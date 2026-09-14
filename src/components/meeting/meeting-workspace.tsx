"use client";

import { useCallback, useEffect, useRef } from "react";
import { CopilotKitProvider, useAgent } from "@copilotkit/react-core/v2";
import { MeetingProvider, useMeeting } from "@/lib/meeting-store";
import { useMeetingCapture } from "@/hooks/useMeetingCapture";
import type { Segment } from "@/lib/types";
import { ActionStream, EXTRACTOR_AGENT_ID } from "./action-cards";
import { ConsentGate } from "./consent-gate";
import { TranscriptPanel } from "./transcript-panel";

const EXTRACT_DEBOUNCE_MS = 8000;

function speakerTag(s: Segment) {
  return s.source === "you" ? "You" : s.speakerLabel ?? "Room";
}

function Workspace() {
  const meeting = useMeeting();
  const { agent } = useAgent({ agentId: EXTRACTOR_AGENT_ID });
  const pendingRef = useRef<Segment[]>([]);
  const runningRef = useRef(false);
  const targetRef = useRef(meeting.targetLanguage);
  useEffect(() => {
    targetRef.current = meeting.targetLanguage;
  }, [meeting.targetLanguage]);

  const flushToExtractor = useCallback(async () => {
    if (runningRef.current || pendingRef.current.length === 0) return;
    const batch = pendingRef.current;
    pendingRef.current = [];
    runningRef.current = true;
    try {
      agent.addMessage({
        id: crypto.randomUUID(),
        role: "user",
        content: batch.map((s) => `[${speakerTag(s)}] ${s.translation ?? s.text}`).join("\n"),
      });
      await agent.runAgent();
    } catch (cause) {
      console.error("extractor run failed", cause);
    } finally {
      runningRef.current = false;
    }
  }, [agent]);

  useEffect(() => {
    const timer = setInterval(() => void flushToExtractor(), EXTRACT_DEBOUNCE_MS);
    return () => clearInterval(timer);
  }, [flushToExtractor]);

  const onSegment = useCallback(
    (segment: Segment) => {
      meeting.addSegment(segment);
      pendingRef.current.push(segment);

      void fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: segment.text, targetLanguage: targetRef.current }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((payload: { data?: { translation?: string; language?: string } } | null) => {
          const translation = payload?.data?.translation;
          if (translation) {
            meeting.setTranslation(segment.id, translation);
            const queued = pendingRef.current.find((s) => s.id === segment.id);
            if (queued) queued.translation = translation;
          }
        })
        .catch(() => undefined);
    },
    [meeting],
  );

  const capture = useMeetingCapture({ onSegment });

  const stopAndPurge = () => {
    capture.stop();
    pendingRef.current = [];
    agent.setMessages([]);
    meeting.purge();
  };

  if (!meeting.consentGiven) return <ConsentGate onAccept={meeting.grantConsent} />;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_370px]">
      <TranscriptPanel
        segments={meeting.segments}
        captureState={capture.state}
        captureMode={capture.mode}
        tabStream={capture.tabStream}
        targetLanguage={meeting.targetLanguage}
        onTargetLanguage={meeting.setTargetLanguage}
        onStart={(mode) => void capture.start({ mode })}
        onStop={stopAndPurge}
        error={capture.error}
      />
      <ActionStream />
    </div>
  );
}

export function MeetingWorkspace() {
  return (
    <CopilotKitProvider runtimeUrl="/api/copilotkit">
      <MeetingProvider>
        <Workspace />
      </MeetingProvider>
    </CopilotKitProvider>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { playSampleTranscript } from "@/lib/sample-transcript";
import type { CaptureMode, CaptureState, Segment, SpeakerSource } from "@/lib/types";

type SessionResponse = { data?: { ephemeralKey?: string } };

interface StartOptions {
  mode?: CaptureMode;
}

interface UseMeetingCaptureOptions {
  onSegment: (segment: Segment) => void;
}

async function mintEphemeralKey(source: SpeakerSource): Promise<string> {
  const response = await fetch("/api/realtime/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source }),
  });
  const payload = (await response.json()) as SessionResponse & {
    error?: { message?: string };
  };
  const key = payload.data?.ephemeralKey;
  if (!response.ok || !key) {
    throw new Error(payload.error?.message ?? "Could not start a transcription session.");
  }
  return key;
}

function extractTranscript(event: Record<string, unknown>): string | null {
  const transcript = event.transcript;
  if (typeof transcript === "string" && transcript.trim()) return transcript.trim();
  return null;
}

function extractSpeaker(event: Record<string, unknown>): string | null {
  // Diarization field naming has moved around across Realtime revisions, so read
  // defensively rather than pinning to one shape.
  for (const key of ["speaker", "speaker_id", "speaker_label"]) {
    const value = event[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return `Speaker ${value + 1}`;
  }
  return null;
}

export function useMeetingCapture({ onSegment }: UseMeetingCaptureOptions) {
  const [state, setState] = useState<CaptureState>("idle");
  const [mode, setMode] = useState<CaptureMode>("live");
  const [error, setError] = useState<string | null>(null);
  const [tabStream, setTabStream] = useState<MediaStream | null>(null);

  const peersRef = useRef<RTCPeerConnection[]>([]);
  const streamsRef = useRef<MediaStream[]>([]);
  const stopSampleRef = useRef<(() => void) | null>(null);
  const onSegmentRef = useRef(onSegment);
  useEffect(() => {
    onSegmentRef.current = onSegment;
  }, [onSegment]);

  const connectSource = useCallback(
    async (track: MediaStreamTrack, source: SpeakerSource) => {
      const ephemeralKey = await mintEphemeralKey(source);

      const pc = new RTCPeerConnection();
      peersRef.current.push(pc);
      pc.addTrack(track);

      const channel = pc.createDataChannel("oai-events");
      channel.addEventListener("message", (event) => {
        let payload: Record<string, unknown>;
        try {
          payload = JSON.parse(event.data as string) as Record<string, unknown>;
        } catch {
          return;
        }
        if (payload.type !== "conversation.item.input_audio_transcription.completed") {
          return;
        }
        const text = extractTranscript(payload);
        if (!text) return;

        onSegmentRef.current({
          id:
            typeof payload.item_id === "string"
              ? `${source}-${payload.item_id}`
              : `${source}-${crypto.randomUUID()}`,
          source,
          speakerLabel: source === "room" ? extractSpeaker(payload) : null,
          text,
          language: typeof payload.language === "string" ? payload.language : null,
          translation: null,
          ts: Date.now(),
        });
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const answer = await fetch("https://api.openai.com/v1/realtime/calls", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      });

      if (!answer.ok) {
        throw new Error(`Realtime handshake failed for ${source} (${answer.status}).`);
      }

      await pc.setRemoteDescription({ type: "answer", sdp: await answer.text() });
    },
    [],
  );

  const stop = useCallback(() => {
    stopSampleRef.current?.();
    stopSampleRef.current = null;
    peersRef.current.forEach((pc) => pc.close());
    peersRef.current = [];
    streamsRef.current.forEach((stream) =>
      stream.getTracks().forEach((track) => track.stop()),
    );
    streamsRef.current = [];
    setTabStream(null);
    setState("stopped");
  }, []);

  const start = useCallback(
    async ({ mode: requested = "live" }: StartOptions = {}) => {
      setError(null);
      setMode(requested);
      setState("requesting");

      if (requested === "sample") {
        stopSampleRef.current = playSampleTranscript((segment) =>
          onSegmentRef.current(segment),
        );
        setState("live");
        return;
      }

      try {
        // video:true is required — Chrome only offers the "share tab audio"
        // checkbox when a video track is also requested.
        const display = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
        streamsRef.current.push(display);

        const tabAudio = display.getAudioTracks()[0];
        if (!tabAudio) {
          display.getTracks().forEach((t) => t.stop());
          throw new Error(
            'No tab audio. Re-share and pick a Chrome Tab with "Share tab audio" ticked — screen and window shares cannot carry audio.',
          );
        }

        // Ending the video track ends the whole share, so it is kept alive and
        // rendered muted as a visible confirmation that capture is connected.
        display.getVideoTracks()[0]?.addEventListener("ended", () => stop());
        setTabStream(display);

        const mic = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        streamsRef.current.push(mic);

        await Promise.all([
          connectSource(tabAudio, "room"),
          connectSource(mic.getAudioTracks()[0]!, "you"),
        ]);

        setState("live");
      } catch (cause) {
        stop();
        setState("error");
        setError(cause instanceof Error ? cause.message : "Could not start capture.");
      }
    },
    [connectSource, stop],
  );

  return { state, mode, error, tabStream, start, stop };
}

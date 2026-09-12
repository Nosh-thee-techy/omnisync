"use client";

/**
 * In-memory meeting state, held in React for the lifetime of the tab.
 *
 * There is no database and nothing is written to disk. Closing the tab destroys
 * the transcript. This started as a time-saving cut and turned into the
 * strongest privacy claim the product has, so it is load-bearing — do not
 * casually swap it for persistence without revisiting the consent copy.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  ActionItem,
  ActionResult,
  ActionStatus,
  CaptureMode,
  CaptureState,
  Segment,
} from "./types";

interface MeetingContextValue {
  segments: Segment[];
  actionItems: ActionItem[];
  captureState: CaptureState;
  captureMode: CaptureMode;
  targetLanguage: string;
  consentGiven: boolean;

  setCaptureState: (state: CaptureState) => void;
  setCaptureMode: (mode: CaptureMode) => void;
  setTargetLanguage: (language: string) => void;
  grantConsent: () => void;

  addSegment: (segment: Segment) => void;
  setTranslation: (segmentId: string, translation: string) => void;

  addActionItem: (item: ActionItem) => void;
  updateActionItem: (id: string, patch: Partial<ActionItem>) => void;
  setActionStatus: (
    id: string,
    status: ActionStatus,
    result?: ActionResult | null,
  ) => void;

  /** Ends capture and destroys every trace of the meeting. */
  purge: () => void;
}

const MeetingContext = createContext<MeetingContextValue | null>(null);

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [captureState, setCaptureState] = useState<CaptureState>("idle");
  const [captureMode, setCaptureMode] = useState<CaptureMode>("live");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [consentGiven, setConsentGiven] = useState(false);

  /**
   * Segment ids already seen. The two Realtime sessions run independently and
   * can redeliver on reconnect, so inserts must be idempotent.
   */
  const seenIds = useRef(new Set<string>());

  const addSegment = useCallback((segment: Segment) => {
    if (seenIds.current.has(segment.id)) return;
    seenIds.current.add(segment.id);

    // Interleave the two sources by timestamp rather than appending, otherwise
    // the transcript reads as two separate monologues.
    setSegments((prev) => {
      const next = [...prev, segment];
      next.sort((a, b) => a.ts - b.ts);
      return next;
    });
  }, []);

  const setTranslation = useCallback((segmentId: string, translation: string) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === segmentId ? { ...s, translation } : s)),
    );
  }, []);

  const addActionItem = useCallback((item: ActionItem) => {
    setActionItems((prev) =>
      prev.some((a) => a.id === item.id) ? prev : [...prev, item],
    );
  }, []);

  const updateActionItem = useCallback(
    (id: string, patch: Partial<ActionItem>) => {
      setActionItems((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      );
    },
    [],
  );

  const setActionStatus = useCallback(
    (id: string, status: ActionStatus, result: ActionResult | null = null) => {
      setActionItems((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status, result: result ?? a.result } : a,
        ),
      );
    },
    [],
  );

  const purge = useCallback(() => {
    seenIds.current.clear();
    setSegments([]);
    setActionItems([]);
    setCaptureState("stopped");
  }, []);

  const grantConsent = useCallback(() => setConsentGiven(true), []);

  const value = useMemo<MeetingContextValue>(
    () => ({
      segments,
      actionItems,
      captureState,
      captureMode,
      targetLanguage,
      consentGiven,
      setCaptureState,
      setCaptureMode,
      setTargetLanguage,
      grantConsent,
      addSegment,
      setTranslation,
      addActionItem,
      updateActionItem,
      setActionStatus,
      purge,
    }),
    [
      segments,
      actionItems,
      captureState,
      captureMode,
      targetLanguage,
      consentGiven,
      grantConsent,
      addSegment,
      setTranslation,
      addActionItem,
      updateActionItem,
      setActionStatus,
      purge,
    ],
  );

  return (
    <MeetingContext.Provider value={value}>{children}</MeetingContext.Provider>
  );
}

export function useMeeting() {
  const ctx = useContext(MeetingContext);
  if (!ctx) throw new Error("useMeeting must be used inside <MeetingProvider>");
  return ctx;
}

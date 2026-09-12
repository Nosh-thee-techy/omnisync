"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { submitTranscript } from "@/lib/submit-transcript";
import type { IntentPayload } from "@/types/pipeline";

type RecognitionResultLike = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEventLike = Event & {
  resultIndex: number;
  results: ArrayLike<RecognitionResultLike>;
};
type RecognitionErrorEventLike = Event & { error: string; message?: string };

type RecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: RecognitionEventLike) => void) | null;
  onerror: ((event: RecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type RecognitionConstructor = new () => RecognitionLike;
type SpeechWindow = Window & {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
};

function browserSupportsSpeechRecognition() {
  if (typeof window === "undefined") return false;
  const browser = window as SpeechWindow;
  return Boolean(browser.SpeechRecognition ?? browser.webkitSpeechRecognition);
}

export type TranscriptLine = {
  id: string;
  text: string;
  isFinal: boolean;
};

export type AudioStreamOptions = {
  meetingId?: string;
  debounceMs?: number;
  onIntent?: (intent: IntentPayload) => void;
};

/**
 * Streams browser speech recognition into transcript lines and submits each
 * pause-delimited final block to the authenticated intent parser.
 */
export function useAudioStream(options: AudioStreamOptions = {}) {
  const { debounceMs = 1500, onIntent } = options;
  const [isSupported] = useState(browserSupportsSpeechRecognition);
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcriptLines, setTranscriptLines] = useState<TranscriptLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const shouldListenRef = useRef(false);
  const finalBlockRef = useRef("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onIntentRef = useRef(onIntent);

  useEffect(() => {
    onIntentRef.current = onIntent;
  }, [onIntent]);

  const flushBlock = useCallback(async () => {
    const block = finalBlockRef.current.trim();
    finalBlockRef.current = "";
    if (!block) return;

    try {
      const intent = await submitTranscript(block);
      onIntentRef.current?.(intent);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to parse the transcript block.");
    }
  }, []);

  const scheduleBlock = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void flushBlock(), debounceMs);
  }, [debounceMs, flushBlock]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = null;
    recognitionRef.current?.stop();
    setIsListening(false);
    setIsPaused(false);
    void flushBlock();
  }, [flushBlock]);

  const pauseListening = useCallback(() => {
    shouldListenRef.current = false;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = null;
    recognitionRef.current?.stop();
    setIsListening(false);
    setIsPaused(true);
    void flushBlock();
  }, [flushBlock]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as SpeechWindow).SpeechRecognition ?? (window as SpeechWindow).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported by this browser. Try Chrome or Edge.");
      return;
    }

    setError(null);
    shouldListenRef.current = true;
    setIsListening(true);
    setIsPaused(false);

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.onresult = (event) => {
        let interim = "";
        const completed: string[] = [];
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const text = result[0].transcript.trim();
          if (!text) continue;
          if (result.isFinal) completed.push(text);
          else interim += `${interim ? " " : ""}${text}`;
        }
        if (completed.length) {
          finalBlockRef.current = [finalBlockRef.current, ...completed].filter(Boolean).join(" ");
          setTranscriptLines((lines) => [
            ...lines.filter((line) => line.isFinal),
            ...completed.map((text) => ({ id: crypto.randomUUID(), text, isFinal: true })),
          ]);
          scheduleBlock();
        }
        setTranscriptLines((lines) => {
          const finals = lines.filter((line) => line.isFinal);
          return interim ? [...finals, { id: "interim", text: interim, isFinal: false }] : finals;
        });
      };
      recognition.onerror = (event) => {
        if (event.error === "aborted") return;
        shouldListenRef.current = false;
        setIsListening(false);
        setError(event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "Microphone permission was denied. Allow microphone access and try again."
          : event.message || `Speech recognition error: ${event.error}`);
      };
      recognition.onend = () => {
        if (!shouldListenRef.current) return;
        try {
          recognition.start();
        } catch {
          // The browser can briefly reject an immediate restart; the next user action retries it.
        }
      };
      recognitionRef.current = recognition;
    }

    try {
      recognitionRef.current.start();
    } catch {
      // Calling start while continuous recognition is active throws in some browsers.
    }
  }, [scheduleBlock]);

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      recognitionRef.current?.abort();
    };
  }, []);

  return {
    isListening,
    isPaused,
    isSupported,
    transcriptLines,
    error,
    startListening,
    stopListening,
    pauseListening,
  };
}

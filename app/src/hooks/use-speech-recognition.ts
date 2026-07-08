/**
 * useSpeechRecognition Hook
 * Browser-native Speech Recognition API for real-time voice transcription.
 * Falls back gracefully when not supported.
 */

import { useState, useRef, useCallback, useEffect } from "react";

// ─── Web Speech API Type Declarations ───
// These are browser-native types not included in standard TypeScript libs

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

export type SpeechRecognitionStatus =
  | "idle"
  | "listening"
  | "processing"
  | "completed"
  | "error"
  | "unsupported";

export interface UseSpeechRecognitionReturn {
  status: SpeechRecognitionStatus;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
  isListening: boolean;
  isProcessing: boolean;
  isCompleted: boolean;
  isError: boolean;
  isUnsupported: boolean;
}

/**
 * Check if Speech Recognition is supported in the current browser
 */
export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Hook for browser-native speech recognition
 */
export function useSpeechRecognition(language: string = "en-US"): UseSpeechRecognitionReturn {
  const [status, setStatus] = useState<SpeechRecognitionStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");

  const isSupported = isSpeechRecognitionSupported();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore errors during cleanup
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  const start = useCallback(() => {
    if (!isSupported) {
      setStatus("unsupported");
      setError("Speech recognition is not supported in this browser. Try Chrome, Edge, or Safari.");
      return;
    }

    // Reset state
    setError(null);
    setTranscript("");
    setInterimTranscript("");
    finalTranscriptRef.current = "";

    try {
      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionConstructor();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setStatus("listening");
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }

        if (final) {
          finalTranscriptRef.current += final;
          setTranscript(finalTranscriptRef.current);
        }
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === "aborted" || event.error === "no-speech") {
          // These are not real errors
          return;
        }
        const errorMessages: Record<string, string> = {
          "audio-capture": "No microphone found or microphone is not working.",
          "not-allowed": "Microphone permission denied. Please allow microphone access.",
          "network": "Network error occurred during speech recognition.",
          "bad-grammar": "Speech recognition grammar error.",
          "language-not-supported": `Language "${language}" is not supported for speech recognition.`,
          "service-not-allowed": "Speech recognition service is not allowed.",
        };
        setError(errorMessages[event.error] || `Speech recognition error: ${event.error}`);
        setStatus("error");
      };

      recognition.onend = () => {
        // Only move to completed if we weren't in error state
        setStatus((prev) => {
          if (prev === "listening") {
            return "completed";
          }
          return prev;
        });
        setInterimTranscript("");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setError("Failed to start speech recognition.");
      setStatus("error");
    }
  }, [isSupported, language]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors
      }
      recognitionRef.current = null;
    }
    if (status === "listening") {
      setStatus("processing");
    }
  }, [status]);

  const reset = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }
    setStatus("idle");
    setTranscript("");
    setInterimTranscript("");
    setError(null);
    finalTranscriptRef.current = "";
  }, []);

  return {
    status,
    transcript,
    interimTranscript,
    error,
    isSupported,
    start,
    stop,
    reset,
    isListening: status === "listening",
    isProcessing: status === "processing",
    isCompleted: status === "completed",
    isError: status === "error",
    isUnsupported: status === "unsupported" || (!isSupported && status === "idle"),
  };
}

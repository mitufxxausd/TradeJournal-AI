import { useState, useCallback, useRef } from "react";
import { transcriptionService } from "@/services/ai/services/transcriptionService";
import type { TranscriptionRequest, VoiceTranscript, TranscriptionOptions } from "@/services/ai/types/transcription";
import type { AIProcessingStatus } from "@/services/ai/types/common";

/**
 * useVoice Hook
 * Hook for voice transcription (voice notes)
 */
export function useVoice() {
  const [status, setStatus] = useState<AIProcessingStatus>({ status: "idle" });
  const [transcript, setTranscript] = useState<VoiceTranscript | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const transcribe = useCallback(async (audioBlob: Blob, options?: TranscriptionOptions) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus({ status: "loading", progress: 0, message: "Transcribing audio..." });
    setTranscript(null);

    try {
      const request: TranscriptionRequest = { audioBlob, options };
      const response = await transcriptionService.transcribe(request, {
        abortSignal: controller.signal,
      });

      if (!controller.signal.aborted) {
        setTranscript(response.data);
        setStatus({ status: "success", message: "Transcription complete" });
      }

      return response.data;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setStatus({ status: "idle" });
        return null;
      }

      const message = error instanceof Error ? error.message : "Transcription failed";
      setStatus({ status: "error", error: message });
      return null;
    }
  }, []);

  const supportsRealtime = useCallback(() => {
    return transcriptionService.supportsRealtime();
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus({ status: "idle" });
  }, []);

  const reset = useCallback(() => {
    cancel();
    setTranscript(null);
    setStatus({ status: "idle" });
  }, [cancel]);

  return {
    transcribe,
    supportsRealtime,
    cancel,
    reset,
    status,
    transcript,
    isLoading: status.status === "loading",
    isError: status.status === "error",
    isSuccess: status.status === "success",
  };
}

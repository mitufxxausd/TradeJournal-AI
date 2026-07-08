import { useState, useCallback, useRef } from "react";
import { coachingService } from "@/services/ai/services/coachingService";
import type { CoachingRequest, CoachingResult, CoachMessage } from "@/services/ai/types/coaching";
import type { AIProcessingStatus } from "@/services/ai/types/common";

/**
 * useCoach Hook
 * Hook for AI coaching and mentorship
 */
export function useCoach() {
  const [status, setStatus] = useState<AIProcessingStatus>({ status: "idle" });
  const [result, setResult] = useState<CoachingResult | null>(null);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateCoaching = useCallback(async (request: CoachingRequest) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setStatus({ status: "loading", progress: 0, message: "Generating coaching plan..." });
    setResult(null);

    try {
      const response = await coachingService.generateCoaching(request, {
        abortSignal: controller.signal,
      });

      if (!controller.signal.aborted) {
        setResult(response.data);
        setStatus({ status: "success", message: "Coaching plan generated" });
      }

      return response.data;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setStatus({ status: "idle" });
        return null;
      }

      const message = error instanceof Error ? error.message : "Coaching generation failed";
      setStatus({ status: "error", error: message });
      return null;
    }
  }, []);

  const sendMessage = useCallback(async (message: string, sessionId?: string) => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMessage: CoachMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setStatus({ status: "loading", message: "Coach is thinking..." });

    try {
      const response = await coachingService.chat(message, sessionId, {
        abortSignal: controller.signal,
      });

      if (!controller.signal.aborted) {
        setMessages((prev) => [...prev, response.data]);
        setStatus({ status: "success" });
      }

      return response.data;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        setStatus({ status: "idle" });
        return null;
      }

      const errorMsg = error instanceof Error ? error.message : "Chat failed";
      setStatus({ status: "error", error: errorMsg });
      return null;
    }
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus({ status: "idle" });
  }, []);

  const reset = useCallback(() => {
    cancel();
    setResult(null);
    setMessages([]);
    setStatus({ status: "idle" });
  }, [cancel]);

  return {
    generateCoaching,
    sendMessage,
    cancel,
    reset,
    status,
    result,
    messages,
    isLoading: status.status === "loading",
    isError: status.status === "error",
    isSuccess: status.status === "success",
  };
}

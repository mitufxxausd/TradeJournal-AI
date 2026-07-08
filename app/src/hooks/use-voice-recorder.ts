/**
 * useVoiceRecorder Hook
 * Manages audio recording with Record, Pause, Resume, Stop, and Playback.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { formatDuration } from "@/services/voice/voiceService";

export type RecorderState = "idle" | "recording" | "paused" | "stopped";

export interface UseVoiceRecorderReturn {
  state: RecorderState;
  duration: number;
  formattedDuration: string;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;

  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
  play: () => void;
  isPlaying: boolean;
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [state, setState] = useState<RecorderState>("idle");
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pausedDurationRef = useRef(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    try {
      setError(null);
      chunksRef.current = [];
      setDuration(0);
      pausedDurationRef.current = 0;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setState("stopped");
        stopTimer();

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(1000); // Collect data every second
      setState("recording");
      startTimer();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to access microphone";
      setError(message);
      setState("idle");
    }
  }, [startTimer]);

  const pause = useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.pause();
      setState("paused");
      stopTimer();
      pausedDurationRef.current = duration;
    }
  }, [state, duration, stopTimer]);

  const resume = useCallback(() => {
    if (mediaRecorderRef.current && state === "paused") {
      mediaRecorderRef.current.resume();
      setState("recording");
      startTimer();
    }
  }, [state, startTimer]);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && (state === "recording" || state === "paused")) {
      mediaRecorderRef.current.stop();
      stopTimer();
    }
  }, [state, stopTimer]);

  const reset = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setState("idle");
    setError(null);
    pausedDurationRef.current = 0;
  }, [audioUrl]);

  const play = useCallback(() => {
    if (!audioUrl) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      audioRef.current = null;
    });

    audio.play().catch(() => {
      setIsPlaying(false);
    });

    setIsPlaying(true);
  }, [audioUrl]);

  return {
    state,
    duration,
    formattedDuration: formatDuration(duration),
    audioBlob,
    audioUrl,
    error,
    start,
    pause,
    resume,
    stop,
    reset,
    play,
    isPlaying,
  };
}

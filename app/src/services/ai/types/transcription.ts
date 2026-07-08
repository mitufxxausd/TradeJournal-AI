/**
 * Voice Transcription Types
 */

export type TranscriptionStatus = "idle" | "recording" | "processing" | "completed" | "error";

export interface VoiceTranscript {
  id: string;
  text: string;
  confidence: number;
  language: string;
  durationMs: number;
  segments: TranscriptSegment[];
  metadata: {
    engine: string;
    processedAt: string;
    audioFormat?: string;
    sampleRate?: number;
  };
}

export interface TranscriptSegment {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
  confidence: number;
  speaker?: string;
  isFinal: boolean;
}

export interface TranscriptionOptions {
  language?: string;
  punctuate?: boolean;
  profanityFilter?: boolean;
  diarize?: boolean;
  format?: "detailed" | "simple";
}

export interface TranscriptionRequest {
  audioBlob: Blob;
  options?: TranscriptionOptions;
}

export interface RealtimeTranscriptionConfig {
  language?: string;
  interimResults?: boolean;
  punctuate?: boolean;
  sampleRate?: number;
  silenceThresholdMs?: number;
}

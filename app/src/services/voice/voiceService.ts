/**
 * Voice Notes Service
 * Handles audio recording, Cloudinary upload, and transcription.
 */

import type { VoiceNote, TranscriptionResult } from "../ai/types";

// ─── Cloudinary Upload ───

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v11/video/upload";

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

function getCloudinaryConfig(): CloudinaryConfig {
  return {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "",
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "tradejournal",
  };
}

export async function uploadVoiceNoteToCloudinary(
  audioBlob: Blob,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; publicId: string }> {
  const config = getCloudinaryConfig();

  if (!config.cloudName) {
    // Fallback: return a local blob URL for demo
    return {
      url: URL.createObjectURL(audioBlob),
      publicId: `local_${Date.now()}`,
    };
  }

  const formData = new FormData();
  formData.append("file", audioBlob, fileName);
  formData.append("upload_preset", config.uploadPreset);
  formData.append("resource_type", "video"); // audio files use "video" resource type in Cloudinary

  // Use XMLHttpRequest for progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress?.(progress);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const response = JSON.parse(xhr.responseText);
        resolve({
          url: response.secure_url,
          publicId: response.public_id,
        });
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Upload failed")));
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${config.cloudName}/video/upload`);
    xhr.send(formData);
  });
}

// ─── Recording Utilities ───

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // seconds
  audioBlob: Blob | null;
  error: string | null;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

// ─── Transcription ───

export async function transcribeVoiceNote(
  audioUrl: string
): Promise<TranscriptionResult | null> {
  // Import dynamically to avoid circular dependencies
  const { getAIProvider } = await import("../ai/aiService");
  const { canUseFeature } = await import("../ai/aiService");
  const provider = getAIProvider();

  if (!provider.capabilities.transcription) {
    return null;
  }

  return provider.transcribeAudio({ audioUrl });
}

// ─── CRUD Operations ───

let mockVoiceNotes: VoiceNote[] = [];

export async function saveVoiceNote(
  userId: string,
  tradeId: string,
  voiceNote: Omit<VoiceNote, "id" | "createdAt">
): Promise<VoiceNote> {
  // TODO: Save to Firestore: users/{userId}/trades/{tradeId}/voiceNotes
  const newNote: VoiceNote = {
    ...voiceNote,
    id: `vn_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  mockVoiceNotes.push(newNote);
  return newNote;
}

export async function getVoiceNotes(userId: string, tradeId: string): Promise<VoiceNote[]> {
  // TODO: Fetch from Firestore
  void userId;
  void tradeId;
  return [...mockVoiceNotes];
}

export async function deleteVoiceNote(userId: string, tradeId: string, voiceNoteId: string): Promise<void> {
  // TODO: Delete from Firestore and Cloudinary
  void userId;
  void tradeId;
  mockVoiceNotes = mockVoiceNotes.filter((n) => n.id !== voiceNoteId);
}

export async function updateVoiceNoteName(
  userId: string,
  tradeId: string,
  voiceNoteId: string,
  name: string
): Promise<void> {
  void userId;
  void tradeId;
  const note = mockVoiceNotes.find((n) => n.id === voiceNoteId);
  if (note) note.name = name;
}

export async function updateVoiceNoteTranscription(
  _userId: string,
  _tradeId: string,
  voiceNoteId: string,
  transcribedText: string
): Promise<void> {
  const note = mockVoiceNotes.find((n) => n.id === voiceNoteId);
  if (note) {
    note.transcribedText = transcribedText;
    note.transcriptionStatus = "completed";
  }
}

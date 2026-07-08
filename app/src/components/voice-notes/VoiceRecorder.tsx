/**
 * Voice Recorder Component
 * Professional voice recorder with Record, Pause, Resume, Stop, Playback.
 * Integrates with Cloudinary for storage.
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { uploadVoiceNoteToCloudinary } from "@/services/voice/voiceService";
import { toast } from "sonner";
import {
  Mic,
  Square,
  Pause,
  Play,
  RotateCcw,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface VoiceRecorderProps {
  onRecordingComplete?: (url: string, duration: number, blob: Blob) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({ onRecordingComplete, disabled }: VoiceRecorderProps) {
  const recorder = useVoiceRecorder();
  const [uploading, setUploading] = useState(false);

  const handleSave = useCallback(async () => {
    if (!recorder.audioBlob) return;

    setUploading(true);
    try {
      const fileName = `voice_note_${Date.now()}.webm`;
      const result = await uploadVoiceNoteToCloudinary(recorder.audioBlob, fileName);
      toast.success("Voice note saved");
      onRecordingComplete?.(result.url, recorder.duration, recorder.audioBlob);
      recorder.reset();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save voice note";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }, [recorder, onRecordingComplete]);

  if (disabled) {
    return (
      <Card className="border-dashed opacity-50">
        <CardContent className="flex items-center justify-center py-6">
          <p className="text-sm text-muted-foreground">Voice notes require Pro tier</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        {/* Waveform placeholder / visual */}
        <div className="flex items-center justify-center h-12 mb-4">
          {recorder.state === "recording" && <RecordingWaveform />}
          {recorder.state === "paused" && <PausedWaveform />}
          {recorder.state === "stopped" && <StoppedWaveform />}
          {recorder.state === "idle" && (
            <div className="flex items-center gap-1">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="w-0.5 h-2 bg-muted-foreground/20 rounded-full" />
              ))}
            </div>
          )}
        </div>

        {/* Duration */}
        <div className="text-center mb-4">
          <span className={`text-2xl font-mono font-semibold ${
            recorder.state === "recording" ? "text-red-500" : "text-foreground"
          }`}>
            {recorder.formattedDuration}
          </span>
          {recorder.state === "recording" && (
            <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </div>

        {/* Error */}
        {recorder.error && (
          <p className="text-sm text-destructive text-center mb-3">{recorder.error}</p>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          {/* Idle: Show Record button */}
          {recorder.state === "idle" && (
            <Button
              size="lg"
              className="rounded-full h-14 w-14"
              onClick={recorder.start}
            >
              <Mic className="h-6 w-6" />
            </Button>
          )}

          {/* Recording: Show Pause and Stop */}
          {recorder.state === "recording" && (
            <>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full h-12 w-12"
                onClick={recorder.pause}
              >
                <Pause className="h-5 w-5" />
              </Button>
              <Button
                variant="destructive"
                size="lg"
                className="rounded-full h-14 w-14"
                onClick={recorder.stop}
              >
                <Square className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Paused: Show Resume and Stop */}
          {recorder.state === "paused" && (
            <>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full h-12 w-12"
                onClick={recorder.resume}
              >
                <Play className="h-5 w-5" />
              </Button>
              <Button
                variant="destructive"
                size="lg"
                className="rounded-full h-14 w-14"
                onClick={recorder.stop}
              >
                <Square className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Stopped: Show Playback, Save, Discard */}
          {recorder.state === "stopped" && (
            <>
              <Button
                variant="outline"
                size="lg"
                className="rounded-full h-12 w-12"
                onClick={recorder.play}
                disabled={recorder.isPlaying}
              >
                {recorder.isPlaying ? (
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-3 bg-current rounded-full animate-pulse" />
                    <div className="w-1 h-3 bg-current rounded-full animate-pulse" style={{ animationDelay: "0.1s" }} />
                  </div>
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="default"
                size="lg"
                className="rounded-full h-12 w-12"
                onClick={handleSave}
                disabled={uploading}
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="rounded-full h-12 w-12"
                onClick={recorder.reset}
                disabled={uploading}
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>

        {/* Status text */}
        <p className="text-center text-xs text-muted-foreground mt-3">
          {recorder.state === "idle" && "Tap to start recording"}
          {recorder.state === "recording" && "Recording..."}
          {recorder.state === "paused" && "Paused"}
          {recorder.state === "stopped" && "Recording complete"}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── Waveform Visualizations ───

function RecordingWaveform() {
  return (
    <div className="flex items-center gap-0.5 h-10">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="w-0.5 bg-red-500 rounded-full animate-pulse"
          style={{
            height: `${20 + Math.random() * 60}%`,
            animationDelay: `${i * 0.05}s`,
            animationDuration: `${0.3 + Math.random() * 0.4}s`,
          }}
        />
      ))}
    </div>
  );
}

function PausedWaveform() {
  return (
    <div className="flex items-center gap-0.5 h-10">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="w-0.5 bg-amber-500 rounded-full"
          style={{ height: `${15 + Math.random() * 30}%` }}
        />
      ))}
    </div>
  );
}

function StoppedWaveform() {
  return (
    <div className="flex items-center gap-0.5 h-10">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="w-0.5 bg-green-500 rounded-full"
          style={{ height: `${10 + Math.random() * 80}%` }}
        />
      ))}
    </div>
  );
}

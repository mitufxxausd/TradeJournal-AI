import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSubscription } from "@/hooks/use-subscription";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Mic,
  Lock,
  Play,
  Square,
  Pause,
  Trash2,
  Pencil,
  Clock,
  Calendar,
  Sparkles,
  Loader2,
  Info,
} from "lucide-react";

// ─── Mock Data ───

const mockVoiceNotes = [
  { id: "1", name: "Pre-session Analysis", duration: 204, date: "2026-07-08", transcribed: true },
  { id: "2", name: "Trade Review - EURUSD", duration: 312, date: "2026-07-08", transcribed: true },
  { id: "3", name: "Weekly Reflection", duration: 525, date: "2026-07-07", transcribed: false },
  { id: "4", name: "Psychology Check-in", duration: 180, date: "2026-07-06", transcribed: true },
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── Feature Gate ───

function LockedFeature() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">Voice Notes Locked</h3>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
        Upgrade to <span className="font-semibold text-primary">Pro</span> or{" "}
        <span className="font-semibold text-primary">Elite</span> to unlock Voice Notes with AI transcription.
      </p>
      <Button className="mt-6" asChild>
        <a href="#/ai/subscription">Upgrade Now</a>
      </Button>
    </div>
  );
}

// ─── Main Component ───

export default function AIVoiceNotes() {
  const { hasAccess } = useSubscription();
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "paused">("idle");
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [playingNote, setPlayingNote] = useState<string | null>(null);

  const canAccess = hasAccess("voiceNotes");

  const startRecording = () => {
    setRecordingState("recording");
    toast.info("Recording started (simulated)");
  };

  const pauseRecording = () => {
    setRecordingState("paused");
    toast.info("Recording paused");
  };

  const resumeRecording = () => {
    setRecordingState("recording");
    toast.info("Recording resumed");
  };

  const stopRecording = () => {
    setRecordingState("idle");
    setRecordingTime(0);
    toast.success("Recording saved (simulated)");
  };

  const deleteNote = (id: string) => {
    toast.info("Delete feature - Coming in Phase 5C");
  };

  const renameNote = (id: string) => {
    toast.info("Rename feature - Coming in Phase 5C");
  };

  const togglePlayback = (id: string) => {
    if (playingNote === id) {
      setPlayingNote(null);
    } else {
      setPlayingNote(id);
      toast.info("Playback simulation");
    }
  };

  if (!canAccess) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Mic className="h-7 w-7 text-primary" />
            Voice Notes
          </h1>
          <p className="mt-1 text-muted-foreground">Record and transcribe trading notes</p>
        </div>
        <LockedFeature />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Mic className="h-7 w-7 text-primary" />
          Voice Notes
        </h1>
        <p className="mt-1 text-muted-foreground">Record, playback, and manage your trading voice notes</p>
      </div>

      {/* Coming Soon Banner */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-sm text-amber-700 dark:text-amber-400">Coming in Phase 5C</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Full voice recording, AI transcription, and playback features will be available in the next phase.
            The UI below demonstrates the planned interface.
          </p>
        </div>
      </div>

      {/* Recording Controls */}
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            {/* Timer */}
            <div className="text-center">
              <div className={cn(
                "text-4xl font-mono font-bold tabular-nums tracking-wider",
                recordingState === "recording" && "text-red-500 animate-pulse"
              )}>
                {formatDuration(recordingTime)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {recordingState === "idle" && "Ready to record"}
                {recordingState === "recording" && "Recording..."}
                {recordingState === "paused" && "Paused"}
              </p>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-3">
              {recordingState === "idle" && (
                <Button
                  size="lg"
                  className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white p-0"
                  onClick={startRecording}
                >
                  <Mic className="h-6 w-6" />
                </Button>
              )}

              {recordingState === "recording" && (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 w-12 rounded-full p-0"
                    onClick={pauseRecording}
                  >
                    <Pause className="h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white p-0"
                    onClick={stopRecording}
                  >
                    <Square className="h-5 w-5" />
                  </Button>
                </>
              )}

              {recordingState === "paused" && (
                <>
                  <Button
                    size="lg"
                    className="h-12 w-12 rounded-full p-0"
                    onClick={resumeRecording}
                  >
                    <Play className="h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 w-12 rounded-full p-0 border-red-500 text-red-500 hover:bg-red-500/10"
                    onClick={stopRecording}
                  >
                    <Square className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Voice Notes List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Saved Notes</h2>

        {mockVoiceNotes.map((note) => (
          <Card
            key={note.id}
            className={cn(
              "transition-all hover:shadow-md",
              selectedNote === note.id && "border-primary/50 ring-1 ring-primary/20"
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Play/Pause Button */}
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-10 w-10 rounded-full shrink-0",
                    playingNote === note.id && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => togglePlayback(note.id)}
                >
                  {playingNote === note.id ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 ml-0.5" />
                  )}
                </Button>

                {/* Note Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm truncate">{note.name}</h3>
                    {note.transcribed && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Transcribed
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(note.duration)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {note.date}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => renameNote(note.id)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                    onClick={() => deleteNote(note.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Transcript Panel (shown when selected) */}
              {selectedNote === note.id && note.transcribed && (
                <div className="mt-4 pt-4 border-t animate-in fade-in slide-in-from-top-2 duration-300">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Transcript
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
                    &quot;I entered this trade because price swept the Asian session liquidity and left a
                    fair value gap on the 15 minute timeframe. My entry was at the 50% retracement
                    of the displacement candle with confluence from the EMA 200.&quot;
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

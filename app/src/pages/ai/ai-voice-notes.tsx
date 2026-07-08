/**
 * AI Voice Notes Page
 * Real voice recording with MediaRecorder API, browser speech recognition,
 * local storage of recordings, playback, rename, and delete.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useSubscription } from "@/hooks/use-subscription";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { useSpeechRecognition, isSpeechRecognitionSupported } from "@/hooks/use-speech-recognition";
import { formatDuration } from "@/services/voice/voiceService";
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
  Info,
  Check,
  X,
  AudioLines,
  Copy,
  Loader2,
  AlertTriangle,
  FileText,
  RotateCcw,
} from "lucide-react";

// ─── Types ───

interface VoiceNote {
  id: string;
  name: string;
  audioUrl: string;
  duration: number;
  createdAt: string;
  transcript: string;
  transcribed: boolean;
}

// ─── Local Storage ───

const STORAGE_KEY = "tradejournal_voice_notes";

function loadVoiceNotes(): VoiceNote[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate and filter out notes with broken URLs (from previous sessions)
      return parsed.filter((note: VoiceNote) => note.id && note.name);
    }
  } catch {
    // ignore
  }
  return [];
}

function saveVoiceNotes(notes: VoiceNote[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    toast.error("Failed to save voice notes. Storage may be full.");
  }
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
  const recorder = useVoiceRecorder();
  const speech = useSpeechRecognition("en-US");

  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>(loadVoiceNotes);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const canAccess = hasAccess("voiceNotes");

  // Persist voice notes
  useEffect(() => {
    saveVoiceNotes(voiceNotes);
  }, [voiceNotes]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // ─── Recording Timer ───

  const startTimer = useCallback(() => {
    stopTimer();
    setRecordingTimer(0);
    timerRef.current = setInterval(() => {
      setRecordingTimer((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ─── Recording Actions ───

  const handleStartRecording = async () => {
    try {
      await recorder.start();
      startTimer();
      // Also start speech recognition if supported
      if (isSpeechRecognitionSupported()) {
        speech.start();
      }
    } catch {
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const handlePauseRecording = () => {
    recorder.pause();
    stopTimer();
    speech.stop();
  };

  const handleResumeRecording = () => {
    recorder.resume();
    startTimer();
    if (isSpeechRecognitionSupported() && speech.isCompleted) {
      speech.start();
    } else {
      speech.start();
    }
  };

  const handleStopRecording = () => {
    recorder.stop();
    stopTimer();
    speech.stop();
  };

  // ─── Save Recording ───

  const handleSaveRecording = useCallback(() => {
    if (!recorder.audioUrl || !recorder.audioBlob) return;

    const newNote: VoiceNote = {
      id: `vn_${Date.now()}`,
      name: `Recording ${voiceNotes.length + 1}`,
      audioUrl: recorder.audioUrl,
      duration: recorder.duration,
      createdAt: new Date().toISOString(),
      transcript: speech.transcript,
      transcribed: speech.transcript.length > 0,
    };

    setVoiceNotes((prev) => [newNote, ...prev]);
    recorder.reset();
    speech.reset();
    setRecordingTimer(0);
    toast.success("Voice note saved");
  }, [recorder, speech, voiceNotes.length]);

  // ─── Playback ───

  const handlePlay = useCallback((note: VoiceNote) => {
    // Stop current
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (playingId === note.id) {
      setPlayingId(null);
      return;
    }

    const audio = new Audio(note.audioUrl);
    audioRef.current = audio;

    audio.addEventListener("ended", () => {
      setPlayingId(null);
      audioRef.current = null;
    });

    audio.addEventListener("error", () => {
      toast.error("Failed to play voice note");
      setPlayingId(null);
      audioRef.current = null;
    });

    audio.play().catch(() => {
      toast.error("Playback failed");
      setPlayingId(null);
    });

    setPlayingId(note.id);
  }, [playingId]);

  // ─── Transcribe Note ───

  const handleTranscribeNote = useCallback(async (note: VoiceNote) => {
    if (!isSpeechRecognitionSupported()) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    setIsTranscribing(true);

    // Play the note and transcribe simultaneously
    const audio = new Audio(note.audioUrl);

    speech.reset();
    speech.start();

    audio.addEventListener("ended", () => {
      speech.stop();
    });

    audio.addEventListener("error", () => {
      speech.stop();
    });

    try {
      await audio.play();
      // Wait a bit then stop
      setTimeout(() => {
        speech.stop();
        setIsTranscribing(false);

        if (speech.transcript) {
          setVoiceNotes((prev) =>
            prev.map((n) =>
              n.id === note.id
                ? { ...n, transcript: speech.transcript, transcribed: true }
                : n
            )
          );
          toast.success("Transcription complete");
        } else {
          toast.info("No speech detected. Try speaking more clearly.");
        }
      }, note.duration * 1000 + 2000);
    } catch {
      toast.error("Failed to play audio for transcription");
      setIsTranscribing(false);
    }
  }, [speech]);

  // ─── Copy Transcript ───

  const handleCopyTranscript = useCallback((transcript: string) => {
    navigator.clipboard.writeText(transcript).then(() => {
      toast.success("Transcript copied to clipboard");
    }).catch(() => {
      toast.error("Failed to copy transcript");
    });
  }, []);

  // ─── Delete ───

  const handleDelete = useCallback((id: string) => {
    const note = voiceNotes.find((n) => n.id === id);
    if (note?.audioUrl) {
      URL.revokeObjectURL(note.audioUrl);
    }
    setVoiceNotes((prev) => prev.filter((n) => n.id !== id));
    if (playingId === id) {
      setPlayingId(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }
    toast.success("Voice note deleted");
  }, [voiceNotes, playingId]);

  // ─── Rename ───

  const handleStartEdit = (note: VoiceNote) => {
    setEditingId(note.id);
    setEditName(note.name);
  };

  const handleSaveEdit = (note: VoiceNote) => {
    if (editName.trim()) {
      setVoiceNotes((prev) =>
        prev.map((n) => (n.id === note.id ? { ...n, name: editName.trim() } : n))
      );
      toast.success("Renamed successfully");
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  // ─── Waveform Component ───

  const RecordingWaveform = () => (
    <div className="flex items-center gap-0.5 h-10">
      {Array.from({ length: 30 }).map((_, i) => (
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

  const PausedWaveform = () => (
    <div className="flex items-center gap-0.5 h-10">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="w-0.5 bg-amber-500 rounded-full"
          style={{ height: `${15 + Math.random() * 30}%` }}
        />
      ))}
    </div>
  );

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

  const showTranscriptPanel = recorder.state === "recording" || recorder.state === "paused";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Mic className="h-7 w-7 text-primary" />
          Voice Notes
        </h1>
        <p className="mt-1 text-muted-foreground">Record, playback, transcribe, and manage your trading voice notes</p>
      </div>

      {/* Real Feature Banner */}
      <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-sm text-green-700 dark:text-green-400">Phase 5C Active</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Real voice recording with MediaRecorder API and browser speech recognition.
            Notes are stored locally in your browser.
          </p>
        </div>
      </div>

      {/* Recording Controls */}
      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            {/* Waveform */}
            <div className="flex items-center justify-center h-12 w-full">
              {recorder.state === "recording" && <RecordingWaveform />}
              {recorder.state === "paused" && <PausedWaveform />}
              {(recorder.state === "idle" || recorder.state === "stopped") && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} className="w-0.5 h-2 bg-muted-foreground/20 rounded-full" />
                  ))}
                </div>
              )}
            </div>

            {/* Timer */}
            <div className="text-center">
              <div className={cn(
                "text-4xl font-mono font-bold tabular-nums tracking-wider",
                recorder.state === "recording" && "text-red-500 animate-pulse"
              )}>
                {formatDuration(recorder.state === "idle" ? 0 : recorder.duration)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {recorder.state === "idle" && "Tap to start recording"}
                {recorder.state === "recording" && "Recording..."}
                {recorder.state === "paused" && "Paused"}
                {recorder.state === "stopped" && "Recording complete"}
              </p>
            </div>

            {/* Error */}
            {recorder.error && (
              <p className="text-sm text-destructive text-center">{recorder.error}</p>
            )}

            {/* Control Buttons */}
            <div className="flex items-center gap-3">
              {recorder.state === "idle" && (
                <Button
                  size="lg"
                  className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white p-0"
                  onClick={handleStartRecording}
                >
                  <Mic className="h-6 w-6" />
                </Button>
              )}

              {recorder.state === "recording" && (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 w-12 rounded-full p-0"
                    onClick={handlePauseRecording}
                  >
                    <Pause className="h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white p-0"
                    onClick={handleStopRecording}
                  >
                    <Square className="h-5 w-5" />
                  </Button>
                </>
              )}

              {recorder.state === "paused" && (
                <>
                  <Button
                    size="lg"
                    className="h-12 w-12 rounded-full p-0"
                    onClick={handleResumeRecording}
                  >
                    <Play className="h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 w-12 rounded-full p-0 border-red-500 text-red-500 hover:bg-red-500/10"
                    onClick={handleStopRecording}
                  >
                    <Square className="h-5 w-5" />
                  </Button>
                </>
              )}

              {recorder.state === "stopped" && (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 w-12 rounded-full p-0"
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
                    size="lg"
                    className="h-12 w-12 rounded-full p-0"
                    onClick={handleSaveRecording}
                  >
                    <Check className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="h-12 w-12 rounded-full p-0"
                    onClick={() => {
                      recorder.reset();
                      speech.reset();
                      setRecordingTimer(0);
                    }}
                  >
                    <RotateCcw className="h-5 w-5" />
                  </Button>
                </>
              )}
            </div>

            {/* Live Transcript during recording */}
            {showTranscriptPanel && (
              <div className="w-full max-w-lg">
                <div className="rounded-lg border bg-muted/50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {speech.isListening ? "Live Transcript" : speech.isCompleted ? "Transcript" : "Transcript"}
                    </span>
                    {speech.isListening && (
                      <Badge variant="secondary" className="text-xs animate-pulse">
                        Listening
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm min-h-[2rem]">
                    {speech.transcript}
                    {speech.interimTranscript && (
                      <span className="text-muted-foreground"> {speech.interimTranscript}</span>
                    )}
                    {!speech.transcript && !speech.interimTranscript && (
                      <span className="text-muted-foreground italic">
                        {speech.isUnsupported
                          ? "Speech recognition not supported in this browser. Try Chrome or Edge."
                          : "Speak now..."}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Speech recognition not supported warning */}
            {recorder.state === "idle" && speech.isUnsupported && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <span>Speech recognition not supported. Recording works, but transcription is unavailable.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Voice Notes List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Saved Notes ({voiceNotes.length})</h2>

        {voiceNotes.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <AudioLines className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">No voice notes yet</p>
              <p className="text-xs text-muted-foreground mt-1">Record your first voice note above</p>
            </CardContent>
          </Card>
        )}

        {voiceNotes.map((note) => (
          <Card
            key={note.id}
            className={cn(
              "transition-all hover:shadow-md",
              expandedNote === note.id && "border-primary/50 ring-1 ring-primary/20"
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
                    playingId === note.id && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => handlePlay(note)}
                >
                  {playingId === note.id ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 ml-0.5" />
                  )}
                </Button>

                {/* Note Info */}
                <div className="flex-1 min-w-0">
                  {editingId === note.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(note);
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSaveEdit(note)}>
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelEdit}>
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm truncate">{note.name}</h3>
                      {note.transcribed && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Transcribed
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(note.duration)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {!note.transcribed && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => handleTranscribeNote(note)}
                      disabled={isTranscribing}
                      title="Transcribe"
                    >
                      {isTranscribing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => handleStartEdit(note)}
                    disabled={editingId === note.id}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                    onClick={() => handleDelete(note.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Transcript Panel */}
              {(note.transcript || expandedNote === note.id) && (
                <div className="mt-4 pt-4 border-t animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Transcript
                    </h4>
                    {note.transcript && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => handleCopyTranscript(note.transcript)}
                        >
                          <Copy className="h-3 w-3" />
                          Copy
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => {
                            navigator.clipboard.writeText(note.transcript);
                            toast.success("Copied! Paste into journal notes.");
                          }}
                        >
                          <Copy className="h-3 w-3" />
                          Copy for Notes
                        </Button>
                      </div>
                    )}
                  </div>
                  {note.transcript ? (
                    <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
                      {note.transcript}
                    </p>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-lg p-3">
                      <Info className="h-4 w-4" />
                      <span>No transcript available. Click the transcript button to transcribe this note.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Expand/Collapse toggle */}
              {note.transcript && (
                <button
                  className="w-full text-center mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
                >
                  {expandedNote === note.id ? "Collapse" : "Show transcript"}
                </button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

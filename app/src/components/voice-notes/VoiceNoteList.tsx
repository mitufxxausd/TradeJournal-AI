/**
 * Voice Note List Component
 * Displays, plays, renames, and deletes voice notes.
 */

import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDuration } from "@/services/voice/voiceService";
import type { VoiceNote } from "@/services/ai/types";
import {
  Play,
  Pause,
  Trash2,
  Edit2,
  Check,
  X,
  AudioLines,
  Loader2,
  FileText,
} from "lucide-react";

interface VoiceNoteListProps {
  notes: VoiceNote[];
  onDelete?: (note: VoiceNote) => void;
  onRename?: (note: VoiceNote, newName: string) => void;
  disabled?: boolean;
}

export default function VoiceNoteList({ notes, onDelete, onRename, disabled }: VoiceNoteListProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlay = useCallback(
    (note: VoiceNote) => {
      // Stop current
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (playingId === note.id) {
        setPlayingId(null);
        return;
      }

      const audio = new Audio(note.url);
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
    },
    [playingId]
  );

  const handleStartEdit = (note: VoiceNote) => {
    setEditingId(note.id);
    setEditName(note.name);
  };

  const handleSaveEdit = (note: VoiceNote) => {
    if (editName.trim()) {
      onRename?.(note, editName.trim());
    }
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  if (disabled) return null;

  if (notes.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <AudioLines className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No voice notes yet</p>
          <p className="text-xs text-muted-foreground">Record your first voice note above</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <Card key={note.id} className="overflow-hidden">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={() => handlePlay(note)}
              >
                {playingId === note.id ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              {/* Info */}
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleSaveEdit(note)}
                    >
                      <Check className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{note.name}</span>
                    {note.transcriptionStatus === "completed" && note.transcribedText && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        <FileText className="mr-1 h-3 w-3" />
                        Transcribed
                      </Badge>
                    )}
                    {note.transcriptionStatus === "processing" && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        Transcribing
                      </Badge>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDuration(note.duration)}</span>
                  <span>•</span>
                  <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleStartEdit(note)}
                  disabled={editingId === note.id}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => onDelete?.(note)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Transcribed text preview */}
            {note.transcribedText && (
              <div className="mt-2 pt-2 border-t text-sm text-muted-foreground line-clamp-3">
                {note.transcribedText}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

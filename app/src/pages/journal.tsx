import { useState } from "react";
import { useNavigate } from "react-router";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { BookOpen, Save, Plus } from "lucide-react";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  tags: string[];
}

export default function Journal() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    try {
      const stored = localStorage.getItem("trade_journal_entries");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const saveEntries = (newEntries: JournalEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem("trade_journal_entries", JSON.stringify(newEntries));
  };

  const handleSave = () => {
    if (!title.trim() && !content.trim()) {
      toast.error("Please enter a title or content");
      return;
    }

    if (editingId) {
      const updated = entries.map((e) =>
        e.id === editingId
          ? { ...e, title: title || e.title, content, date: new Date().toISOString() }
          : e
      );
      saveEntries(updated);
      toast.success("Entry updated");
    } else {
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        title: title || "Untitled Entry",
        content,
        date: new Date().toISOString(),
        tags: [],
      };
      saveEntries([newEntry, ...entries]);
      toast.success("Entry saved");
    }

    setTitle("");
    setContent("");
    setEditingId(null);
  };

  const handleEdit = (entry: JournalEntry) => {
    setTitle(entry.title);
    setContent(entry.content);
    setEditingId(entry.id);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this entry?")) return;
    saveEntries(entries.filter((e) => e.id !== id));
    if (editingId === id) {
      setTitle("");
      setContent("");
      setEditingId(null);
    }
    toast.success("Entry deleted");
  };

  const handleNew = () => {
    setTitle("");
    setContent("");
    setEditingId(null);
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Trading Journal</h1>
            <p className="text-muted-foreground">Document your trading journey</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleNew}>
              <Plus className="mr-2 h-4 w-4" /> New Entry
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Entry Editor */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{editingId ? "Edit Entry" : "New Entry"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Entry title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea
                placeholder="Write your journal entry here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={16}
                className="font-mono text-sm resize-none"
              />
            </CardContent>
          </Card>

          {/* Entry List */}
          <div className="space-y-4">
            <h3 className="font-semibold">Recent Entries</h3>
            {entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>No entries yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <Card
                    key={entry.id}
                    className={`cursor-pointer hover:shadow-md transition-all ${
                      editingId === entry.id ? "border-primary" : ""
                    }`}
                    onClick={() => handleEdit(entry)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{entry.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(entry.id);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                      {entry.content && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {entry.content}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

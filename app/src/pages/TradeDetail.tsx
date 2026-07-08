import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrade } from "@/hooks/use-trade";
import { useAuth } from "@/contexts/AuthContext";
import { deleteTrade, toggleFavorite, togglePin } from "@/lib/firestore";
import type { Trade } from "@/types/trade";
import { toast } from "sonner";
import {
  ArrowLeft, Edit, Star, Pin, Trash2,
  Target, Clock, DollarSign, Image as ImageIcon, CheckSquare,
  Brain, FileText, ExternalLink, X,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function TradeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { trade, loading } = useTrade(user?.uid, id);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!id || !user?.uid) return;
    try {
      await deleteTrade(user.uid, id);
      toast.success("Trade deleted");
      navigate("/trades");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleFavorite = async () => {
    if (!trade || !user?.uid) return;
    try {
      await toggleFavorite(user.uid, trade.id, trade.isFavorite);
      toast.success(trade.isFavorite ? "Removed from favorites" : "Added to favorites");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handlePin = async () => {
    if (!trade || !user?.uid) return;
    try {
      await togglePin(user.uid, trade.id, trade.isPinned);
      toast.success(trade.isPinned ? "Unpinned" : "Pinned");
    } catch {
      toast.error("Failed to update");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64" />
        </div>
      </AppLayout>
    );
  }

  if (!trade) {
    return (
      <AppLayout>
        <div className="max-w-5xl mx-auto text-center py-12">
          <p className="text-lg text-muted-foreground">Trade not found</p>
          <Button className="mt-4" onClick={() => navigate("/trades")}>Back to Trades</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/trades")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{trade.pair}</h1>
                <Badge variant={trade.direction === "Buy" ? "default" : "secondary"}>{trade.direction}</Badge>
                <Badge variant="outline">{trade.market}</Badge>
                {trade.isFavorite && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                {trade.isPinned && <Pin className="h-4 w-4 text-primary" />}
              </div>
              <p className="text-sm text-muted-foreground">{trade.strategy} • {trade.setupName} • {trade.timeframe}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="icon" onClick={handleFavorite}>
              <Star className={`h-5 w-5 ${trade.isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={handlePin}>
              <Pin className={`h-5 w-5 ${trade.isPinned ? "text-primary" : ""}`} />
            </Button>
            <Button variant="outline" onClick={() => navigate(`/trades/${trade.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Trade</AlertDialogTitle>
                  <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* P&L Summary */}
        <TradeSummary trade={trade} />

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="screenshots">Screenshots ({trade.screenshots.length})</TabsTrigger>
            <TabsTrigger value="psychology">Psychology</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" />Trade Information</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <DetailRow label="Pair" value={trade.pair} />
                  <DetailRow label="Market" value={trade.market} />
                  <DetailRow label="Direction" value={trade.direction} />
                  <DetailRow label="Broker" value={trade.broker || "-"} />
                  <DetailRow label="Account" value={trade.account || "-"} />
                  <DetailRow label="Strategy" value={trade.strategy || "-"} />
                  <DetailRow label="Setup" value={trade.setupName || "-"} />
                  <DetailRow label="Timeframe" value={trade.timeframe} />
                  <DetailRow label="Session" value={trade.session} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" />Price Levels</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <DetailRow label="Entry Price" value={trade.entryPrice.toFixed(5)} />
                  <DetailRow label="Stop Loss" value={trade.stopLoss?.toFixed(5) || "-"} />
                  <DetailRow label="Take Profit" value={trade.takeProfit?.toFixed(5) || "-"} />
                  <DetailRow label="Exit Price" value={trade.exitPrice?.toFixed(5) || "-"} />
                  <DetailRow label="Position Size" value={trade.positionSize.toLocaleString()} />
                  <DetailRow label="Risk %" value={trade.riskPercent ? `${trade.riskPercent}%` : "-"} />
                  <DetailRow label="R:R Ratio" value={trade.rrRatio?.toFixed(2) || "-"} />
                  <DetailRow label="Commission" value={`$${trade.commission}`} />
                  <DetailRow label="Swap" value={`$${trade.swap}`} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Timing</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <DetailRow label="Trade Date" value={trade.tradeDate} />
                  <DetailRow label="Entry Time" value={trade.entryTime || "-"} />
                  <DetailRow label="Exit Time" value={trade.exitTime || "-"} />
                  <DetailRow label="Status" value={<Badge variant={trade.status === "open" ? "default" : trade.status === "closed" ? "secondary" : "outline"}>{trade.status}</Badge>} />
                  <DetailRow label="Currency" value={trade.currency} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
                <CardContent>
                  {trade.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {trade.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                    </div>
                  ) : <p className="text-muted-foreground">No tags</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="screenshots">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" />Screenshots</CardTitle></CardHeader>
              <CardContent>
                {trade.screenshots.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {trade.screenshots.map((s) => (
                      <div key={s.id} className="group relative rounded-lg border overflow-hidden cursor-pointer" onClick={() => setSelectedImage(s.url)}>
                        <img src={s.url} alt={s.name} className="w-full h-40 object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ExternalLink className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-muted-foreground text-center py-8">No screenshots uploaded</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="psychology">
            {trade.psychology ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" />Before Trade</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <PsychologyBar label="Confidence" value={trade.psychology.before.confidence} />
                    <PsychologyBar label="Stress Level" value={trade.psychology.before.stressLevel} />
                    <PsychologyBar label="Focus Level" value={trade.psychology.before.focusLevel} />
                    <PsychologyBar label="Sleep Quality" value={trade.psychology.before.sleepQuality} />
                    <DetailRow label="Emotion" value={trade.psychology.before.emotion} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>During Trade</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <PsychologyBar label="Fear" value={trade.psychology.during.fear} />
                    <PsychologyBar label="Greed" value={trade.psychology.during.greed} />
                    <PsychologyBar label="Patience" value={trade.psychology.during.patience} />
                    <PsychologyBar label="Discipline" value={trade.psychology.during.discipline} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>After Trade</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <DetailRow label="Emotion" value={trade.psychology.after.emotion} />
                    <div>
                      <p className="text-sm font-medium mb-1">Mistakes</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{trade.psychology.after.mistakes || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Lessons Learned</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{trade.psychology.after.lessonsLearned || "-"}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : <p className="text-muted-foreground">No psychology data recorded</p>}
          </TabsContent>

          <TabsContent value="checklist">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><CheckSquare className="h-5 w-5" />Checklist</CardTitle></CardHeader>
              <CardContent>
                {trade.checklist.length > 0 ? (
                  <div className="space-y-2">
                    {trade.checklist.map((item) => (
                      <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border ${item.checked ? "bg-green-50 dark:bg-green-950/20 border-green-200" : ""}`}>
                        <div className={`h-5 w-5 rounded border-2 flex items-center justify-center ${item.checked ? "bg-green-500 border-green-500" : "border-muted-foreground"}`}>
                          {item.checked && <CheckSquare className="h-3 w-3 text-white" />}
                        </div>
                        <span className={item.checked ? "line-through text-muted-foreground" : ""}>{item.label}</span>
                      </div>
                    ))}
                    <div className="mt-4">
                      <p className="text-sm font-medium">
                        {trade.checklist.filter((i) => i.checked).length} of {trade.checklist.length} completed
                      </p>
                      <div className="h-2 rounded-full bg-muted overflow-hidden mt-1">
                        <div className="h-full bg-green-500 transition-all" style={{ width: `${(trade.checklist.filter((i) => i.checked).length / trade.checklist.length) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ) : <p className="text-muted-foreground">No checklist items</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Journal Notes</CardTitle></CardHeader>
              <CardContent>{renderNotes(trade.notes)}</CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Full screen image viewer */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Screenshot" className="max-w-full max-h-full object-contain rounded-lg" />
          <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white" onClick={() => setSelectedImage(null)}>
            <X className="h-6 w-6" />
          </Button>
        </div>
      )}
    </AppLayout>
  );
}

function TradeSummary({ trade }: { trade: Trade }) {
  const isWin = (trade.profitLoss || 0) > 0;
  const isLoss = (trade.profitLoss || 0) < 0;

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 rounded-xl ${isWin ? "bg-green-50 dark:bg-green-950/20" : isLoss ? "bg-red-50 dark:bg-red-950/20" : "bg-muted"}`}>
      <div>
        <p className="text-sm text-muted-foreground">Profit / Loss</p>
        <p className={`text-3xl font-bold ${isWin ? "text-green-600" : isLoss ? "text-red-600" : ""}`}>
          {isWin ? "+" : ""}${(trade.profitLoss || 0).toFixed(2)}
        </p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">R:R Ratio</p>
        <p className="text-2xl font-semibold">{trade.rrRatio?.toFixed(2) || "-"}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Position Size</p>
        <p className="text-2xl font-semibold">{trade.positionSize.toLocaleString()}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Risk %</p>
        <p className="text-2xl font-semibold">{trade.riskPercent ? `${trade.riskPercent}%` : "-"}</p>
      </div>
    </div>
  );
}

function renderNotes(text: string) {
  if (!text) return <p className="text-muted-foreground italic">No notes added</p>;
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
      {text}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-1 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function PsychologyBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm">{label}</span>
        <span className="text-sm font-medium">{value}/10</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary transition-all rounded-full" style={{ width: `${value * 10}%` }} />
      </div>
    </div>
  );
}

import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createTrade, updateTrade, getTrade } from "@/lib/firestore";
import { uploadToCloudinary } from "@/services/cloudinary";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, Plus, X, Upload, Trash2, Star, Image as ImageIcon, GripVertical } from "lucide-react";
import type { Trade, Market, Direction, Session, TradePsychology, TradeChecklistItem, TradeScreenshot } from "@/types/trade";

const MARKETS: Market[] = ["Forex", "Crypto", "Stocks", "Futures", "Options"];
const DIRECTIONS: Direction[] = ["Buy", "Sell"];
const SESSIONS: Session[] = ["London", "New York", "Tokyo", "Sydney", "Asian", "European", "American", "Other"];
const TIMEFRAMES = ["1M", "5M", "15M", "30M", "1H", "4H", "D", "W", "MN"];
const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF"];
const EMOTIONS = ["Neutral", "Confident", "Nervous", "Excited", "Fearful", "Greedy", "Impatient", "Disciplined", "Revengeful", "FOMO"];

const DEFAULT_CHECKLIST: TradeChecklistItem[] = [
  { id: "1", label: "Waited for confirmation", checked: false },
  { id: "2", label: "Risk below limit", checked: false },
  { id: "3", label: "Trend followed", checked: false },
  { id: "4", label: "News checked", checked: false },
  { id: "5", label: "Entry according to plan", checked: false },
];

const DEFAULT_TAGS = ["Scalp", "Swing", "Breakout", "Reversal", "Liquidity", "London", "New York", "FOMO", "Revenge"];

export default function AddTrade() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isEditing = !!id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // Form state
  const [pair, setPair] = useState("");
  const [market, setMarket] = useState<Market>("Forex");
  const [direction, setDirection] = useState<Direction>("Buy");
  const [broker, setBroker] = useState("");
  const [account, setAccount] = useState("");
  const [strategy, setStrategy] = useState("");
  const [setupName, setSetupName] = useState("");
  const [timeframe, setTimeframe] = useState("1H");
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [exitPrice, setExitPrice] = useState("");
  const [positionSize, setPositionSize] = useState("");
  const [riskPercent, setRiskPercent] = useState("");
  const [commission, setCommission] = useState("0");
  const [swap, setSwap] = useState("0");
  const [profitLoss, setProfitLoss] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [tradeDate, setTradeDate] = useState(new Date().toISOString().split("T")[0]);
  const [entryTime, setEntryTime] = useState("");
  const [exitTime, setExitTime] = useState("");
  const [session, setSession] = useState<Session>("London");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<Trade["status"]>("breakeven");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [screenshots, setScreenshots] = useState<TradeScreenshot[]>([]);
  const [checklist, setChecklist] = useState<TradeChecklistItem[]>(DEFAULT_CHECKLIST);
  const [checklistInput, setChecklistInput] = useState("");
  const [psychology, setPsychology] = useState<TradePsychology>({
    before: { confidence: 5, stressLevel: 5, emotion: "Neutral", focusLevel: 5, sleepQuality: 5 },
    during: { fear: 5, greed: 5, patience: 5, discipline: 5 },
    after: { emotion: "Neutral", mistakes: "", lessonsLearned: "" },
  });

  // Load trade for editing
  useEffect(() => {
    if (!id || !user?.uid) return;
    setLoading(true);
    getTrade(user.uid, id).then((trade) => {
      if (trade) {
        setPair(trade.pair);
        setMarket(trade.market);
        setDirection(trade.direction);
        setBroker(trade.broker);
        setAccount(trade.account);
        setStrategy(trade.strategy);
        setSetupName(trade.setupName);
        setTimeframe(trade.timeframe);
        setEntryPrice(trade.entryPrice.toString());
        setStopLoss(trade.stopLoss?.toString() || "");
        setTakeProfit(trade.takeProfit?.toString() || "");
        setExitPrice(trade.exitPrice?.toString() || "");
        setPositionSize(trade.positionSize.toString());
        setRiskPercent(trade.riskPercent?.toString() || "");
        setCommission(trade.commission.toString());
        setSwap(trade.swap.toString());
        setProfitLoss(trade.profitLoss?.toString() || "");
        setCurrency(trade.currency);
        setTradeDate(trade.tradeDate);
        setEntryTime(trade.entryTime);
        setExitTime(trade.exitTime || "");
        setSession(trade.session);
        setNotes(trade.notes);
        setStatus(trade.status);
        setIsFavorite(trade.isFavorite);
        setIsPinned(trade.isPinned);
        setIsArchived(trade.isArchived);
        setTags(trade.tags);
        setScreenshots(trade.screenshots || []);
        setChecklist(trade.checklist.length > 0 ? trade.checklist : DEFAULT_CHECKLIST);
        if (trade.psychology) setPsychology(trade.psychology);
      }
      setLoading(false);
    });
  }, [id, user?.uid]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleAddChecklistItem = () => {
    if (checklistInput.trim()) {
      setChecklist([...checklist, { id: Date.now().toString(), label: checklistInput.trim(), checked: false }]);
      setChecklistInput("");
    }
  };

  const handleToggleChecklist = (id: string) => {
    setChecklist(checklist.map((item) => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    handleUploadFiles(files);
  }, [screenshots]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    handleUploadFiles(files);
  };

  const handleUploadFiles = async (files: File[]) => {
    if (!user?.uid) {
      toast.error("You must be logged in to upload screenshots");
      return;
    }

    for (const file of files) {
      const uploadId = Date.now().toString() + Math.random().toString(36).slice(2);
      setUploadProgress((prev) => ({ ...prev, [uploadId]: 0 }));

      try {
        const result = await uploadToCloudinary(
          file,
          ({ progress }) => {
            setUploadProgress((prev) => ({ ...prev, [uploadId]: progress }));
          }
        );

        setScreenshots((prev) => [
          ...prev,
          {
            id: uploadId,
            url: result.secure_url,
            name: file.name,
            uploadedAt: new Date().toISOString(),
          },
        ]);
        toast.success(`${file.name} uploaded`);
      } catch (error: unknown) {
        const err = error as { message?: string };
        console.error("Upload error:", err);
        toast.error(err.message || `Failed to upload ${file.name}`);
      } finally {
        setUploadProgress((prev) => {
          const n = { ...prev };
          delete n[uploadId];
          return n;
        });
      }
    }
  };

  const handleDeleteScreenshot = async (screenshot: TradeScreenshot) => {
    // For Cloudinary unsigned uploads, we can't delete via the client API
    // Just remove from local state - the image will remain on Cloudinary
    setScreenshots(screenshots.filter((s) => s.id !== screenshot.id));
    toast.success("Screenshot removed");
  };

  const calculateAutoPl = () => {
    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const dir = direction === "Buy" ? 1 : -1;
    if (!isNaN(entry) && !isNaN(exit) && entry !== 0) {
      const pl = (exit - entry) * dir * parseFloat(positionSize || "1");
      setProfitLoss(pl.toFixed(2));
    }
  };

  const handleSubmit = async () => {
    if (!user?.uid) {
      toast.error("You must be logged in");
      return;
    }
    if (!pair.trim()) { toast.error("Trading pair is required"); return; }
    if (!entryPrice) { toast.error("Entry price is required"); return; }
    if (!positionSize) { toast.error("Position size is required"); return; }

    setSaving(true);
    try {
      const tradeData = {
        pair: pair.trim().toUpperCase(),
        market,
        direction,
        broker: broker.trim(),
        account: account.trim(),
        strategy: strategy.trim(),
        setupName: setupName.trim(),
        timeframe,
        entryPrice: parseFloat(entryPrice),
        stopLoss: stopLoss ? parseFloat(stopLoss) : null,
        takeProfit: takeProfit ? parseFloat(takeProfit) : null,
        exitPrice: exitPrice ? parseFloat(exitPrice) : null,
        positionSize: parseFloat(positionSize),
        riskPercent: riskPercent ? parseFloat(riskPercent) : null,
        rrRatio: stopLoss && parseFloat(stopLoss) !== 0
          ? Math.abs((parseFloat(takeProfit || entryPrice) - parseFloat(entryPrice)) / (parseFloat(entryPrice) - parseFloat(stopLoss)))
          : null,
        commission: parseFloat(commission) || 0,
        swap: parseFloat(swap) || 0,
        profitLoss: profitLoss ? parseFloat(profitLoss) : null,
        currency,
        tradeDate,
        entryTime,
        exitTime: exitTime || null,
        session,
        status,
        isFavorite,
        isPinned,
        isArchived,
        tags,
        psychology,
        checklist,
        screenshots,
        notes,
      };

      if (isEditing && id) {
        await updateTrade(user.uid, id, tradeData);
        toast.success("Trade updated successfully");
        navigate(`/trades/${id}`);
      } else {
        const newTrade = await createTrade(user.uid, tradeData);
        toast.success("Trade created successfully");
        navigate(`/trades/${newTrade.id}`);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err.message || "Failed to save trade");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditing ? "Edit Trade" : "Add New Trade"}
            </h1>
            <p className="text-muted-foreground">Record your trade details for analysis</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate("/trades")}>Cancel</Button>
            <Button variant="ghost" size="icon" onClick={() => setIsFavorite(!isFavorite)}>
              <Star className={`h-5 w-5 ${isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEditing ? "Update Trade" : "Save Trade"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto">
            <TabsTrigger value="details">Trade Details</TabsTrigger>
            <TabsTrigger value="psychology">Psychology</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="screenshots">Screenshots ({screenshots.length})</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            {/* Basic Info */}
            <Card>
              <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pair">Trading Pair *</Label>
                  <Input id="pair" value={pair} onChange={(e) => setPair(e.target.value)} placeholder="EURUSD" required />
                </div>
                <div className="space-y-2">
                  <Label>Market</Label>
                  <Select value={market} onValueChange={(v) => setMarket(v as Market)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{MARKETS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Direction</Label>
                  <Select value={direction} onValueChange={(v) => setDirection(v as Direction)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{DIRECTIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="broker">Broker</Label>
                  <Input id="broker" value={broker} onChange={(e) => setBroker(e.target.value)} placeholder="OANDA" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account">Account</Label>
                  <Input id="account" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="Main" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="strategy">Strategy</Label>
                  <Input id="strategy" value={strategy} onChange={(e) => setStrategy(e.target.value)} placeholder="Supply & Demand" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="setupName">Setup Name</Label>
                  <Input id="setupName" value={setupName} onChange={(e) => setSetupName(e.target.value)} placeholder="FVG Reversal" />
                </div>
                <div className="space-y-2">
                  <Label>Timeframe</Label>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TIMEFRAMES.map((tf) => <SelectItem key={tf} value={tf}>{tf}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Session</Label>
                  <Select value={session} onValueChange={(v) => setSession(v as Session)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SESSIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Prices */}
            <Card>
              <CardHeader><CardTitle>Price Levels</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entryPrice">Entry Price *</Label>
                  <Input id="entryPrice" type="number" step="0.00001" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stopLoss">Stop Loss</Label>
                  <Input id="stopLoss" type="number" step="0.00001" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="takeProfit">Take Profit</Label>
                  <Input id="takeProfit" type="number" step="0.00001" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exitPrice">Exit Price</Label>
                  <Input id="exitPrice" type="number" step="0.00001" value={exitPrice} onChange={(e) => { setExitPrice(e.target.value); }} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="positionSize">Position Size *</Label>
                  <Input id="positionSize" type="number" step="0.01" value={positionSize} onChange={(e) => setPositionSize(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="riskPercent">Risk %</Label>
                  <Input id="riskPercent" type="number" step="0.1" value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* P&L */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Profit / Loss</CardTitle>
                <Button variant="outline" size="sm" onClick={calculateAutoPl} type="button">Auto Calculate</Button>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profitLoss">Profit/Loss</Label>
                  <Input id="profitLoss" type="number" step="0.01" value={profitLoss} onChange={(e) => setProfitLoss(e.target.value)} placeholder="0.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission">Commission</Label>
                  <Input id="commission" type="number" step="0.01" value={commission} onChange={(e) => setCommission(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="swap">Swap</Label>
                  <Input id="swap" type="number" step="0.01" value={swap} onChange={(e) => setSwap(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Timing */}
            <Card>
              <CardHeader><CardTitle>Timing</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tradeDate">Trade Date *</Label>
                  <Input id="tradeDate" type="date" value={tradeDate} onChange={(e) => setTradeDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entryTime">Entry Time</Label>
                  <Input id="entryTime" type="time" value={entryTime} onChange={(e) => setEntryTime(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exitTime">Exit Time</Label>
                  <Input id="exitTime" type="time" value={exitTime} onChange={(e) => setExitTime(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as Trade["status"])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="breakeven">Breakeven</SelectItem>
                      <SelectItem value="win">Win</SelectItem>
                      <SelectItem value="loss">Loss</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag..."
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" onClick={handleAddTag} size="icon"><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_TAGS.filter((t) => !tags.includes(t)).map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-primary/20" onClick={() => setTags([...tags, tag])}>
                      + {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="default" className="gap-1 pr-1">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-red-400"><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="psychology" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Before Trade</CardTitle><CardDescription>Your mental state before entering</CardDescription></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { label: "Confidence", key: "confidence" as const },
                  { label: "Stress Level", key: "stressLevel" as const },
                  { label: "Focus Level", key: "focusLevel" as const },
                  { label: "Sleep Quality", key: "sleepQuality" as const },
                ].map((item) => (
                  <div key={item.key} className="space-y-2">
                    <div className="flex justify-between"><Label>{item.label}</Label><span className="text-sm font-medium">{psychology.before[item.key]}/10</span></div>
                    <Slider value={[psychology.before[item.key]]} min={1} max={10} step={1} onValueChange={([v]) => setPsychology({ ...psychology, before: { ...psychology.before, [item.key]: v } })} />
                  </div>
                ))}
                <div className="space-y-2">
                  <Label>Emotion</Label>
                  <Select value={psychology.before.emotion} onValueChange={(v) => setPsychology({ ...psychology, before: { ...psychology.before, emotion: v } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{EMOTIONS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>During Trade</CardTitle><CardDescription>Your emotions while in the trade</CardDescription></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { label: "Fear", key: "fear" as const },
                  { label: "Greed", key: "greed" as const },
                  { label: "Patience", key: "patience" as const },
                  { label: "Discipline", key: "discipline" as const },
                ].map((item) => (
                  <div key={item.key} className="space-y-2">
                    <div className="flex justify-between"><Label>{item.label}</Label><span className="text-sm font-medium">{psychology.during[item.key]}/10</span></div>
                    <Slider value={[psychology.during[item.key]]} min={1} max={10} step={1} onValueChange={([v]) => setPsychology({ ...psychology, during: { ...psychology.during, [item.key]: v } })} />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>After Trade</CardTitle><CardDescription>Reflection post-trade</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Emotion</Label>
                  <Select value={psychology.after.emotion} onValueChange={(v) => setPsychology({ ...psychology, after: { ...psychology.after, emotion: v } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{EMOTIONS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mistakes">Mistakes Made</Label>
                  <Textarea id="mistakes" value={psychology.after.mistakes} onChange={(e) => setPsychology({ ...psychology, after: { ...psychology.after, mistakes: e.target.value } })} placeholder="What went wrong?" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lessons">Lessons Learned</Label>
                  <Textarea id="lessons" value={psychology.after.lessonsLearned} onChange={(e) => setPsychology({ ...psychology, after: { ...psychology.after, lessonsLearned: e.target.value } })} placeholder="What did you learn?" rows={3} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checklist" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Trade Checklist</CardTitle>
                <CardDescription>Verify your trading rules before execution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input value={checklistInput} onChange={(e) => setChecklistInput(e.target.value)} placeholder="Add checklist item..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddChecklistItem())} />
                  <Button type="button" onClick={handleAddChecklistItem} size="icon"><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-2">
                  {checklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                      <Switch checked={item.checked} onCheckedChange={() => handleToggleChecklist(item.id)} />
                      <span className={`flex-1 ${item.checked ? "line-through text-muted-foreground" : ""}`}>{item.label}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveChecklistItem(item.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="screenshots" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Trade Screenshots</CardTitle>
                <CardDescription>Upload chart screenshots for this trade (Cloudinary)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleFileDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Click or drag &amp; drop to upload</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
                </div>

                {/* Upload progress */}
                {Object.entries(uploadProgress).map(([id, progress]) => (
                  <div key={id} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <div className="flex-1"><div className="h-2 rounded-full bg-primary/20 overflow-hidden"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div></div>
                    <span className="text-xs">{Math.round(progress)}%</span>
                  </div>
                ))}

                {/* Screenshots grid */}
                {screenshots.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {screenshots.map((screenshot) => (
                      <div key={screenshot.id} className="group relative rounded-lg border overflow-hidden">
                        <img src={screenshot.url} alt={screenshot.name} className="w-full h-32 object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => window.open(screenshot.url, "_blank")}><ImageIcon className="h-4 w-4" /></Button>
                          <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteScreenshot(screenshot)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Journal Notes</CardTitle><CardDescription>Additional notes about this trade</CardDescription></CardHeader>
              <CardContent>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Write your trade notes here... Use **bold**, *italic*, or create lists." rows={12} className="font-mono text-sm" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

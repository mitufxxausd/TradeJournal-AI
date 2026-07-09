/**
 * AI Settings Page
 * Configure OCR settings, feature preferences, and advanced options.
 * All settings are persisted to localStorage.
 */

import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSubscription } from "@/hooks/use-subscription";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Cpu,
  CheckCircle2,
  Sparkles,
  Lock,
  RefreshCw,
  Server,
  Gauge,
  AlertTriangle,
  ChevronRight,
  ScanText,
  Languages,
  ImagePlus,
  Bot,
  Eye,
  Settings2,
  Hash,
  Trash2,
  Download,
} from "lucide-react";

// ─── OCR Settings Types ───

const ocrLanguages = [
  { code: "eng", name: "English" },
  { code: "deu", name: "German" },
  { code: "fra", name: "French" },
  { code: "spa", name: "Spanish" },
  { code: "ita", name: "Italian" },
  { code: "por", name: "Portuguese" },
  { code: "rus", name: "Russian" },
  { code: "chi_sim", name: "Chinese (Simplified)" },
  { code: "chi_tra", name: "Chinese (Traditional)" },
  { code: "jpn", name: "Japanese" },
  { code: "kor", name: "Korean" },
  { code: "ara", name: "Arabic" },
  { code: "tur", name: "Turkish" },
  { code: "nld", name: "Dutch" },
  { code: "pol", name: "Polish" },
];

const featureToggles = [
  { id: "voiceTranscription", label: "Auto-transcribe voice notes", defaultValue: true },
  { id: "weeklyReport", label: "Generate weekly coaching reports", defaultValue: true },
  { id: "notifications", label: "AI insight notifications", defaultValue: true },
  { id: "saveHistory", label: "Save AI analysis history", defaultValue: true },
];

// ─── Feature Gate ───

function LockedFeature() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Lock className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">AI Settings Locked</h3>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
        Upgrade to <span className="font-semibold text-primary">Pro</span> or{" "}
        <span className="font-semibold text-primary">Elite</span> to access AI settings.
      </p>
      <Button className="mt-6" asChild>
        <a href="#/ai/subscription">Upgrade Now</a>
      </Button>
    </div>
  );
}

// ─── Main Component ───

export default function AISettings() {
  const { hasAccess } = useSubscription();

  // OCR Settings
  const [ocrLanguage, setOcrLanguage] = useState(() => {
    return localStorage.getItem("tj_ocr_language") || "eng";
  });
  const [ocrQuality, setOcrQuality] = useState<"low" | "medium" | "high">(() => {
    return (localStorage.getItem("tj_ocr_quality") as "low" | "medium" | "high") || "medium";
  });
  const [ocrConfidenceThreshold, setOcrConfidenceThreshold] = useState(() => {
    return parseInt(localStorage.getItem("tj_ocr_confidence_threshold") || "60", 10);
  });
  const [ocrAutoFill, setOcrAutoFill] = useState(() => {
    return localStorage.getItem("tj_ocr_autofill") !== "false";
  });
  const [ocrAutoAnalyze, setOcrAutoAnalyze] = useState(() => {
    return localStorage.getItem("tj_ocr_autoanalyze") === "true";
  });
  const [ocrIgnorePriceScale, setOcrIgnorePriceScale] = useState(() => {
    return localStorage.getItem("tj_ocr_ignore_price_scale") !== "false";
  });
  const [ocrMultipleTradeDetection, setOcrMultipleTradeDetection] = useState(() => {
    return localStorage.getItem("tj_ocr_multiple_trade_detection") !== "false";
  });
  const [ocrShowRaw, setOcrShowRaw] = useState(() => {
    return localStorage.getItem("tj_ocr_show_raw") === "true";
  });

  // Feature toggles
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(featureToggles.map((f) => [f.id, f.defaultValue]))
  );

  const canAccess = hasAccess("aiScreenshotAnalysis");

  const handleToggle = (id: string) => {
    setToggles((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      toast.success(`${featureToggles.find((f) => f.id === id)?.label} ${next[id] ? "enabled" : "disabled"}`);
      return next;
    });
  };

  const handleOcrLanguageChange = (value: string) => {
    setOcrLanguage(value);
    localStorage.setItem("tj_ocr_language", value);
    toast.success(`OCR language set to ${ocrLanguages.find((l) => l.code === value)?.name || value}`);
  };

  const handleOcrQualityChange = (value: "low" | "medium" | "high") => {
    setOcrQuality(value);
    localStorage.setItem("tj_ocr_quality", value);
    toast.success(`OCR image quality set to ${value}`);
  };

  const handleConfidenceThresholdChange = (value: number[]) => {
    const threshold = value[0];
    setOcrConfidenceThreshold(threshold);
    localStorage.setItem("tj_ocr_confidence_threshold", String(threshold));
  };

  const handleConfidenceCommit = () => {
    toast.success(`OCR confidence threshold set to ${ocrConfidenceThreshold}%`);
  };

  const handleOcrAutoFillChange = (checked: boolean) => {
    setOcrAutoFill(checked);
    localStorage.setItem("tj_ocr_autofill", String(checked));
    toast.success(`Auto Fill ${checked ? "enabled" : "disabled"}`);
  };

  const handleOcrAutoAnalyzeChange = (checked: boolean) => {
    setOcrAutoAnalyze(checked);
    localStorage.setItem("tj_ocr_autoanalyze", String(checked));
    toast.success(`Auto Analyze ${checked ? "enabled" : "disabled"}`);
  };

  const handleIgnorePriceScaleChange = (checked: boolean) => {
    setOcrIgnorePriceScale(checked);
    localStorage.setItem("tj_ocr_ignore_price_scale", String(checked));
    toast.success(`Ignore Price Scale ${checked ? "enabled" : "disabled"}`);
  };

  const handleMultipleTradeDetectionChange = (checked: boolean) => {
    setOcrMultipleTradeDetection(checked);
    localStorage.setItem("tj_ocr_multiple_trade_detection", String(checked));
    toast.success(`Multiple Trade Detection ${checked ? "enabled" : "disabled"}`);
  };

  const handleShowRawChange = (checked: boolean) => {
    setOcrShowRaw(checked);
    localStorage.setItem("tj_ocr_show_raw", String(checked));
    toast.success(`Show Raw OCR ${checked ? "enabled" : "disabled"}`);
  };

  const handleRefresh = () => {
    toast.success("AI configuration refreshed");
  };

  const handleClearVoiceNotes = () => {
    if (confirm("Are you sure you want to delete all voice notes? This cannot be undone.")) {
      localStorage.removeItem("tradejournal_voice_notes");
      toast.success("All voice notes cleared");
    }
  };

  const handleResetOCR = () => {
    if (confirm("Reset all OCR settings to defaults?")) {
      setOcrLanguage("eng");
      setOcrQuality("medium");
      setOcrConfidenceThreshold(60);
      setOcrAutoFill(true);
      setOcrAutoAnalyze(false);
      setOcrIgnorePriceScale(true);
      setOcrMultipleTradeDetection(true);
      setOcrShowRaw(false);
      localStorage.removeItem("tj_ocr_language");
      localStorage.removeItem("tj_ocr_quality");
      localStorage.removeItem("tj_ocr_confidence_threshold");
      localStorage.removeItem("tj_ocr_autofill");
      localStorage.removeItem("tj_ocr_autoanalyze");
      localStorage.removeItem("tj_ocr_ignore_price_scale");
      localStorage.removeItem("tj_ocr_multiple_trade_detection");
      localStorage.removeItem("tj_ocr_show_raw");
      toast.success("OCR settings reset to defaults");
    }
  };

  if (!canAccess) {
    return (
    <AppLayout>
      <div className="space-y-6 animate-in fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Cpu className="h-7 w-7 text-primary" />
            AI Settings
          </h1>
          <p className="mt-1 text-muted-foreground">Configure AI preferences</p>
        </div>
        <LockedFeature />
      </div>
    
    </AppLayout>);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Cpu className="h-7 w-7 text-primary" />
          AI Settings
        </h1>
        <p className="mt-1 text-muted-foreground">
          Configure OCR settings and feature preferences
        </p>
      </div>

      {/* Active Status */}
      <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-semibold">AI Features Active</h3>
              <p className="text-sm text-muted-foreground">
                OCR, Voice Recording, and Coaching are using real browser APIs
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                Connected
              </Badge>
              <Button variant="outline" size="sm" className="gap-1" onClick={handleRefresh}>
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OCR Settings */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ScanText className="h-5 w-5 text-primary" />
          OCR Settings
        </h2>
        <Card>
          <CardContent className="p-0 divide-y">
            {/* OCR Language */}
            <div className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Languages className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">OCR Language</p>
                    <p className="text-xs text-muted-foreground">Language used for text recognition in screenshots</p>
                  </div>
                </div>
                <Select value={ocrLanguage} onValueChange={handleOcrLanguageChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ocrLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Image Quality */}
            <div className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Image Processing Quality</p>
                    <p className="text-xs text-muted-foreground">Higher quality is slower but more accurate</p>
                  </div>
                </div>
                <Select value={ocrQuality} onValueChange={(v) => handleOcrQualityChange(v as "low" | "medium" | "high")}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (Fast)</SelectItem>
                    <SelectItem value="medium">Medium (Balanced)</SelectItem>
                    <SelectItem value="high">High (Accurate)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Confidence Threshold */}
            <div className="p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Settings2 className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">Confidence Threshold</p>
                      <Badge variant="outline" className="text-xs">{ocrConfidenceThreshold}%</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Minimum OCR confidence to accept detected values
                    </p>
                  </div>
                </div>
                <Slider
                  value={[ocrConfidenceThreshold]}
                  onValueChange={handleConfidenceThresholdChange}
                  onValueCommit={handleConfidenceCommit}
                  min={10}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>

            {/* Ignore Price Scale */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Ignore Price Scale</p>
                    <p className="text-xs text-muted-foreground">Filter out chart price scale, indicator values, and watermarks</p>
                  </div>
                </div>
                <Switch checked={ocrIgnorePriceScale} onCheckedChange={handleIgnorePriceScaleChange} />
              </div>
            </div>

            {/* Multiple Trade Detection */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Hash className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Multiple Trade Detection</p>
                    <p className="text-xs text-muted-foreground">Detect and separate multiple trades in a single screenshot</p>
                  </div>
                </div>
                <Switch checked={ocrMultipleTradeDetection} onCheckedChange={handleMultipleTradeDetectionChange} />
              </div>
            </div>

            {/* Auto Fill */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Auto Fill Trade</p>
                    <p className="text-xs text-muted-foreground">After OCR, show &quot;Auto Fill Trade&quot; button to populate Add Trade form</p>
                  </div>
                </div>
                <Switch checked={ocrAutoFill} onCheckedChange={handleOcrAutoFillChange} />
              </div>
            </div>

            {/* Auto Analyze */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ScanText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Auto Analyze on Upload</p>
                    <p className="text-xs text-muted-foreground">Automatically run OCR when screenshots are uploaded</p>
                  </div>
                </div>
                <Switch checked={ocrAutoAnalyze} onCheckedChange={handleOcrAutoAnalyzeChange} />
              </div>
            </div>

            {/* Show Raw OCR */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Eye className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Show Raw OCR Text</p>
                    <p className="text-xs text-muted-foreground">Display the full raw OCR output for debugging</p>
                  </div>
                </div>
                <Switch checked={ocrShowRaw} onCheckedChange={handleShowRawChange} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reset OCR */}
        <div className="mt-3">
          <Button variant="outline" size="sm" className="gap-1" onClick={handleResetOCR}>
            <RefreshCw className="h-3.5 w-3.5" />
            Reset OCR Settings
          </Button>
        </div>
      </section>

      <Separator />

      {/* Feature Toggles */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Gauge className="h-5 w-5 text-primary" />
          Feature Preferences
        </h2>
        <Card>
          <CardContent className="p-0">
            {featureToggles.map((feature, index) => (
              <div key={feature.id}>
                <div className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium text-sm">{feature.label}</p>
                  </div>
                  <Switch
                    checked={toggles[feature.id]}
                    onCheckedChange={() => handleToggle(feature.id)}
                  />
                </div>
                {index < featureToggles.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Advanced Settings */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" />
          Advanced
        </h2>
        <div className="space-y-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Reset AI Cache</h3>
                  <p className="text-sm text-muted-foreground">Clear all cached AI responses and analysis history</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => {
                  localStorage.removeItem("tradejournal_voice_notes");
                  toast.info("Cache cleared");
                }}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Export AI Data</h3>
                  <p className="text-sm text-muted-foreground">Download all AI analysis and voice note data</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => {
                  try {
                    const data = {
                      voiceNotes: JSON.parse(localStorage.getItem("tradejournal_voice_notes") || "[]"),
                      ocrSettings: {
                        language: ocrLanguage,
                        quality: ocrQuality,
                        confidenceThreshold: ocrConfidenceThreshold,
                      },
                      exportedAt: new Date().toISOString(),
                    };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `tradejournal-ai-data-${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success("Export complete");
                  } catch {
                    toast.error("Export failed");
                  }
                }}>
                  <Download className="h-3.5 w-3.5" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Clear Voice Notes</h3>
                  <p className="text-sm text-muted-foreground">Delete all locally stored voice recordings</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1 text-red-500 hover:text-red-600" onClick={handleClearVoiceNotes}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium">Privacy Note</h3>
                  <p className="text-sm text-muted-foreground">
                    All voice notes and OCR data are stored locally in your browser.
                    No audio or screenshot data is uploaded to any server unless you
                    explicitly configure cloud storage.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useSubscription } from "@/hooks/use-subscription";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Cpu,
  CheckCircle2,
  XCircle,
  Sparkles,
  Lock,
  RefreshCw,
  Server,
  Gauge,
  AlertTriangle,
  ChevronRight,
  Brain,
  type LucideIcon,
} from "lucide-react";

// ─── AI Provider Types ───

interface AIProvider {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  status: "active" | "available" | "coming_soon";
  capabilities: string[];
  model?: string;
}

const aiProviders: AIProvider[] = [
  {
    id: "mock",
    name: "Mock Provider",
    description: "Built-in demo provider with realistic mock responses for testing.",
    icon: Sparkles,
    status: "active",
    model: "Mock AI v1.0",
    capabilities: ["Chat", "Vision", "OCR", "Trade Analysis", "Coaching", "Transcription"],
  },
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4o with vision capabilities for screenshot analysis and coaching.",
    icon: Brain,
    status: "available",
    model: "gpt-4o",
    capabilities: ["Chat", "Vision", "Trade Analysis", "Coaching"],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description: "Gemini 2.0 Flash with fast multimodal analysis.",
    icon: Brain,
    status: "available",
    model: "gemini-2.0-flash",
    capabilities: ["Chat", "Vision", "OCR", "Trade Analysis", "Coaching"],
  },
  {
    id: "claude",
    name: "Claude (Anthropic)",
    description: "Claude Sonnet with excellent reasoning for trade analysis.",
    icon: Brain,
    status: "available",
    model: "claude-sonnet-4-20250514",
    capabilities: ["Chat", "Vision", "OCR", "Trade Analysis", "Coaching"],
  },
  {
    id: "groq",
    name: "Groq",
    description: "Ultra-fast inference with Llama 3.3 70B.",
    icon: Server,
    status: "available",
    model: "llama-3.3-70b-versatile",
    capabilities: ["Chat", "Trade Analysis", "Coaching"],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "Unified API access to multiple models including Claude and GPT.",
    icon: Server,
    status: "available",
    model: "anthropic/claude-sonnet-4",
    capabilities: ["Chat", "Vision", "Trade Analysis", "Coaching"],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    description: "DeepSeek Chat with strong reasoning capabilities.",
    icon: Brain,
    status: "coming_soon",
    model: "deepseek-chat",
    capabilities: ["Chat", "Trade Analysis", "Coaching"],
  },
  {
    id: "azure-openai",
    name: "Azure OpenAI",
    description: "Enterprise-grade OpenAI models via Azure cloud.",
    icon: Server,
    status: "coming_soon",
    model: "gpt-4o",
    capabilities: ["Chat", "Vision", "Trade Analysis", "Coaching"],
  },
];

const featureToggles = [
  { id: "autoAnalyze", label: "Auto-analyze screenshots on upload", defaultValue: false },
  { id: "voiceTranscription", label: "Auto-transcribe voice notes", defaultValue: true },
  { id: "weeklyReport", label: "Generate weekly coaching reports", defaultValue: true },
  { id: "notifications", label: "AI insight notifications", defaultValue: true },
  { id: "darkModeOptimize", label: "Optimize for dark mode charts", defaultValue: false },
  { id: "saveHistory", label: "Save AI analysis history", defaultValue: true },
];

// ─── Main Component ───

export default function AISettings() {
  const { tier } = useSubscription();
  const [activeProvider, setActiveProvider] = useState("mock");
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(featureToggles.map((f) => [f.id, f.defaultValue]))
  );

  const handleToggle = (id: string) => {
    setToggles((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      toast.success(`${featureToggles.find((f) => f.id === id)?.label} ${next[id] ? "enabled" : "disabled"}`);
      return next;
    });
  };

  const handleProviderSelect = (id: string) => {
    const provider = aiProviders.find((p) => p.id === id);
    if (provider?.status === "coming_soon") {
      toast.info(`${provider.name} - Coming soon!`);
      return;
    }
    setActiveProvider(id);
    toast.success(`Switched to ${provider?.name}`);
  };

  const handleRefresh = () => {
    toast.success("AI configuration refreshed");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Cpu className="h-7 w-7 text-primary" />
          AI Settings
        </h1>
        <p className="mt-1 text-muted-foreground">
          Configure AI providers and feature preferences
        </p>
      </div>

      {/* Active Provider Card */}
      <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-semibold">Active Provider</h3>
              <p className="text-sm text-muted-foreground">
                {aiProviders.find((p) => p.id === activeProvider)?.name} —{" "}
                {aiProviders.find((p) => p.id === activeProvider)?.model}
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

      {/* AI Provider Selection */}
      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          AI Provider
        </h2>
        <div className="space-y-3">
          {aiProviders.map((provider) => {
            const Icon = provider.icon;
            const isActive = activeProvider === provider.id;
            const isDisabled = provider.status === "coming_soon";

            return (
              <Card
                key={provider.id}
                className={cn(
                  "transition-all cursor-pointer",
                  isActive && "border-primary ring-1 ring-primary/20",
                  isDisabled && "opacity-60 cursor-not-allowed"
                )}
                onClick={() => !isDisabled && handleProviderSelect(provider.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      {isDisabled ? <Lock className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{provider.name}</h3>
                        {provider.status === "active" && (
                          <Badge className="bg-green-500 text-white text-xs">Active</Badge>
                        )}
                        {provider.status === "coming_soon" && (
                          <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                        )}
                        {provider.model && (
                          <Badge variant="outline" className="text-xs font-mono">{provider.model}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{provider.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {provider.capabilities.map((cap) => (
                          <Badge key={cap} variant="outline" className="text-xs">{cap}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {isActive ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <ChevronRight className={cn("h-5 w-5 text-muted-foreground", isDisabled && "opacity-0")} />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
                <Button variant="outline" size="sm" onClick={() => toast.info("Cache cleared")}>
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
                  <p className="text-sm text-muted-foreground">Download all AI analysis and coaching data</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.info("Export started")}>
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium">Experimental Features</h3>
                  <p className="text-sm text-muted-foreground">
                    Enable experimental AI features that are still in development.
                    These may be unstable or change without notice.
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <Switch id="experimental" />
                    <label htmlFor="experimental" className="text-sm font-medium cursor-pointer">
                      Enable experimental features
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/use-subscription";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  CreditCard,
  Check,
  X,
  Lock,
  Sparkles,
  Zap,
  Crown,
  Camera,
  Mic,
  Brain,
  ClipboardList,
  Infinity,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

// ─── Feature Data ───

interface Feature {
  name: string;
  icon: LucideIcon;
  free: boolean | string;
  pro: boolean | string;
  elite: boolean | string;
}

const features: Feature[] = [
  { name: "Manual Trade Journal", icon: ClipboardList, free: true, pro: true, elite: true },
  { name: "Screenshot OCR", icon: Camera, free: false, pro: true, elite: true },
  { name: "Voice Notes", icon: Mic, free: false, pro: true, elite: true },
  { name: "AI Screenshot Analysis", icon: Camera, free: false, pro: true, elite: true },
  { name: "AI Trade Summary", icon: ClipboardList, free: false, pro: false, elite: true },
  { name: "AI Coach", icon: Brain, free: false, pro: false, elite: true },
  { name: "Unlimited Analysis", icon: Infinity, free: false, pro: false, elite: true },
  { name: "Priority Processing", icon: Zap, free: false, pro: false, elite: true },
  { name: "Advanced Analytics", icon: BarChart3, free: false, pro: true, elite: true },
  { name: "Export & Reports", icon: ClipboardList, free: "Basic", pro: "Advanced", elite: "Full" },
];

// ─── Plan Card ───

interface PlanCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  icon: LucideIcon;
  color: string;
  buttonText: string;
  buttonVariant: "outline" | "default";
  isCurrentPlan: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}

function PlanCard({
  name,
  price,
  period,
  description,
  icon: Icon,
  color,
  buttonText,
  buttonVariant,
  isCurrentPlan,
  onSelect,
  children,
}: PlanCardProps) {
  return (
    <Card
      className={cn(
        "relative flex flex-col transition-all duration-300 hover:shadow-xl",
        isCurrentPlan && "ring-2 ring-primary ring-offset-2 scale-[1.02]"
      )}
    >
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-white px-3">Current Plan</Badge>
        </div>
      )}

      <CardHeader className="pb-3 text-center">
        <div className={cn("mx-auto flex h-14 w-14 items-center justify-center rounded-2xl", color)}>
          <Icon className="h-7 w-7 text-white" />
        </div>
        <CardTitle className="text-xl mt-3">{name}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <div className="text-center mb-6">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-muted-foreground">{period}</span>
        </div>

        <div className="flex-1 space-y-3">
          {children}
        </div>

        <Button
          variant={buttonVariant}
          className={cn("w-full mt-6", isCurrentPlan && "opacity-50 cursor-not-allowed")}
          onClick={onSelect}
          disabled={isCurrentPlan}
        >
          {isCurrentPlan ? "Current Plan" : buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Feature Row ───

function FeatureRow({ name, icon: Icon, free, pro, elite }: Feature) {
  const renderValue = (value: boolean | string) => {
    if (typeof value === "string") {
      return <span className="text-sm font-medium text-primary">{value}</span>;
    }
    return value ? (
      <Check className="h-5 w-5 text-green-500 mx-auto" />
    ) : (
      <X className="h-5 w-5 text-muted-foreground/40 mx-auto" />
    );
  };

  return (
    <div className="grid grid-cols-[1fr_80px_80px_80px] items-center gap-4 py-3 px-4 rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{name}</span>
      </div>
      <div className="text-center">{renderValue(free)}</div>
      <div className="text-center">{renderValue(pro)}</div>
      <div className="text-center">{renderValue(elite)}</div>
    </div>
  );
}

// ─── Main Component ───

export default function AISubscription() {
  const { tier, setTier } = useSubscription();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const handleSelectPlan = (plan: "free" | "pro" | "elite") => {
    if (plan === tier) {
      toast.info("This is your current plan");
      return;
    }
    setTier(plan);
    toast.success(`Switched to ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan (demo)`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
          <CreditCard className="h-7 w-7 text-primary" />
          Subscription
        </h1>
        <p className="mt-2 text-muted-foreground">
          Unlock the full power of AI trading analysis. Choose the plan that fits your needs.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              billingCycle === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              billingCycle === "yearly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Yearly
            <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">Save 17%</Badge>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid gap-6 lg:grid-cols-3 max-w-6xl mx-auto">
        {/* Free Plan */}
        <PlanCard
          name="Free"
          price="$0"
          period="/mo"
          description="Essential tools for manual journaling"
          icon={Sparkles}
          color="bg-muted-foreground"
          buttonText="Get Started"
          buttonVariant="outline"
          isCurrentPlan={tier === "free"}
          onSelect={() => handleSelectPlan("free")}
        >
          <ul className="space-y-3">
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              Manual trade journal
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              Basic analytics
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              Up to 50 trades/month
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <X className="h-4 w-4 shrink-0 mt-0.5" />
              AI screenshot analysis
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <X className="h-4 w-4 shrink-0 mt-0.5" />
              Voice notes
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <X className="h-4 w-4 shrink-0 mt-0.5" />
              AI coach
            </li>
          </ul>
        </PlanCard>

        {/* Pro Plan */}
        <PlanCard
          name="Pro"
          price={billingCycle === "monthly" ? "$19" : "$190"}
          period={billingCycle === "monthly" ? "/mo" : "/yr"}
          description="AI-powered analysis & transcription"
          icon={Zap}
          color="bg-gradient-to-br from-blue-500 to-cyan-400"
          buttonText="Upgrade to Pro"
          buttonVariant="default"
          isCurrentPlan={tier === "pro"}
          onSelect={() => handleSelectPlan("pro")}
        >
          <ul className="space-y-3">
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              Everything in Free
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              AI screenshot OCR
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              Voice notes & transcription
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              50 AI analyses/month
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              Advanced analytics
            </li>
            <li className="flex items-start gap-2 text-sm text-muted-foreground">
              <X className="h-4 w-4 shrink-0 mt-0.5" />
              AI coach
            </li>
          </ul>
        </PlanCard>

        {/* Elite Plan */}
        <PlanCard
          name="Elite"
          price={billingCycle === "monthly" ? "$49" : "$490"}
          period={billingCycle === "monthly" ? "/mo" : "/yr"}
          description="Full AI suite for serious traders"
          icon={Crown}
          color="bg-gradient-to-br from-amber-500 to-yellow-400"
          buttonText="Upgrade to Elite"
          buttonVariant="default"
          isCurrentPlan={tier === "elite"}
          onSelect={() => handleSelectPlan("elite")}
        >
          <ul className="space-y-3">
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              Everything in Pro
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              Unlimited AI analysis
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              AI coach & mentorship
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              AI trade summaries
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              Priority processing
            </li>
            <li className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              Full export & reports
            </li>
          </ul>
        </PlanCard>
      </div>

      {/* Comparison Table */}
      <section className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-center mb-6">Feature Comparison</h2>
        <Card className="overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_80px_80px_80px] gap-4 p-4 bg-muted/50 border-b">
            <div className="text-sm font-semibold">Feature</div>
            <div className="text-center text-sm font-semibold">Free</div>
            <div className="text-center text-sm font-semibold text-blue-600">Pro</div>
            <div className="text-center text-sm font-semibold text-amber-600">Elite</div>
          </div>

          {/* Table Body */}
          <div className="divide-y">
            {features.map((feature, index) => (
              <FeatureRow key={index} {...feature} />
            ))}
          </div>
        </Card>
      </section>

      {/* Payment Note */}
      <div className="text-center max-w-lg mx-auto">
        <Card className="border-muted">
          <CardContent className="p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            Payment integration coming soon. Currently in demo mode — select a plan to preview features.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

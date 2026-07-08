import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ChronoSequenceDataBand from "@/components/effects/ChronoSequenceDataBand";
import VolumetricSplineAura from "@/components/effects/VolumetricSplineAura";
import {
  BrainCircuit,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Zap,
  Shield,
  BarChart3,
  Clock,
  Target,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const insights = [
  {
    id: "1",
    title: "BTC Entry Window Optimized",
    description:
      "Your win rate for BTC longs between 09:00-10:00 UTC is 78%, compared to 42% outside this window. Consider concentrating BTC entries during this timeframe.",
    type: "opportunity" as const,
    confidence: 92,
    metric: "+36% edge",
    icon: TrendingUp,
    color: "#22c55e",
  },
  {
    id: "2",
    title: "Oversized Position Risk",
    description:
      "Your last 3 trades averaged 2.8% risk per trade, exceeding your 1.5% rule. This pattern correlates with a 3x higher drawdown rate in the following week.",
    type: "risk" as const,
    confidence: 87,
    metric: "-8.4% DD",
    icon: AlertTriangle,
    color: "#ef4444",
  },
  {
    id: "3",
    title: "Strategy Refinement",
    description:
      "Your trend-following strategy on SOL/USDT has a 2.1 profit factor on the 4H timeframe but only 0.8 on the 1H. Switching to higher timeframes could improve overall P&L by an estimated 15%.",
    type: "recommendation" as const,
    confidence: 81,
    metric: "+15% est.",
    icon: Lightbulb,
    color: "#3b82f6",
  },
  {
    id: "4",
    title: "Emotional Trading Pattern",
    description:
      "After a losing trade, your next trade shows 40% larger position sizing and 25% tighter stops. This revenge-trading behavior accounts for 62% of your total losses.",
    type: "risk" as const,
    confidence: 95,
    metric: "62% of losses",
    icon: Shield,
    color: "#f59e0b",
  },
  {
    id: "5",
    title: "Correlation Risk",
    description:
      "Your portfolio has 0.82 correlation between BTC and ETH positions. Diversifying into uncorrelated assets like forex or commodities could reduce portfolio volatility by 30%.",
    type: "recommendation" as const,
    confidence: 89,
    metric: "-30% vol",
    icon: BarChart3,
    color: "#a855f7",
  },
];

const typeConfig = {
  opportunity: { label: "Opportunity", bg: "bg-[#22c55e]/10", text: "text-[#22c55e]", border: "border-[#22c55e]/20" },
  risk: { label: "Risk Alert", bg: "bg-[#ef4444]/10", text: "text-[#ef4444]", border: "border-[#ef4444]/20" },
  recommendation: { label: "Recommendation", bg: "bg-[#3b82f6]/10", text: "text-[#3b82f6]", border: "border-[#3b82f6]/20" },
};

export default function Insights() {
  const { user } = useAuth();
  const firstName = user?.displayName?.split(" ")[0] || "Trader";

  return (
    <DashboardLayout>
      <ChronoSequenceDataBand userName={firstName} />
      <div className="p-6 overflow-y-auto scrollbar-thin">
        {/* Hero */}
        <motion.div
          className="mb-8"
          variants={fadeUp}
          initial="hidden"
          animate="show"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-md bg-[#3b82f6]/20 flex items-center justify-center">
              <BrainCircuit className="w-4 h-4 text-[#3b82f6]" />
            </div>
            <h1 className="text-white text-xl font-semibold">Insight Engine</h1>
          </div>
          <p className="text-[#a1a1aa] text-sm ml-11">
            AI-powered analysis of your trading patterns and market opportunities
          </p>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main insights column */}
          <div className="xl:col-span-2 space-y-4">
            {insights.map((insight, idx) => {
              const config = typeConfig[insight.type];
              return (
                <motion.div
                  key={insight.id}
                  className="bg-[#18181b] border border-[#27272a] rounded-lg p-5 hover:border-[#3f3f46] transition-colors duration-200"
                  variants={fadeUp}
                  initial="hidden"
                  animate="show"
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${insight.color}15` }}
                    >
                      <insight.icon className="w-5 h-5" style={{ color: insight.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <h3 className="text-white text-sm font-semibold">{insight.title}</h3>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 h-5 font-medium border-0 ${config.bg} ${config.text}`}
                        >
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-[#a1a1aa] text-xs leading-relaxed mb-3">
                        {insight.description}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-3 h-3 text-[#52525b]" />
                          <span className="text-[#52525b] text-[10px]">
                            {insight.confidence}% confidence
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Target className="w-3 h-3" style={{ color: insight.color }} />
                          <span className="text-xs font-mono font-semibold" style={{ color: insight.color }}>
                            {insight.metric}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Aura visual */}
            <motion.div
              className="bg-[#18181b] border border-[#27272a] rounded-lg p-6 flex flex-col items-center"
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.1 }}
            >
              <p className="text-[#a1a1aa] text-xs mb-4 text-center">AI Computation Active</p>
              <div className="w-[180px] h-[180px] rounded-full overflow-hidden">
                <VolumetricSplineAura />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="text-[#22c55e] text-[10px] font-mono">Processing 5 active signals</span>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              className="bg-[#18181b] border border-[#27272a] rounded-lg p-5"
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.15 }}
            >
              <h3 className="text-white text-sm font-semibold mb-4">Analysis Coverage</h3>
              <div className="space-y-4">
                {[
                  { label: "Pattern Recognition", value: 94, color: "#3b82f6" },
                  { label: "Risk Assessment", value: 88, color: "#ef4444" },
                  { label: "Opportunity Scan", value: 91, color: "#22c55e" },
                  { label: "Behavioral Analysis", value: 86, color: "#a855f7" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[#a1a1aa] text-xs">{stat.label}</span>
                      <span className="text-white text-xs font-mono">{stat.value}%</span>
                    </div>
                    <div className="h-1.5 bg-[#27272a] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: stat.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.value}%` }}
                        transition={{ duration: 1, delay: 0.3, ease: "easeOut" as const }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Last updated */}
            <motion.div
              className="bg-[#18181b] border border-[#27272a] rounded-lg p-4 flex items-center gap-3"
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.2 }}
            >
              <Clock className="w-4 h-4 text-[#52525b]" />
              <div>
                <p className="text-[#a1a1aa] text-[10px]">Last analysis</p>
                <p className="text-white text-xs font-mono">
                  {new Date().toLocaleTimeString()} UTC
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

import { motion, type Variants } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, Target, Hash, AlertTriangle } from "lucide-react";

interface KPIData {
  balance: number;
  totalProfit: number;
  totalTrades: number;
  winRate: number;
  totalDrawdown: number;
  avgReturn: number;
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function KPICards({ data }: { data: KPIData }) {
  const cards = [
    {
      label: "Balance",
      value: `$${data.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: "+12.4%",
      positive: true,
      icon: Wallet,
      accent: "#3b82f6",
    },
    {
      label: "Total Profit",
      value: `$${data.totalProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: "+8.2%",
      positive: true,
      icon: Target,
      accent: "#22c55e",
    },
    {
      label: "Total Trades",
      value: `${data.totalTrades}`,
      change: "+23",
      positive: true,
      icon: Hash,
      accent: "#a855f7",
    },
    {
      label: "Max Drawdown",
      value: `${data.totalDrawdown.toFixed(1)}%`,
      change: "-2.1%",
      positive: false,
      icon: AlertTriangle,
      accent: "#ef4444",
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {cards.map((card) => (
        <motion.div
          key={card.label}
          variants={item}
          className="bg-[#18181b] border border-[#27272a] rounded-lg p-5 hover:border-[#3f3f46] transition-colors duration-200 cursor-default group"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#a1a1aa] text-xs font-medium uppercase tracking-wider">
              {card.label}
            </span>
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ backgroundColor: `${card.accent}15` }}
            >
              <card.icon className="w-3.5 h-3.5" style={{ color: card.accent }} />
            </div>
          </div>
          <p className="text-white text-xl font-mono font-semibold tracking-tight">
            {card.value}
          </p>
          <div className="flex items-center gap-1 mt-2">
            {card.positive ? (
              <TrendingUp className="w-3 h-3 text-[#22c55e]" />
            ) : (
              <TrendingDown className="w-3 h-3 text-[#ef4444]" />
            )}
            <span
              className={`text-xs font-mono font-medium ${
                card.positive ? "text-[#22c55e]" : "text-[#ef4444]"
              }`}
            >
              {card.change}
            </span>
            <span className="text-[#52525b] text-xs">All time</span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

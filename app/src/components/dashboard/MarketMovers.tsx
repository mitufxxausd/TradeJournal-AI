import { memo } from "react";
import { motion, type Variants } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Mover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  sparkline: number[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.15 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, x: -6 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 24;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#22c55e" : "#ef4444"}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const MarketMovers = memo(function MarketMovers({
  movers,
  isLoading,
}: {
  movers: Mover[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-md bg-[#27272a]" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-20 bg-[#27272a]" />
              <Skeleton className="h-3 w-14 bg-[#27272a]" />
            </div>
            <Skeleton className="h-6 w-16 bg-[#27272a]" />
          </div>
        ))}
      </div>
    );
  }

  if (movers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <p className="text-[#a1a1aa] text-xs">Market data loading...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-1"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {movers.slice(0, 5).map((mover) => {
        const positive = mover.change >= 0;
        return (
          <motion.div
            key={mover.symbol}
            variants={item}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-[#27272a]/40 transition-colors duration-150"
          >
            <div className="w-8 h-8 rounded-md bg-[#27272a] flex items-center justify-center shrink-0">
              <span className="text-[10px] font-mono font-semibold text-[#a1a1aa]">
                {mover.symbol.slice(0, 3)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{mover.name}</p>
              <p className="text-[#52525b] text-[10px] font-mono">
                ${mover.price.toLocaleString()}
              </p>
            </div>
            <MiniSparkline data={mover.sparkline} positive={positive} />
            <div className="flex items-center gap-1 shrink-0 w-16 justify-end">
              {positive ? (
                <TrendingUp className="w-3 h-3 text-[#22c55e]" />
              ) : (
                <TrendingDown className="w-3 h-3 text-[#ef4444]" />
              )}
              <span
                className={`text-xs font-mono font-medium ${
                  positive ? "text-[#22c55e]" : "text-[#ef4444]"
                }`}
              >
                {positive ? "+" : ""}
                {mover.changePercent.toFixed(2)}%
              </span>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
});

export default MarketMovers;

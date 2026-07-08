import { memo } from "react";
import { motion, type Variants } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export interface TradeFeedItem {
  id: string;
  time: string;
  asset: string;
  type: "BUY" | "SELL";
  price: number;
  quantity: number;
  status: "open" | "closed";
  pnl?: number;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

const rowItem: Variants = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25, ease: "easeOut" } },
};

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-10 h-10 rounded-lg bg-[#27272a] flex items-center justify-center mb-3">
        <svg
          className="w-5 h-5 text-[#52525b]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5"
          />
        </svg>
      </div>
      <p className="text-[#a1a1aa] text-sm">No trades yet</p>
      <p className="text-[#52525b] text-xs mt-1">Your trade history will appear here</p>
    </div>
  );
}

const TradeFeed = memo(function TradeFeed({
  trades,
  isLoading,
}: {
  trades: TradeFeedItem[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-1">
            <Skeleton className="h-3 w-14 bg-[#27272a]" />
            <Skeleton className="h-3 w-20 bg-[#27272a]" />
            <Skeleton className="h-5 w-12 bg-[#27272a] rounded-full" />
            <Skeleton className="h-3 w-16 bg-[#27272a] ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (trades.length === 0) {
    return <EmptyState />;
  }

  return (
    <motion.div
      className="space-y-1"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {trades.slice(0, 8).map((trade) => (
        <motion.div
          key={trade.id}
          variants={rowItem}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-[#27272a]/40 transition-colors duration-150 cursor-default"
        >
          <span className="text-[#52525b] text-xs font-mono w-16 shrink-0">
            {trade.time}
          </span>
          <span className="text-white text-xs font-medium w-24 shrink-0 truncate">
            {trade.asset}
          </span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 h-5 font-mono font-semibold border-0 ${
              trade.type === "BUY"
                ? "bg-[#22c55e]/15 text-[#22c55e]"
                : "bg-[#ef4444]/15 text-[#ef4444]"
            }`}
          >
            {trade.type}
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-white text-xs font-mono">
              ${trade.price.toLocaleString()}
            </span>
            {trade.status === "open" && (
              <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
});

export default TradeFeed;

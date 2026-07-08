import { memo } from "react";
import { motion } from "framer-motion";

const marketData = [
  { symbol: "S&P 500", value: "5,783.42", change: "+0.82%", positive: true },
  { symbol: "NASDAQ", value: "18,412.67", change: "+1.14%", positive: true },
  { symbol: "BTC/USD", value: "67,245.00", change: "-1.23%", positive: false },
  { symbol: "ETH/USD", value: "3,482.15", change: "+2.45%", positive: true },
  { symbol: "DOW", value: "42,156.78", change: "+0.34%", positive: true },
  { symbol: "VIX", value: "14.23", change: "-3.12%", positive: true },
  { symbol: "EUR/USD", value: "1.0845", change: "+0.15%", positive: true },
  { symbol: "GOLD", value: "2,342.80", change: "+0.67%", positive: true },
];

function MarketTicker() {
  return (
    <>
      {marketData.map((item) => (
        <span key={item.symbol} className="inline-flex items-center gap-2 mx-6 shrink-0">
          <span className="text-[#a1a1aa] text-xs font-medium">{item.symbol}</span>
          <span className="text-white text-xs font-mono">{item.value}</span>
          <span
            className={`text-xs font-mono ${
              item.positive ? "text-[#22c55e]" : "text-[#ef4444]"
            }`}
          >
            {item.change}
          </span>
        </span>
      ))}
    </>
  );
}

const ChronoSequenceDataBand = memo(function ChronoSequenceDataBand({
  userName,
}: {
  userName: string;
}) {
  return (
    <div className="flex items-center gap-6 overflow-hidden border-b border-[#27272a] bg-[#18181b] h-14 px-6">
      <div className="flex items-center gap-3 shrink-0">
        <div
          className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"
          style={{ boxShadow: "0 0 15px #3b82f6" }}
        />
        <h1 className="text-white text-lg font-semibold tracking-tight whitespace-nowrap">
          Welcome, {userName}
        </h1>
      </div>

      <div className="w-px h-6 bg-[#27272a] shrink-0" />

      <div className="flex-1 overflow-hidden relative">
        <motion.div
          className="flex whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            repeat: Infinity,
            duration: 30,
            ease: "linear",
          }}
        >
          <MarketTicker />
          <MarketTicker />
        </motion.div>
      </div>
    </div>
  );
});

export default ChronoSequenceDataBand;

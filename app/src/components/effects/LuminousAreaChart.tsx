import { useState, memo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ChartDataPoint {
  date: string;
  value: number;
}

interface LuminousAreaChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  showGrid?: boolean;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-tooltip px-3 py-2 rounded-sm shadow-xl pointer-events-none">
      <p className="text-[#a1a1aa] text-xs mb-1">{label}</p>
      <p className="text-white text-sm font-mono font-medium">
        ${payload[0].value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

const LuminousAreaChart = memo(function LuminousAreaChart({
  data,
  height = 320,
  color = "#22c55e",
  showGrid = true,
}: LuminousAreaChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const gradientId = `luminous-gradient-${color.replace("#", "")}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
        onMouseMove={(state) => {
          if (state?.activeTooltipIndex !== undefined) {
            setHoveredIndex(state.activeTooltipIndex);
          }
        }}
        onMouseLeave={() => setHoveredIndex(null)}
        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.5} />
            <stop offset="40%" stopColor={color} stopOpacity={0.1} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="2 2"
            stroke="#27272a"
            vertical={false}
          />
        )}
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#a1a1aa", fontSize: 11, fontFamily: "Inter" }}
          dy={8}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#a1a1aa", fontSize: 11, fontFamily: "JetBrains Mono" }}
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
          dx={-8}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{
            stroke: "#3f3f46",
            strokeWidth: 1,
            strokeDasharray: "4 4",
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={
            hoveredIndex !== null
              ? {
                  r: 5,
                  fill: "#18181b",
                  stroke: color,
                  strokeWidth: 2,
                }
              : false
          }
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});

export default LuminousAreaChart;

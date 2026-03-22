"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { DailySummary } from "@/lib/types";

type Props = {
  data: DailySummary[];
};

export default function MacroChart({ data }: Props) {
  const chartData = data.map((d) => ({
    date: d.date,
    Proteína: Math.round(d.proteina),
    Gorduras: Math.round(d.gorduras),
    Carboidratos: Math.round(d.carboidratos),
  }));

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          barGap={2}
          barCategoryGap="30%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#F0F4F0"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#9CA3AF" }}
            unit="g"
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            }}
            formatter={(v: number | string) => `${v}g`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Proteína" fill="#22c55e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Gorduras" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Carboidratos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

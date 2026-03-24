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

type ChartDataPoint = {
  id: number;
  date: string;
  syncedAt: Date;
  proteina: number;
  gorduras: number;
  carboidratos: number;
};

type Props = {
  data: ChartDataPoint[];
};

function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const tz = process.env.NEXT_PUBLIC_TZ ?? 'UTC';
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  });
}

export default function MacroChart({ data }: Props) {
  const chartData = data.map((d) => ({
    id: d.id,
    date: formatDateTime(d.syncedAt),
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

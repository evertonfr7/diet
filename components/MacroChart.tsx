"use client";

import {
  LineChart,
  Line,
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
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <ResponsiveContainer width="100%" height={360}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} unit="g" />
          <Tooltip formatter={(v: number | string) => `${v}g`} />
          <Legend />
          <Line
            type="monotone"
            dataKey="Proteína"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Gorduras"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="Carboidratos"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

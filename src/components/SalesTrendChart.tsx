"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPeso } from "@/lib/format";

export function SalesTrendChart({ data }: { data: { label: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#17281f1a" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#17281f99" }} axisLine={{ stroke: "#17281f1a" }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: "#17281f99" }}
          axisLine={false}
          tickLine={false}
          width={64}
          tickFormatter={(v) => `₱${Math.round(v / 1000)}k`}
        />
        <Tooltip
          formatter={(value) => formatPeso(Number(value))}
          contentStyle={{ borderRadius: 12, border: "1px solid #17281f22", fontSize: 13 }}
        />
        <Bar dataKey="total" fill="#d89b3c" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

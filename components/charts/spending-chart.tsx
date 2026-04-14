"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type SpendingChartProps = {
  data: Array<{ week: string; total: number }>;
  currencyCode: string;
};

export function SpendingChart({ data, currencyCode }: SpendingChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-body">
        No spending data this month
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 12, fill: "var(--color-muted)" }}
          axisLine={{ stroke: "var(--color-border)" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--color-muted)" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value: number) =>
            new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode, maximumFractionDigits: 0 }).format(value / 100)
          }
        />
        <Tooltip
          formatter={(value) => [
            new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode }).format(Number(value) / 100),
            "Spending",
          ]}
          contentStyle={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            fontSize: "13px",
          }}
        />
        <defs>
          <linearGradient id="spendingGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="var(--color-primary-dark)" />
          </linearGradient>
        </defs>
        <Line
          type="monotone"
          dataKey="total"
          stroke="url(#spendingGradient)"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "var(--color-primary)", stroke: "var(--color-surface)", strokeWidth: 2 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

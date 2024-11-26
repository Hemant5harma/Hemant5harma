"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

interface SparklineChartProps {
  data: { value: number }[];
  color?: string;
}

export default function SparklineChart({
  data,
  color = "#22c55e",
}: SparklineChartProps) {
  return (
    <ResponsiveContainer
      width={100}
      height={40}>
      <LineChart data={data}>
        <Line
          type='monotone'
          dataKey='value'
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

"use client";

import { useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { date: "2023-05-01", value: 10000 },
  { date: "2023-05-02", value: 10200 },
  { date: "2023-05-03", value: 10150 },
  { date: "2023-05-04", value: 10400 },
  { date: "2023-05-05", value: 10300 },
  { date: "2023-05-06", value: 10450 },
  { date: "2023-05-07", value: 10600 },
  { date: "2023-05-08", value: 10550 },
  { date: "2023-05-09", value: 10700 },
  { date: "2023-05-10", value: 10800 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className='bg-white p-2 border border-gray-200 rounded shadow-lg'>
        <p className='text-sm text-gray-600'>
          {new Date(label).toLocaleDateString()}
        </p>
        <p className='text-sm font-bold text-blue-600'>
          ${payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

const CustomizedDot = (props: any) => {
  const { cx, cy, payload } = props;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      stroke='#3B82F6'
      strokeWidth={2}
      fill='#FFFFFF'
    />
  );
};

export default function PortfolioChart() {
  const [activePoint, setActivePoint] = useState<{
    x: number;
    y: number;
    value: number;
  } | null>(null);

  const handleMouseMove = useCallback((e: any) => {
    if (e.activePayload) {
      const { chartX, chartY } = e;
      setActivePoint({
        x: chartX,
        y: chartY,
        value: e.activePayload[0].value,
      });
    } else {
      setActivePoint(null);
    }
  }, []);

  return (
    <div className='relative h-80'>
      <ResponsiveContainer
        width='100%'
        height='100%'>
        <LineChart
          data={data}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setActivePoint(null)}>
          <CartesianGrid
            strokeDasharray='3 3'
            stroke='#E5E7EB'
          />
          <XAxis
            dataKey='date'
            tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
            stroke='#9CA3AF'
          />
          <YAxis
            tickFormatter={(tick) => `$${tick.toLocaleString()}`}
            stroke='#9CA3AF'
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "#9CA3AF", strokeWidth: 1 }}
          />
          <Line
            type='monotone'
            dataKey='value'
            stroke='#3B82F6'
            strokeWidth={2}
            dot={<CustomizedDot />}
            activeDot={{
              r: 6,
              fill: "#3B82F6",
              stroke: "#FFFFFF",
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
      {activePoint && (
        <div
          className='absolute pointer-events-none bg-white px-2 py-1 rounded shadow-lg border border-gray-200 transform -translate-x-1/2 -translate-y-full'
          style={{
            left: activePoint.x,
            top: activePoint.y - 16,
          }}>
          <span className='text-sm font-bold text-blue-600'>
            ${activePoint.value.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}

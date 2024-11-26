"use client";

import { useState, useCallback } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface CryptoCardProps {
  symbol: string;
  price: string;
  change: string;
  chartData: { date: string; price: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className='bg-white p-2 border border-gray-200 rounded shadow-lg'>
        <p className='text-xs text-gray-600'>{label}</p>
        <p className='text-sm font-bold text-blue-600'>
          ${payload[0].value.toFixed(2)}
        </p>
      </div>
    );
  }
  return null;
};

export default function CryptoCard({
  symbol,
  price,
  change,
  chartData,
}: CryptoCardProps) {
  const [activePoint, setActivePoint] = useState<{
    x: number;
    y: number;
    value: number;
  } | null>(null);
  const isPositive = !change.startsWith("-");

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
    <div className='bg-white rounded-lg p-4 shadow-sm relative overflow-hidden'>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-3'>
          <img
            src={`/placeholder.svg?height=32&width=32`}
            alt={symbol}
            width={32}
            height={32}
            className='rounded-full'
          />
          <div>
            <h3 className='font-semibold text-gray-800'>{symbol}</h3>
            <p className='text-xl font-bold text-gray-800'>{price}</p>
            <span
              className={`text-sm ${
                isPositive ? "text-green-500" : "text-red-500"
              }`}>
              {isPositive ? "+" : ""}
              {change}%
            </span>
          </div>
        </div>
      </div>
      <div className='h-24 relative'>
        <ResponsiveContainer
          width='100%'
          height='100%'>
          <LineChart
            data={chartData}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setActivePoint(null)}>
            <XAxis
              dataKey='date'
              hide
            />
            <YAxis
              hide
              domain={["dataMin", "dataMax"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type='monotone'
              dataKey='price'
              stroke={isPositive ? "#22c55e" : "#ef4444"}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
        {activePoint && (
          <div
            className='absolute pointer-events-none bg-white px-2 py-1 rounded shadow-lg border border-gray-200 transform -translate-x-1/2 -translate-y-full'
            style={{
              left: activePoint.x,
              top: activePoint.y - 10,
            }}>
            <span className='text-xs font-bold text-blue-600'>
              ${activePoint.value.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

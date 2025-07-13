import { useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Colors } from '../styles/theme';

interface EnhancedCryptoCardProps {
  symbol: string;
  name: string;
  price: string;
  change: string;
  chartData: { date: string; price: number }[];
  high24h: string;
  low24h: string;
  volume24h: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border border-gray-200 bg-white p-2 text-xs shadow-sm dark:border-gray-600 dark:bg-boxdark">
        <p className="mb-1 text-gray-600 dark:text-gray-400">
          {new Date(label).toLocaleDateString()}
        </p>
        <p className="font-bold text-gray-800 dark:text-white">${payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export function generateChartDataForTrend(
  days: number,
  currentPrice: number,
  trend: 'up' | 'down',
): { date: string; price: number }[] {
  const data = [];
  const volatility = 0.02; // 2% daily volatility
  let price = currentPrice;

  for (let i = days; i > 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const change = (Math.random() - 0.5) * 2 * volatility;

    if (trend === 'up') {
      price *= 1 + Math.abs(change);
    } else {
      price *= 1 - Math.abs(change);
    }

    data.push({
      date: date.toISOString().split('T')[0],
      price: Number(price.toFixed(2)),
    });
  }

  return data;
}

export default function CryptoCard({
  symbol,
  name,
  price,
  change,
  chartData,
  high24h,
  low24h,
  volume24h,
}: EnhancedCryptoCardProps) {
  const [, setActivePoint] = useState<{
    x: number;
    y: number;
    value: number;
  } | null>(null);
  const isPositive = !change.startsWith('-');
  const changeValue = parseFloat(change);

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
    <div className="font-sans mx-auto w-full max-w-md rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-xl font-bold text-black dark:text-white">{symbol}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">{name}</p>
        </div>
        <div className="text-right">
          <p className="mb-1 text-2xl font-bold text-black dark:text-white">{price}</p>
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold 
            ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
          >
            {isPositive ? '▲' : '▼'} {change}%
          </span>
        </div>
      </div>
      <div className="relative mb-3 h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setActivePoint(null)}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={Colors.STROKE_DARK} />
            <XAxis dataKey="date" hide />
            <YAxis hide domain={['dataMin', 'dataMax']} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="price"
              stroke={isPositive ? Colors.POSITIVE : Colors.NEGATIVE}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mb-2 flex justify-between text-xs text-gray-600 dark:text-gray-400">
        <span className="text-black dark:text-white">
          24h High: <span className="font-bold text-green-600">{high24h}</span>
        </span>
        <span className="text-black dark:text-white">
          24h Low: <span className="font-bold text-red-600">{low24h}</span>
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
        <span className="text-black dark:text-white">
          24h Change:
          <span
            className={`ml-1 font-bold 
            ${isPositive ? 'text-green-600' : 'text-red-600'}
          `}
          >
            {changeValue > 0 ? '+' : ''}
            {changeValue.toFixed(2)}%
          </span>
        </span>
        <span className="text-black dark:text-white">Volume: {volume24h}</span>
      </div>
    </div>
  );
}

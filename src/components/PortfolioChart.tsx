import { useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Colors } from '../styles/theme';

const data = [
  { date: '2023-05-01', value: 10000 },
  { date: '2023-05-02', value: 10200 },
  { date: '2023-05-03', value: 10150 },
  { date: '2023-05-04', value: 10400 },
  { date: '2023-05-05', value: 10300 },
  { date: '2023-05-06', value: 10450 },
  { date: '2023-05-07', value: 10600 },
  { date: '2023-05-08', value: 10550 },
  { date: '2023-05-09', value: 10700 },
  { date: '2023-05-10', value: 10800 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded border border-gray-200 bg-white p-2 shadow-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(label).toLocaleDateString()}</p>
        <p className="text-sm font-bold text-blue-600">${payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const CustomizedDot = (props: any) => {
  const { cx, cy } = props;
  return (
    <circle cx={cx} cy={cy} r={4} stroke={Colors.PRIMARY} strokeWidth={2} fill={Colors.WHITE} />
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
    <div className="relative h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setActivePoint(null)}
        >
          <CartesianGrid stroke={Colors.STROKE_LIGHT} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
            stroke={Colors.GRAY_DARK}
          />
          <YAxis tickFormatter={(tick) => `$${tick.toLocaleString()}`} stroke={Colors.GRAY_DARK} />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: Colors.GRAY_DARK, strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={Colors.PRIMARY}
            strokeWidth={2}
            dot={<CustomizedDot />}
            activeDot={{
              r: 6,
              fill: Colors.PRIMARY,
              stroke: Colors.WHITE,
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
      {activePoint && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full transform rounded border border-gray-200 bg-white px-2 py-1 shadow-lg"
          style={{
            left: activePoint.x,
            top: activePoint.y - 16,
          }}
        >
          <span className="text-sm font-bold text-blue-600">
            ${activePoint.value.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}

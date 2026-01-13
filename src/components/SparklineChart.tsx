import React from 'react';

interface SparklineChartProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  trend?: 'up' | 'down';
}

const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  color = '#0bda65',
  height = 100,
  width = 472,
  trend = 'up',
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="text-xs text-gray-400">No data</span>
      </div>
    );
  }

  // Normalize data to fit within the SVG viewBox
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const normalizedData = data.map((value) => ((value - min) / range) * 100);

  // Generate path points
  const stepX = width / (normalizedData.length - 1);

  // Generate path string for the line
  const pathD = normalizedData
    .map((y, i) => (i === 0 ? 'M' : 'L') + ` ${i * stepX} ${100 - y}`)
    .join(' ');

  // Generate area path (line + bottom fill)
  const areaPath = `${pathD} V 100 H 0 Z`;

  const gradientId = `gradient-${trend}-${color.replace('#', '')}`;
  const gradientColor = trend === 'up' ? '#0bda65' : '#fa6538';

  return (
    <div className="flex h-full w-full flex-1 flex-col">
      <svg
        fill="none"
        height={height}
        preserveAspectRatio="none"
        viewBox={`0 0 ${width} 100`}
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={gradientColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={gradientColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeWidth="2"
        />
        <path d={areaPath} fill={`url(#${gradientId})`} />
      </svg>
    </div>
  );
};

export default SparklineChart;

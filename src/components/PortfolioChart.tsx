import React from 'react';

interface PortfolioChartProps {
  period?: string;
}

const PortfolioChart: React.FC<PortfolioChartProps> = ({ period = '24H' }) => {
  // Generate data points based on period
  const generateData = () => {
    const points = 16;
    const data = [];
    for (let i = 0; i <= points; i++) {
      const x = (i / points) * 800;
      // Generate a smooth curve that goes up over time
      const y = 320 - (i / points) * 230 + Math.sin((i / points) * Math.PI * 2) * 20;
      data.push({ x, y });
    }
    return data;
  };

  const data = generateData();
  const pathD = data.map((point, i) => (i === 0 ? 'M' : 'L') + ` ${point.x} ${point.y}`).join(' ');
  const areaPath = `${pathD} V 400 H 0 Z`;

  // Y-axis labels
  const yLabels = ['$1.20M', '$1.22M', '$1.24M', '$1.26M', '$1.28M'];
  const yPositions = [395, 305, 205, 105, 5];

  return (
    <div className="h-96">
      <svg
        fill="none"
        height="100%"
        preserveAspectRatio="none"
        viewBox="0 0 800 400"
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="portfolioGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#354ae9" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#354ae9" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className="text-text-light-secondary dark:text-text-dark-secondary text-xs">
          {yLabels.map((label, i) => (
            <text key={i} x="0" y={yPositions[i]}>
              {label}
            </text>
          ))}
        </g>
        <path
          d={pathD}
          fill="none"
          stroke="#354ae9"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
        />
        <path d={areaPath} fill="url(#portfolioGradient)" />
        <line
          className="stroke-border-light dark:stroke-border-dark"
          strokeWidth="1"
          x1="40"
          x2="800"
          y1="400"
          y2="400"
        />
        <line
          className="stroke-border-light dark:stroke-border-dark"
          strokeDasharray="4 4"
          strokeWidth="1"
          x1="40"
          x2="800"
          y1="300"
          y2="300"
        />
        <line
          className="stroke-border-light dark:stroke-border-dark"
          strokeDasharray="4 4"
          strokeWidth="1"
          x1="40"
          x2="800"
          y1="200"
          y2="200"
        />
        <line
          className="stroke-border-light dark:stroke-border-dark"
          strokeDasharray="4 4"
          strokeWidth="1"
          x1="40"
          x2="800"
          y1="100"
          y2="100"
        />
      </svg>
    </div>
  );
};

export default PortfolioChart;

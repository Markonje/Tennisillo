import React from 'react';

export interface MiniLineChartProps {
  data: number[];
  dates?: string[];
  width?: number;
  height?: number;
}

export function MiniLineChart({ data, width = 300, height = 80 }: MiniLineChartProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data) - 50;
  const max = Math.max(...data) + 30;
  const coords: [number, number][] = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - ((v - min) / (max - min)) * height,
  ]);
  const ptStr = coords.map(([x, y]) => `${x},${y}`);
  const pathD = `M ${ptStr.join(' L ')}`;
  const areaD = `M ${ptStr[0]} L ${ptStr.join(' L ')} L ${width},${height} L 0,${height} Z`;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="lgArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#B9FF5A" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#B9FF5A" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#lgArea)" />
      <path d={pathD} fill="none" stroke="#B9FF5A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i === data.length - 1 ? 4 : 2.5}
          fill={i === data.length - 1 ? '#B9FF5A' : 'rgba(185,255,90,0.7)'}
          stroke="rgba(185,255,90,0.5)"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}

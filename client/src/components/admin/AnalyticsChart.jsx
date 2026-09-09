import React from 'react';

/**
 * Lightweight SVG Analytics Chart (Line & Bar modes)
 */
export const AnalyticsChart = ({
  data = [],
  title = 'Analytics Overview',
  subtitle = 'Trend metric over selected timeframe',
  type = 'line', // 'line' | 'bar'
  valueKey = 'value',
  labelKey = 'label',
  color = 'primary', // 'primary' | 'cyan' | 'emerald' | 'amber'
  height = 200,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col items-center justify-center min-h-[220px] text-content-muted text-xs font-mono">
        No time-series data available for the selected range.
      </div>
    );
  }

  const values = data.map((d) => Number(d[valueKey]) || 0);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);

  const colors = {
    primary: { stroke: '#6366f1', fill: 'rgba(99, 102, 241, 0.15)' },
    cyan: { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.15)' },
    emerald: { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.15)' },
    amber: { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.15)' },
  };

  const activeColor = colors[color] || colors.primary;

  // Compute SVG Points
  const width = 600;
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((d, i) => {
    const x = padding + (i / Math.max(data.length - 1, 1)) * chartWidth;
    const y =
      height -
      padding -
      ((Number(d[valueKey]) - minVal) / Math.max(maxVal - minVal, 1)) * chartHeight;
    return { x, y, label: d[labelKey], val: d[valueKey] };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPoints = `${padding},${height - padding} ${polylinePoints} ${
    padding + chartWidth
  },${height - padding}`;

  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-heading font-bold text-sm text-content-primary">{title}</h4>
          <p className="text-xs text-content-muted">{subtitle}</p>
        </div>
      </div>

      <div className="w-full overflow-hidden">
        {type === 'line' ? (
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            {/* Horizontal Grid lines */}
            <line
              x1={padding}
              y1={padding}
              x2={width - padding}
              y2={padding}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="4 4"
            />
            <line
              x1={padding}
              y1={height / 2}
              x2={width - padding}
              y2={height / 2}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="4 4"
            />
            <line
              x1={padding}
              y1={height - padding}
              x2={width - padding}
              y2={height - padding}
              stroke="rgba(255,255,255,0.1)"
            />

            {/* Area fill */}
            <polygon points={areaPoints} fill={activeColor.fill} />

            {/* Line trace */}
            <polyline
              points={polylinePoints}
              fill="none"
              stroke={activeColor.stroke}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data point dots */}
            {points.map((p, idx) => (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill="#0f172a"
                stroke={activeColor.stroke}
                strokeWidth="2"
              />
            ))}
          </svg>
        ) : (
          <div className="flex items-end justify-between gap-1.5 h-40 pt-4">
            {data.map((item, idx) => {
              const pct = Math.max(8, (Number(item[valueKey]) / maxVal) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div className="text-[10px] font-mono text-content-muted opacity-0 hover:opacity-100 transition-opacity">
                    {item[valueKey]}
                  </div>
                  <div
                    style={{ height: `${pct}%` }}
                    className="w-full rounded-t-md bg-gradient-to-t from-primary/30 to-primary transition-all duration-300 hover:brightness-125"
                  />
                  <span className="text-[10px] font-mono text-content-muted truncate max-w-[48px]">
                    {item[labelKey]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsChart;

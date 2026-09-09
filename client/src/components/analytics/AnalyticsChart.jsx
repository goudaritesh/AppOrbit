import React from 'react';

export const AnalyticsChart = ({ data = [], title = 'Activity Trend' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-3xl">
        <p className="text-xs text-slate-500">No telemetry data recorded for this time window</p>
      </div>
    );
  }

  // Calculate scales
  const maxViews = Math.max(...data.map((d) => d.views || 0), 1);
  const maxDownloads = Math.max(...data.map((d) => d.downloads || 0), 1);
  const ceiling = Math.max(maxViews, maxDownloads, 5);

  return (
    <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white text-base">{title}</h3>
        <div className="flex items-center space-x-4 text-xs">
          <span className="flex items-center space-x-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span>Views</span>
          </span>
          <span className="flex items-center space-x-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>Downloads</span>
          </span>
        </div>
      </div>

      {/* SVG Responsive Chart */}
      <div className="h-48 w-full flex items-end space-x-2 pt-4">
        {data.map((point, index) => {
          const viewsHeight = Math.round(((point.views || 0) / ceiling) * 100);
          const downloadsHeight = Math.round(((point.downloads || 0) / ceiling) * 100);
          const shortDate = point.date ? point.date.split('-').slice(1).join('/') : `${index + 1}`;

          return (
            <div
              key={point.date || index}
              className="flex-1 flex flex-col items-center h-full justify-end group relative"
            >
              {/* Tooltip on hover */}
              <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                <div className="bg-slate-950 border border-slate-700 px-2.5 py-1.5 rounded-xl shadow-xl text-[11px] whitespace-nowrap">
                  <div className="text-slate-400 font-semibold">{point.date}</div>
                  <div className="text-indigo-400">Views: {point.views || 0}</div>
                  <div className="text-emerald-400">Downloads: {point.downloads || 0}</div>
                </div>
              </div>

              {/* Dual Bars */}
              <div className="w-full flex items-end justify-center space-x-1 h-full pb-6">
                {/* Views Bar */}
                <div
                  style={{ height: `${Math.max(viewsHeight, 4)}%` }}
                  className="w-1/2 max-w-[14px] bg-indigo-500/80 hover:bg-indigo-400 rounded-t-md transition-all duration-300"
                />
                {/* Downloads Bar */}
                <div
                  style={{ height: `${Math.max(downloadsHeight, 4)}%` }}
                  className="w-1/2 max-w-[14px] bg-emerald-400/80 hover:bg-emerald-300 rounded-t-md transition-all duration-300"
                />
              </div>

              {/* X Axis Date Label */}
              <span className="text-[10px] text-slate-500 truncate w-full text-center mt-1">
                {shortDate}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalyticsChart;

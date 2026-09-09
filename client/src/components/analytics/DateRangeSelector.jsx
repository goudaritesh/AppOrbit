import React from 'react';

export const DateRangeSelector = ({ selectedRange = '30d', onChange }) => {
  const options = [
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 90 Days', value: '90d' },
  ];

  return (
    <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-2xl">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            selectedRange === opt.value
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

export default DateRangeSelector;

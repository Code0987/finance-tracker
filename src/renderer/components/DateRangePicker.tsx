import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (range: { startDate: string; endDate: string }) => void;
  onClose: () => void;
}

const presets = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 3 months', days: 90 },
  { label: 'Last 6 months', days: 180 },
  { label: 'Last year', days: 365 },
  { label: 'This month', type: 'thisMonth' },
  { label: 'Last month', type: 'lastMonth' },
  { label: 'This year', type: 'thisYear' },
  { label: 'All time', type: 'all' },
];

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  onClose,
}) => {
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);

  const applyPreset = (preset: typeof presets[0]) => {
    const end = new Date();
    let start = new Date();

    if (preset.days) {
      start.setDate(start.getDate() - preset.days);
    } else if (preset.type === 'thisMonth') {
      start = new Date(end.getFullYear(), end.getMonth(), 1);
    } else if (preset.type === 'lastMonth') {
      start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
      end.setDate(0); // Last day of previous month
    } else if (preset.type === 'thisYear') {
      start = new Date(end.getFullYear(), 0, 1);
    } else if (preset.type === 'all') {
      start = new Date(2000, 0, 1);
    }

    const newStart = start.toISOString().split('T')[0];
    const newEnd = end.toISOString().split('T')[0];
    
    setLocalStart(newStart);
    setLocalEnd(newEnd);
    onChange({ startDate: newStart, endDate: newEnd });
  };

  const handleApply = () => {
    onChange({ startDate: localStart, endDate: localEnd });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 w-80">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-slate-900">Select Date Range</h3>
        <button onClick={onClose} className="btn-icon p-1">
          <FiX className="w-4 h-4" />
        </button>
      </div>

      {/* Presets */}
      <div className="mb-4">
        <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Quick Select</h4>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyPreset(preset)}
              className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Range */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-slate-500 uppercase">Custom Range</h4>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="label text-xs">From</label>
            <input
              type="date"
              value={localStart}
              onChange={(e) => setLocalStart(e.target.value)}
              className="input text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="label text-xs">To</label>
            <input
              type="date"
              value={localEnd}
              onChange={(e) => setLocalEnd(e.target.value)}
              className="input text-sm"
            />
          </div>
        </div>
        <button onClick={handleApply} className="btn-primary w-full">
          Apply
        </button>
      </div>
    </div>
  );
};

export default DateRangePicker;

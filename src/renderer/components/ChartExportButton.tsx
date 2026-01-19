import React, { useRef } from 'react';
import { FiDownload } from 'react-icons/fi';
import { exportChartAsImage, exportChartAsPDF } from '../utils/chartExport';

interface ChartExportButtonProps {
  chartRef: React.RefObject<HTMLDivElement>;
  filename: string;
  title?: string;
}

const ChartExportButton: React.FC<ChartExportButtonProps> = ({ chartRef, filename, title }) => {
  const handleExport = async (format: 'png' | 'pdf') => {
    if (!chartRef.current) return;

    if (format === 'png') {
      await exportChartAsImage(chartRef.current, filename);
    } else {
      await exportChartAsPDF(chartRef.current, filename, { title });
    }
  };

  return (
    <div className="relative group">
      <button className="btn-icon p-2" title="Export chart">
        <FiDownload className="w-4 h-4" />
      </button>
      <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[120px]">
        <button
          onClick={() => handleExport('png')}
          className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
        >
          Save as PNG
        </button>
        <button
          onClick={() => handleExport('pdf')}
          className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
        >
          Save as PDF
        </button>
      </div>
    </div>
  );
};

export default ChartExportButton;

import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
  defaultRange?: 'today' | 'week' | 'month' | 'quarter';
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ 
  onDateRangeChange, 
  defaultRange = 'week' 
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRange, setSelectedRange] = useState(defaultRange);

  const getDateRange = (range: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case 'today':
        return {
          start: today.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return {
          start: weekStart.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      case 'month':
        const monthStart = new Date(today);
        monthStart.setDate(today.getDate() - 30);
        return {
          start: monthStart.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      case 'quarter':
        const quarterStart = new Date(today);
        quarterStart.setDate(today.getDate() - 90);
        return {
          start: quarterStart.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
      default:
        return {
          start: today.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        };
    }
  };

  const handleRangeSelect = (range: string) => {
    setSelectedRange(range);
    const { start, end } = getDateRange(range);
    setStartDate(start);
    setEndDate(end);
    onDateRangeChange(start, end);
  };

  const handleCustomDateChange = () => {
    if (startDate && endDate) {
      setSelectedRange('custom');
      onDateRangeChange(startDate, endDate);
    }
  };

  // Initialize with default range
  React.useEffect(() => {
    handleRangeSelect(defaultRange);
  }, []);

  return (
    <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow border">
      <Calendar className="h-5 w-5 text-gray-500" />
      
      {/* Quick Range Buttons */}
      <div className="flex space-x-2">
        {[
          { key: 'today', label: 'Hoy' },
          { key: 'week', label: '7 días' },
          { key: 'month', label: '30 días' },
          { key: 'quarter', label: '90 días' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleRangeSelect(key)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              selectedRange === key
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Custom Date Inputs */}
      <div className="flex items-center space-x-2 border-l pl-4">
        <span className="text-sm text-gray-500">Desde:</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            if (endDate) handleCustomDateChange();
          }}
          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        
        <span className="text-sm text-gray-500">Hasta:</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            if (startDate) handleCustomDateChange();
          }}
          className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Apply Button for Custom Range */}
      {selectedRange === 'custom' && startDate && endDate && (
        <button
          onClick={handleCustomDateChange}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
        >
          Aplicar
        </button>
      )}
    </div>
  );
};
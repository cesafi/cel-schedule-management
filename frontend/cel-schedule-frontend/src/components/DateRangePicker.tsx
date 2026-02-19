import React from 'react';
import { useTheme } from '../providers/ThemeProvider';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClear?: () => void;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
}) => {
  const { mode } = useTheme();
  const isDarkMode = mode === 'night';
  
  const dateInputClass = isDarkMode
    ? "px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
    : "px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900";
  
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <label htmlFor="start-date" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
          From:
        </label>
        <input
          id="start-date"
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
          className={dateInputClass}
        />
      </div>
      
      <div className="flex items-center gap-2">
        <label htmlFor="end-date" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
          To:
        </label>
        <input
          id="end-date"
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          style={{ colorScheme: isDarkMode ? 'dark' : 'light' }}
          className={dateInputClass}
        />
      </div>
      
      {onClear && (startDate || endDate) && (
        <button
          onClick={onClear}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};

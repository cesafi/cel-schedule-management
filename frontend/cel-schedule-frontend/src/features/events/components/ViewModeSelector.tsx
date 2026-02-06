import React from 'react';
import { Segmented } from 'antd';
import { TableOutlined, CalendarOutlined, AppstoreOutlined } from '@ant-design/icons';

const STORAGE_KEY = 'schedules-view-mode';

export type ViewMode = 'table' | 'calendar' | 'cards';

interface ViewModeSelectorProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({ value, onChange }) => {
  const handleChange = (mode: string | number) => {
    const newMode = mode as ViewMode;
    onChange(newMode);
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch (error) {
      console.error('Failed to save view mode:', error);
    }
  };

  return (
    <Segmented
      value={value}
      onChange={handleChange}
      options={[
        {
          label: 'Table',
          value: 'table',
          icon: <TableOutlined />,
        },
        {
          label: 'Calendar',
          value: 'calendar',
          icon: <CalendarOutlined />,
        },
        {
          label: 'Cards',
          value: 'cards',
          icon: <AppstoreOutlined />,
        },
      ]}
    />
  );
};

// Hook to get saved view mode
export const useViewMode = (): [ViewMode, (mode: ViewMode) => void] => {
  const [viewMode, setViewMode] = React.useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ['table', 'calendar', 'cards'].includes(saved)) {
        return saved as ViewMode;
      }
    } catch (error) {
      console.error('Failed to load view mode:', error);
    }
    return 'table'; // default
  });

  return [viewMode, setViewMode];
};

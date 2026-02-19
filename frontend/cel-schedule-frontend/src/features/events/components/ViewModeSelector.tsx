import React, { useState, useEffect } from 'react';
import { Segmented } from 'antd';
import { TableOutlined, CalendarOutlined, AppstoreOutlined } from '@ant-design/icons';

const STORAGE_KEY = 'schedules-view-mode';

export type ViewMode = 'table' | 'calendar' | 'cards';

interface ViewModeSelectorProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export const ViewModeSelector: React.FC<ViewModeSelectorProps> = ({ value, onChange }) => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 576px)');
    setIsMobile(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
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
          label: isMobile ? undefined : 'Table',
          value: 'table',
          icon: <TableOutlined />,
        },
        {
          label: isMobile ? undefined : 'Calendar',
          value: 'calendar',
          icon: <CalendarOutlined />,
        },
        {
          label: isMobile ? undefined : 'Cards',
          value: 'cards',
          icon: <AppstoreOutlined />,
        },
      ]}
    />
  );
};

import { useState } from 'react';

const STORAGE_KEY = 'schedules-view-mode';

export type ViewMode = 'table' | 'calendar' | 'cards';

// Hook to get saved view mode
export const useViewMode = (): [ViewMode, (mode: ViewMode) => void] => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
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

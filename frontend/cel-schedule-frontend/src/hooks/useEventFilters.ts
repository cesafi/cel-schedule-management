import { useState, useMemo, useEffect } from 'react';
import { EventSchedule } from '../types';
import { 
  isAfter, 
  isBefore, 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  isToday,
  parseISO
} from 'date-fns';

const STORAGE_KEY = 'schedules-filters';

export type DateRangeFilter = 
  | 'all' 
  | 'past' 
  | 'today' 
  | 'upcoming' 
  | 'this-week' 
  | 'this-month' 
  | 'custom';

export interface EventFilters {
  searchTerm: string;
  dateRange: DateRangeFilter;
  customDateStart: Date | null;
  customDateEnd: Date | null;
  departments: string[];
  statuses: string[]; // 'active', 'cancelled', 'needs-volunteers'
  hasLocation: boolean | null; // true = has location, false = no location, null = all
}

const defaultFilters: EventFilters = {
  searchTerm: '',
  dateRange: 'all',
  customDateStart: null,
  customDateEnd: null,
  departments: [],
  statuses: [],
  hasLocation: null,
};

// Load filters from localStorage
const loadFilters = (): EventFilters => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...defaultFilters,
        ...parsed,
        customDateStart: parsed.customDateStart ? new Date(parsed.customDateStart) : null,
        customDateEnd: parsed.customDateEnd ? new Date(parsed.customDateEnd) : null,
      };
    }
  } catch (error) {
    console.error('Failed to load filters from localStorage:', error);
  }
  return defaultFilters;
};

// Save filters to localStorage
const saveFilters = (filters: EventFilters) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch (error) {
    console.error('Failed to save filters to localStorage:', error);
  }
};

export const useEventFilters = (events: EventSchedule[] | undefined) => {
  const [filters, setFilters] = useState<EventFilters>(loadFilters);

  // Save to localStorage whenever filters change
  useEffect(() => {
    saveFilters(filters);
  }, [filters]);

  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    if (!events) return [];

    return events.filter(event => {
      const eventDate = parseISO(event.timeAndDate);
      const now = new Date();

      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesName = event.name.toLowerCase().includes(searchLower);
        const matchesDescription = event.description?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesDescription) return false;
      }

      // Date range filter
      switch (filters.dateRange) {
        case 'past':
          if (!isBefore(eventDate, startOfDay(now))) return false;
          break;
        case 'today':
          if (!isToday(eventDate)) return false;
          break;
        case 'upcoming':
          if (!isAfter(eventDate, endOfDay(now))) return false;
          break;
        case 'this-week':
          if (
            isBefore(eventDate, startOfWeek(now)) ||
            isAfter(eventDate, endOfWeek(now))
          ) return false;
          break;
        case 'this-month':
          if (
            isBefore(eventDate, startOfMonth(now)) ||
            isAfter(eventDate, endOfMonth(now))
          ) return false;
          break;
        case 'custom':
          if (filters.customDateStart && isBefore(eventDate, startOfDay(filters.customDateStart))) {
            return false;
          }
          if (filters.customDateEnd && isAfter(eventDate, endOfDay(filters.customDateEnd))) {
            return false;
          }
          break;
        case 'all':
        default:
          // No date filtering
          break;
      }

      // Department filter
      if (filters.departments.length > 0) {
        const hasMatchingDept = event.assignedGroups?.some(deptId => 
          filters.departments.includes(deptId)
        );
        if (!hasMatchingDept) return false;
      }

      // Status filter
      if (filters.statuses.length > 0) {
        const statusMatches = filters.statuses.some(status => {
          if (status === 'active') return !event.isDisabled;
          if (status === 'cancelled') return event.isDisabled;
          if (status === 'needs-volunteers') {
            const totalVolunteers = 
              (event.scheduledVolunteers?.length || 0) + 
              (event.voluntaryVolunteers?.length || 0);
            return totalVolunteers < 3;
          }
          return false;
        });
        if (!statusMatches) return false;
      }

      // Location filter
      if (filters.hasLocation !== null) {
        const hasLoc = !!event.location;
        if (filters.hasLocation && !hasLoc) return false;
        if (!filters.hasLocation && hasLoc) return false;
      }

      return true;
    });
  }, [events, filters]);

  // Update individual filter values
  const setSearchTerm = (searchTerm: string) => 
    setFilters(prev => ({ ...prev, searchTerm }));

  const setDateRange = (dateRange: DateRangeFilter) => 
    setFilters(prev => ({ ...prev, dateRange }));

  const setCustomDateRange = (start: Date | null, end: Date | null) =>
    setFilters(prev => ({ 
      ...prev, 
      dateRange: 'custom',
      customDateStart: start, 
      customDateEnd: end 
    }));

  const setDepartments = (departments: string[]) => 
    setFilters(prev => ({ ...prev, departments }));

  const setStatuses = (statuses: string[]) => 
    setFilters(prev => ({ ...prev, statuses }));

  const setHasLocation = (hasLocation: boolean | null) => 
    setFilters(prev => ({ ...prev, hasLocation }));

  const resetFilters = () => setFilters(defaultFilters);

  const hasActiveFilters = 
    filters.searchTerm !== '' ||
    filters.dateRange !== 'all' ||
    filters.departments.length > 0 ||
    filters.statuses.length > 0 ||
    filters.hasLocation !== null;

  return {
    filters,
    filteredEvents,
    setSearchTerm,
    setDateRange,
    setCustomDateRange,
    setDepartments,
    setStatuses,
    setHasLocation,
    resetFilters,
    hasActiveFilters,
  };
};

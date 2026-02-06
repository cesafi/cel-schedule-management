import { useMemo } from 'react';
import { EventSchedule } from '../types/event';
import { useEvents } from './useEvents';
import { getUpcomingEvents } from '../utils/analytics';

interface UseUpcomingEventsOptions {
  volunteerId?: string;
  departmentId?: string;
}

interface UseUpcomingEventsReturn {
  upcomingEvents: EventSchedule[];
  isLoading: boolean;
  error: Error | null;
}

export function useUpcomingEvents(options: UseUpcomingEventsOptions = {}): UseUpcomingEventsReturn {
  const { volunteerId, departmentId } = options;
  const { data: events, isLoading, error } = useEvents();

  const upcomingEvents = useMemo((): EventSchedule[] => {
    if (!events || events.length === 0) return [];

    let filtered = getUpcomingEvents(events);

    // Filter by volunteer ID if provided
    if (volunteerId) {
      filtered = filtered.filter(event =>
        (event.scheduledVolunteers?.includes(volunteerId)) ||
        (event.voluntaryVolunteers?.includes(volunteerId)) ||
        (event.statuses?.some(s => s.volunteerID === volunteerId))
      );
    }

    // Filter by department ID if provided
    if (departmentId) {
      filtered = filtered.filter(event =>
        event.assignedGroups?.includes(departmentId)
      );
    }

    return filtered;
  }, [events, volunteerId, departmentId]);

  return {
    upcomingEvents,
    isLoading,
    error: error as Error | null,
  };
}

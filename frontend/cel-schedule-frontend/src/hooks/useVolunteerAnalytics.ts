import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { volunteersApi } from '../api';
import { VolunteerAnalytics } from '../types';
import { EventSchedule, ScheduleStatus } from '../types/event';
import {
  calculateAttendanceRate,
  calculatePunctualityRate,
  getAttendanceDistribution,
  calculateAttendanceStreak,
  groupStatusesByMonth,
  TrendDataPoint,
  AttendanceDistribution,
} from '../utils/analytics';
import { AttendanceType } from '../types/enums';

interface UseVolunteerAnalyticsReturn {
  stats: VolunteerAnalytics | null;
  distribution: AttendanceDistribution | null;
  trendData: TrendDataPoint[];
  isLoading: boolean;
  error: Error | null;
}

export function useVolunteerAnalytics(volunteerId: string): UseVolunteerAnalyticsReturn {
  // Fetch volunteer status history
  const { data: statusHistory, isLoading, error } = useQuery({
    queryKey: ['volunteer-status-history', volunteerId],
    queryFn: () => volunteersApi.getStatusHistory(volunteerId),
    enabled: !!volunteerId,
  });

  // Convert StatusHistoryItem[] to EventSchedule[] format for analytics functions
  const events = useMemo((): EventSchedule[] => {
    if (!statusHistory) return [];

    return statusHistory
      .filter(item => item.status) // Filter out items without status
      .map(item => ({
        id: item.eventId,
        name: item.eventName,
        description: '',
        timeAndDate: item.timeAndDate,
        scheduledVolunteers: [],
        voluntaryVolunteers: [],
        assignedGroups: [],
        statuses: [{
          volunteerID: volunteerId,
          timeIn: item.status.timeIn,
          timeOut: item.status.timeOut,
          attendanceType: item.status.attendanceType as AttendanceType | undefined,
        }] as ScheduleStatus[],
        createdAt: '',
        updatedAt: '',
        isDisabled: false,
      }));
  }, [statusHistory, volunteerId]);

  // Calculate all statistics
  const stats = useMemo((): VolunteerAnalytics | null => {
    if (!events.length) return null;

    const allStatuses = events.flatMap(e => e.statuses || []);
    const distribution = getAttendanceDistribution(allStatuses);

    return {
      totalEvents: events.length,
      attendanceRate: calculateAttendanceRate(allStatuses),
      punctualityRate: calculatePunctualityRate(allStatuses),
      presentCount: distribution.present,
      lateCount: distribution.late,
      excusedCount: distribution.excused,
      absentCount: distribution.absent,
      currentStreak: calculateAttendanceStreak(events),
      upcomingEventsCount: 0, // This will be calculated separately with useUpcomingEvents
    };
  }, [events]);

  const distribution = useMemo((): AttendanceDistribution | null => {
    if (!events.length) return null;
    const allStatuses = events.flatMap(e => e.statuses || []);
    return getAttendanceDistribution(allStatuses);
  }, [events]);

  const trendData = useMemo((): TrendDataPoint[] => {
    if (!events.length) return [];
    return groupStatusesByMonth(events);
  }, [events]);

  return {
    stats,
    distribution,
    trendData,
    isLoading,
    error: error as Error | null,
  };
}

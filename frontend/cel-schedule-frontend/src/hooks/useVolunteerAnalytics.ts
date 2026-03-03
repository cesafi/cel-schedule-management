import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { volunteersApi } from '../api';
import { VolunteerAnalytics } from '../types';
import { EventSchedule } from '../types/event';
import {
  calculateAttendanceRate,
  calculatePunctualityRate,
  getAttendanceDistribution,
  calculateAttendanceStreak,
  groupStatusesByMonth,
  TrendDataPoint,
  AttendanceDistribution,
} from '../utils/analytics';

interface UseVolunteerAnalyticsReturn {
  stats: VolunteerAnalytics | null;
  distribution: AttendanceDistribution | null;
  trendData: TrendDataPoint[];
  isLoading: boolean;
  error: Error | null;
}

export function useVolunteerAnalytics(volunteerId: string): UseVolunteerAnalyticsReturn {
  // Backend returns EventSchedule[] — each event where this volunteer has a status entry
  const { data: events = [], isLoading, error } = useQuery<EventSchedule[]>({
    queryKey: ['volunteer-status-history', volunteerId],
    queryFn: () => volunteersApi.getStatusHistory(volunteerId),
    enabled: !!volunteerId,
  });

  // Extract only this volunteer's own statuses from each event
  const ownStatuses = useMemo(
    () => events.flatMap(e =>
      (e.statuses || []).filter(s => s.volunteerID === volunteerId),
    ),
    [events, volunteerId],
  );

  const stats = useMemo((): VolunteerAnalytics | null => {
    if (!events.length) return null;

    const distribution = getAttendanceDistribution(ownStatuses);

    return {
      totalEvents: events.length,
      attendanceRate: calculateAttendanceRate(ownStatuses),
      punctualityRate: calculatePunctualityRate(ownStatuses),
      presentCount: distribution.present,
      lateCount: distribution.late,
      excusedCount: distribution.excused,
      absentCount: distribution.absent,
      currentStreak: calculateAttendanceStreak(events.map(e => ({
        ...e,
        statuses: (e.statuses || []).filter(s => s.volunteerID === volunteerId),
      }))),
      upcomingEventsCount: 0, // Handled separately by useUpcomingEvents
    };
  }, [events, ownStatuses, volunteerId]);

  const distribution = useMemo((): AttendanceDistribution | null => {
    if (!events.length) return null;
    return getAttendanceDistribution(ownStatuses);
  }, [events, ownStatuses]);

  const trendData = useMemo((): TrendDataPoint[] => {
    if (!events.length) return [];
    // Pass events with only this volunteer's statuses for correct per-month counts
    return groupStatusesByMonth(events.map(e => ({
      ...e,
      statuses: (e.statuses || []).filter(s => s.volunteerID === volunteerId),
    })));
  }, [events, volunteerId]);

  return {
    stats,
    distribution,
    trendData,
    isLoading,
    error: error as Error | null,
  };
}

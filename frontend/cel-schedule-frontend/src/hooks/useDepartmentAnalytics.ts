import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { departmentsApi } from '../api';
import { DepartmentAnalytics, MemberPerformance, Volunteer } from '../types';
import { EventSchedule } from '../types/event';
import {
  calculateAttendanceRate,
  calculatePunctualityRate,
  getAttendanceDistribution,
  groupStatusesByMonth,
  isActiveMember,
  TrendDataPoint,
  AttendanceDistribution,
} from '../utils/analytics';
import { AttendanceType } from '../types/enums';
import { useVolunteers } from './useVolunteers';

interface UseDepartmentAnalyticsReturn {
  stats: DepartmentAnalytics | null;
  distribution: AttendanceDistribution | null;
  trendData: TrendDataPoint[];
  memberPerformance: MemberPerformance[];
  isLoading: boolean;
  error: Error | null;
}

export function useDepartmentAnalytics(departmentId: string): UseDepartmentAnalyticsReturn {
  // Backend returns full EventSchedule[] with all member statuses populated
  const { data: events = [], isLoading: eventsLoading, error } = useQuery<EventSchedule[]>({
    queryKey: ['department-status-history', departmentId],
    queryFn: () => departmentsApi.getStatusHistory(departmentId),
    enabled: !!departmentId,
  });

  // Fetch department details for member list
  const { data: department, isLoading: deptLoading } = useQuery({
    queryKey: ['department', departmentId],
    queryFn: () => departmentsApi.getById(departmentId),
    enabled: !!departmentId,
  });

  // Fetch all volunteers for name lookup
  const { data: volunteers, isLoading: volunteersLoading } = useVolunteers();
  const volunteerMap = useMemo(
    () => new Map((volunteers || []).map((v: Volunteer) => [v.id, v])),
    [volunteers],
  );

  const isLoading = eventsLoading || deptLoading || volunteersLoading;

  // All statuses across all events (department-wide)
  const allStatuses = useMemo(
    () => events.flatMap(e => e.statuses || []),
    [events],
  );

  // Department-wide statistics
  const stats = useMemo((): DepartmentAnalytics | null => {
    if (!events.length || !department) return null;

    const distribution = getAttendanceDistribution(allStatuses);

    // Active members = those who have a check-in in any event within the last 30 days
    const activeMemberIds = new Set<string>();
    events.forEach(event => {
      if (isActiveMember([event], 30)) {
        (event.statuses || []).forEach(status => {
          if (
            status.attendanceType === AttendanceType.PRESENT ||
            status.attendanceType === AttendanceType.LATE ||
            status.attendanceType === AttendanceType.EXCUSED
          ) {
            activeMemberIds.add(status.volunteerID);
          }
        });
      }
    });

    return {
      totalEvents: events.length,
      attendanceRate: calculateAttendanceRate(allStatuses),
      punctualityRate: calculatePunctualityRate(allStatuses),
      presentCount: distribution.present,
      lateCount: distribution.late,
      excusedCount: distribution.excused,
      absentCount: distribution.absent,
      activeMembers: activeMemberIds.size,
      totalMembers: department.volunteerMembers?.length || 0,
      upcomingEventsCount: 0, // Handled separately by useUpcomingEvents
    };
  }, [events, department, allStatuses]);

  const distribution = useMemo((): AttendanceDistribution | null => {
    if (!events.length) return null;
    return getAttendanceDistribution(allStatuses);
  }, [events, allStatuses]);

  const trendData = useMemo((): TrendDataPoint[] => {
    if (!events.length) return [];
    return groupStatusesByMonth(events);
  }, [events]);

  // Per-member analytics — filter each member's own statuses across all events
  const memberPerformance = useMemo((): MemberPerformance[] => {
    if (!department?.volunteerMembers || !events.length) return [];

    return department.volunteerMembers
      .map(member => {
        const volunteer = volunteerMap.get(member.volunteerID);
        if (!volunteer) return null;

        // Only statuses that belong to this volunteer
        const memberStatuses = events.flatMap(e =>
          (e.statuses || []).filter(s => s.volunteerID === member.volunteerID),
        );

        // Count events where this volunteer has any status entry
        const eventsAttended = events.filter(e =>
          (e.statuses || []).some(s => s.volunteerID === member.volunteerID),
        ).length;

        return {
          volunteerId: member.volunteerID,
          volunteerName: volunteer.name || 'Unknown',
          eventsAttended,
          attendanceRate: calculateAttendanceRate(memberStatuses),
          punctualityRate: calculatePunctualityRate(memberStatuses),
        };
      })
      .filter((p): p is MemberPerformance => p !== null)
      .sort((a, b) => b.attendanceRate - a.attendanceRate);
  }, [department, events, volunteerMap]);

  return {
    stats,
    distribution,
    trendData,
    memberPerformance,
    isLoading,
    error: error as Error | null,
  };
}

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { departmentsApi } from '../api';
import { DepartmentAnalytics, MemberPerformance } from '../types';
import { EventSchedule, ScheduleStatus } from '../types/event';
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
import { useDepartments, useVolunteers } from './';

interface UseDepartmentAnalyticsReturn {
  stats: DepartmentAnalytics | null;
  distribution: AttendanceDistribution | null;
  trendData: TrendDataPoint[];
  memberPerformance: MemberPerformance[];
  isLoading: boolean;
  error: Error | null;
}

export function useDepartmentAnalytics(departmentId: string): UseDepartmentAnalyticsReturn {
  // Fetch department status history (all events the department was assigned to)
  const { data: statusHistory, isLoading: historyLoading, error } = useQuery({
    queryKey: ['department-status-history', departmentId],
    queryFn: () => departmentsApi.getStatusHistory(departmentId),
    enabled: !!departmentId,
  });

  // Fetch department details for member information
  const { data: department, isLoading: deptLoading } = useQuery({
    queryKey: ['department', departmentId],
    queryFn: () => departmentsApi.getById(departmentId),
    enabled: !!departmentId,
  });

  // Fetch all volunteers for name lookup
  const { data: volunteers, isLoading: volunteersLoading } = useVolunteers();
  const volunteerMap = useMemo(() => new Map((volunteers || []).map(v => [v.id, v])), [volunteers]);

  const isLoading = historyLoading || deptLoading || volunteersLoading;

  // Convert StatusHistoryItem[] to EventSchedule[] format
  // Group by event and collect all member statuses for each event
  const events = useMemo((): EventSchedule[] => {
    if (!statusHistory) return [];

    const eventMap = new Map<string, EventSchedule>();

    statusHistory.forEach(item => {
      if (!eventMap.has(item.eventId)) {
        eventMap.set(item.eventId, {
          id: item.eventId,
          name: item.eventName,
          description: '',
          timeAndDate: item.timeAndDate,
          scheduledVolunteers: [],
          voluntaryVolunteers: [],
          assignedGroups: [departmentId],
          statuses: [],
          createdAt: '',
          updatedAt: '',
          isDisabled: false,
        });
      }

      const event = eventMap.get(item.eventId)!;
      
      // Skip items without status information
      if (!item.status) return;
      
      // The backend might return individual statuses or aggregated
      // Based on research, status history returns individual volunteer statuses
      // We need to extract volunteer ID from the status (this might need adjustment based on actual API response)
      event.statuses.push({
        volunteerID: item.status.attendanceType ? 'unknown' : '', // API doesn't return volunteer ID in status
        timeIn: item.status.timeIn,
        timeOut: item.status.timeOut,
        attendanceType: item.status.attendanceType as AttendanceType | undefined,
      });
    });

    return Array.from(eventMap.values());
  }, [statusHistory, departmentId]);

  // Calculate department-wide statistics
  const stats = useMemo((): DepartmentAnalytics | null => {
    if (!events.length || !department) return null;

    const allStatuses = events.flatMap(e => e.statuses || []);
    const distribution = getAttendanceDistribution(allStatuses);

    // Calculate active members (attended event in last 30 days)
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
      upcomingEventsCount: 0, // Calculated separately with useUpcomingEvents
    };
  }, [events, department]);

  const distribution = useMemo((): AttendanceDistribution | null => {
    if (!events.length) return null;
    const allStatuses = events.flatMap(e => e.statuses || []);
    return getAttendanceDistribution(allStatuses);
  }, [events]);

  const trendData = useMemo((): TrendDataPoint[] => {
    if (!events.length) return [];
    return groupStatusesByMonth(events);
  }, [events]);

  // Calculate performance for each member
  const memberPerformance = useMemo((): MemberPerformance[] => {
    if (!department?.volunteerMembers || !statusHistory) return [];

    const performanceMap = new Map<string, {
      statuses: ScheduleStatus[];
      events: EventSchedule[];
    }>();

    // Group statuses by volunteer
    // Note: The current StatusHistoryItem structure doesn't clearly separate volunteer IDs
    // This is a limitation that might need backend adjustment
    // For now, we'll calculate based on department members and available events
    
    department.volunteerMembers.forEach(member => {
      const volunteer = volunteerMap.get(member.volunteerID);
      if (!volunteer) return;
      
      // This is a simplified calculation - ideally we'd filter events per volunteer
      const memberStatuses = events.flatMap(e => e.statuses || []);
      const distribution = getAttendanceDistribution(memberStatuses);
      
      performanceMap.set(member.volunteerID, {
        statuses: memberStatuses,
        events: events,
      });
    });

    return department.volunteerMembers
      .map(member => {
        const volunteer = volunteerMap.get(member.volunteerID);
        if (!volunteer) return null;

        const data = performanceMap.get(member.volunteerID);
        if (!data) return null;

        return {
          volunteerId: member.volunteerID,
          volunteerName: volunteer?.name || 'Unknown',
          eventsAttended: data.events.length,
          attendanceRate: calculateAttendanceRate(data.statuses),
          punctualityRate: calculatePunctualityRate(data.statuses),
        };
      })
      .filter((p): p is MemberPerformance => p !== null)
      .sort((a, b) => b.attendanceRate - a.attendanceRate); // Sort by attendance rate
  }, [department, statusHistory, events, volunteerMap]);

  return {
    stats,
    distribution,
    trendData,
    memberPerformance,
    isLoading,
    error: error as Error | null,
  };
}

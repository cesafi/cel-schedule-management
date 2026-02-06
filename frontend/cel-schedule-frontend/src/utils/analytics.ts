import { AttendanceType } from '../types/enums';
import { ScheduleStatus, EventSchedule } from '../types/event';

export interface AttendanceDistribution {
  present: number;
  late: number;
  excused: number;
  absent: number;
  total: number;
}

export interface TrendDataPoint {
  month: string;
  year: number;
  present: number;
  late: number;
  excused: number;
  absent: number;
  total: number;
  attendanceRate: number;
}

/**
 * Calculate attendance rate as percentage
 * Formula: (present + late + excused) / total × 100%
 */
export function calculateAttendanceRate(statuses: ScheduleStatus[]): number {
  if (statuses.length === 0) return 0;
  
  const attended = statuses.filter(s => 
    s.attendanceType === AttendanceType.PRESENT ||
    s.attendanceType === AttendanceType.LATE ||
    s.attendanceType === AttendanceType.EXCUSED
  ).length;
  
  return Math.round((attended / statuses.length) * 100);
}

/**
 * Calculate punctuality rate as percentage
 * Formula: present / (present + late) × 100%
 * Returns 100 if no late records exist
 */
export function calculatePunctualityRate(statuses: ScheduleStatus[]): number {
  const present = statuses.filter(s => s.attendanceType === AttendanceType.PRESENT).length;
  const late = statuses.filter(s => s.attendanceType === AttendanceType.LATE).length;
  
  const total = present + late;
  if (total === 0) return 100;
  
  return Math.round((present / total) * 100);
}

/**
 * Get distribution of attendance types
 */
export function getAttendanceDistribution(statuses: ScheduleStatus[]): AttendanceDistribution {
  const distribution = {
    present: 0,
    late: 0,
    excused: 0,
    absent: 0,
    total: statuses.length,
  };
  
  statuses.forEach(status => {
    switch (status.attendanceType) {
      case AttendanceType.PRESENT:
        distribution.present++;
        break;
      case AttendanceType.LATE:
        distribution.late++;
        break;
      case AttendanceType.EXCUSED:
        distribution.excused++;
        break;
      default:
        // undefined or null means absent/not checked in
        distribution.absent++;
    }
  });
  
  return distribution;
}

/**
 * Filter events by date range
 */
export function filterEventsByDateRange(
  events: EventSchedule[],
  startDate?: Date,
  endDate?: Date
): EventSchedule[] {
  return events.filter(event => {
    const eventDate = new Date(event.timeAndDate);
    
    if (startDate && eventDate < startDate) return false;
    if (endDate && eventDate > endDate) return false;
    
    return true;
  });
}

/**
 * Group events by month for trend analysis
 * Returns array sorted by date (oldest first)
 */
export function groupStatusesByMonth(events: EventSchedule[]): TrendDataPoint[] {
  const monthMap = new Map<string, TrendDataPoint>();
  
  events.forEach(event => {
    const date = new Date(event.timeAndDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        month: monthName,
        year: date.getFullYear(),
        present: 0,
        late: 0,
        excused: 0,
        absent: 0,
        total: 0,
        attendanceRate: 0,
      });
    }
    
    const dataPoint = monthMap.get(monthKey)!;
    
    (event.statuses || []).forEach(status => {
      dataPoint.total++;
      
      switch (status.attendanceType) {
        case AttendanceType.PRESENT:
          dataPoint.present++;
          break;
        case AttendanceType.LATE:
          dataPoint.late++;
          break;
        case AttendanceType.EXCUSED:
          dataPoint.excused++;
          break;
        default:
          dataPoint.absent++;
      }
    });
  });
  
  // Calculate attendance rate for each month
  monthMap.forEach(dataPoint => {
    if (dataPoint.total > 0) {
      const attended = dataPoint.present + dataPoint.late + dataPoint.excused;
      dataPoint.attendanceRate = Math.round((attended / dataPoint.total) * 100);
    }
  });
  
  // Convert to array and sort by date
  return Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([_, dataPoint]) => dataPoint);
}

/**
 * Calculate current attendance streak (consecutive non-absent events)
 * Starts from most recent event and counts backwards
 */
export function calculateAttendanceStreak(events: EventSchedule[]): number {
  if (events.length === 0) return 0;
  
  // Sort events by date (most recent first)
  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.timeAndDate).getTime() - new Date(a.timeAndDate).getTime()
  );
  
  let streak = 0;
  
  for (const event of sortedEvents) {
    // Check if the event is in the past
    if (new Date(event.timeAndDate) > new Date()) continue;
    
    const status = (event.statuses || [])[0]; // Assuming first status is the relevant one
    if (!status) break;
    
    if (
      status.attendanceType === AttendanceType.PRESENT ||
      status.attendanceType === AttendanceType.LATE ||
      status.attendanceType === AttendanceType.EXCUSED
    ) {
      streak++;
    } else {
      break; // Streak broken
    }
  }
  
  return streak;
}

/**
 * Filter to get only upcoming (future) events
 */
export function getUpcomingEvents(events: EventSchedule[]): EventSchedule[] {
  const now = new Date();
  return events
    .filter(event => new Date(event.timeAndDate) > now)
    .sort((a, b) => new Date(a.timeAndDate).getTime() - new Date(b.timeAndDate).getTime());
}

/**
 * Filter to get only past events
 */
export function getPastEvents(events: EventSchedule[]): EventSchedule[] {
  const now = new Date();
  return events
    .filter(event => new Date(event.timeAndDate) <= now)
    .sort((a, b) => new Date(b.timeAndDate).getTime() - new Date(a.timeAndDate).getTime());
}

/**
 * Check if a member is active (attended at least one event in the last N days)
 */
export function isActiveMember(events: EventSchedule[], daysThreshold: number = 30): boolean {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);
  
  return events.some(event => {
    const eventDate = new Date(event.timeAndDate);
    if (eventDate < thresholdDate) return false;
    
    return (event.statuses || []).some(status =>
      status.attendanceType === AttendanceType.PRESENT ||
      status.attendanceType === AttendanceType.LATE ||
      status.attendanceType === AttendanceType.EXCUSED
    );
  });
}

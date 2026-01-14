import { AttendanceType, TimeType } from './enums';

// Event Schedule types

export interface ScheduleStatus {
  volunteerID: string;
  timeIn?: string;
  timeOut?: string;
  attendanceType?: AttendanceType;
  timeType?: TimeType;
}

export interface EventSchedule {
  id: string;
  name: string;
  description: string;
  timeAndDate: string;
  scheduledVolunteers: string[]; // volunteer IDs
  voluntaryVolunteers: string[]; // volunteer IDs
  assignedGroups: string[]; // department IDs
  statuses: ScheduleStatus[];
  createdAt: string;
  updatedAt: string;
  isDisabled: boolean;
}

export interface EventCreateDTO {
  name: string;
  description: string;
  timeAndDate: string;
  scheduledVolunteers?: string[];
  voluntaryVolunteers?: string[];
  assignedGroups?: string[];
}

export interface EventUpdateDTO {
  name?: string;
  description?: string;
  timeAndDate?: string;
  scheduledVolunteers?: string[];
  voluntaryVolunteers?: string[];
  assignedGroups?: string[];
  isDisabled?: boolean;
}

export interface AddStatusDTO {
  volunteerID: string;
  timeIn?: string;
  attendanceType?: AttendanceType;
}

export interface UpdateStatusDTO {
  timeOut?: string;
  attendanceType?: AttendanceType;
  timeType?: TimeType;
}

import { AttendanceType, TimeOutType } from './enums';
import { AddDepartmentToEventModal } from '../features/events/modals/AddDepartmentToEventModal';

// Event Schedule types

export interface ScheduleStatus {
  volunteerID: string;
  timeIn?: string;
  timeOut?: string;
  attendanceType?: AttendanceType;
  timeOutType?: TimeOutType;
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
}

export interface UpdateStatusDTO {
  timeIn?: string;
  attendanceType?: AttendanceType;
  timeOut?: string;
}

export interface AddDepartmentToEventDTO {
  departmentIDs: string[];
}

export interface TimeInDTO {
  timeIn?: string;
  timeInType: string;
}

export interface TimeOutDTO {
  timeOut?: string;
  timeOutType: string;
}
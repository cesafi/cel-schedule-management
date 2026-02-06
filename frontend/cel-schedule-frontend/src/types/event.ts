import { AttendanceType, TimeOutType } from './enums';
// Removed unused import: AddDepartmentToEventModal

// Event Schedule types

export interface EventLocation {
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
}

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
  location?: EventLocation;
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
  location?: EventLocation;
  scheduledVolunteers?: string[];
  voluntaryVolunteers?: string[];
  assignedGroups?: string[];
}

export interface EventUpdateDTO {
  name?: string;
  description?: string;
  timeAndDate?: string;
  location?: EventLocation;
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
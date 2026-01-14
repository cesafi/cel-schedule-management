// Volunteer model types

export interface Volunteer {
  id: string;
  name: string;
  createdAt: string;
  lastUpdated: string;
  isDisabled: boolean;
}

export interface VolunteerCreateDTO {
  name: string;
}

export interface VolunteerUpdateDTO {
  name?: string;
  isDisabled?: boolean;
}

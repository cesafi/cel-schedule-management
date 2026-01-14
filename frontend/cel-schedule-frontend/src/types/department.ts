import { MembershipType } from './enums';

// Department model types

export interface MembershipInfo {
  volunteerID: string;
  joinedDate: string;
  membershipType: MembershipType;
  lastUpdated: string;
}

export interface Department {
  id: string;
  departmentName: string;
  volunteerMembers: MembershipInfo[];
  createdAt: string;
  lastUpdated: string;
  isDisabled: boolean;
}

export interface DepartmentCreateDTO {
  departmentName: string;
  initialHeadId: string;
}

export interface DepartmentUpdateDTO {
  name?: string;
  isDisabled?: boolean;
}

export interface AddMemberDTO {
  volunteerId: string;
  membershipType: string;
}

export interface UpdateMemberDTO {
  membershipType: MembershipType;
}

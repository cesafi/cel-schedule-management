import { firestoreService } from '../services/firestore';
import {
  Department,
  DepartmentCreateDTO,
  DepartmentUpdateDTO,
  AddMemberDTO,
  UpdateMemberDTO,
} from '../types';
import type { EventSchedule } from '../types/event';

export const departmentsApi = {
  async getAll(): Promise<Department[]> {
    return firestoreService.departments.getAll();
  },

  async getById(id: string): Promise<Department> {
    return firestoreService.departments.getById(id);
  },

  async getStatusHistory(id: string): Promise<EventSchedule[]> {
    return firestoreService.events.getStatusHistoryForDepartment(id);
  },

  async create(data: DepartmentCreateDTO): Promise<Department> {
    return firestoreService.departments.create(data);
  },

  async update(id: string, data: DepartmentUpdateDTO): Promise<Department> {
    return firestoreService.departments.update(id, data);
  },

  async delete(id: string): Promise<void> {
    return firestoreService.departments.delete(id);
  },

  async addMember(id: string, data: AddMemberDTO): Promise<Department> {
    return firestoreService.departments.addMember(id, data);
  },

  async updateMember(id: string, volunteerId: string, data: UpdateMemberDTO): Promise<Department> {
    return firestoreService.departments.updateMember(id, volunteerId, data);
  },

  async removeMember(id: string, volunteerId: string): Promise<void> {
    return firestoreService.departments.removeMember(id, volunteerId);
  },

  async getLogs(id: string, params?: { limit?: number }): Promise<import('../types/log').LogListResponse> {
    const logs = await firestoreService.logs.getAll({ departmentId: id, limit: params?.limit });
    return { logs: logs as unknown as import('../types/log').SystemLog[], total: logs.length };
  },
};

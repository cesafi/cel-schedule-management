import { firestoreService } from '../services/firestore';
import {
  EventSchedule,
  EventCreateDTO,
  EventUpdateDTO,
  AddStatusDTO,
  UpdateStatusDTO,
  TimeInDTO,
  TimeOutDTO,
} from '../types';

export const eventsApi = {
  async getAll(): Promise<EventSchedule[]> {
    return firestoreService.events.getAll();
  },

  /** Fetch all events including soft-deleted ones — for admin use only */
  async getAllIncludingDisabled(): Promise<EventSchedule[]> {
    return firestoreService.events.getAllIncludingDisabled();
  },

  async getById(id: string): Promise<EventSchedule> {
    return firestoreService.events.getById(id);
  },

  async create(data: EventCreateDTO): Promise<EventSchedule> {
    return firestoreService.events.create(data);
  },

  async update(id: string, data: EventUpdateDTO): Promise<EventSchedule> {
    return firestoreService.events.update(id, data);
  },

  async delete(id: string): Promise<void> {
    return firestoreService.events.delete(id);
  },

  async addStatus(id: string, data: AddStatusDTO): Promise<EventSchedule> {
    return firestoreService.events.addStatus(id, data);
  },

  async updateStatus(id: string, volunteerId: string, data: UpdateStatusDTO): Promise<EventSchedule> {
    return firestoreService.events.updateStatus(id, volunteerId, data);
  },

  async timeIn(id: string, volunteerId: string, data: TimeInDTO): Promise<void> {
    return firestoreService.events.timeIn(id, volunteerId, data);
  },

  async timeOut(id: string, volunteerId: string, data: TimeOutDTO): Promise<void> {
    return firestoreService.events.timeOut(id, volunteerId, data);
  },

  async addDepartmentsToEvent(id: string, departmentIds: string[]): Promise<void> {
    return firestoreService.events.addDepartments(id, departmentIds);
  },

  async removeDepartmentFromEvent(id: string, departmentId: string): Promise<void> {
    return firestoreService.events.removeDepartment(id, departmentId);
  },

  async removeVolunteerFromEvent(id: string, volunteerId: string): Promise<void> {
    return firestoreService.events.removeVolunteer(id, volunteerId);
  },

  async getLogs(id: string, params?: { limit?: number }): Promise<import('../types/log').LogListResponse> {
    const logs = await firestoreService.logs.getAll({ eventId: id, limit: params?.limit });
    return { logs: logs as unknown as import('../types/log').SystemLog[], total: logs.length };
  },
};

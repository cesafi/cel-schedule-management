import { firestoreService } from '../services/firestore';
import { Volunteer, VolunteerCreateDTO, VolunteerUpdateDTO } from '../types';
import type { EventSchedule } from '../types/event';

export const volunteersApi = {
  async getAll(): Promise<Volunteer[]> {
    return firestoreService.volunteers.getAll();
  },

  async getById(id: string): Promise<Volunteer> {
    return firestoreService.volunteers.getById(id);
  },

  async getStatusHistory(id: string): Promise<EventSchedule[]> {
    return firestoreService.events.getStatusHistoryForVolunteer(id);
  },

  async create(data: VolunteerCreateDTO): Promise<Volunteer> {
    return firestoreService.volunteers.create(data);
  },

  async update(id: string, data: VolunteerUpdateDTO): Promise<Volunteer> {
    return firestoreService.volunteers.update(id, data);
  },

  /** Soft-delete — sets IsDisabled = true in Firestore */
  async delete(id: string): Promise<void> {
    return firestoreService.volunteers.delete(id);
  },

  /**
   * Audit logs for a volunteer are written by the Cloud Function onWrite trigger.
   * This queries the logs collection filtered by volunteerId in metadata.
   */
  async getLogs(id: string, params?: { limit?: number }): Promise<import('../types/log').LogListResponse> {
    const logs = await firestoreService.logs.getAll({ volunteerId: id, limit: params?.limit });
    return { logs: logs as unknown as import('../types/log').SystemLog[], total: logs.length };
  },
};

import apiClient from './client';
import { EventSchedule, EventCreateDTO, EventUpdateDTO, AddStatusDTO, UpdateStatusDTO } from '../types';

export const eventsApi = {
  // Get all events
  async getAll(): Promise<EventSchedule[]> {
    const response = await apiClient.get<EventSchedule[]>('/events');
    return response.data;
  },

  // Get event by ID
  async getById(id: string): Promise<EventSchedule> {
    const response = await apiClient.get<EventSchedule>(`/events/${id}`);
    return response.data;
  },

  // Create event
  async create(data: EventCreateDTO): Promise<EventSchedule> {
    const response = await apiClient.post<EventSchedule>('/events', data);
    return response.data;
  },

  // Update event
  async update(id: string, data: EventUpdateDTO): Promise<EventSchedule> {
    const response = await apiClient.put<EventSchedule>(`/events/${id}`, data);
    return response.data;
  },

  // Delete event (soft delete)
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/events/${id}`);
  },

  // Add volunteer status (check-in)
  async addStatus(id: string, data: AddStatusDTO): Promise<EventSchedule> {
    const response = await apiClient.post<EventSchedule>(`/events/${id}/status`, data);
    return response.data;
  },

  // Update volunteer status (check-out)
  async updateStatus(id: string, volunteerId: string, data: UpdateStatusDTO): Promise<EventSchedule> {
    const response = await apiClient.put<EventSchedule>(`/events/${id}/status/${volunteerId}`, data);
    return response.data;
  },
};

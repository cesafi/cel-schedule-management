import apiClient from './client';
import { EventSchedule, EventCreateDTO, EventUpdateDTO, AddStatusDTO, UpdateStatusDTO } from '../types';

export const eventsApi = {
  // Get all events
  async getAll(): Promise<EventSchedule[]> {
    const response = await apiClient.get<EventSchedule[]>('/events');
    console.log("fetched all events:", response.data);
    return response.data;
  },

  // Get event by ID
  async getById(id: string): Promise<EventSchedule> {
    const response = await apiClient.get<EventSchedule>(`/events/${id}`);
    console.log("fetched event by id:", response.data);
    return response.data;
  },

  // Create event
  async create(data: EventCreateDTO): Promise<EventSchedule> {
    const response = await apiClient.post<EventSchedule>('/events', data);
    console.log("created event:", response.data);
    return response.data;
  },

  // Update event
  async update(id: string, data: EventUpdateDTO): Promise<EventSchedule> {
    const response = await apiClient.put<EventSchedule>(`/events/${id}`, data);
    console.log("updated event:", response.data);
    return response.data;
  },

  // Delete event (soft delete)
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/events/${id}`);
    console.log("deleted event with id:", id);
  },

  // Add volunteer status (check-in)
  async addStatus(id: string, data: AddStatusDTO): Promise<EventSchedule> {
    const response = await apiClient.post<EventSchedule>(`/events/${id}/status`, data);
    console.log("added status to event:", response.data);
    return response.data;
  },

  // Update volunteer status (check-out)
  async updateStatus(id: string, volunteerId: string, data: UpdateStatusDTO): Promise<EventSchedule> {
    const response = await apiClient.put<EventSchedule>(`/events/${id}/status/${volunteerId}`, data);
    console.log("updated status in event:", response.data);
    return response.data;
  },
};

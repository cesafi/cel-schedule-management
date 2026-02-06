import apiClient from './client';
import { Volunteer, VolunteerCreateDTO, VolunteerUpdateDTO, StatusHistoryItem } from '../types';
import type { LogListResponse } from '../types/log';

export const volunteersApi = {
  // Get all volunteers
  async getAll(): Promise<Volunteer[]> {
    const response = await apiClient.get<Volunteer[]>('/volunteers');
    return response.data;
  },

  // Get volunteer by ID
  async getById(id: string): Promise<Volunteer> {
    const response = await apiClient.get<Volunteer>(`/volunteers/${id}`);
    return response.data;
  },

  // Get volunteer status history
  async getStatusHistory(id: string): Promise<StatusHistoryItem[]> {
    const response = await apiClient.get<StatusHistoryItem[]>(`/volunteers/${id}/status-history`);
    console.log("fetched volunteer status history:", response.data);
    return response.data;
  },

  // Create volunteer
  async create(data: VolunteerCreateDTO): Promise<Volunteer> {
    const response = await apiClient.post<Volunteer>('/volunteers', data);
    return response.data;
  },

  // Update volunteer
  async update(id: string, data: VolunteerUpdateDTO): Promise<Volunteer> {
    const response = await apiClient.put<Volunteer>(`/volunteers/${id}`, data);
    return response.data;
  },

  // Delete volunteer (soft delete)
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/volunteers/${id}`);
  },

  // Get logs for volunteer (admin only)
  async getLogs(id: string, params?: { limit?: number; offset?: number }): Promise<LogListResponse> {
    const response = await apiClient.get<LogListResponse>(`/volunteers/${id}/logs`, { params });
    return response.data;
  },
};

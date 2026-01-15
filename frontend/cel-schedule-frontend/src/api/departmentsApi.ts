import apiClient from './client';
import { Department, DepartmentCreateDTO, DepartmentUpdateDTO, AddMemberDTO, UpdateMemberDTO, StatusHistoryItem } from '../types';

export const departmentsApi = {
  // Get all departments
  async getAll(): Promise<Department[]> {
    const response = await apiClient.get<Department[]>('/departments');
    console.log("fetched all departments:", response.data);
    return response.data;
  },

  // Get department by ID
  async getById(id: string): Promise<Department> {
    const response = await apiClient.get<Department>(`/departments/${id}`);
    console.log("fetched department by id:", response.data);
    return response.data;
  },

  // Get department status history
  async getStatusHistory(id: string): Promise<StatusHistoryItem[]> {
    const response = await apiClient.get<StatusHistoryItem[]>(`/departments/${id}/status-history`);
    console.log("fetched status history for department:", response.data);
    return response.data;
  },

  // Create department
  async create(data: DepartmentCreateDTO): Promise<Department> {
    const response = await apiClient.post<Department>('/departments', data);
    console.log("created department:", response.data);
    return response.data;
  },

  // Update department
  async update(id: string, data: DepartmentUpdateDTO): Promise<Department> {
    const response = await apiClient.put<Department>(`/departments/${id}`, data);
    console.log("updated department:", response.data);
    return response.data;
  },

  // Delete department (soft delete)
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/departments/${id}`);
    console.log("deleted department with id:", id);
  },

  // Add member to department
  async addMember(id: string, data: AddMemberDTO): Promise<Department> {
    const response = await apiClient.post<Department>(`/departments/${id}/members`, data);
    console.log("added member to department:", response.data);
    return response.data;
  },

  // Update member type
  async updateMember(id: string, volunteerId: string, data: UpdateMemberDTO): Promise<Department> {
    const response = await apiClient.put<Department>(`/departments/${id}/members/${volunteerId}`, data);
    console.log("updated member in department:", response.data);
    return response.data;
  },
};

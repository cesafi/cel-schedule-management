import apiClient from './client';
import { LoginDTO, LoginResponse, AuthUser, AuthUserCreateDTO } from '../types';

export const authApi = {
  // Login
  async login(credentials: LoginDTO): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    console.log("Called real login API with credentials:", credentials);
    console.log("Received response:", response.data);
    return response.data;
  },

  // Get current user info
  async getCurrentUser(): Promise<AuthUser> {
    const response = await apiClient.get<AuthUser>('/auth/me');
    console.log("Called getCurrentUser API");
    console.log("Received response:", response.data);
    return response.data;
  },

  // Create new user (admin only)
  async createUser(data: AuthUserCreateDTO): Promise<AuthUser> {
    const response = await apiClient.post<AuthUser>('/auth-users', data);
    return response.data;
  },

  // Mock login for development (remove when backend is ready)
  async mockLogin(credentials: LoginDTO): Promise<LoginResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock successful login
    return {
      token: 'mock-jwt-token-' + Date.now(),
      user: {
        id: 'mock-user-1',
        username: credentials.username,
        volunteerId: 'volunteer-1',
        accessLevel: 1, // Admin for testing
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDisabled: false,
      },
    };
  },
};

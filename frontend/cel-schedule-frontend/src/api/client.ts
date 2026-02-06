import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { storage } from '../utils/storage';
import { message, notification } from 'antd';
import React from 'react';

// Create axios instance with base configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track warmup retry state to prevent duplicate notifications
let isWarmingUp = false;
const warmupNotificationKey = 'backend-warmup';

// Helper function to check if error is a cold-start error
const isColdStartError = (error: AxiosError): boolean => {
  // Network errors (backend not reachable)
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
    return true;
  }
  
  // Render returns these when service is hibernating/starting
  if (error.response?.status === 502 || error.response?.status === 503) {
    return true;
  }
  
  return false;
};

// Helper function to retry a request with exponential backoff
const retryRequest = async (
  error: AxiosError,
  retryCount: number = 0,
  maxRetries: number = 3
): Promise<unknown> => {
  if (retryCount >= maxRetries) {
    // Max retries reached - show error with manual retry option
    notification.error({
      key: warmupNotificationKey,
      message: 'Service Unavailable',
      description: 'The backend service could not be reached. Please try again later.',
      duration: 0,
      btn: React.createElement(
        'button',
        {
          onClick: () => {
            notification.destroy(warmupNotificationKey);
            window.location.reload();
          },
          style: {
            padding: '4px 12px',
            background: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          },
        },
        'Reload Page'
      ),
    });
    isWarmingUp = false;
    return Promise.reject(error);
  }

  // Calculate delay with exponential backoff: 2s, 5s, 10s
  const delays = [2000, 5000, 10000];
  const delay = delays[retryCount] || 10000;

  // Show notification on first retry
  if (retryCount === 0) {
    isWarmingUp = true;
    notification.info({
      key: warmupNotificationKey,
      message: 'Backend Starting',
      description: 'The server is waking up, please wait...',
      duration: 0,
      icon: React.createElement('span', { style: { fontSize: '20px' } }, '⏳'),
    });
  } else {
    // Update notification with retry count
    notification.info({
      key: warmupNotificationKey,
      message: 'Backend Starting',
      description: `Retrying... (Attempt ${retryCount + 1} of ${maxRetries})`,
      duration: 0,
      icon: React.createElement('span', { style: { fontSize: '20px' } }, '⏳'),
    });
  }

  // Wait for the calculated delay
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Retry the original request
  return apiClient(error.config!)
    .then((response) => {
      // Success - close notification and reset state
      notification.destroy(warmupNotificationKey);
      isWarmingUp = false;
      return response;
    })
    .catch((retryError) => {
      // Check if it's still a cold-start error
      if (isColdStartError(retryError)) {
        // Retry again
        return retryRequest(retryError, retryCount + 1, maxRetries);
      } else {
        // Different error - close warmup notification and reject
        notification.destroy(warmupNotificationKey);
        isWarmingUp = false;
        return Promise.reject(retryError);
      }
    });
};

// Request interceptor - attach token to all requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 and 403 errors, and cold-start retries
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Check if this is a cold-start error and we're not already warming up
    if (isColdStartError(error) && !isWarmingUp) {
      // Attempt retry with backoff
      return retryRequest(error);
    }

    // Handle other errors as before
    if (error.response?.status === 401) {
      // Token expired or invalid - clear storage and redirect to login
      storage.clear();
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Forbidden - user doesn't have permission
      message.error('You do not have permission to perform this action');
    }
    return Promise.reject(error);
  }
);

export default apiClient;

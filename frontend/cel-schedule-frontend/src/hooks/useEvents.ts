import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../api';
import { EventSchedule, EventCreateDTO, EventUpdateDTO } from '../types';
import { message } from 'antd';

// Query keys
export const eventKeys = {
  all: ['events'] as const,
  detail: (id: string) => ['events', id] as const,
};

// Hook to fetch all events
export const useEvents = () => {
  return useQuery({
    queryKey: eventKeys.all,
    queryFn: () => eventsApi.getAll(),
  });
};

// Hook to fetch single event by ID
export const useEvent = (id: string | undefined) => {
  return useQuery({
    queryKey: eventKeys.detail(id || ''),
    queryFn: () => eventsApi.getById(id!),
    enabled: !!id, // Only run query if id is provided
  });
};

// Hook to create event
export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EventCreateDTO) => eventsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      message.success('Event created successfully');
    },
    onError: (error) => {
      console.error('Failed to create event:', error);
      message.error('Failed to create event');
    },
  });
};

// Hook to update event
export const useUpdateEvent = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: EventUpdateDTO) => eventsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) });
      message.success('Event updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update event:', error);
      message.error('Failed to update event');
    },
  });
};

// Hook to delete event
export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => eventsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      message.success('Event deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete event:', error);
      message.error('Failed to delete event');
    },
  });
};

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { volunteersApi } from '../api';
import { Volunteer } from '../types';

// Query keys
export const volunteerKeys = {
  all: ['volunteers'] as const,
};

// Hook to fetch all volunteers
export const useVolunteers = (includeDisabled = false) => {
  const query = useQuery({
    queryKey: volunteerKeys.all,
    queryFn: () => volunteersApi.getAll(),
  });

  // Filter disabled volunteers if needed
  const filteredData = useMemo(() => {
    if (includeDisabled || !query.data) return query.data;
    return query.data.filter(v => !v.isDisabled);
  }, [query.data, includeDisabled]);

  return {
    ...query,
    data: filteredData,
  };
};

// Hook to get volunteer Map for O(1) lookups
export const useVolunteerMap = (includeDisabled = false) => {
  const { data: volunteers, ...rest } = useVolunteers(includeDisabled);

  const volunteerMap = useMemo(() => {
    if (!volunteers) return new Map<string, Volunteer>();
    return new Map(volunteers.map((vol: Volunteer) => [vol.id, vol]));
  }, [volunteers]);

  return {
    volunteerMap,
    volunteers,
    ...rest,
  };
};

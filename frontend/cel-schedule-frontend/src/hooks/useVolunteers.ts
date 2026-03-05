import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { volunteersApi } from '../api';
import { Volunteer } from '../types';

// Query keys
export const volunteerKeys = {
  all: ['volunteers'] as const,
};

// Hook to fetch all volunteers
// Pass includeDisabled=true (admin only) to also retrieve soft-deleted volunteers
// Pass enabled=false to skip the query (e.g. when the user is not authenticated)
export const useVolunteers = (includeDisabled = false, enabled = true) => {
  const query = useQuery({
    queryKey: [...volunteerKeys.all, { includeDisabled }],
    queryFn: () =>
      includeDisabled
        ? volunteersApi.getAllIncludingDisabled()
        : volunteersApi.getAll(),
    enabled,
  });

  return query;
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

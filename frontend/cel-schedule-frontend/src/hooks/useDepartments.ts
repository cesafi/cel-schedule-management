import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { departmentsApi } from '../api';
import { Department } from '../types';

// Query keys
export const departmentKeys = {
  all: ['departments'] as const,
};

// Hook to fetch all departments
export const useDepartments = (includeDisabled = false) => {
  const query = useQuery({
    queryKey: departmentKeys.all,
    queryFn: () => departmentsApi.getAll(),
  });

  // Filter disabled departments if needed
  const filteredData = useMemo(() => {
    if (includeDisabled || !query.data) return query.data;
    return query.data.filter(d => !d.isDisabled);
  }, [query.data, includeDisabled]);

  return {
    ...query,
    data: filteredData,
  };
};

// Hook to get department Map for O(1) lookups
export const useDepartmentMap = (includeDisabled = false) => {
  const { data: departments, ...rest } = useDepartments(includeDisabled);

  const departmentMap = useMemo(() => {
    if (!departments) return new Map<string, Department>();
    return new Map(departments.map((dept: Department) => [dept.id, dept]));
  }, [departments]);

  return {
    departmentMap,
    departments,
    ...rest,
  };
};

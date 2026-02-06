// Batch Import Types

export interface BatchImportPreviewResponse {
  departments: DepartmentPreview[];
  conflicts: VolunteerConflict[];
  validationErrors: ValidationError[];
  totalVolunteers: number;
  totalDepartments: number;
  sessionId: string;
}

export interface DepartmentPreview {
  departmentName: string;
  headName: string;
  members: string[];
  columnIndex: number;
  headId?: string;
  memberIds?: string[];
}

export interface VolunteerConflict {
  volunteerName: string;
  conflictType: ConflictType;
  occurrences: ConflictOccurrence[];
  existingVolunteer?: ExistingVolunteerInfo;
}

export type ConflictType = 'DUPLICATE_IN_IMPORT' | 'EXISTING_IN_DB';

export interface ConflictOccurrence {
  departmentName: string;
  columnIndex: number;
  rowIndex: number;
  isHead: boolean;
}

export interface ExistingVolunteerInfo {
  id: string;
  name: string;
  createdAt: string;
  currentDeptCount: number;
}

export interface ValidationError {
  errorType: ValidationErrorType;
  message: string;
  columnIndex: number;
  rowIndex?: number;
  departmentName?: string;
}

export type ValidationErrorType =
  | 'EMPTY_DEPARTMENT_NAME'
  | 'EMPTY_HEAD'
  | 'EMPTY_VOLUNTEER_NAME'
  | 'DUPLICATE_IN_COLUMN'
  | 'INVALID_FILE_FORMAT';

export interface BatchImportExecuteRequest {
  sessionId: string;
  resolutions: ConflictResolution[];
}

export interface ConflictResolution {
  volunteerName: string;
  decision: ResolutionDecision;
  volunteerId?: string;
}

export type ResolutionDecision = 'CREATE_ONE' | 'CREATE_MULTIPLE' | 'REUSE_EXISTING';

export interface BatchImportExecuteResponse {
  success: boolean;
  departmentsCreated: number;
  volunteersCreated: number;
  volunteersReused: number;
  errorMessage?: string;
  createdDepartmentIds?: string[];
  createdVolunteerIds?: string[];
}

// UI State Types

export interface BatchImportState {
  step: 'upload' | 'preview' | 'conflicts' | 'result';
  file: File | null;
  preview: BatchImportPreviewResponse | null;
  resolutions: Map<string, ConflictResolution>;
  result: BatchImportExecuteResponse | null;
  isLoading: boolean;
  error: string | null;
}

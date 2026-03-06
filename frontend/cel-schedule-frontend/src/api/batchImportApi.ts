/**
 * Client-side batch import using SheetJS.
 *
 * Expected Excel format:
 *   - Each column = one department
 *   - Row 1  = Department name
 *   - Row 2  = Department head name
 *   - Row 3+ = Department member names
 *
 * No backend is required — parsing and Firestore writes run entirely in the browser.
 */
import * as XLSX from 'xlsx';
import { firestoreService } from '../services/firestore';
import { clientWriteLog } from '../utils/clientLog';
import type {
  BatchImportPreviewResponse,
  BatchImportExecuteRequest,
  BatchImportExecuteResponse,
  DepartmentPreview,
  VolunteerConflict,
  ValidationError,
  ConflictResolution,
} from '../types/batchImport';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const generateSessionId = (): string =>
  `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/**
 * Read an .xlsx / .xls file using SheetJS and return a 2-D string array
 * (rows × columns).  Each element is the raw string value of the cell.
 */
const parseExcel = (file: File): Promise<string[][]> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
          raw: false,
        }) as string[][];
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

export const batchImportApi = {
  /**
   * Parse the Excel file and detect conflicts against existing Firestore volunteers.
   * Returns a preview identical in shape to what the backend previously returned,
   * so the existing UI hooks continue to work unchanged.
   */
  previewBatchImport: async (file: File): Promise<BatchImportPreviewResponse> => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      const err: ValidationError = {
        errorType: 'INVALID_FILE_FORMAT',
        message: 'Only .xlsx and .xls files are supported',
        columnIndex: 0,
      };
      return {
        departments: [],
        conflicts: [],
        validationErrors: [err],
        totalVolunteers: 0,
        totalDepartments: 0,
        sessionId: '',
      };
    }

    const rows = await parseExcel(file);
    const validationErrors: ValidationError[] = [];
    const departments: DepartmentPreview[] = [];

    if (rows.length === 0) {
      validationErrors.push({
        errorType: 'INVALID_FILE_FORMAT',
        message: 'The file appears to be empty',
        columnIndex: 0,
      });
      return {
        departments: [],
        conflicts: [],
        validationErrors,
        totalVolunteers: 0,
        totalDepartments: 0,
        sessionId: generateSessionId(),
      };
    }

    // Determine column count from the widest row
    const columnCount = Math.max(...rows.map((r) => r.length));

    for (let col = 0; col < columnCount; col++) {
      const deptName = (rows[0]?.[col] ?? '').trim();
      const headName = (rows[1]?.[col] ?? '').trim();

      if (!deptName) {
        if (col < columnCount - 1) {
          validationErrors.push({
            errorType: 'EMPTY_DEPARTMENT_NAME',
            message: `Column ${col + 1} is missing a department name`,
            columnIndex: col,
          });
        }
        continue;
      }

      if (!headName) {
        validationErrors.push({
          errorType: 'EMPTY_HEAD',
          message: `Department "${deptName}" is missing a head (row 2)`,
          columnIndex: col,
        });
        continue;
      }

      const members: string[] = [];
      for (let row = 2; row < rows.length; row++) {
        const memberName = (rows[row]?.[col] ?? '').trim();
        if (memberName) members.push(memberName);
      }

      // Detect duplicate names within the same column
      const seen = new Set<string>();
      for (let i = 0; i < members.length; i++) {
        if (seen.has(members[i].toLowerCase())) {
          validationErrors.push({
            errorType: 'DUPLICATE_IN_COLUMN',
            message: `Duplicate name "${members[i]}" in department "${deptName}"`,
            columnIndex: col,
            rowIndex: i + 2,
            departmentName: deptName,
          });
        }
        seen.add(members[i].toLowerCase());
      }

      departments.push({
        departmentName: deptName,
        headName,
        members,
        columnIndex: col,
      });
    }

    if (validationErrors.length > 0) {
      return {
        departments,
        conflicts: [],
        validationErrors,
        totalVolunteers: 0,
        totalDepartments: departments.length,
        sessionId: generateSessionId(),
      };
    }

    // Compare all names against existing Firestore volunteers
    const existingVolunteers = await firestoreService.volunteers.getAll();
    const existingByName = new Map(
      existingVolunteers.map((v) => [v.name.trim().toLowerCase(), v]),
    );

    const allNamesInImport: Array<{ name: string; deptName: string; rowIndex: number; isHead: boolean; colIndex: number }> = [];
    for (const dept of departments) {
      allNamesInImport.push({ name: dept.headName, deptName: dept.departmentName, rowIndex: 1, isHead: true, colIndex: dept.columnIndex });
      dept.members.forEach((m, i) =>
        allNamesInImport.push({ name: m, deptName: dept.departmentName, rowIndex: i + 2, isHead: false, colIndex: dept.columnIndex }),
      );
    }

    // Detect cross-column duplicates (same name in multiple departments)
    const nameInstances = new Map<string, typeof allNamesInImport>();
    for (const entry of allNamesInImport) {
      const key = entry.name.toLowerCase();
      if (!nameInstances.has(key)) nameInstances.set(key, []);
      nameInstances.get(key)!.push(entry);
    }

    const conflicts: VolunteerConflict[] = [];
    const handledNames = new Set<string>();

    for (const [key, instances] of nameInstances) {
      if (handledNames.has(key)) continue;
      const existing = existingByName.get(key);
      const isDuplicate = instances.length > 1;
      const existsInDb = !!existing;

      if (isDuplicate || existsInDb) {
        handledNames.add(key);
        conflicts.push({
          volunteerName: instances[0].name,
          conflictType: isDuplicate ? 'DUPLICATE_IN_IMPORT' : 'EXISTING_IN_DB',
          occurrences: instances.map((inst) => ({
            departmentName: inst.deptName,
            columnIndex: inst.colIndex,
            rowIndex: inst.rowIndex,
            isHead: inst.isHead,
          })),
          existingVolunteer: existing
            ? {
                id: existing.id,
                name: existing.name,
                createdAt: existing.createdAt,
                currentDeptCount: 0,
              }
            : undefined,
        });
      }
    }

    const totalVolunteers = new Set(allNamesInImport.map((n) => n.name.toLowerCase())).size;

    return {
      departments,
      conflicts,
      validationErrors: [],
      totalVolunteers,
      totalDepartments: departments.length,
      sessionId: generateSessionId(),
    };
  },

  // ---------------------------------------------------------------------------
  // Execute
  // ---------------------------------------------------------------------------

  /**
   * Execute the import using conflict resolutions.
   * Since this is now fully client-side, the sessionId is ignored.
   * The `preview` is passed in via the hook state (see useBatchImport).
   */
  executeBatchImport: async (
    request: BatchImportExecuteRequest & {
      _departments: DepartmentPreview[];
    },
  ): Promise<BatchImportExecuteResponse> => {
    const resolutionMap = new Map<string, ConflictResolution>(
      request.resolutions.map((r) => [r.volunteerName.toLowerCase(), r]),
    );

    let volunteersCreated = 0;
    let volunteersReused = 0;
    const createdVolunteerIds: string[] = [];
    const createdDepartmentIds: string[] = [];

    const totalDepartments = request._departments.length;
    const totalVolunteersToImport = request._departments.reduce(
      (sum, d) => sum + 1 + d.members.length,
      0,
    );

    await clientWriteLog({
      type: 'BATCH_IMPORT_STARTED',
      category: 'batch_operations',
      severity: 'INFO',
      metadata: { totalDepartments, totalVolunteers: totalVolunteersToImport },
    });

    try {
      for (const dept of request._departments) {
        // Resolve head
        const headNameKey = dept.headName.toLowerCase();
        const headResolution = resolutionMap.get(headNameKey);

        let headId: string;
        if (headResolution?.decision === 'REUSE_EXISTING' && headResolution.volunteerId) {
          headId = headResolution.volunteerId;
          volunteersReused++;
        } else {
          const newVol = await firestoreService.volunteers.create({ name: dept.headName });
          headId = newVol.id;
          volunteersCreated++;
          createdVolunteerIds.push(headId);
        }

        // Create department with the head
        const newDept = await firestoreService.departments.create({
          departmentName: dept.departmentName,
          initialHeadId: headId,
        });
        createdDepartmentIds.push(newDept.id);

        // Resolve and add each member
        for (const memberName of dept.members) {
          const memberKey = memberName.toLowerCase();
          const resolution = resolutionMap.get(memberKey);

          let memberId: string;
          if (resolution?.decision === 'REUSE_EXISTING' && resolution.volunteerId) {
            memberId = resolution.volunteerId;
            volunteersReused++;
          } else {
            const newVol = await firestoreService.volunteers.create({ name: memberName });
            memberId = newVol.id;
            volunteersCreated++;
            createdVolunteerIds.push(memberId);
          }

          await firestoreService.departments.addMember(newDept.id, {
            volunteerId: memberId,
            membershipType: 'MEMBER',
          });
        }
      }

      await clientWriteLog({
        type: 'BATCH_IMPORT_COMPLETED',
        category: 'batch_operations',
        severity: 'INFO',
        metadata: {
          departmentsCreated: createdDepartmentIds.length,
          volunteersCreated,
          volunteersReused,
        },
      });

      return {
        success: true,
        departmentsCreated: createdDepartmentIds.length,
        volunteersCreated,
        volunteersReused,
        createdDepartmentIds,
        createdVolunteerIds,
      };
    } catch (err) {
      const e = err as { message?: string };
      await clientWriteLog({
        type: 'BATCH_IMPORT_FAILED',
        category: 'batch_operations',
        severity: 'ERROR',
        metadata: { error: e.message ?? 'Batch import failed' },
      });
      return {
        success: false,
        departmentsCreated: 0,
        volunteersCreated: 0,
        volunteersReused: 0,
        errorMessage: e.message ?? 'Batch import failed',
      };
    }
  },
};


import { useState, useCallback } from 'react';
import { message } from 'antd';
import { batchImportApi } from '../api';
import {
  BatchImportState,
  ConflictResolution,
} from '../types/batchImport';

export const useBatchImport = () => {
  const [state, setState] = useState<BatchImportState>({
    step: 'upload',
    file: null,
    preview: null,
    resolutions: new Map(),
    result: null,
    isLoading: false,
    error: null,
  });

  // Upload file and get preview (parsed client-side with SheetJS)
  const uploadFile = useCallback(async (file: File) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null, file }));

    try {
      const preview = await batchImportApi.previewBatchImport(file);

      if (preview.validationErrors && preview.validationErrors.length > 0) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Please fix validation errors in the Excel file',
          preview,
          step: 'preview',
        }));
        message.error('Validation errors found in Excel file');
        return false;
      }

      const hasConflicts = preview.conflicts && preview.conflicts.length > 0;

      setState((prev) => ({
        ...prev,
        isLoading: false,
        preview,
        step: hasConflicts ? 'conflicts' : 'preview',
      }));

      if (hasConflicts) {
        message.info('Please resolve conflicts before importing');
      } else {
        message.success('File validated successfully!');
      }

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
      message.error(errorMessage);
      return false;
    }
  }, []);

  const setResolution = useCallback(
    (volunteerName: string, resolution: ConflictResolution) => {
      setState((prev) => {
        const newResolutions = new Map(prev.resolutions);
        newResolutions.set(volunteerName, resolution);
        return { ...prev, resolutions: newResolutions };
      });
    },
    [],
  );

  const areAllConflictsResolved = useCallback(() => {
    if (!state.preview?.conflicts) return true;
    return state.preview.conflicts.every((conflict) =>
      state.resolutions.has(conflict.volunteerName),
    );
  }, [state.preview, state.resolutions]);

  const goToPreview = useCallback(() => {
    if (!areAllConflictsResolved()) {
      message.warning('Please resolve all conflicts first');
      return false;
    }
    setState((prev) => ({ ...prev, step: 'preview' }));
    return true;
  }, [areAllConflictsResolved]);

  const executeImport = useCallback(async () => {
    if (!state.preview) {
      message.error('No preview data found');
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const resolutions = Array.from(state.resolutions.values());
      // Pass the parsed departments directly â€” no server-side session needed
      const result = await batchImportApi.executeBatchImport({
        sessionId: state.preview.sessionId,
        resolutions,
        _departments: state.preview.departments,
      });

      if (result.success) {
        setState((prev) => ({ ...prev, isLoading: false, result, step: 'result' }));
        message.success('Import completed successfully!');
        return true;
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: result.errorMessage ?? 'Import failed',
        }));
        message.error(result.errorMessage ?? 'Import failed');
        return false;
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to execute import';
      setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
      message.error(errorMessage);
      return false;
    }
  }, [state.preview, state.resolutions]);

  const reset = useCallback(() => {
    setState({
      step: 'upload',
      file: null,
      preview: null,
      resolutions: new Map(),
      result: null,
      isLoading: false,
      error: null,
    });
  }, []);

  const goBack = useCallback(() => {
    setState((prev) => {
      switch (prev.step) {
        case 'conflicts':
          return { ...prev, step: 'upload' };
        case 'preview':
          return {
            ...prev,
            step: prev.preview?.conflicts?.length ? 'conflicts' : 'upload',
          };
        case 'result':
          return { ...prev, step: 'preview' };
        default:
          return prev;
      }
    });
  }, []);

  return {
    state,
    uploadFile,
    setResolution,
    areAllConflictsResolved,
    goToPreview,
    executeImport,
    reset,
    goBack,
  };
};

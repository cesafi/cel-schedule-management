import apiClient from './client';
import {
  BatchImportPreviewResponse,
  BatchImportExecuteRequest,
  BatchImportExecuteResponse,
} from '../types/batchImport';

export const batchImportApi = {
  /**
   * Upload Excel file and get preview with conflicts
   */
  previewBatchImport: async (file: File): Promise<BatchImportPreviewResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<BatchImportPreviewResponse>(
      '/batch-import/preview',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // Increase timeout for large files
      }
    );

    return response.data;
  },

  /**
   * Execute batch import with conflict resolutions
   */
  executeBatchImport: async (
    request: BatchImportExecuteRequest
  ): Promise<BatchImportExecuteResponse> => {
    const response = await apiClient.post<BatchImportExecuteResponse>(
      '/batch-import/execute',
      request,
      {
        timeout: 120000, // Increase timeout for batch operations
      }
    );

    return response.data;
  },
};

import { useState } from 'react';
import { Modal, Steps, Button, Space, Spin } from 'antd';
import {
  UploadOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  CheckOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useBatchImport } from '../../../hooks';
import { FileUploadStep } from './FileUploadStep';
import { ConflictResolutionStep } from './ConflictResolutionStep';
import { PreviewStep } from './PreviewStep';
import { ImportResultStep } from './ImportResultStep';

interface BatchImportWizardProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BatchImportWizard: React.FC<BatchImportWizardProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const {
    state,
    uploadFile,
    setResolution,
    areAllConflictsResolved,
    goToPreview,
    executeImport,
    reset,
    goBack,
  } = useBatchImport();

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSuccess = () => {
    onSuccess();
    // Don't reset immediately - let user see the result
  };

  const handleExecuteImport = async () => {
    const success = await executeImport();
    if (success) {
      handleSuccess();
    }
  };

  // Determine current step index for the Steps component
  const getStepIndex = () => {
    switch (state.step) {
      case 'upload':
        return 0;
      case 'conflicts':
        return 1;
      case 'preview':
        return 2;
      case 'result':
        return 3;
      default:
        return 0;
    }
  };

  // Determine which buttons to show
  const getFooterButtons = () => {
    const hasValidationErrors =
      state.preview?.validationErrors &&
      state.preview.validationErrors.length > 0;

    switch (state.step) {
      case 'upload':
        return [
          <Button key="cancel" onClick={handleClose}>
            Cancel
          </Button>,
        ];

      case 'conflicts':
        return [
          <Button key="back" icon={<ArrowLeftOutlined />} onClick={goBack}>
            Back
          </Button>,
          <Button
            key="next"
            type="primary"
            onClick={goToPreview}
            disabled={!areAllConflictsResolved()}
          >
            Continue to Preview
          </Button>,
        ];

      case 'preview':
        if (hasValidationErrors) {
          return [
            <Button key="back" icon={<ArrowLeftOutlined />} onClick={handleClose}>
              Close
            </Button>,
          ];
        }
        return [
          <Button
            key="back"
            icon={<ArrowLeftOutlined />}
            onClick={goBack}
            disabled={state.isLoading}
          >
            Back
          </Button>,
          <Button
            key="execute"
            type="primary"
            onClick={handleExecuteImport}
            loading={state.isLoading}
            icon={<CheckOutlined />}
          >
            Execute Import
          </Button>,
        ];

      case 'result':
        return [
          <Button key="close" onClick={handleClose}>
            Close
          </Button>,
        ];

      default:
        return [];
    }
  };

  return (
    <Modal
      title="Batch Import Departments & Volunteers"
      open={visible}
      onCancel={handleClose}
      footer={getFooterButtons()}
      width={1200}
      styles={{ body: { minHeight: 400 } }}
      destroyOnClose
    >
      <Spin spinning={state.isLoading} tip="Processing...">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Steps indicator */}
          <Steps
            current={getStepIndex()}
            items={[
              {
                title: 'Upload',
                icon: <UploadOutlined />,
              },
              {
                title: 'Resolve Conflicts',
                icon: <ExclamationCircleOutlined />,
                disabled: state.step === 'upload',
              },
              {
                title: 'Preview',
                icon: <EyeOutlined />,
                disabled: state.step === 'upload' || state.step === 'conflicts',
              },
              {
                title: 'Complete',
                icon: <CheckOutlined />,
                disabled: state.step !== 'result',
              },
            ]}
          />

          {/* Step content */}
          <div style={{ minHeight: 300 }}>
            {state.step === 'upload' && (
              <FileUploadStep
                onFileSelect={uploadFile}
                isLoading={state.isLoading}
              />
            )}

            {state.step === 'conflicts' && state.preview?.conflicts && (
              <ConflictResolutionStep
                conflicts={state.preview.conflicts}
                resolutions={state.resolutions}
                onResolutionChange={setResolution}
              />
            )}

            {state.step === 'preview' && state.preview && (
              <PreviewStep preview={state.preview} />
            )}

            {state.step === 'result' && state.result && (
              <ImportResultStep
                result={state.result}
                onReset={reset}
                onGoToDepartments={handleClose}
              />
            )}
          </div>
        </Space>
      </Spin>
    </Modal>
  );
};

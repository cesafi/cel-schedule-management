import { Result, Button, Card, Descriptions, Space } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  UserAddOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { BatchImportExecuteResponse } from '../../../types/batchImport';

interface ImportResultStepProps {
  result: BatchImportExecuteResponse;
  onReset: () => void;
  onGoToDepartments: () => void;
}

export const ImportResultStep: React.FC<ImportResultStepProps> = ({
  result,
  onReset,
  onGoToDepartments,
}) => {
  const isSuccess = result.success;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Result
        status={isSuccess ? 'success' : 'error'}
        icon={
          isSuccess ? (
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
          ) : (
            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
          )
        }
        title={isSuccess ? 'Import Completed Successfully!' : 'Import Failed'}
        subTitle={
          isSuccess
            ? 'All departments and volunteers have been created successfully.'
            : result.errorMessage || 'An error occurred during the import process.'
        }
        extra={
          <Space>
            <Button type="primary" onClick={isSuccess ? onGoToDepartments : onReset}>
              {isSuccess ? 'View Departments' : 'Try Again'}
            </Button>
            {isSuccess && (
              <Button onClick={onReset}>Import Another File</Button>
            )}
          </Space>
        }
      >
        {isSuccess && (
          <Card style={{ textAlign: 'left', marginTop: 24 }}>
            <Descriptions bordered column={1}>
              <Descriptions.Item
                label={
                  <Space>
                    <TeamOutlined style={{ color: '#1890ff' }} />
                    <span>Departments Created</span>
                  </Space>
                }
              >
                <span style={{ fontSize: 18, fontWeight: 'bold', color: '#1890ff' }}>
                  {result.departmentsCreated}
                </span>
              </Descriptions.Item>

              <Descriptions.Item
                label={
                  <Space>
                    <UserAddOutlined style={{ color: '#52c41a' }} />
                    <span>New Volunteers Created</span>
                  </Space>
                }
              >
                <span style={{ fontSize: 18, fontWeight: 'bold', color: '#52c41a' }}>
                  {result.volunteersCreated}
                </span>
              </Descriptions.Item>

              <Descriptions.Item
                label={
                  <Space>
                    <UserOutlined style={{ color: '#faad14' }} />
                    <span>Existing Volunteers Reused</span>
                  </Space>
                }
              >
                <span style={{ fontSize: 18, fontWeight: 'bold', color: '#faad14' }}>
                  {result.volunteersReused}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}
      </Result>
    </div>
  );
};

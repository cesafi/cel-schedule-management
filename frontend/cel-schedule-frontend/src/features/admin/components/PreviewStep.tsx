import { Card, Typography, Tag, Space, Alert, Descriptions, Collapse, Empty } from 'antd';
import {
  BatchImportPreviewResponse,
} from '../../../types/batchImport';
import {
  TeamOutlined,
  UserOutlined,
  CrownOutlined,
  WarningOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface PreviewStepProps {
  preview: BatchImportPreviewResponse;
}

export const PreviewStep: React.FC<PreviewStepProps> = ({ preview }) => {
  const hasValidationErrors =
    preview.validationErrors && preview.validationErrors.length > 0;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={3}>
            {hasValidationErrors ? 'Validation Errors' : 'Import Preview'}
          </Title>
          {hasValidationErrors ? (
            <Paragraph type="danger">
              Please fix the following errors in your Excel file and upload again.
            </Paragraph>
          ) : (
            <Paragraph>
              Review the departments and volunteers that will be created. Click
              "Execute Import" to proceed.
            </Paragraph>
          )}
        </div>

        {/* Summary Statistics */}
        {!hasValidationErrors && (
          <Card>
            <Descriptions bordered column={3}>
              <Descriptions.Item
                label={
                  <Space>
                    <TeamOutlined />
                    <Text>Departments</Text>
                  </Space>
                }
              >
                <Text strong style={{ fontSize: 18, color: '#1890ff' }}>
                  {preview.totalDepartments}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <Space>
                    <UserOutlined />
                    <Text>Volunteers</Text>
                  </Space>
                }
              >
                <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                  {preview.totalVolunteers}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <Space>
                    <WarningOutlined />
                    <Text>Conflicts Resolved</Text>
                  </Space>
                }
              >
                <Text strong style={{ fontSize: 18, color: '#faad14' }}>
                  {preview.conflicts?.length || 0}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* Validation Errors */}
        {hasValidationErrors && (
          <Alert
            message="Validation Errors Found"
            description={
              <Space direction="vertical" style={{ width: '100%', marginTop: 12 }}>
                {preview.validationErrors.map((error, idx) => (
                  <Card key={idx} size="small" style={{ background: '#fff7e6' }}>
                    <Space direction="vertical" size="small">
                      <Text strong style={{ color: '#d4380d' }}>
                        {error.errorType.replace(/_/g, ' ')}
                      </Text>
                      <Text>{error.message}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Column {error.columnIndex + 1}
                        {error.rowIndex !== undefined && `, Row ${error.rowIndex + 1}`}
                        {error.departmentName && ` (${error.departmentName})`}
                      </Text>
                    </Space>
                  </Card>
                ))}
              </Space>
            }
            type="error"
            showIcon
          />
        )}

        {/* Departments Preview */}
        {!hasValidationErrors && preview.departments.length > 0 && (
          <Card title={<Text strong>Departments to be Created</Text>}>
            <Collapse accordion>
              {preview.departments.map((dept, idx) => (
                <Panel
                  key={idx}
                  header={
                    <Space>
                      <TeamOutlined style={{ color: '#1890ff' }} />
                      <Text strong>{dept.departmentName}</Text>
                      <Tag color="green">
                        {dept.members.length + 1} member
                        {dept.members.length + 1 !== 1 ? 's' : ''}
                      </Tag>
                    </Space>
                  }
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {/* Department Head */}
                    <div>
                      <Text type="secondary">Department Head:</Text>
                      <div style={{ marginTop: 8 }}>
                        <Tag
                          icon={<CrownOutlined />}
                          color="gold"
                          style={{ fontSize: 14, padding: '4px 12px' }}
                        >
                          {dept.headName}
                        </Tag>
                      </div>
                    </div>

                    {/* Regular Members */}
                    {dept.members.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <Text type="secondary">Members:</Text>
                        <div
                          style={{
                            marginTop: 8,
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 8,
                          }}
                        >
                          {dept.members.map((member, memberIdx) => (
                            <Tag
                              key={memberIdx}
                              icon={<UserOutlined />}
                              style={{ fontSize: 13, padding: '2px 10px' }}
                            >
                              {member}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    )}
                  </Space>
                </Panel>
              ))}
            </Collapse>
          </Card>
        )}

        {/* Empty State */}
        {!hasValidationErrors && preview.departments.length === 0 && (
          <Card>
            <Empty
              description="No departments found in the Excel file"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        )}
      </Space>
    </div>
  );
};

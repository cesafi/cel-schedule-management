import { Upload, Typography, Alert, Space } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Title, Paragraph, Text } = Typography;
const { Dragger } = Upload;

interface FileUploadStepProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export const FileUploadStep: React.FC<FileUploadStepProps> = ({
  onFileSelect,
  isLoading,
}) => {
  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls',
    beforeUpload: (file) => {
      onFileSelect(file);
      return false; // Prevent automatic upload
    },
    showUploadList: false,
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={3}>Upload Excel File</Title>
          <Paragraph>
            Upload an Excel file (.xlsx or .xls) where each column represents a
            department with volunteers.
          </Paragraph>
        </div>

        <Alert
          message="Excel File Format"
          description={
            <div>
              <Paragraph>
                <strong>Each column should contain:</strong>
              </Paragraph>
              <ul>
                <li>
                  <strong>Row 1:</strong> Department name
                </li>
                <li>
                  <strong>Row 2:</strong> Department head
                </li>
                <li>
                  <strong>Row 3+:</strong> Regular members (one per row)
                </li>
              </ul>
              <Paragraph style={{ marginTop: 12 }}>
                <strong>Example:</strong>
              </Paragraph>
              <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
                {`| Media      | Worship    | Logistics  |
|------------|------------|------------|
| John       | Sarah      | Mike       |
| Alice      | David      | Emma       |
| Bob        | ...        | ...        |`}
              </pre>
            </div>
          }
          type="info"
          showIcon
        />

        <Dragger {...uploadProps} disabled={isLoading}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">
            Click or drag Excel file to this area to upload
          </p>
          <p className="ant-upload-hint">
            Support for .xlsx and .xls files. The file will be validated before
            import.
          </p>
        </Dragger>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            After uploading, you'll be able to review and resolve any conflicts
            before importing.
          </Text>
        </div>
      </Space>
    </div>
  );
};

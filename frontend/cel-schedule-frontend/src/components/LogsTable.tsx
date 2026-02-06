import React from 'react';
import { Table, Tag, Typography, Space, Descriptions } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { SystemLog } from '../types/log';
import { LogType } from '../types/enums';

const { Text } = Typography;

interface LogsTableProps {
  logs: SystemLog[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
}

const getSeverityColor = (severity: string): string => {
  switch (severity?.toUpperCase()) {
    case 'ERROR':
      return 'red';
    case 'WARNING':
      return 'orange';
    case 'INFO':
    default:
      return 'blue';
  }
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Authentication': 'purple',
    'User Management': 'cyan',
    'OAuth': 'geekblue',
    'Attendance': 'green',
    'Volunteer Management': 'blue',
    'Event Management': 'volcano',
    'Department Management': 'magenta',
    'Batch Operations': 'orange',
    'System': 'red',
  };
  return colors[category] || 'default';
};

const formatLogType = (type: LogType): string => {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleString();
};

const renderMetadata = (metadata: Record<string, any>): React.ReactNode => {
  if (!metadata || Object.keys(metadata).length === 0) {
    return <Text type="secondary">No additional information</Text>;
  }

  const importantKeys = [
    'message',
    'userId',
    'username',
    'volunteerId',
    'volunteerName',
    'eventId',
    'eventName',
    'departmentId',
    'departmentName',
    'reason',
    'changes',
    'errorMessage',
  ];

  const items = importantKeys
    .filter((key) => metadata[key] !== undefined)
    .map((key) => {
      let value = metadata[key];
      
      // Format changes object
      if (key === 'changes' && typeof value === 'object') {
        value = JSON.stringify(value, null, 2);
      }
      
      // Format key for display
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
      
      return {
        key,
        label,
        children: <Text>{String(value)}</Text>,
      };
    });

  return (
    <Descriptions size="small" column={1} items={items} />
  );
};

export const LogsTable: React.FC<LogsTableProps> = ({ logs, loading, pagination }) => {
  const columns: ColumnsType<SystemLog> = [
    {
      title: 'Time',
      dataIndex: 'TimeDetected',
      key: 'TimeDetected',
      width: 180,
      render: (timestamp: string) => (
        <Space direction="vertical" size={0}>
          <Text strong>{formatTimestamp(timestamp)}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {new Date(timestamp).toLocaleString()}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'Type',
      key: 'Type',
      width: 200,
      render: (type: LogType) => <Text>{formatLogType(type)}</Text>,
    },
    {
      title: 'Category',
      dataIndex: 'Category',
      key: 'Category',
      width: 150,
      render: (category: string) => (
        <Tag color={getCategoryColor(category)}>{category}</Tag>
      ),
    },
    {
      title: 'Severity',
      dataIndex: 'Severity',
      key: 'Severity',
      width: 100,
      render: (severity: string) => (
        <Tag color={getSeverityColor(severity)}>{severity || 'INFO'}</Tag>
      ),
    },
    {
      title: 'Details',
      dataIndex: 'Metadata',
      key: 'Metadata',
      render: (metadata: Record<string, any>) => {
        const message = metadata?.message;
        return message ? <Text>{message}</Text> : <Text type="secondary">—</Text>;
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={logs}
      loading={loading}
      rowKey="ID"
      pagination={pagination ? {
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        onChange: pagination.onChange,
        showSizeChanger: false,
        showTotal: (total) => `Total ${total} logs`,
      } : false}
      expandable={{
        expandedRowRender: (record) => renderMetadata(record.Metadata),
        rowExpandable: (record) => Object.keys(record.Metadata || {}).length > 0,
      }}
      size="middle"
    />
  );
};

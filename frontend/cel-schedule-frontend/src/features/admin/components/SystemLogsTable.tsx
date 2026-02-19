import { Table, Tag, Typography, Card } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SystemLog } from '../../../types';
import dayjs from 'dayjs';
import { useState } from 'react';

const { Text } = Typography;

interface SystemLogsTableProps {
  logs: SystemLog[];
  total: number;
  loading: boolean;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
}

export const SystemLogsTable = ({
  logs,
  total,
  loading,
  currentPage,
  pageSize,
  onPageChange,
}: SystemLogsTableProps) => {
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  const getLogTypeColor = (logType: string): string => {
    if (logType.includes('LOGIN_FAILED')) return 'red';
    if (logType.includes('LOGIN') || logType.includes('OAUTH')) return 'blue';
    if (logType.includes('CREATED')) return 'green';
    if (logType.includes('UPDATED') || logType.includes('CHANGED')) return 'orange';
    if (logType.includes('DISABLED')) return 'volcano';
    if (logType.includes('ENABLED')) return 'cyan';
    return 'default';
  };

  const columns: ColumnsType<SystemLog> = [
    {
      title: 'Timestamp',
      dataIndex: 'TimeDetected',
      key: 'timestamp',
      width: 200,
      fixed: 'left',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a: SystemLog, b: SystemLog) =>
        dayjs(a.TimeDetected).unix() - dayjs(b.TimeDetected).unix(),
    },
    {
      title: 'Log Type',
      dataIndex: 'Type',
      key: 'type',
      width: 200,
      render: (type: string) => (
        <Tag color={getLogTypeColor(type)}>{type.replace(/_/g, ' ')}</Tag>
      ),
    },
    {
      title: 'User',
      key: 'user',
      width: 200,
      responsive: ['md'],
      render: (_: unknown, record: SystemLog) => {
        const username = record.Metadata?.username as string | undefined;
        const userId = record.Metadata?.userId as string | undefined;
        return (
          <div>
            {username && <Text strong>{username}</Text>}
            {userId && (
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {userId}
                </Text>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Details',
      key: 'details',
      responsive: ['lg'],
      render: (_: unknown, record: SystemLog) => {
        const metadata = record.Metadata || {};
        const keys = Object.keys(metadata).filter(
          (k) => k !== 'userId' && k !== 'username'
        );

        if (keys.length === 0) return <Text type="secondary">No additional details</Text>;

        return (
          <div style={{ maxWidth: 400 }}>
            {keys.slice(0, 2).map((key) => (
              <div key={key}>
                <Text type="secondary">{key}: </Text>
                <Text>{String(metadata[key])}</Text>
              </div>
            ))}
            {keys.length > 2 && (
              <Text type="secondary">... and {keys.length - 2} more</Text>
            )}
          </div>
        );
      },
    },
  ];

  const expandedRowRender = (record: SystemLog) => {
    const metadata = record.Metadata || {};
    return (
      <Card size="small" title="Full Metadata" style={{ maxWidth: 800 }}>
        <pre style={{ margin: 0, fontSize: '12px' }}>
          {JSON.stringify(metadata, null, 2)}
        </pre>
      </Card>
    );
  };

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .ant-table {
            font-size: 12px;
          }
          .ant-table-thead > tr > th {
            padding: 8px 4px;
          }
          .ant-table-tbody > tr > td {
            padding: 8px 4px;
          }
        }
      `}</style>
      <Table
        columns={columns}
        dataSource={logs}
        rowKey="ID"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: total,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} logs`,
          pageSizeOptions: ['10', '20', '50', '100'],
          onChange: onPageChange,
          responsive: true,
        }}
        expandable={{
          expandedRowRender,
          expandedRowKeys,
          onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as string[]),
        }}
        scroll={{ x: 'max-content' }}
      />
    </>
  );
};

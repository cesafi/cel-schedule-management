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

const getLogSummary = (type: LogType, metadata: Record<string, unknown>): string => {
  const m = metadata || {};
  const volunteer = m.volunteerName as string | undefined;
  const event     = m.eventName as string | undefined;
  const dept      = m.departmentName as string | undefined;
  const user      = (m.targetUsername ?? m.username) as string | undefined;
  const reason    = m.reason as string | undefined;
  const message   = m.message as string | undefined;
  const role      = m.newRole as string | undefined;
  const level     = m.newLevel as string | undefined;
  const imported  = m.importedCount as number | undefined;
  const failed    = m.failedCount as number | undefined;
  const attendance = m.attendanceType as string | undefined;
  const timeOut   = m.timeOutType as string | undefined;
  const err       = m.errorMessage as string | undefined;

  switch (type) {
    // Authentication
    case LogType.USER_LOGIN:
      return user ? `${user} logged in` : 'User logged in';
    case LogType.USER_LOGIN_FAILED:
      return user ? `Failed login attempt for ${user}` : 'Failed login attempt';
    case LogType.USER_LOGOUT:
      return user ? `${user} logged out` : 'User logged out';

    // User Management
    case LogType.USER_CREATED:
      return user ? `Account created for ${user}` : 'New user account created';
    case LogType.USER_UPDATED:
      return user ? `Account updated for ${user}` : 'User account updated';
    case LogType.USER_DISABLED:
      return user ? `Account disabled: ${user}` : 'User account disabled';
    case LogType.USER_ENABLED:
      return user ? `Account re-enabled: ${user}` : 'User account re-enabled';
    case LogType.ACCESS_LEVEL_CHANGED:
      return user && level ? `Access level of ${user} changed to ${level}` : 'User access level changed';
    case LogType.PASSWORD_CHANGED:
      return user ? `Password changed for ${user}` : 'Password changed';

    // OAuth
    case LogType.OAUTH_LINKED:
      return user ? `OAuth linked to ${user}` : 'OAuth account linked';
    case LogType.OAUTH_LOGIN:
      return user ? `${user} logged in via OAuth` : 'OAuth login';

    // Attendance & Scheduling
    case LogType.VOLUNTEER_TIMED_IN:
      if (volunteer && event) return `${volunteer} timed in to "${event}"${attendance ? ` — ${attendance}` : ''}`;
      if (volunteer) return `${volunteer} timed in${attendance ? ` — ${attendance}` : ''}`;
      return `Volunteer timed in${attendance ? ` — ${attendance}` : ''}`;
    case LogType.VOLUNTEER_TIMED_OUT:
      if (volunteer && event) return `${volunteer} timed out of "${event}"${timeOut ? ` — ${timeOut}` : ''}`;
      if (volunteer) return `${volunteer} timed out${timeOut ? ` — ${timeOut}` : ''}`;
      return `Volunteer timed out${timeOut ? ` — ${timeOut}` : ''}`;
    case LogType.ATTENDANCE_STATUS_UPDATED:
      if (volunteer && event) return `Attendance updated for ${volunteer} in "${event}"`;
      if (volunteer) return `Attendance updated for ${volunteer}`;
      return 'Attendance status updated';
    case LogType.VOLUNTEER_SCHEDULED:
      if (volunteer && event) return `${volunteer} scheduled for "${event}"`;
      if (volunteer) return `${volunteer} scheduled`;
      return 'Volunteer scheduled';
    case LogType.VOLUNTEER_UNSCHEDULED:
      if (volunteer && event) return `${volunteer} removed from "${event}"`;
      if (volunteer) return `${volunteer} unscheduled`;
      return 'Volunteer unscheduled';

    // Volunteer Management
    case LogType.VOLUNTEER_CREATED:
      return volunteer ? `Volunteer profile created: ${volunteer}` : 'New volunteer created';
    case LogType.VOLUNTEER_UPDATED:
      return volunteer ? `Volunteer profile updated: ${volunteer}` : 'Volunteer profile updated';
    case LogType.VOLUNTEER_DELETED:
      return volunteer ? `Volunteer deleted: ${volunteer}` : 'Volunteer deleted';
    case LogType.VOLUNTEER_DISABLED:
      return volunteer ? `Volunteer disabled: ${volunteer}` : 'Volunteer disabled';
    case LogType.VOLUNTEER_ENABLED:
      return volunteer ? `Volunteer re-enabled: ${volunteer}` : 'Volunteer re-enabled';

    // Event Management
    case LogType.EVENT_CREATED:
      return event ? `Event created: "${event}"` : 'New event created';
    case LogType.EVENT_UPDATED:
      return event ? `Event updated: "${event}"` : 'Event updated';
    case LogType.EVENT_DELETED:
      return event ? `Event deleted: "${event}"` : 'Event deleted';
    case LogType.EVENT_CANCELLED:
      return event ? `Event cancelled: "${event}"${reason ? ` — ${reason}` : ''}` : 'Event cancelled';
    case LogType.EVENT_DEPARTMENT_ADDED:
      if (event && dept) return `Dept "${dept}" added to "${event}"`;
      if (event) return `Department added to "${event}"`;
      return 'Department added to event';
    case LogType.EVENT_DEPARTMENT_REMOVED:
      if (event && dept) return `Dept "${dept}" removed from "${event}"`;
      if (event) return `Department removed from "${event}"`;
      return 'Department removed from event';

    // Department Management
    case LogType.DEPARTMENT_CREATED:
      return dept ? `Department created: ${dept}` : 'New department created';
    case LogType.DEPARTMENT_UPDATED:
      return dept ? `Department updated: ${dept}` : 'Department updated';
    case LogType.DEPARTMENT_DELETED:
      return dept ? `Department deleted: ${dept}` : 'Department deleted';
    case LogType.DEPARTMENT_MEMBER_ADDED:
      if (volunteer && dept) return `${volunteer} added to ${dept}`;
      if (dept) return `Member added to ${dept}`;
      return 'Member added to department';
    case LogType.DEPARTMENT_MEMBER_REMOVED:
      if (volunteer && dept) return `${volunteer} removed from ${dept}`;
      if (dept) return `Member removed from ${dept}`;
      return 'Member removed from department';
    case LogType.DEPARTMENT_ROLE_CHANGED:
      if (volunteer && dept) return `${volunteer}'s role in ${dept} changed${role ? ` to ${role}` : ''}`;
      return 'Department role changed';

    // Batch Operations
    case LogType.BATCH_IMPORT_STARTED:
      return 'Batch import started';
    case LogType.BATCH_IMPORT_COMPLETED:
      if (imported !== undefined && failed !== undefined) return `Batch import done — ${imported} imported, ${failed} failed`;
      if (imported !== undefined) return `Batch import done — ${imported} records imported`;
      return 'Batch import completed';
    case LogType.BATCH_IMPORT_FAILED:
      return err ? `Batch import failed: ${err}` : 'Batch import failed';
    case LogType.BATCH_CONFLICT_RESOLVED:
      return 'Batch import conflict resolved';

    // System
    case LogType.SENSITIVE_DATA_ACCESSED:
      return user ? `Sensitive data accessed by ${user}` : 'Sensitive data accessed';
    case LogType.SYSTEM_ERROR:
      return err ?? message ?? 'System error occurred';
    case LogType.CONFIGURATION_CHANGED:
      return message ?? 'System configuration changed';
    case LogType.CLEAN_LOG:
      return 'System log cleanup performed';

    default:
      return message ?? '—';
  }
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

const renderMetadata = (metadata: Record<string, unknown>): React.ReactNode => {
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
      dataIndex: 'timeDetected',
      key: 'timeDetected',
      width: 180,
      fixed: 'left',
      render: (timestamp: string | { toDate: () => Date }) => {
        const iso = typeof timestamp === 'string'
          ? timestamp
          : timestamp?.toDate?.().toISOString() ?? '';
        return (
          <Space direction="vertical" size={0}>
            <Text strong>{formatTimestamp(iso)}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {new Date(iso).toLocaleString()}
            </Text>
          </Space>
        );
      },
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 200,
      render: (type: LogType) => <Text>{formatLogType(type)}</Text>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      responsive: ['md'],
      render: (category: string) => (
        <Tag color={getCategoryColor(category)}>{category}</Tag>
      ),
    },
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      responsive: ['sm'],
      render: (severity: string) => (
        <Tag color={getSeverityColor(severity)}>{severity || 'INFO'}</Tag>
      ),
    },
    {
      title: 'Details',
      key: 'details',
      render: (_: unknown, record: SystemLog) => {
        const summary = getLogSummary(record.type, record.metadata);
        return summary !== '—'
          ? <Text>{summary}</Text>
          : <Text type="secondary">—</Text>;
      },
    },
  ];

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
        loading={loading}
        rowKey="id"
        scroll={{ x: 'max-content' }}
        pagination={pagination ? {
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: pagination.onChange,
          showSizeChanger: false,
          showTotal: (total) => `Total ${total} logs`,
          responsive: true,
        } : false}
        expandable={{
          expandedRowRender: (record) => renderMetadata(record.metadata),
          rowExpandable: (record) => Object.keys(record.metadata || {}).length > 0,
        }}
        size="middle"
      />
    </>
  );
};

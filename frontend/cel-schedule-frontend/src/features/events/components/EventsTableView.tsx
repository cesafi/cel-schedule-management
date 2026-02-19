import React, { useMemo, useCallback } from 'react';
import { Table, Button, Space, Popconfirm, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, EyeOutlined, EnvironmentOutlined, UserOutlined, TeamOutlined, WarningOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { EventSchedule, Department } from '../../../types';
import { format, isPast, isToday } from 'date-fns';
import { formatDistanceToNow } from 'date-fns';

interface EventsTableViewProps {
  events: EventSchedule[];
  departments: Department[];
  isAdmin: boolean;
  loading?: boolean;
  onEdit: (event: EventSchedule) => void;
  onDelete: (id: string) => void;
}

export const EventsTableView: React.FC<EventsTableViewProps> = React.memo(({
  events,
  departments,
  isAdmin,
  loading = false,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();

  // Create department map for O(1) lookups
  const departmentMap = useMemo(() => {
    return new Map(departments.map(d => [d.id, d]));
  }, [departments]);

  const handleView = useCallback((id: string) => {
    navigate(`/events/${id}`);
  }, [navigate]);

  const handleEdit = useCallback((event: EventSchedule) => {
    onEdit(event);
  }, [onEdit]);

  const handleDelete = useCallback((id: string) => {
    onDelete(id);
  }, [onDelete]);

  // Memoize columns
  const columns: ColumnsType<EventSchedule> = useMemo(() => [
    {
      title: 'Event Name',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 200,
      sorter: (a: EventSchedule, b: EventSchedule) => a.name.localeCompare(b.name),
      render: (name: string, record: EventSchedule) => {
        const today = isToday(new Date(record.timeAndDate));
        return (
          <Space direction="vertical" size="small">
            <span style={{ fontWeight: 500 }}>{name}</span>
            {today && <Tag color="green">Today</Tag>}
          </Space>
        );
      },
    },
    {
      title: 'Date & Time',
      dataIndex: 'timeAndDate',
      key: 'timeAndDate',
      width: 180,
      render: (date: string) => {
        const eventDate = new Date(date);
        const past = isPast(eventDate) && !isToday(eventDate);
        const today = isToday(eventDate);
        
        return (
          <Space direction="vertical" size="small">
            <span style={{ 
              fontWeight: today ? 'bold' : 'normal',
              color: past ? '#999' : undefined 
            }}>
              {format(eventDate, 'MMM dd, yyyy HH:mm')}
            </span>
            <span style={{ fontSize: '0.85em', color: '#666' }}>
              {formatDistanceToNow(eventDate, { addSuffix: true })}
            </span>
          </Space>
        );
      },
      sorter: (a: EventSchedule, b: EventSchedule) => 
        new Date(a.timeAndDate).getTime() - new Date(b.timeAndDate).getTime(),
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Departments',
      dataIndex: 'assignedGroups',
      key: 'assignedGroups',
      width: 150,
      responsive: ['md'],
      render: (groups: string[]) => {
        if (!groups || groups.length === 0) {
          return <span style={{ color: '#999' }}>None</span>;
        }
        
        const deptNames = groups
          .map(id => departmentMap.get(id)?.departmentName)
          .filter(Boolean);

        if (deptNames.length === 0) return <span style={{ color: '#999' }}>None</span>;

        return (
          <Tooltip title={deptNames.join(', ')}>
            <Space>
              <TeamOutlined />
              <Tag color="blue">{deptNames.length} Department{deptNames.length !== 1 ? 's' : ''}</Tag>
            </Space>
          </Tooltip>
        );
      },
    },
    {
      title: 'Volunteers',
      key: 'volunteers',
      width: 120,
      render: (_: unknown, record: EventSchedule) => {
        const scheduled = record.scheduledVolunteers?.length || 0;
        const voluntary = record.voluntaryVolunteers?.length || 0;
        const total = scheduled + voluntary;
        const checkedIn = record.statuses?.length || 0;
        const needsHelp = total < 3;

        return (
          <Space>
            <UserOutlined />
            <span style={{ color: needsHelp ? '#ff4d4f' : undefined }}>
              {checkedIn}/{total}
            </span>
            {needsHelp && (
              <Tooltip title="Needs more volunteers">
                <WarningOutlined style={{ color: '#ff9800' }} />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 200,
      responsive: ['lg'],
      render: (location: EventSchedule['location']) => {
        if (!location) return <span style={{ color: '#999' }}>-</span>;
        
        const shortAddress = location.address.length > 30 
          ? location.address.substring(0, 30) + '...'
          : location.address;

        return (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <Space>
              <EnvironmentOutlined />
              {shortAddress}
            </Space>
          </a>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'isDisabled',
      key: 'isDisabled',
      width: 120,
      responsive: ['sm'],
      render: (isDisabled: boolean, record: EventSchedule) => {
        const total = (record.scheduledVolunteers?.length || 0) + (record.voluntaryVolunteers?.length || 0);
        const needsHelp = total < 3;

        return (
          <Space direction="vertical" size="small">
            <Tag color={isDisabled ? 'red' : 'green'}>
              {isDisabled ? 'Cancelled' : 'Active'}
            </Tag>
            {!isDisabled && needsHelp && (
              <Tag color="orange">Needs Help</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_: unknown, record: EventSchedule) => (
        <Space size="small" wrap>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record.id)}
            size="small"
          >
            View
          </Button>
          {isAdmin && (
            <>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
                size="small"
              >
                Edit
              </Button>
              <Popconfirm
                title="Delete event"
                description="Are you sure you want to delete this event?"
                onConfirm={() => handleDelete(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="link" danger icon={<DeleteOutlined />} size="small">
                  Delete
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ], [departmentMap, isAdmin, handleView, handleEdit, handleDelete]);

  // Add row className for styling
  const rowClassName = useCallback((record: EventSchedule) => {
    const eventDate = new Date(record.timeAndDate);
    if (isToday(eventDate)) return 'event-row-today';
    if (isPast(eventDate)) return 'event-row-past';
    return 'event-row-upcoming';
  }, []);

  return (
    <>
      <style>{`
        .event-row-today {
          background-color: #f6ffed !important;
          border-left: 4px solid #52c41a;
        }
        .event-row-past {
          opacity: 0.6;
          border-left: 4px solid #d9d9d9;
        }
        .event-row-upcoming {
          border-left: 4px solid #1890ff;
        }
        .event-row-today:hover,
        .event-row-past:hover,
        .event-row-upcoming:hover {
          background-color: #fafafa !important;
        }
        
        /* Mobile responsiveness */
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
          .ant-btn-sm {
            padding: 0 4px;
            font-size: 12px;
          }
        }
        
        @media (max-width: 576px) {
          .ant-table-pagination {
            text-align: center;
          }
          .ant-pagination-options {
            display: none;
          }
        }
      `}</style>
      <Table
        columns={columns}
        dataSource={events}
        rowKey="id"
        loading={loading}
        rowClassName={rowClassName}
        scroll={{ x: 'max-content' }}
        pagination={{ 
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '25', '50', '100'],
          showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} events`,
          responsive: true,
        }}
        expandable={{
          expandedRowRender: (record) => (
            <div style={{ padding: '12px 0' }}>
              <p style={{ margin: 0, marginBottom: 8 }}><strong>Description:</strong> {record.description}</p>
              {record.location && (
                <p style={{ margin: 0 }}>
                  <strong>Location:</strong>{' '}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(record.location.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <EnvironmentOutlined /> {record.location.address}
                  </a>
                </p>
              )}
              {record.assignedGroups && record.assignedGroups.length > 0 && (
                <p style={{ margin: 0, marginTop: 8 }}>
                  <strong>Departments:</strong>{' '}
                  {record.assignedGroups
                    .map(id => departmentMap.get(id)?.departmentName)
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
            </div>
          ),
        }}
      />
    </>
  );
});

EventsTableView.displayName = 'EventsTableView';

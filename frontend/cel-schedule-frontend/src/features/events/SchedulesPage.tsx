import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, Space, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { eventsApi, departmentsApi } from '../../api';
import { EventSchedule, EventCreateDTO, Department } from '../../types';
import { useAuth } from '../auth';
import { format } from 'date-fns';
import { EventFormModal } from './modals/EventFormModal';

const { Title } = Typography;

export const SchedulesPage: React.FC = () => {
  const [events, setEvents] = useState<EventSchedule[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventSchedule | null>(null);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await eventsApi.getAll();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
      message.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await departmentsApi.getAll();
      setDepartments(data.filter(d => !d.isDisabled));
    } catch (err) {
      console.error('Failed to load departments:', err);
      message.error('Failed to load departments');
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchDepartments();
  }, []);

  const handleCreate = () => {
    setEditingEvent(null);
    setModalOpen(true);
  };

  const handleEdit = (event: EventSchedule) => {
    setEditingEvent(event);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await eventsApi.delete(id);
      message.success('Event deleted successfully');
      fetchEvents();
    } catch (err) {
      console.error('Failed to delete event:', err);
      message.error('Failed to delete event');
    }
  };

  const handleSubmit = async (data: EventCreateDTO) => {
    try {
      if (editingEvent) {
        await eventsApi.update(editingEvent.id, data);
        message.success('Event updated successfully');
      } else {
        await eventsApi.create(data);
        message.success('Event created successfully');
      }
      setModalOpen(false);
      fetchEvents();
    } catch (err) {
      console.error(`Failed to ${editingEvent ? 'update' : 'create'} event:`, err);
      message.error(`Failed to ${editingEvent ? 'update' : 'create'} event`);
      throw err;
    }
  };

  const columns = [
    {
      title: 'Event Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: EventSchedule, b: EventSchedule) => a.name.localeCompare(b.name),
    },
    {
      title: 'Date & Time',
      dataIndex: 'timeAndDate',
      key: 'timeAndDate',
      render: (date: string) => format(new Date(date), 'MMM dd, yyyy HH:mm'),
      sorter: (a: EventSchedule, b: EventSchedule) => 
        new Date(a.timeAndDate).getTime() - new Date(b.timeAndDate).getTime(),
    },
    {
      title: 'Departments',
      dataIndex: 'assignedGroups',
      key: 'assignedGroups',
      render: (groups: string[]) => {
        if (!groups || groups.length === 0) return 0;
        return groups.map(deptId => {
          const dept = departments.find(d => d.id === deptId);
          return dept?.departmentName || deptId;
        }).join(', ');
      },
    },
    {
      title: 'Volunteers',
      key: 'volunteers',
      render: (_: unknown, record: EventSchedule) => 
        (record.scheduledVolunteers?.length || 0) + (record.voluntaryVolunteers?.length || 0),
    },
    {
      title: 'Status',
      dataIndex: 'isDisabled',
      key: 'isDisabled',
      render: (isDisabled: boolean) => (
        <Tag color={isDisabled ? 'red' : 'green'}>
          {isDisabled ? 'Cancelled' : 'Active'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: EventSchedule) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/events/${record.id}`)}
          >
            View
          </Button>
          {isAdmin && (
            <>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
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
                <Button type="link" danger icon={<DeleteOutlined />}>
                  Delete
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2}>
          <CalendarOutlined /> Event Schedules
        </Title>
        {isAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Create Event
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={events}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <EventFormModal
        open={modalOpen}
        event={editingEvent}
        departments={departments}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

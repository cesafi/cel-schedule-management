import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, Space, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { volunteersApi } from '../../api';
import { Volunteer, VolunteerCreateDTO } from '../../types';
import { useAuth } from '../auth';
import { format } from 'date-fns';
import { VolunteerFormModal } from './modals/VolunteerFormModal';

const { Title } = Typography;

export const VolunteersPage: React.FC = () => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const navigate = useNavigate();
  const { isAdmin, isAuthenticated, isLoading: authLoading } = useAuth();

  const fetchVolunteers = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = isAdmin
        ? await volunteersApi.getAllIncludingDisabled()
        : await volunteersApi.getAll();
      setVolunteers(data);
    } catch (err) {
      console.error('Failed to load volunteers:', err);
      message.error('Failed to load volunteers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    fetchVolunteers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, isAdmin]);

  const handleCreate = () => {
    setEditingVolunteer(null);
    setModalOpen(true);
  };

  const handleEdit = (volunteer: Volunteer) => {
    setEditingVolunteer(volunteer);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await volunteersApi.delete(id);
      message.success('Volunteer deleted successfully');
      fetchVolunteers();
    } catch (err) {
      console.error('Failed to delete volunteer:', err);
      message.error('Failed to delete volunteer');
    }
  };

  const handleSubmit = async (values: VolunteerCreateDTO) => {
    try {
      if (editingVolunteer) {
        await volunteersApi.update(editingVolunteer.id, values);
        message.success('Volunteer updated successfully');
      } else {
        await volunteersApi.create(values);
        message.success('Volunteer created successfully');
      }
      setModalOpen(false);
      fetchVolunteers();
    } catch (err) {
      console.error(`Failed to ${editingVolunteer ? 'update' : 'create'} volunteer:`, err);
      message.error(`Failed to ${editingVolunteer ? 'update' : 'create'} volunteer`);
      throw err;
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Volunteer, b: Volunteer) => a.name.localeCompare(b.name),
      render: (name: string, record: Volunteer) => (
        <Space size="small">
          <span style={{
            textDecoration: record.isDisabled ? 'line-through' : undefined,
            color: record.isDisabled ? '#999' : undefined,
          }}>{name}</span>
          {isAdmin && record.isDisabled && <Tag color="red">Deleted</Tag>}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isDisabled',
      key: 'isDisabled',
      render: (isDisabled: boolean) => (
        <Tag color={isDisabled ? 'red' : 'green'}>
          {isDisabled ? 'Deleted' : 'Active'}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => {
        if (!date) return '-';
        const d = new Date(date);
        return isNaN(d.getTime()) ? '-' : format(d, 'MMM dd, yyyy');
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Volunteer) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/volunteers/${record.id}`)}
          >
            View
          </Button>
          {isAdmin && !record.isDisabled && (
            <>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                Edit
              </Button>
              <Popconfirm
                title="Delete volunteer"
                description="Are you sure you want to delete this volunteer?"
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

  const rowClassName = (record: Volunteer) =>
    record.isDisabled ? 'volunteer-row-deleted' : '';

  return (
    <div>
      <style>{`
        .volunteer-row-deleted > td {
          background-color: rgba(255, 77, 79, 0.07) !important;
          opacity: 0.65;
        }
        .volunteer-row-deleted {
          border-left: 4px solid #ff4d4f;
        }
        .volunteer-row-deleted:hover > td {
          background-color: rgba(255, 77, 79, 0.12) !important;
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2}>Volunteers</Title>
        {isAdmin && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Add Volunteer
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={volunteers}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        rowClassName={rowClassName}
      />

      <VolunteerFormModal
        open={modalOpen}
        volunteer={editingVolunteer}
        onCancel={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
};


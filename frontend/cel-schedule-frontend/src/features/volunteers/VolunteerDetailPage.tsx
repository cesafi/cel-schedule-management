import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, data } from 'react-router-dom';
import { Typography, Card, Descriptions, Table, Button, Tag, Spin, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { volunteersApi } from '../../api';
import { Volunteer, StatusHistoryItem } from '../../types';
import { format } from 'date-fns';

const { Title } = Typography;

export const VolunteerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const [volunteerData, historyData] = await Promise.all([
          volunteersApi.getById(id),
          volunteersApi.getStatusHistory(id),
        ]);
        setVolunteer(volunteerData);
        setHistory(historyData);
      } catch (error) {
        message.error('Failed to load volunteer data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!volunteer) {
    return <div>Volunteer not found</div>;
  }

  const historyColumns = [
    {
      title: 'Event',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Date',
      dataIndex: 'timeAndDate',
      key: 'timeAndDate',
      render: (date: string) => format(new Date(date), 'MMM dd, yyyy HH:mm'),
    },
    {
      title: 'Attendance',
      dataIndex: ['status', 'attendanceType'],
      key: 'attendanceType',
      render: (type: string) => {
        const colors: Record<string, string> = {
          PRESENT: 'green',
          LATE: 'orange',
          EXCUSED: 'blue',
          ABSENT: 'red',
        };
        return <Tag color={colors[type] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: 'Time In',
      dataIndex: ['status', 'timeIn'],
      key: 'timeIn',
      render: (time: string) => time ? format(new Date(time), 'HH:mm') : '-',
    },
    {
      title: 'Time Out',
      dataIndex: ['status', 'timeOut'],
      key: 'timeOut',
      render: (time: string) => time ? format(new Date(time), 'HH:mm') : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      dataIndex: 'id',
      render: (id:string) => (
        <Button type="link" onClick={() => navigate(`/events/${id}`)}>
          View Event
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/volunteers')}
        style={{ marginBottom: 16 }}
      >
        Back to Volunteers
      </Button>

      <Card>
        <Title level={2}>{volunteer.name}</Title>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="ID">{volunteer.id}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={volunteer.isDisabled ? 'red' : 'green'}>
              {volunteer.isDisabled ? 'Inactive' : 'Active'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Created">
            {format(new Date(volunteer.createdAt), 'MMM dd, yyyy HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="Updated">
            {format(new Date(volunteer.lastUpdated), 'MMM dd, yyyy HH:mm')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card style={{ marginTop: 24 }} title="Attendance History">
        <Table
          columns={historyColumns}
          dataSource={history}
          rowKey="eventId"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

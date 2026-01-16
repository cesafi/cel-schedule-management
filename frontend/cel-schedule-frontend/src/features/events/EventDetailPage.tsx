import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Card, Descriptions, Table, Button, Tag, Spin, message, Modal, Form, Select, Space, Input } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { eventsApi, volunteersApi, departmentsApi } from '../../api';
import { EventSchedule, Volunteer, Department, AttendanceType, AddStatusDTO, UpdateStatusDTO, EventUpdateDTO } from '../../types';
import { format } from 'date-fns';
import { useAuth } from '../auth';
import { AddVolunteerToEventModal } from './modals/AddVolunteerToEventModal';
import { AddDepartmentToEventModal } from './modals/AddDepartmentToEventModal';

const { Title } = Typography;

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDeptHead, isAdmin } = useAuth();
  const [event, setEvent] = useState<EventSchedule | null>(null);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [checkOutModalOpen, setCheckOutModalOpen] = useState(false);
  const [addDeptModalOpen, setAddDeptModalOpen] = useState(false);
  const [addVolunteerModalOpen, setAddVolunteerModalOpen] = useState(false);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>('');
  const [checkInForm] = Form.useForm();
  const [checkOutForm] = Form.useForm();

  const fetchData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const [eventData, volunteersData, departmentsData] = await Promise.all([
        eventsApi.getById(id),
        volunteersApi.getAll(),
        departmentsApi.getAll(),
      ]);
      setEvent(eventData);
      setVolunteers(volunteersData);
      setDepartments(departmentsData);
    } catch (error) {
      message.error('Failed to load event data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleCheckIn = async (values: any) => {
    if (!id) return;
    
    try {
      const data: AddStatusDTO = {
        volunteerID: values.volunteerID,
        timeIn: new Date().toISOString(),
        attendanceType: values.attendanceType,
      };
      await eventsApi.addStatus(id, data);
      message.success('Volunteer checked in successfully');
      setCheckInModalOpen(false);
      checkInForm.resetFields();
      fetchData();
    } catch (error) {
      message.error('Failed to check in volunteer');
    }
  };

  const handleCheckOut = async (values: any) => {
    if (!id || !selectedVolunteerId) return;
    
    try {
      const data: UpdateStatusDTO = {
        timeOut: new Date().toISOString(),
      };
      await eventsApi.updateStatus(id, selectedVolunteerId, data);
      message.success('Volunteer checked out successfully');
      setCheckOutModalOpen(false);
      checkOutForm.resetFields();
      fetchData();
    } catch (error) {
      message.error('Failed to check out volunteer');
    }
  };

  const openCheckOut = (volunteerId: string) => {
    setSelectedVolunteerId(volunteerId);
    setCheckOutModalOpen(true);
  };

  const handleAddDepartments = async (departmentIds: string[]) => {
    if (!id || !event) return;
    
    try {
      const updatedGroups = [...new Set([...(event.assignedGroups || []), ...departmentIds])];
      const data: EventUpdateDTO = {
        assignedGroups: updatedGroups,
      };
      await eventsApi.update(id, data);
      message.success('Departments added successfully');
      setAddDeptModalOpen(false);
      fetchData();
    } catch (error) {
      message.error('Failed to add departments');
      throw error;
    }
  };

  const handleAddVolunteers = async (volunteerIds: string[]) => {
    if (!id || !event) return;
    
    try {
      const updatedVolunteers = [...new Set([...(event.scheduledVolunteers || []), ...volunteerIds])];
      const data: EventUpdateDTO = {
        scheduledVolunteers: updatedVolunteers,
      };
      await eventsApi.update(id, data);
      message.success('Volunteers added successfully');
      setAddVolunteerModalOpen(false);
      fetchData();
    } catch (error) {
      message.error('Failed to add volunteers');
      throw error;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!event) {
    return <div>Event not found</div>;
  }

  const attendanceColumns = [
    {
      title: 'Volunteer',
      dataIndex: 'volunteerID',
      key: 'volunteerID',
      render: (volunteerId: string) => {
        const volunteer = volunteers.find(v => v.id === volunteerId);
        return volunteer ? (
          <Button type="link" onClick={() => navigate(`/volunteers/${volunteerId}`)}>
            {volunteer.name}
          </Button>
        ) : volunteerId;
      },
    },
    {
      title: 'Status',
      dataIndex: 'attendanceType',
      key: 'attendanceType',
      render: (type: AttendanceType) => {
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
      dataIndex: 'timeIn',
      key: 'timeIn',
      render: (time: string) => time ? format(new Date(time), 'HH:mm:ss') : '-',
    },
    {
      title: 'Time Out',
      dataIndex: 'timeOut',
      key: 'timeOut',
      render: (time: string) => time ? format(new Date(time), 'HH:mm:ss') : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          {!record.timeOut && (
            <Button
              type="link"
              icon={<ClockCircleOutlined />}
              onClick={() => openCheckOut(record.volunteerID)}
            >
              Check Out
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const departmentColumns = [
    {
      title: 'Department',
      dataIndex: 'id',
      key: 'id',
      render: (_: any, deptId: string) => {
        const dept = departments.find(d => d.id === deptId);
        console.log("Debug Dept Info: ", deptId, dept);
        return dept ? (
          <Button type="link" onClick={() => navigate(`/departments/${deptId}`)}>
            {dept.departmentName}
          </Button>
        ) : "Unknown";
      },
    },
    {
      title: 'Members',
      key: 'members',
      render: (_: any, deptId: string) => {
        const dept = departments.find(d => d.id === deptId);
        console.log("Debug Dept Members: ", deptId, dept);
        return dept?.volunteerMembers?.length || 0;
      },
    },
  ];

  const checkedInVolunteerIds = event.statuses?.map(s => s.volunteerID) || [];
  const availableVolunteers = volunteers.filter(
    v => !v.isDisabled && 
         !checkedInVolunteerIds.includes(v.id) &&
         ((event.scheduledVolunteers || []).includes(v.id) || (event.voluntaryVolunteers || []).includes(v.id))
  );

  const availableDepartments = departments.filter(
    d => !d.isDisabled && !(event.assignedGroups || []).includes(d.id)
  );

  const unscheduledVolunteers = volunteers.filter(
    v => !v.isDisabled && !(event.scheduledVolunteers || []).includes(v.id)
  );

  const scheduledVolunteerColumns = [
    {
      title: 'Volunteer',
      key: 'volunteer',
      render: (volunteerId: string) => {
        const volunteer = volunteers.find(v => v.id === volunteerId);
        return volunteer ? (
          <Button type="link" onClick={() => navigate(`/volunteers/${volunteerId}`)}>
            {volunteer.name}
          </Button>
        ) : volunteerId;
      },
    },
  ];

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/schedules')}
        style={{ marginBottom: 16 }}
      >
        Back to Schedules
      </Button>

      <Card>
        <Title level={2}>{event.name}</Title>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Description" span={2}>
            {event.description}
          </Descriptions.Item>
          <Descriptions.Item label="Date & Time">
            {format(new Date(event.timeAndDate), 'MMM dd, yyyy HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={event.isDisabled ? 'red' : 'green'}>
              {event.isDisabled ? 'Cancelled' : 'Active'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Scheduled Volunteers">
            {event.scheduledVolunteers?.length || 0}
          </Descriptions.Item>
          <Descriptions.Item label="Checked In">
            {event.statuses?.length || 0}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card 
        style={{ marginTop: 24 }} 
        title="Assigned Departments"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddDeptModalOpen(true)}
          >
            Add Department
          </Button>
        }
      >
        <Table
          columns={departmentColumns}
          dataSource={event.assignedGroups || ["XoX"]}
          rowKey={(deptId: string) => deptId}
          pagination={false}
        />
      </Card>

      <Card 
        style={{ marginTop: 24 }} 
        title="Scheduled Volunteers"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddVolunteerModalOpen(true)}
          >
            Add Volunteer
          </Button>
        }
      >
        <Table
          columns={scheduledVolunteerColumns}
          dataSource={event.scheduledVolunteers || []}
          rowKey={(volunteerId: string) => volunteerId}
          pagination={false}
        />
      </Card>

      <Card 
        style={{ marginTop: 24 }} 
        title="Attendance"
        extra={
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => setCheckInModalOpen(true)}
          >
            Check In Volunteer
          </Button>
        }
      >
        <Table
          columns={attendanceColumns}
          dataSource={event.statuses}
          rowKey="volunteerID"
          pagination={false}
        />
      </Card>

      {/* Check In Modal */}
      <Modal
        title="Check In Volunteer"
        open={checkInModalOpen}
        onCancel={() => {
          setCheckInModalOpen(false);
          checkInForm.resetFields();
        }}
        footer={null}
      >
        <Form form={checkInForm} layout="vertical" onFinish={handleCheckIn}>
          <Form.Item
            name="volunteerID"
            label="Volunteer"
            rules={[{ required: true, message: 'Please select a volunteer' }]}
          >
            <Select
              placeholder="Select volunteer"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={availableVolunteers.map(v => ({ label: v.name, value: v.id }))}
            />
          </Form.Item>

          <Form.Item
            name="attendanceType"
            label="Attendance Type"
            rules={[{ required: true, message: 'Please select attendance type' }]}
            initialValue={AttendanceType.PRESENT}
          >
            <Select>
              <Select.Option value={AttendanceType.PRESENT}>Present</Select.Option>
              <Select.Option value={AttendanceType.LATE}>Late</Select.Option>
              <Select.Option value={AttendanceType.EXCUSED}>Excused</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Check In
              </Button>
              <Button onClick={() => setCheckInModalOpen(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Check Out Modal */}
      <Modal
        title="Check Out Volunteer"
        open={checkOutModalOpen}
        onCancel={() => {
          setCheckOutModalOpen(false);
          checkOutForm.resetFields();
        }}
        footer={null}
      >
        <Form form={checkOutForm} layout="vertical" onFinish={handleCheckOut}>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Check Out
              </Button>
              <Button onClick={() => setCheckOutModalOpen(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Department Modal */}
      <AddDepartmentToEventModal
        open={addDeptModalOpen}
        availableDepartments={availableDepartments}
        onCancel={() => setAddDeptModalOpen(false)}
        onSubmit={handleAddDepartments}
      />

      {/* Add Volunteer Modal */}
      <AddVolunteerToEventModal
        open={addVolunteerModalOpen}
        availableVolunteers={unscheduledVolunteers}
        onCancel={() => setAddVolunteerModalOpen(false)}
        onSubmit={handleAddVolunteers}
      />
    </div>
  );
};

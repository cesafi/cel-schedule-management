import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Card, Descriptions, Table, Button, Tag, Spin, message, Form, Select, Space, Input, Tabs, Popconfirm } from 'antd';
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, EnvironmentOutlined, FileTextOutlined } from '@ant-design/icons';
import { eventsApi } from '../../api';
import { EventSchedule, Volunteer, Department, AddStatusDTO, EventUpdateDTO, TimeInDTO, TimeOutDTO } from '../../types';
import { AttendanceType, TimeOutType } from '../../types/enums';
import { format } from 'date-fns';
import { useAuth } from '../auth';
import { AddVolunteerToEventModal } from './modals/AddVolunteerToEventModal';
import { AddDepartmentToEventModal } from './modals/AddDepartmentToEventModal';
import { useEvent, useVolunteers, useDepartments, useVolunteerMap, useDepartmentMap, useEntityLogs } from '../../hooks';
import { useQueryClient } from '@tanstack/react-query';
import { eventKeys } from '../../hooks/useEvents';
import { LogsTable } from '../../components';

const { Title } = Typography;

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDeptHead, isAdmin, canManageVolunteer } = useAuth();
  const queryClient = useQueryClient();
  
  const [addDeptModalOpen, setAddDeptModalOpen] = useState(false);
  const [addVolunteerModalOpen, setAddVolunteerModalOpen] = useState(false);
  const [editingTimeIn, setEditingTimeIn] = useState<string | null>(null);
  const [editingTimeOut, setEditingTimeOut] = useState<string | null>(null);
  const [timeInForm] = Form.useForm();
  const [timeOutForm] = Form.useForm();
  const [filterDepartment, setFilterDepartment] = useState<string | null>(null);
  const [logPage, setLogPage] = useState(1);
  const logPageSize = 20;
  const [filterTimeIn, setFilterTimeIn] = useState<string | null>(null);
  const [filterTimeOut, setFilterTimeOut] = useState<string | null>(null);

  // Fetch data using React Query hooks
  const { data: event, isLoading: eventLoading } = useEvent(id);
  const { data: volunteers = [], isLoading: volunteersLoading } = useVolunteers(true);
  const { data: departments = [], isLoading: departmentsLoading } = useDepartments(true);
  
  // Create maps for O(1) lookups
  const { volunteerMap } = useVolunteerMap(true);
  const { departmentMap } = useDepartmentMap(true);

  // Fetch entity logs (admin only)
  const { data: logsData, isLoading: logsLoading } = useEntityLogs(
    'event',
    id || '',
    {
      limit: logPageSize,
      offset: (logPage - 1) * logPageSize,
      enabled: isAdmin && !!id
    }
  );

  const loading = eventLoading || volunteersLoading || departmentsLoading;

  // Refetch event data after mutations
  const refetchEvent = useCallback(() => {
    if (id) {
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
    }
  }, [id, queryClient]);

  const handleTimeIn = async (volunteerId: string, values: { timeIn?: string; attendanceType?: AttendanceType }) => {
    if (!id) return;
    
    try {
      const data: TimeInDTO = {
        timeIn: values.timeIn ? `${new Date().toISOString().split('T')[0]}T${values.timeIn}:00Z` : undefined,
        timeInType: values.attendanceType || AttendanceType.PRESENT,
      };
      await eventsApi.timeIn(id, volunteerId, data);
      message.success('Volunteer checked in successfully');
      setEditingTimeIn(null);
      timeInForm.resetFields();
      refetchEvent();
    } catch (err) {
      console.error('Failed to check in volunteer:', err);
      message.error('Failed to check in volunteer');
    }
  };

  const handleTimeOut = async (volunteerId: string, values: { timeOut?: string }) => {
    if (!id) return;
    
    try {
      const data: TimeOutDTO = {
        timeOut: values.timeOut ? `${new Date().toISOString().split('T')[0]}T${values.timeOut}:00Z` : undefined,
        timeOutType: 'On-Time',
      };
      await eventsApi.timeOut(id, volunteerId, data);
      message.success('Volunteer checked out successfully');
      setEditingTimeOut(null);
      timeOutForm.resetFields();
      refetchEvent();
    } catch (err) {
      console.error('Failed to check out volunteer:', err);
      message.error('Failed to check out volunteer');
    }
  };

  const handleAddDepartments = async (departmentIds: string[]) => {
    if (!id || !event) return;
    
    try {
      await eventsApi.addDepartmentsToEvent(id, departmentIds);
      message.success('Departments added successfully');
      setAddDeptModalOpen(false);
      refetchEvent();
    } catch (err) {
      console.error('Failed to add departments:', err);
      message.error('Failed to add departments');
    }
  };

  const handleRemoveDepartment = async (departmentId: string) => {
    if (!id) return;
    
    try {
      await eventsApi.removeDepartmentFromEvent(id, departmentId);
      message.success('Department removed successfully');
      refetchEvent();
    } catch (err) {
      console.error('Failed to remove department:', err);
      message.error('Failed to remove department');
    }
  };

  const handleRemoveVolunteer = async (volunteerId: string) => {
    if (!id) return;
    
    try {
      await eventsApi.removeVolunteerFromEvent(id, volunteerId);
      message.success('Volunteer removed from event successfully');
      refetchEvent();
    } catch (err) {
      console.error('Failed to remove volunteer:', err);
      message.error('Failed to remove volunteer');
    }
  };

  // Unused for now - TODO: implement volunteer addition feature
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      refetchEvent();
    } catch (err) {
      console.error('Failed to add volunteers:', err);
      message.error('Failed to add volunteers');
      throw err;
    }
  };

  const getVolunteerDepartments = useCallback((volunteerId: string): Department[] => {
    return departments.filter((d: Department) => 
      d.volunteerMembers?.some((m: any) => m.volunteerID === volunteerId)
    );
  }, [departments]);

  // Type for status records in tables
  type StatusRecord = { volunteerID: string; timeIn?: string; timeOut?: string; attendanceType?: string; timeOutType?: string };

  // Memoize attendance columns for performance
  const attendanceColumns = useMemo(() => [
    {
      title: 'Volunteer',
      dataIndex: 'volunteerID',
      key: 'volunteerID',
      sorter: (a: StatusRecord, b: StatusRecord) => {
        const volA = volunteerMap.get(a.volunteerID);
        const volB = volunteerMap.get(b.volunteerID);
        return (volA?.name || '').localeCompare(volB?.name || '');
      },
      render: (volunteerId: string) => {
        const volunteer = volunteerMap.get(volunteerId);
        return volunteer ? (
          <Button type="link" onClick={() => navigate(`/volunteers/${volunteerId}`)}>
            {volunteer.name}
          </Button>
        ) : volunteerId;
      },
    },
    {
      title: 'Department',
      key: 'department',
      sorter: (a: StatusRecord, b: StatusRecord) => {
        const deptsA = getVolunteerDepartments(a.volunteerID);
        const deptsB = getVolunteerDepartments(b.volunteerID);
        const nameA = deptsA[0]?.departmentName || 'zzz';
        const nameB = deptsB[0]?.departmentName || 'zzz';
        return nameA.localeCompare(nameB);
      },
      render: (_: unknown, record: StatusRecord) => {
        const volunteerDepts = getVolunteerDepartments(record.volunteerID);
        return volunteerDepts.length > 0 ? (
          <Space wrap>
            {volunteerDepts.map((d: Department) => (
              <Tag key={d.id} color="blue">
                {d.departmentName}
              </Tag>
            ))}
          </Space>
        ) : (
          <Tag color="default">No Department</Tag>
        );
      },
    },
    {
      title: 'Time In',
      dataIndex: 'timeIn',
      key: 'timeIn',
      sorter: (a: StatusRecord, b: StatusRecord) => {
        if (!a.timeIn && !b.timeIn) return 0;
        if (!a.timeIn) return 1;
        if (!b.timeIn) return -1;
        return new Date(a.timeIn).getTime() - new Date(b.timeIn).getTime();
      },
      render: (time: string, record: StatusRecord) => {
        if (!record.attendanceType && editingTimeIn === record.volunteerID) {
          return (
            <Form
              form={timeInForm}
              layout="inline"
              onFinish={(values) => handleTimeIn(record.volunteerID, values)}
              style={{ display: 'flex', gap: '8px' }}
            >
              <Form.Item
                name="attendanceType"
                rules={[{ required: true, message: 'Required' }]}
                style={{ marginBottom: 0 }}
              >
                <Select placeholder="Status" style={{ width: 120 }}>
                  <Select.Option value={AttendanceType.PRESENT}>Present</Select.Option>
                  <Select.Option value={AttendanceType.LATE}>Late</Select.Option>
                  <Select.Option value={AttendanceType.EXCUSED}>Excused</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="timeIn" style={{ marginBottom: 0 }}>
                <Input type="time" placeholder="Time" style={{ width: 100 }} />
              </Form.Item>
              <Button type="primary" size="small" htmlType="submit">
                Submit
              </Button>
              <Button size="small" onClick={() => setEditingTimeIn(null)}>
                Cancel
              </Button>
            </Form>
          );
        }
        
        if (!record.attendanceType) {
          const canManage = isAdmin || canManageVolunteer(record.volunteerID);
          if (!canManage) {
            return <span>-</span>;
          }
          return (
            <Button 
              type="link" 
              onClick={() => setEditingTimeIn(record.volunteerID)}
            >
              Check In
            </Button>
          );
        }

        const canManage = isAdmin || canManageVolunteer(record.volunteerID);
        return (
          <Space>
            <Tag color={record.attendanceType === AttendanceType.PRESENT ? 'green' : record.attendanceType === AttendanceType.LATE ? 'orange' : 'blue'}>
              {record.attendanceType}
            </Tag>
            <span>{time ? format(new Date(time), 'MMM dd, yyyy h:mm:ss a') : '-'}</span>
            {canManage && (
              <Button 
                type="link" 
                size="small"
                onClick={() => {
                  setEditingTimeIn(record.volunteerID);
                  timeInForm.setFieldsValue({
                    attendanceType: record.attendanceType,
                    timeIn: time ? format(new Date(time), 'HH:mm') : '',
                  });
                }}
              >
                Edit
              </Button>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Time Out',
      dataIndex: 'timeOut',
      key: 'timeOut',
      sorter: (a: StatusRecord, b: StatusRecord) => {
        if (!a.timeOut && !b.timeOut) return 0;
        if (!a.timeOut) return 1;
        if (!b.timeOut) return -1;
        return new Date(a.timeOut).getTime() - new Date(b.timeOut).getTime();
      },
      render: (time: string, record: StatusRecord) => {
        if (!record.timeOutType && editingTimeOut === record.volunteerID) {
          return (
            <Form
              form={timeOutForm}
              layout="inline"
              onFinish={(values) => handleTimeOut(record.volunteerID, values)}
              style={{ display: 'flex', gap: '8px' }}
            >
              <Form.Item
                name="timeOutType"
                rules={[{ required: true, message: 'Required' }]}
                style={{ marginBottom: 0 }}
              >
                <Select placeholder="Status" style={{ width: 120 }}>
                  <Select.Option value={TimeOutType.ONTIME}>On-Time</Select.Option>
                  <Select.Option value={TimeOutType.EARYLEAVE}>Early Leave</Select.Option>
                  <Select.Option value={TimeOutType.FORGOT}>Forgot</Select.Option>
                  <Select.Option value={TimeOutType.EXCUSED}>Excused</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="timeOut" style={{ marginBottom: 0 }}>
                <Input type="time" placeholder="Time" style={{ width: 100 }} />
              </Form.Item>
              <Button type="primary" size="small" htmlType="submit">
                Submit
              </Button>
              <Button size="small" onClick={() => setEditingTimeOut(null)}>
                Cancel
              </Button>
            </Form>
          );
        }
        
        if (!record.timeOutType && record.attendanceType) {
          const canManage = isAdmin || canManageVolunteer(record.volunteerID);
          if (!canManage) {
            return <span>-</span>;
          }
          return (
            <Button 
              type="link" 
              onClick={() => setEditingTimeOut(record.volunteerID)}
            >
              Check Out
            </Button>
          );
        }

        if (record.timeOutType) {
          const canManage = isAdmin || canManageVolunteer(record.volunteerID);
          return (
            <Space>
              <Tag color={record.timeOutType === TimeOutType.ONTIME ? 'green' : record.timeOutType === TimeOutType.EARYLEAVE ? 'orange' : 'red'}>
                {record.timeOutType}
              </Tag>
              <span>{time ? format(new Date(time), 'MMM dd, yyyy h:mm:ss a') : '-'}</span>
              {canManage && (
                <Button 
                  type="link" 
                  size="small"
                  onClick={() => {
                    setEditingTimeOut(record.volunteerID);
                    timeOutForm.setFieldsValue({
                      timeOutType: record.timeOutType,
                      timeOut: time ? format(new Date(time), 'HH:mm') : '',
                    });
                  }}
                >
                  Edit
                </Button>
              )}
            </Space>
          );
        }

        return '-';
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: StatusRecord) => {
        const canManage = isAdmin || canManageVolunteer(record.volunteerID);
        if (!canManage) return null;
        return (
          <Popconfirm
            title="Remove volunteer"
            description="This will remove the volunteer's attendance record. Continue?"
            onConfirm={() => handleRemoveVolunteer(record.volunteerID)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Remove
            </Button>
          </Popconfirm>
        );
      },
    },
  ], [volunteerMap, navigate, isAdmin, canManageVolunteer, editingTimeIn, editingTimeOut, timeInForm, timeOutForm, getVolunteerDepartments]);

  const departmentColumns = useMemo(() => [
    {
      title: 'Department',
      dataIndex: 'id',
      key: 'id',
      render: (_: unknown, deptId: string) => {
        const dept = departmentMap.get(deptId);
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
      render: (_: unknown, deptId: string) => {
        const dept = departmentMap.get(deptId);
        console.log("Debug Dept Members: ", deptId, dept);
        return dept?.volunteerMembers?.length || 0;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, deptId: string) => {
        if (!isAdmin) return null;
        return (
          <Popconfirm
            title="Remove department"
            description="Are you sure you want to remove this department from the event?"
            onConfirm={() => handleRemoveDepartment(deptId)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Remove
            </Button>
          </Popconfirm>
        );
      },
    },
  ], [departmentMap, navigate, isAdmin, handleRemoveDepartment]);

  // Unused for now - kept for future feature
  // const checkedInVolunteerIds = event.statuses?.map(s => s.volunteerID) || [];
  // Unused for now - TODO: implement volunteer selection feature
  // const availableVolunteers = volunteers.filter(
  //   v => !v.isDisabled && 
  //        !checkedInVolunteerIds.includes(v.id) &&
  //        ((event.scheduledVolunteers || []).includes(v.id) || (event.voluntaryVolunteers || []).includes(v.id))
  // );

  const availableDepartments = useMemo(() => {
    if (!event) return [];
    return departments.filter(
      (d: Department) => !d.isDisabled && !(event.assignedGroups || []).includes(d.id)
    );
  }, [event, departments]);

  // Unused for now - TODO: implement volunteer scheduling feature
  // const unscheduledVolunteers = volunteers.filter(
  //   v => !v.isDisabled && !(event.scheduledVolunteers || []).includes(v.id)
  // );

  // Unused for now - TODO: implement attendance tracking feature
  // const volunteersNotInAttendance = (event.scheduledVolunteers || []).filter(
  //   vid => !(event.statuses || []).some(s => s.volunteerID === vid)
  // );

  // Filter attendance data - memoized for performance
  const filteredAttendance = useMemo(() => {
    if (!event) return [];
    
    return (event.statuses || []).filter((record) => {
      // Filter by department
      if (filterDepartment) {
        const volunteerDepts = getVolunteerDepartments(record.volunteerID);
        if (filterDepartment === 'none') {
          if (volunteerDepts.length > 0) return false;
        } else {
          if (!volunteerDepts.some((d: Department) => d.id === filterDepartment)) return false;
        }
      }

      // Filter by time in status (check attendanceType instead of timeIn)
      if (filterTimeIn) {
        if (filterTimeIn === 'yes' && !record.attendanceType) return false;
        if (filterTimeIn === 'no' && record.attendanceType) return false;
      }

      // Filter by time out status (check timeOutType instead of timeOut)
      if (filterTimeOut) {
        if (filterTimeOut === 'yes' && !record.timeOutType) return false;
        if (filterTimeOut === 'no' && record.timeOutType) return false;
      }

      return true;
    });
  }, [event, filterDepartment, filterTimeIn, filterTimeOut, getVolunteerDepartments]);

  // Unused for now - TODO: implement volunteer table feature
  // const scheduledVolunteerColumns = [
  //   {
  //     title: 'Volunteer',
  //     key: 'volunteer',
  //     render: (volunteerId: string) => {
  //       const volunteer = volunteers.find(v => v.id === volunteerId);
  //       return volunteer ? (
  //         <Button type="link" onClick={() => navigate(`/volunteers/${volunteerId}`)}>
  //           {volunteer.name}
  //         </Button>
  //       ) : volunteerId;
  //     },
  //   },
  // ];

  const handleAddVolunteersToAttendance = async (volunteerIds: string[]) => {
    if (!id) return;
    
    try {
      // Add each volunteer to the event statuses (without timeIn initially)
      for (const volunteerId of volunteerIds) {
        const data: AddStatusDTO = {
          volunteerID: volunteerId,
        };
        await eventsApi.addStatus(id, data);
      }
      message.success('Volunteers added to attendance');
      setAddVolunteerModalOpen(false);
      refetchEvent();
    } catch (error) {
      message.error('Failed to add volunteers to attendance');
      throw error;
    }
  };

  // Add conditional returns AFTER all hooks
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
          <Descriptions.Item label="Location">
            {event.location ? (
              <Space>
                <EnvironmentOutlined />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {event.location.address}
                </a>
              </Space>
            ) : (
              '-'
            )}
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

      <Card style={{ marginTop: 24 }}>
        <Tabs
          defaultActiveKey="departments"
          items={[
            {
              key: 'attendance',
              label: 'Attendance',
              children: (
                <>
                  <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <Space wrap>
                      <Select
                        placeholder="Filter by Department"
                        style={{ width: 200 }}
                        allowClear
                        value={filterDepartment}
                        onChange={setFilterDepartment}
                      >
                        <Select.Option value="none">No Department</Select.Option>
                        {departments.filter((d: Department) => !d.isDisabled).map((d: Department) => (
                          <Select.Option key={d.id} value={d.id}>
                            {d.departmentName}
                          </Select.Option>
                        ))}
                      </Select>
                      <Select
                        placeholder="Filter by Time In"
                        style={{ width: 160 }}
                        allowClear
                        value={filterTimeIn}
                        onChange={setFilterTimeIn}
                      >
                        <Select.Option value="yes">Has Timed In</Select.Option>
                        <Select.Option value="no">Not Timed In</Select.Option>
                      </Select>
                      <Select
                        placeholder="Filter by Time Out"
                        style={{ width: 160 }}
                        allowClear
                        value={filterTimeOut}
                        onChange={setFilterTimeOut}
                      >
                        <Select.Option value="yes">Has Timed Out</Select.Option>
                        <Select.Option value="no">Not Timed Out</Select.Option>
                      </Select>
                    </Space>
                    {(isAdmin || isDeptHead) && (
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setAddVolunteerModalOpen(true)}
                      >
                        Add Volunteer
                      </Button>
                    )}
                  </div>
                  <Table
                    columns={attendanceColumns}
                    dataSource={filteredAttendance}
                    rowKey="volunteerID"
                    pagination={false}
                  />
                </>
              ),
            },
            {
              key: 'departments',
              label: 'Assigned Departments',
              children: (
                <>
                  <div style={{ marginBottom: 16, textAlign: 'right' }}>
                    {isAdmin && (
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setAddDeptModalOpen(true)}
                      >
                        Add Department
                      </Button>
                    )}
                  </div>
                  <Table
                    columns={departmentColumns}
                    dataSource={event.assignedGroups || []}
                    rowKey={(deptId: string) => deptId}
                    pagination={false}
                  />
                </>
              ),
            },
            ...(isAdmin ? [{
              key: 'logs',
              label: (
                <span>
                  <FileTextOutlined /> Activity Log
                </span>
              ),
              children: (
                <Card title="System Activity Log">
                  <LogsTable
                    logs={logsData?.logs || []}
                    loading={logsLoading}
                    pagination={{
                      current: logPage,
                      pageSize: logPageSize,
                      total: logsData?.total || 0,
                      onChange: setLogPage,
                    }}
                  />
                </Card>
              ),
            }] : [])
          ]}
        />
      </Card>

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
        availableVolunteers={volunteers.filter((v: Volunteer) => !v.isDisabled && !event.statuses?.some(s => s.volunteerID === v.id))}
        departments={departments}
        onCancel={() => setAddVolunteerModalOpen(false)}
        onSubmit={handleAddVolunteersToAttendance}
      />
    </div>
  );
};

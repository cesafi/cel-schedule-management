import React from 'react';
import { Modal, Form, Select, Button, Space, Tag } from 'antd';
import { Volunteer, Department } from '../../../types';

interface AddVolunteerToEventModalProps {
  open: boolean;
  availableVolunteers: Volunteer[];
  departments: Department[];
  onCancel: () => void;
  onSubmit: (volunteerIds: string[]) => Promise<void>;
}

export const AddVolunteerToEventModal: React.FC<AddVolunteerToEventModalProps> = ({
  open,
  availableVolunteers,
  departments,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleFinish = async (values: { volunteerIds: string[] }) => {
    await onSubmit(values.volunteerIds);
    form.resetFields();
  };

  const getVolunteerDepartments = (volunteerId: string) => {
    return departments.filter(d => 
      d.volunteerMembers?.some(m => m.volunteerID === volunteerId)
    );
  };

  return (
    <Modal
      title="Add Volunteers to Event"
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="volunteerIds"
          label="Volunteers"
          rules={[{ required: true, message: 'Please select at least one volunteer' }]}
        >
          <Select
            mode="multiple"
            placeholder="Select volunteers"
            showSearch
            filterOption={(input, option) => {
              const searchText = input.toLowerCase();
              return (option?.searchtext ?? '').toLowerCase().includes(searchText);
            }}
            optionRender={(option) => {
              const volunteer = availableVolunteers.find(v => v.id === option.value);
              if (!volunteer) return option.label;
              const volunteerDepts = getVolunteerDepartments(volunteer.id);
              return (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{volunteer.name}</span>
                  <div>
                    {volunteerDepts.length > 0 ? (
                      volunteerDepts.map(d => (
                        <Tag key={d.id} color="blue" style={{ marginLeft: 4 }}>
                          {d.departmentName}
                        </Tag>
                      ))
                    ) : (
                      <Tag color="default" style={{ marginLeft: 4 }}>No Department</Tag>
                    )}
                  </div>
                </div>
              );
            }}
            options={availableVolunteers.map(v => {
              const depts = getVolunteerDepartments(v.id);
              const deptNames = depts.map(d => d.departmentName).join(' ');
              return {
                label: v.name,
                value: v.id,
                searchtext: `${v.name} ${deptNames}`
              };
            })}
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Add Volunteers
            </Button>
            <Button onClick={onCancel}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

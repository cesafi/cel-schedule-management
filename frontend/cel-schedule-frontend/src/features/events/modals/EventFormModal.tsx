import React from 'react';
import { Modal, Form, Input, DatePicker, Select, Button, Space } from 'antd';
import { EventSchedule, EventCreateDTO, Department, EventLocation } from '../../../types';
import { LocationInput } from '../../../components/LocationInput';

const { TextArea } = Input;

interface EventFormModalProps {
  open: boolean;
  event: EventSchedule | null;
  departments: Department[];
  onCancel: () => void;
  onSubmit: (values: EventCreateDTO) => Promise<void>;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({
  open,
  event,
  departments,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (open) {
      if (event) {
        form.setFieldsValue({
          name: event.name,
          description: event.description,
          timeAndDate: new Date(event.timeAndDate),
          location: event.location,
          assignedGroups: event.assignedGroups,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, event, form]);

  const handleFinish = async (values: { name: string; description: string; timeAndDate: Date; location?: EventLocation; assignedGroups?: string[] }) => {
    const data: EventCreateDTO = {
      name: values.name,
      description: values.description,
      timeAndDate: values.timeAndDate.toISOString(),
      location: values.location,
      assignedGroups: values.assignedGroups || [],
    };
    
    await onSubmit(data);
    form.resetFields();
  };

  return (
    <Modal
      title={event ? 'Edit Event' : 'Create Event'}
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      footer={null}
      width={600}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="name"
          label="Event Name"
          rules={[{ required: true, message: 'Please enter event name' }]}
        >
          <Input placeholder="Enter event name" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please enter description' }]}
        >
          <TextArea rows={4} placeholder="Enter event description" />
        </Form.Item>

        <Form.Item
          name="timeAndDate"
          label="Date & Time"
          rules={[{ required: true, message: 'Please select date and time' }]}
        >
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="location"
          label="Location"
        >
          <LocationInput />
        </Form.Item>

        <Form.Item
          name="assignedGroups"
          label="Assign Departments"
        >
          <Select
            mode="multiple"
            placeholder="Select departments"
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={departments.map(d => ({ label: d.departmentName, value: d.id }))}
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              {event ? 'Update' : 'Create'}
            </Button>
            <Button onClick={onCancel}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

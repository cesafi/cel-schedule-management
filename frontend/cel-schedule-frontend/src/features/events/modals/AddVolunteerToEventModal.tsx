import React from 'react';
import { Modal, Form, Select, Button, Space } from 'antd';
import { Volunteer } from '../../../types';

interface AddVolunteerToEventModalProps {
  open: boolean;
  availableVolunteers: Volunteer[];
  onCancel: () => void;
  onSubmit: (volunteerIds: string[]) => Promise<void>;
}

export const AddVolunteerToEventModal: React.FC<AddVolunteerToEventModalProps> = ({
  open,
  availableVolunteers,
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
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={availableVolunteers.map(v => ({ label: v.name, value: v.id }))}
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

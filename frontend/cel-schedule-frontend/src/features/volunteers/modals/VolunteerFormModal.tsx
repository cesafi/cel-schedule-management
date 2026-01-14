import React from 'react';
import { Modal, Form, Input, Button, Space } from 'antd';
import { Volunteer, VolunteerCreateDTO } from '../../../types';

interface VolunteerFormModalProps {
  open: boolean;
  volunteer: Volunteer | null;
  onCancel: () => void;
  onSubmit: (values: VolunteerCreateDTO) => Promise<void>;
}

export const VolunteerFormModal: React.FC<VolunteerFormModalProps> = ({
  open,
  volunteer,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (open) {
      if (volunteer) {
        form.setFieldsValue({ name: volunteer.name });
      } else {
        form.resetFields();
      }
    }
  }, [open, volunteer, form]);

  const handleFinish = async (values: VolunteerCreateDTO) => {
    await onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      title={volunteer ? 'Edit Volunteer' : 'Create Volunteer'}
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please enter volunteer name' }]}
        >
          <Input placeholder="Enter volunteer name" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              {volunteer ? 'Update' : 'Create'}
            </Button>
            <Button onClick={onCancel}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

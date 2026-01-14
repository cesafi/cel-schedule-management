import React from 'react';
import { Modal, Form, Input, Select, Button, Space } from 'antd';
import { DepartmentCreateDTO, Volunteer } from '../../../types';

interface DepartmentFormModalProps {
  open: boolean;
  volunteers: Volunteer[];
  onCancel: () => void;
  onSubmit: (values: DepartmentCreateDTO) => Promise<void>;
}

export const DepartmentFormModal: React.FC<DepartmentFormModalProps> = ({
  open,
  volunteers,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleFinish = async (values: DepartmentCreateDTO) => {
    await onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      title="Create Department"
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="departmentName"
          label="Department Name"
          rules={[{ required: true, message: 'Please enter department name' }]}
        >
          <Input placeholder="Enter department name" />
        </Form.Item>

        <Form.Item
          name="initialHeadId"
          label="Department Head"
          rules={[{ required: true, message: 'Please select a department head' }]}
        >
          <Select
            placeholder="Select department head"
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={volunteers.map(v => ({ label: v.name, value: v.id }))}
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Create
            </Button>
            <Button onClick={onCancel}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

import React, { useEffect } from 'react';
import { Modal, Form, Input, Button, Space } from 'antd';
import { Department, DepartmentUpdateDTO } from '../../../types';

interface DepartmentEditModalProps {
  open: boolean;
  department: Department | null;
  onCancel: () => void;
  onSubmit: (values: DepartmentUpdateDTO) => Promise<void>;
}

export const DepartmentEditModal: React.FC<DepartmentEditModalProps> = ({
  open,
  department,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && department) {
      form.setFieldsValue({ name: department.departmentName });
    } else {
      form.resetFields();
    }
  }, [open, department, form]);

  const handleFinish = async (values: DepartmentUpdateDTO) => {
    await onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      title="Edit Department"
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      footer={null}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="name"
          label="Department Name"
          rules={[{ required: true, message: 'Please enter department name' }]}
        >
          <Input placeholder="Enter department name" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Save Changes
            </Button>
            <Button onClick={onCancel}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

import React from 'react';
import { Modal, Form, Select, Button, Space } from 'antd';
import { Department } from '../../../types';

interface AddDepartmentToEventModalProps {
  open: boolean;
  availableDepartments: Department[];
  onCancel: () => void;
  onSubmit: (departmentIds: string[]) => Promise<void>;
}

export const AddDepartmentToEventModal: React.FC<AddDepartmentToEventModalProps> = ({
  open,
  availableDepartments,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (open) {
      form.resetFields();
    }
  }, [open, form]);

  const handleFinish = async (values: { departmentIds: string[] }) => {
    await onSubmit(values.departmentIds);
    form.resetFields();
  };

  return (
    <Modal
      title="Add Departments to Event"
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="departmentIds"
          label="Departments"
          rules={[{ required: true, message: 'Please select at least one department' }]}
        >
          <Select
            mode="multiple"
            placeholder="Select departments"
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={availableDepartments.map(d => ({ label: d.departmentName, value: d.id }))}
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Add Departments
            </Button>
            <Button onClick={onCancel}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

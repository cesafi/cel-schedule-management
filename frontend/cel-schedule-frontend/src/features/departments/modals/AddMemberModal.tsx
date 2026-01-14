import React from 'react';
import { Modal, Form, Select, Button, Space } from 'antd';
import { AddMemberDTO, Volunteer, MembershipType } from '../../../types';

interface AddMemberModalProps {
  open: boolean;
  availableVolunteers: Volunteer[];
  onCancel: () => void;
  onSubmit: (values: AddMemberDTO) => Promise<void>;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({
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

  const handleFinish = async (values: AddMemberDTO) => {
    await onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      title="Add Member"
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="volunteerId"
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
          name="membershipType"
          label="Role"
          rules={[{ required: true, message: 'Please select a role' }]}
          initialValue={MembershipType.MEMBER}
        >
          <Select>
            <Select.Option value={MembershipType.MEMBER}>Member</Select.Option>
            <Select.Option value={MembershipType.HEAD}>Head</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              Add
            </Button>
            <Button onClick={onCancel}>Cancel</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

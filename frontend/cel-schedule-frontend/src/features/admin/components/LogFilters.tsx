import { Form, Select, DatePicker, Button, Space, Input } from 'antd';
import { LogType } from '../../../types';
import { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

interface LogFiltersProps {
  onFilterChange: (filters: LogFilterValues) => void;
  onReset: () => void;
}

export interface LogFilterValues {
  logType?: LogType;
  userId?: string;
  dateRange?: [Dayjs, Dayjs];
}

export const LogFilters = ({ onFilterChange, onReset }: LogFiltersProps) => {
  const [form] = Form.useForm();

  const handleApply = () => {
    const values = form.getFieldsValue();
    onFilterChange(values);
  };

  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  const logTypeOptions = Object.values(LogType).map((type) => ({
    label: type.replace(/_/g, ' '),
    value: type,
  }));

  return (
    <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
      <Form.Item name="dateRange" label="Date Range">
        <RangePicker
          showTime
          format="YYYY-MM-DD HH:mm"
          placeholder={['Start Date', 'End Date']}
        />
      </Form.Item>

      <Form.Item name="logType" label="Log Type">
        <Select
          placeholder="Select log type"
          allowClear
          style={{ width: 200 }}
          options={logTypeOptions}
        />
      </Form.Item>

      <Form.Item name="userId" label="User ID">
        <Input placeholder="Enter user ID" style={{ width: 200 }} />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" onClick={handleApply}>
            Apply
          </Button>
          <Button onClick={handleReset}>Reset</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

import React, { useState, useMemo } from 'react';
import { Modal, Button, Space, Tag, Table, Tabs, Input, Badge } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';
import { Volunteer, Department } from '../../../types';

const TAB_ALL = '__all__';
const TAB_NO_DEPT = '__no_dept__';

interface AddVolunteerToEventModalProps {
  open: boolean;
  allVolunteers: Volunteer[];
  assignedVolunteerIds: string[];
  departments: Department[];
  onCancel: () => void;
  onSubmit: (volunteerIds: string[]) => Promise<void>;
}

interface VolunteerRow {
  id: string;
  name: string;
  depts: Department[];
  isAssigned: boolean;
}

export const AddVolunteerToEventModal: React.FC<AddVolunteerToEventModalProps> = ({
  open,
  allVolunteers,
  assignedVolunteerIds,
  departments,
  onCancel,
  onSubmit,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>(TAB_ALL);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (open) {
      setSelectedIds([]);
      setActiveTab(TAB_ALL);
      setSearch('');
    }
  }, [open]);

  // Build rows from all non-disabled volunteers
  const allRows: VolunteerRow[] = useMemo(() => {
    return allVolunteers.map(v => ({
      id: v.id,
      name: v.name,
      depts: departments.filter(d => d.volunteerMembers?.some(m => m.volunteerID === v.id)),
      isAssigned: assignedVolunteerIds.includes(v.id),
    }));
  }, [allVolunteers, departments, assignedVolunteerIds]);

  // Departments that actually have volunteers in allRows
  const activeDepts = useMemo(() => {
    return departments.filter(d =>
      allRows.some(r => r.depts.some(rd => rd.id === d.id))
    );
  }, [departments, allRows]);

  // Filter rows by active tab and search term
  const visibleRows = useMemo(() => {
    let rows = allRows;

    if (activeTab === TAB_NO_DEPT) {
      rows = rows.filter(r => r.depts.length === 0);
    } else if (activeTab !== TAB_ALL) {
      rows = rows.filter(r => r.depts.some(d => d.id === activeTab));
    }

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      rows = rows.filter(r => r.name.toLowerCase().includes(term));
    }

    return rows;
  }, [allRows, activeTab, search]);

  const columns: ColumnsType<VolunteerRow> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: VolunteerRow) => (
        <Space>
          <span style={{ color: record.isAssigned ? '#aaa' : undefined }}>{name}</span>
          {record.isAssigned && <Tag color="green">Already Assigned</Tag>}
        </Space>
      ),
    },
    {
      title: 'Departments',
      key: 'depts',
      render: (_: unknown, record: VolunteerRow) =>
        record.depts.length > 0 ? (
          <Space wrap>
            {record.depts.map(d => (
              <Tag key={d.id} color="blue">{d.departmentName}</Tag>
            ))}
          </Space>
        ) : (
          <Tag color="default">No Department</Tag>
        ),
    },
  ];

  const tabItems = [
    {
      key: TAB_ALL,
      label: (
        <Space size={4}>
          All
          <Badge count={allRows.filter(r => !r.isAssigned).length} color="blue" size="small" />
        </Space>
      ),
    },
    ...activeDepts.map(d => ({
      key: d.id,
      label: (
        <Space size={4}>
          {d.departmentName}
          <Badge
            count={allRows.filter(r => !r.isAssigned && r.depts.some(rd => rd.id === d.id)).length}
            color="blue"
            size="small"
          />
        </Space>
      ),
    })),
    {
      key: TAB_NO_DEPT,
      label: (
        <Space size={4}>
          No Department
          <Badge
            count={allRows.filter(r => !r.isAssigned && r.depts.length === 0).length}
            color="blue"
            size="small"
          />
        </Space>
      ),
    },
  ];

  const handleSubmit = async () => {
    if (selectedIds.length === 0) return;
    setSubmitting(true);
    try {
      await onSubmit(selectedIds);
      setSelectedIds([]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Add Volunteers to Event"
      open={open}
      onCancel={() => {
        setSelectedIds([]);
        onCancel();
      }}
      width={700}
      footer={
        <Space>
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            type="primary"
            disabled={selectedIds.length === 0}
            loading={submitting}
            onClick={handleSubmit}
          >
            Add {selectedIds.length > 0 ? `(${selectedIds.length})` : ''} Volunteer{selectedIds.length !== 1 ? 's' : ''}
          </Button>
        </Space>
      }
    >
      <Input
        prefix={<SearchOutlined />}
        placeholder="Search volunteers..."
        allowClear
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 12 }}
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="small"
      />

      <Table<VolunteerRow>
        columns={columns}
        dataSource={visibleRows}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 8, showSizeChanger: false }}
        rowSelection={{
          type: 'checkbox',
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys as string[]),
          getCheckboxProps: (record: VolunteerRow) => ({
            disabled: record.isAssigned,
          }),
        }}
        scroll={{ y: 300 }}
      />
    </Modal>
  );
};

// src/pages/Admin/Classes/partials/partials/ActivityManager.jsx
import React, { useEffect, useState } from 'react';
import { 
  Table, Button, Modal, Form, Input, message, Popconfirm, Space, Typography, Empty 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined, AppstoreOutlined 
} from '@ant-design/icons';
import * as ActivityQuery from '../../../../../data/Center/activityQuery';

const { TextArea } = Input;

export default function ActivityManager({ slot }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [form] = Form.useForm();

  const fetchActivities = async () => {
    setLoading(true);
    const data = await ActivityQuery.getActivitiesBySlot(slot.id);
    setActivities(data);
    setLoading(false);
  };

  useEffect(() => {
    if (slot?.id) fetchActivities();
  }, [slot?.id]);

  const handleOpenModal = (activity = null) => {
    setEditingActivity(activity);
    if (activity) {
      form.setFieldsValue({
        name: activity.name,
        description: activity.description,
        link: activity.link
      });
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSave = async (values) => {
    const payload = {
      slotId: slot.id,
      name: values.name,
      description: values.description || '',
      link: values.link || ''
    };

    const result = editingActivity 
      ? await ActivityQuery.updateActivity(editingActivity.id, payload)
      : await ActivityQuery.addActivity(payload);

    if (result.success) {
      message.success(editingActivity ? "Activity updated" : "Activity added");
      setIsModalOpen(false);
      fetchActivities();
    } else {
      message.error(result.message);
    }
  };

  const handleDelete = async (id) => {
    const result = await ActivityQuery.deleteActivity(id);
    if (result.success) {
      message.success("Activity deleted");
      fetchActivities();
    } else {
      message.error(result.message);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', width: '20%' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { 
      title: 'Link', 
      key: 'link', 
      render: (_, r) => r.link ? <a href={r.link} target="_blank" rel="noreferrer"><LinkOutlined /> Source</a> : null 
    },
    {
      title: '',
      key: 'action',
      width: 80,
      render: (_, r) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenModal(r)} />
          <Popconfirm title="Delete?" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '10px 20px', background: '#fafafa', borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <Typography.Text strong><AppstoreOutlined /> Activities</Typography.Text>
        <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Add Activity
        </Button>
      </div>
      
      <Table 
        columns={columns}
        dataSource={activities}
        rowKey="id"
        pagination={false}
        loading={loading}
        locale={{ emptyText: <Empty description="No activities found" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
      />

      <Modal
        title={editingActivity ? "Edit Activity" : "New Activity"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Activity Name" rules={[{ required: true, message: 'Please enter a name' }]}>
            <Input placeholder="e.g. Quiz, Group Discussion" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={2} placeholder="Instructions or details..." />
          </Form.Item>
          <Form.Item name="link" label="Source / Link">
            <Input prefix={<LinkOutlined />} placeholder="https://..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
// src/pages/Admin/Shifts/AdminShifts.jsx
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, DatePicker, Select, Space, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getAllShifts, addShift, updateShift, deleteShift } from '../../../data/Shifts/shiftQuery';
import { getAllUsers } from '../../../data/Users/userQuery';

const { RangePicker } = DatePicker;

const AdminShifts = () => {
  const [shifts, setShifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const shiftsData = await getAllShifts();
    const usersData = await getAllUsers();
    setShifts(shiftsData);
    setUsers(usersData);
  };

  const handleAddClick = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditClick = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      userId: record.userId,
      timeRange: [dayjs(record.startTime), dayjs(record.endTime)],
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    const res = await deleteShift(id);
    if (res.success) {
      message.success('Shift deleted successfully');
      fetchData();
    } else {
      message.error('Failed to delete shift');
    }
  };

  const handleModalSubmit = async (values) => {
    const selectedUser = users.find(u => u.id === values.userId);
    const shiftData = {
      name: values.name,
      description: values.description || '',
      userId: selectedUser.id,
      username: selectedUser.username,
      employeeName: selectedUser.name,
      startTime: values.timeRange[0].toISOString(),
      endTime: values.timeRange[1].toISOString(),
    };

    if (editingId) {
      const res = await updateShift(editingId, shiftData);
      if (res.success) message.success('Shift updated successfully');
    } else {
      const res = await addShift(shiftData);
      if (res.success) message.success('Shift added successfully');
    }
    
    setIsModalVisible(false);
    fetchData();
  };

  const columns = [
    { title: 'Tên Ca', dataIndex: 'name', key: 'name' },
    { title: 'Nhân viên', dataIndex: 'employeeName', key: 'employeeName' },
    { title: 'Tài khoản', dataIndex: 'username', key: 'username' },
    { 
      title: 'Bắt đầu', 
      dataIndex: 'startTime', 
      key: 'startTime',
      render: (text) => dayjs(text).format('DD/MM/YYYY HH:mm')
    },
    { 
      title: 'Kết thúc', 
      dataIndex: 'endTime', 
      key: 'endTime',
      render: (text) => dayjs(text).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEditClick(record)} type="primary" ghost />
          <Popconfirm title="Bạn có chắc muốn xóa ca này?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Quản lý Ca làm (Shifts)</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClick}>
          Thêm Ca làm
        </Button>
      </div>

      <Table dataSource={shifts} columns={columns} rowKey="id" />

      <Modal
        title={editingId ? 'Chỉnh sửa Ca làm' : 'Thêm Ca làm mới'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleModalSubmit}>
          <Form.Item name="name" label="Tên Ca làm" rules={[{ required: true, message: 'Vui lòng nhập tên ca' }]}>
            <Input placeholder="Vd: Ca sáng, Ca tối..." />
          </Form.Item>
          
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} placeholder="Mô tả công việc trong ca..." />
          </Form.Item>

          <Form.Item name="userId" label="Nhân viên" rules={[{ required: true, message: 'Vui lòng chọn nhân viên' }]}>
            <Select placeholder="Chọn nhân viên" showSearch optionFilterProp="children">
              {users.map(user => (
                <Select.Option key={user.id} value={user.id}>
                  {user.name} ({user.username} - {user.role})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="timeRange" label="Thời gian" rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}>
            <RangePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminShifts;
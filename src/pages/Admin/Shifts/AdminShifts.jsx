// src/pages/Admin/Shifts/AdminShifts.jsx
import React, { useState, useEffect } from 'react';
import { 
  Button, Modal, Form, Input, DatePicker, Select, Space, 
  Popconfirm, message, Card, Typography, Tag, TimePicker 
} from 'antd';
import { 
  EditOutlined, DeleteOutlined, PlusOutlined, 
  LeftOutlined, RightOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getAllShifts, addShift, updateShift, deleteShift } from '../../../data/Shifts/shiftQuery';
import { getAllUsers } from '../../../data/Users/userQuery';

const { Title, Text } = Typography;

const AdminShifts = () => {
  const [shifts, setShifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
  
  // Weekly View State
  const [currentWeekStart, setCurrentWeekStart] = useState(dayjs().startOf('week').add(1, 'day')); // Start on Monday

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
    // Default values for new shift
    form.setFieldsValue({
      date: dayjs(),
      timeSlot: '08:00-11:00'
    });
    setIsModalVisible(true);
  };

  const handleEditClick = (record) => {
    setEditingId(record.id);
    const startDayjs = dayjs(record.startTime);
    const endDayjs = dayjs(record.endTime);
    
    const startStr = startDayjs.format('HH:mm');
    const endStr = endDayjs.format('HH:mm');
    const slotStr = `${startStr}-${endStr}`;
    const isPreset = ['08:00-11:00', '13:00-17:00', '15:00-19:00'].includes(slotStr);

    // Support backward compatibility if old shifts only have a single userId
    const userIds = record.users ? record.users.map(u => u.id) : (record.userId ? [record.userId] : []);

    form.setFieldsValue({
      name: record.name,
      description: record.description,
      userIds: userIds,
      date: startDayjs,
      timeSlot: isPreset ? slotStr : 'custom',
      customTime: isPreset ? null : [startDayjs, endDayjs],
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    const res = await deleteShift(id);
    if (res.success) {
      message.success('Đã xóa ca làm việc');
      fetchData();
    } else {
      message.error('Lỗi khi xóa ca làm việc');
    }
  };

  const handleModalSubmit = async (values) => {
    // 1. Gather Users
    const selectedUsers = users
      .filter(u => values.userIds.includes(u.id))
      .map(u => ({ id: u.id, name: u.name, username: u.username }));

    // 2. Parse Date & Time
    const dateStr = values.date.format('YYYY-MM-DD');
    let startStr, endStr;
    
    if (values.timeSlot === 'custom') {
      startStr = values.customTime[0].format('HH:mm');
      endStr = values.customTime[1].format('HH:mm');
    } else {
      [startStr, endStr] = values.timeSlot.split('-');
    }

    const startTime = dayjs(`${dateStr} ${startStr}`).toISOString();
    const endTime = dayjs(`${dateStr} ${endStr}`).toISOString();

    const shiftData = {
      name: values.name,
      description: values.description || '',
      users: selectedUsers,
      startTime,
      endTime,
    };

    if (editingId) {
      const res = await updateShift(editingId, shiftData);
      if (res.success) message.success('Đã cập nhật ca làm việc');
    } else {
      const res = await addShift(shiftData);
      if (res.success) message.success('Đã thêm ca làm việc mới');
    }
    
    setIsModalVisible(false);
    fetchData();
  };

  // Week Navigation Helpers
  const nextWeek = () => setCurrentWeekStart(prev => prev.add(1, 'week'));
  const prevWeek = () => setCurrentWeekStart(prev => prev.subtract(1, 'week'));
  const currentWeek = () => setCurrentWeekStart(dayjs().startOf('week').add(1, 'day'));

  const weekDays = Array.from({ length: 7 }).map((_, i) => currentWeekStart.add(i, 'day'));
  const dayNamesVN = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>Lịch làm việc (Schedule)</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddClick}>
          Thêm Ca làm
        </Button>
      </div>

      {/* Week Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, backgroundColor: '#fff', padding: '12px 20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Button icon={<LeftOutlined />} onClick={prevWeek}>Tuần trước</Button>
        <Space size="large">
          <Title level={5} style={{ margin: 0 }}>
            {weekDays[0].format('DD/MM/YYYY')} - {weekDays[6].format('DD/MM/YYYY')}
          </Title>
          <Button onClick={currentWeek}>Tuần này</Button>
        </Space>
        <Button onClick={nextWeek}>Tuần sau <RightOutlined /></Button>
      </div>

      {/* Weekly Schedule Grid */}
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px' }}>
        {weekDays.map(day => {
          // Filter shifts that fall on this specific day
          const dayShifts = shifts.filter(s => dayjs(s.startTime).isSame(day, 'day'))
            .sort((a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf());

          const isToday = day.isSame(dayjs(), 'day');

          return (
            <Card 
              key={day.format('YYYY-MM-DD')} 
              title={
                <div style={{ textAlign: 'center', color: isToday ? '#1677ff' : 'inherit' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{dayNamesVN[day.day()]}</div>
                  <div style={{ fontSize: '13px', fontWeight: 'normal' }}>{day.format('DD/MM')}</div>
                </div>
              }
              style={{ 
                minWidth: '260px', 
                flex: 1, 
                backgroundColor: isToday ? '#e6f4ff' : '#f5f5f5',
                border: isToday ? '1px solid #91caff' : '1px solid #f0f0f0'
              }}
              headStyle={{ padding: '10px' }}
              bodyStyle={{ padding: '12px', minHeight: '300px' }}
            >
              {dayShifts.length === 0 ? (
                <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: '20px' }}>Không có ca làm</Text>
              ) : (
                dayShifts.map(shift => (
                  <Card 
                    key={shift.id} 
                    size="small" 
                    style={{ marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                    title={<Text strong>{shift.name}</Text>}
                    extra={
                      <Space size="small">
                        <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleEditClick(shift)} />
                        <Popconfirm title="Xóa ca này?" onConfirm={() => handleDelete(shift.id)}>
                          <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Space>
                    }
                  >
                    <div style={{ marginBottom: '8px', color: '#555' }}>
                      <b>⏰</b> {dayjs(shift.startTime).format('HH:mm')} - {dayjs(shift.endTime).format('HH:mm')}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {shift.users ? (
                        shift.users.map(u => <Tag color="blue" key={u.id}>{u.name}</Tag>)
                      ) : (
                        // Fallback for old records
                        <Tag color="blue">{shift.employeeName}</Tag>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </Card>
          )
        })}
      </div>

      <Modal
        title={editingId ? 'Chỉnh sửa Ca làm' : 'Thêm Ca làm mới'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleModalSubmit}>
          <Form.Item name="name" label="Tên Ca làm" rules={[{ required: true, message: 'Vui lòng nhập tên ca' }]}>
            <Input placeholder="Vd: Ca sáng, Ca tối..." />
          </Form.Item>
          
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} placeholder="Mô tả công việc trong ca..." />
          </Form.Item>

          <Form.Item name="userIds" label="Nhân viên" rules={[{ required: true, message: 'Vui lòng chọn ít nhất 1 nhân viên' }]}>
            <Select 
              mode="multiple" 
              placeholder="Chọn các nhân viên" 
              showSearch 
              optionFilterProp="children"
            >
              {users.map(user => (
                <Select.Option key={user.id} value={user.id}>
                  {user.name} ({user.username} - {user.role})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Space style={{ display: 'flex', marginBottom: 8 }} align="start">
            <Form.Item name="date" label="Ngày làm việc" rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}>
              <DatePicker format="DD/MM/YYYY" style={{ width: 160 }} />
            </Form.Item>

            <Form.Item name="timeSlot" label="Khung giờ" rules={[{ required: true }]}>
              <Select style={{ width: 180 }}>
                <Select.Option value="08:00-11:00">08:00 to 11:00</Select.Option>
                <Select.Option value="13:00-17:00">13:00 to 17:00</Select.Option>
                <Select.Option value="15:00-19:00">15:00 to 19:00</Select.Option>
                <Select.Option value="custom">Tùy chỉnh (Khác)</Select.Option>
              </Select>
            </Form.Item>
          </Space>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.timeSlot !== currentValues.timeSlot}
          >
            {({ getFieldValue }) =>
              getFieldValue('timeSlot') === 'custom' ? (
                <Form.Item name="customTime" label="Thời gian tùy chỉnh" rules={[{ required: true, message: 'Chọn thời gian tùy chỉnh' }]}>
                  <TimePicker.RangePicker format="HH:mm" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminShifts;
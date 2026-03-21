import React, { useState, useEffect } from 'react';
import { Button, Space, Popconfirm, message, Card, Typography, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, LeftOutlined, RightOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { getAllShifts, addShift, updateShift, deleteShift } from '../../../data/Shifts/shiftQuery';
import { getAllUsers } from '../../../data/Users/userQuery';

import ShiftModal from './partials/ShiftModal';
import BulkShiftModal from './partials/BulkShiftModal';

dayjs.extend(isoWeek);

const { Title, Text } = Typography;

const AdminShifts = () => {
  const [shifts, setShifts] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Modals state
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  
  // Ensure we start exactly on Monday of the current ISO week
  const [currentWeekStart, setCurrentWeekStart] = useState(dayjs().startOf('isoWeek'));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const shiftsData = await getAllShifts();
    const usersData = await getAllUsers();
    setShifts(shiftsData);
    setUsers(usersData);
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

  // --- Modal Submit Handlers --- //

  const handleSingleShiftSubmit = async (values, shiftId) => {
    const selectedUsers = values.userIds && values.userIds.length > 0 
      ? users.filter(u => values.userIds.includes(u.id)).map(u => ({ id: u.id, name: u.name, username: u.username }))
      : [];

    const dateStr = values.date.format('YYYY-MM-DD');
    let startStr, endStr;
    
    if (values.timeSlot === 'custom') {
      startStr = values.customTime[0].format('HH:mm');
      endStr = values.customTime[1].format('HH:mm');
    } else {
      [startStr, endStr] = values.timeSlot.split('-');
    }

    const shiftData = {
      name: values.name,
      description: values.description || '',
      users: selectedUsers,
      startTime: dayjs(`${dateStr} ${startStr}`).toISOString(),
      endTime: dayjs(`${dateStr} ${endStr}`).toISOString(),
    };

    if (shiftId) {
      const res = await updateShift(shiftId, shiftData);
      if (res.success) message.success('Đã cập nhật ca làm việc');
    } else {
      const res = await addShift(shiftData);
      if (res.success) message.success('Đã thêm ca làm việc mới');
    }
    
    setIsShiftModalOpen(false);
    fetchData();
  };

  const handleBulkShiftSubmit = async (startOfWeek) => {
    setIsBulkModalOpen(false);
    const hideLoading = message.loading('Đang tạo lịch mặc định, vui lòng chờ...', 0);
    
    try {
      const newShifts = [];
      
      // Loop 7 days to create default shifts
      for (let i = 0; i < 7; i++) {
        const currentDay = startOfWeek.add(i, 'day');
        const dateStr = currentDay.format('YYYY-MM-DD');
        const isWeekend = (i === 5 || i === 6); // 5 = Saturday, 6 = Sunday 
        
        if (!isWeekend) {
          // Mon - Fri
          newShifts.push({
            name: 'Ca Chiều',
            description: 'Lịch mặc định',
            users: [], // Employees are empty by default
            startTime: dayjs(`${dateStr} 15:00`).toISOString(),
            endTime: dayjs(`${dateStr} 19:00`).toISOString(),
          });
        } else {
          // Sat - Sun (2 Shifts)
          newShifts.push({
            name: 'Ca Sáng',
            description: 'Lịch mặc định',
            users: [],
            startTime: dayjs(`${dateStr} 07:30`).toISOString(),
            endTime: dayjs(`${dateStr} 11:00`).toISOString(),
          });
          newShifts.push({
            name: 'Ca Chiều',
            description: 'Lịch mặc định',
            users: [],
            startTime: dayjs(`${dateStr} 13:00`).toISOString(),
            endTime: dayjs(`${dateStr} 17:00`).toISOString(),
          });
        }
      }
      
      // Execute all additions simultaneously
      await Promise.all(newShifts.map(shift => addShift(shift)));
      
      hideLoading();
      message.success('Đã tạo lịch mặc định thành công!');
      
      // Jump view to the week just created
      setCurrentWeekStart(startOfWeek);
      fetchData();
    } catch (error) {
      hideLoading();
      message.error('Có lỗi xảy ra khi tạo lịch.');
    }
  };

  // --- Week Navigation --- //
  const nextWeek = () => setCurrentWeekStart(prev => prev.add(1, 'week'));
  const prevWeek = () => setCurrentWeekStart(prev => prev.subtract(1, 'week'));
  const currentWeek = () => setCurrentWeekStart(dayjs().startOf('isoWeek'));

  const weekDays = Array.from({ length: 7 }).map((_, i) => currentWeekStart.add(i, 'day'));
  const dayNamesVN = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Space>
          <Button type="dashed" icon={<CalendarOutlined />} onClick={() => setIsBulkModalOpen(true)}>
            Thêm Tuần
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingShift(null); setIsShiftModalOpen(true); }}>
            Thêm Ca
          </Button>
        </Space>
      </div>

      {/* Week Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, backgroundColor: '#fff', padding: '12px 20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Button icon={<LeftOutlined />} onClick={prevWeek}>Tuần trước</Button>
        
        <Button onClick={nextWeek}>Tuần sau <RightOutlined /></Button>
      </div>

      {/* Weekly Schedule Grid */}
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px' }}>
        {weekDays.map(day => {
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
                minWidth: '260px', flex: 1, 
                backgroundColor: isToday ? '#e6f4ff' : '#f5f5f5',
                border: isToday ? '1px solid #91caff' : '1px solid #f0f0f0'
              }}
              headStyle={{ padding: '10px' }} bodyStyle={{ padding: '12px', minHeight: '300px' }}
            >
              {dayShifts.length === 0 ? (
                <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginTop: '20px' }}>Chưa có ca làm</Text>
              ) : (
                dayShifts.map(shift => (
                  <Card 
                    key={shift.id} 
                    size="small" 
                    style={{ marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
                    title={<Text strong>{shift.name}</Text>}
                    extra={
                      <Space size="small">
                        <Button size="small" type="text" icon={<EditOutlined />} onClick={() => { setEditingShift(shift); setIsShiftModalOpen(true); }} />
                        <Popconfirm title="Xóa ca này?" onConfirm={() => handleDelete(shift.id)}>
                          <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      </Space>
                    }
                  >
                    <div style={{ marginBottom: '8px', color: '#555' }}>
                      <b>⏰</b> {dayjs(shift.startTime).format('HH:mm')} - {dayjs(shift.endTime).format('HH:mm')}
                    </div>
                    
                    {/* Display Who is Assigned (Phân công) */}
                    <div style={{ marginBottom: '8px' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>Phân công:</Text>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {shift.users && shift.users.length > 0 ? (
                          shift.users.map(u => <Tag color="blue" key={u.id}>{u.name}</Tag>)
                        ) : (shift.employeeName ? (
                          <Tag color="blue">{shift.employeeName}</Tag>
                        ) : (
                          <Tag color="default">Chưa xếp người</Tag>
                        ))}
                      </div>
                    </div>

                    {/* Display Who Registered (Đã đăng ký) */}
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Đã đăng ký ({shift.registers ? shift.registers.length : 0}):
                      </Text>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                        {shift.registers && shift.registers.length > 0 ? (
                          shift.registers.map(r => (
                            <Tag color="green" key={r.id}>{r.name}</Tag>
                          ))
                        ) : (
                          <Text type="secondary" style={{ fontSize: '12px' }}>Chưa có ai</Text>
                        )}
                      </div>
                    </div>
                    
                  </Card>
                ))
              )}
            </Card>
          )
        })}
      </div>

      <ShiftModal
        open={isShiftModalOpen}
        onCancel={() => setIsShiftModalOpen(false)}
        onSubmit={handleSingleShiftSubmit}
        shiftData={editingShift}
        users={users}
      />

      <BulkShiftModal
        open={isBulkModalOpen}
        onCancel={() => setIsBulkModalOpen(false)}
        onSubmit={handleBulkShiftSubmit}
      />
    </div>
  );
};

export default AdminShifts;
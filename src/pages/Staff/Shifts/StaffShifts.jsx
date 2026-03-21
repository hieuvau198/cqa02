import React, { useState, useEffect } from 'react';
import { Button, Space, message, Card, Typography, Tag } from 'antd';
import { LeftOutlined, RightOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { getAllShifts, toggleShiftRegistration } from '../../../data/Shifts/shiftQuery';
import { useAuth } from '../../../context/AuthContext';

dayjs.extend(isoWeek);

const { Text } = Typography;

const StaffShifts = () => {
  const { user } = useAuth(); // Get current logged-in staff
  const [shifts, setShifts] = useState([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(dayjs().startOf('isoWeek'));
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    fetchData();
  }, [currentWeekStart]);

  const fetchData = async () => {
    const shiftsData = await getAllShifts();
    setShifts(shiftsData);
  };

  const handleToggleRegistration = async (shift, isCurrentlyRegistered) => {
    if (!user) return message.error("Không tìm thấy thông tin người dùng!");
    
    setLoadingAction(true);
    const res = await toggleShiftRegistration(shift.id, user, !isCurrentlyRegistered);
    
    if (res.success) {
      message.success(isCurrentlyRegistered ? 'Đã hủy đăng ký ca làm' : 'Đăng ký ca làm thành công');
      await fetchData(); // Refresh data to show updated registers
    } else {
      message.error(res.message);
    }
    setLoadingAction(false);
  };

  // --- Week Navigation --- //
  const nextWeek = () => setCurrentWeekStart(prev => prev.add(1, 'week'));
  const prevWeek = () => setCurrentWeekStart(prev => prev.subtract(1, 'week'));

  const weekDays = Array.from({ length: 7 }).map((_, i) => currentWeekStart.add(i, 'day'));
  const dayNamesVN = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ marginBottom: 24 }}>
        <Typography.Title level={3}>Đăng Ký Ca Làm Việc</Typography.Title>
        <Text type="secondary">Xem lịch và đăng ký các ca làm việc trong tuần</Text>
      </div>

      {/* Week Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, backgroundColor: '#fff', padding: '12px 20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <Button icon={<LeftOutlined />} onClick={prevWeek}>Tuần trước</Button>
        <Text strong>
          Tuần từ {currentWeekStart.format('DD/MM/YYYY')} đến {currentWeekStart.add(6, 'day').format('DD/MM/YYYY')}
        </Text>
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
                dayShifts.map(shift => {
                  const registers = shift.registers || [];
                  const isRegistered = registers.some(r => r.id === user?.id);
                  const isPast = dayjs(shift.startTime).isBefore(dayjs());

                  return (
                    <Card 
                      key={shift.id} 
                      size="small" 
                      style={{ 
                        marginBottom: 12, 
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        borderColor: isRegistered ? '#91caff' : '#f0f0f0'
                      }}
                      title={
                        <Space>
                          <Text strong>{shift.name}</Text>
                          {isRegistered && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                        </Space>
                      }
                    >
                      <div style={{ marginBottom: '8px', color: '#555' }}>
                        <b>⏰</b> {dayjs(shift.startTime).format('HH:mm')} - {dayjs(shift.endTime).format('HH:mm')}
                      </div>

                      {/* Display Who is Assigned (From Admin) */}
                      {shift.users && shift.users.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>Phân công:</Text>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                            {shift.users.map(u => <Tag color="blue" key={u.id}>{u.name}</Tag>)}
                          </div>
                        </div>
                      )}

                      {/* Display Who Registered */}
                      <div style={{ marginBottom: '12px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Đã đăng ký ({registers.length}):</Text>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                          {registers.length > 0 ? (
                            registers.map(r => (
                              <Tag color={r.id === user?.id ? "green" : "default"} key={r.id}>
                                {r.name}
                              </Tag>
                            ))
                          ) : (
                            <Text type="secondary" style={{ fontSize: '12px' }}>Chưa có ai</Text>
                          )}
                        </div>
                      </div>

                      {/* Registration Action */}
                      <Button 
                        block 
                        type={isRegistered ? "default" : "primary"}
                        danger={isRegistered}
                        disabled={isPast || loadingAction}
                        onClick={() => handleToggleRegistration(shift, isRegistered)}
                      >
                        {isRegistered ? 'Hủy đăng ký' : 'Đăng ký ca này'}
                      </Button>
                    </Card>
                  )
                })
              )}
            </Card>
          )
        })}
      </div>
    </div>
  );
};

export default StaffShifts;
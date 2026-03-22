// src/pages/Staff/Shifts/StaffShifts.jsx
import React, { useState, useEffect } from 'react';
import { Button, message, Typography, Tag, Spin } from 'antd';
import { 
  LeftOutlined, 
  RightOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { getAllShifts, toggleShiftRegistration } from '../../../data/Shifts/shiftQuery';
import { useAuth } from '../../../context/AuthContext';

dayjs.extend(isoWeek);

const { Title, Text } = Typography;

const StaffShifts = () => {
  const { user } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(dayjs().startOf('isoWeek'));
  const [loadingAction, setLoadingAction] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [currentWeekStart]);

  const fetchData = async () => {
    setInitialLoading(true);
    const shiftsData = await getAllShifts();
    setShifts(shiftsData);
    setInitialLoading(false);
  };

  const handleToggleRegistration = async (shift, isCurrentlyRegistered) => {
    if (!user) return message.error("Không tìm thấy thông tin người dùng!");
    
    setLoadingAction(true);
    const res = await toggleShiftRegistration(shift.id, user, !isCurrentlyRegistered);
    
    if (res.success) {
      message.success(isCurrentlyRegistered ? 'Đã hủy đăng ký ca làm' : 'Đăng ký ca làm thành công');
      await fetchData();
    } else {
      message.error(res.message);
    }
    setLoadingAction(false);
  };

  const nextWeek = () => setCurrentWeekStart(prev => prev.add(1, 'week'));
  const prevWeek = () => setCurrentWeekStart(prev => prev.subtract(1, 'week'));

  const weekDays = Array.from({ length: 7 }).map((_, i) => currentWeekStart.add(i, 'day'));
  const dayNamesVN = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  return (
    <div className="pb-8">
      {/* Header & Week Navigation */}
      <div className="mb-6">
        <Title level={3} className="!mb-4 !text-gray-800 flex items-center gap-2">
          <CalendarOutlined className="text-blue-500" />
          Đăng ký ca làm
        </Title>
        
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 gap-4">
          <Button 
            icon={<LeftOutlined />} 
            onClick={prevWeek}
            className="w-full sm:w-auto rounded-xl hover:!border-blue-500 hover:!text-blue-500 transition-all"
          >
            Tuần trước
          </Button>
          
          
          <Button 
            onClick={nextWeek}
            className="w-full sm:w-auto rounded-xl flex items-center justify-center hover:!border-blue-500 hover:!text-blue-500 transition-all"
          >
            Tuần sau <RightOutlined className="ml-1" />
          </Button>
        </div>
      </div>

      {/* Weekly Schedule Grid */}
      {initialLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar">
          {weekDays.map(day => {
            const dayShifts = shifts
              .filter(s => dayjs(s.startTime).isSame(day, 'day'))
              .sort((a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf());

            const isToday = day.isSame(dayjs(), 'day');

            return (
              <div 
                key={day.format('YYYY-MM-DD')} 
                className={`min-w-[280px] sm:min-w-[320px] max-w-[350px] flex-1 snap-start rounded-3xl border flex flex-col transition-colors
                  ${isToday ? 'bg-blue-50/40 border-blue-200 shadow-sm' : 'bg-gray-50/50 border-gray-200'}`}
              >
                {/* Day Header */}
                <div className={`p-4 text-center border-b rounded-t-3xl ${isToday ? 'border-blue-100 bg-blue-100/30' : 'border-gray-200'}`}>
                  <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                    {dayNamesVN[day.day()]}
                  </div>
                  <div className={`text-sm ${isToday ? 'text-blue-500 font-medium' : 'text-gray-500'}`}>
                    {day.format('DD/MM')}
                  </div>
                </div>

                {/* Day Content */}
                <div className="p-3 flex-1 flex flex-col gap-3">
                  {dayShifts.length === 0 ? (
                    <div className="text-gray-400 text-center py-8 text-sm italic">
                      Chưa có ca làm
                    </div>
                  ) : (
                    dayShifts.map(shift => {
                      const registers = shift.registers || [];
                      const isRegistered = registers.some(r => r.id === user?.id);
                      const isPast = dayjs(shift.startTime).isBefore(dayjs());

                      return (
                        <div 
                          key={shift.id} 
                          className={`bg-white rounded-2xl p-4 shadow-sm border transition-all duration-300
                            ${isRegistered ? 'border-green-400 ring-1 ring-green-100' : 'border-gray-100 hover:border-blue-200 hover:shadow-md'}
                            ${isPast ? 'opacity-70' : ''}
                          `}
                        >
                          {/* Shift Header */}
                          <div className="flex justify-between items-start mb-3">
                            <span className="font-bold text-gray-800 text-base">{shift.name}</span>
                            {isRegistered && <CheckCircleOutlined className="text-green-500 text-xl" />}
                          </div>

                          {/* Time */}
                          <div className="flex items-center text-gray-600 text-sm mb-4 bg-gray-50 p-2 rounded-lg font-medium w-fit">
                            <ClockCircleOutlined className="mr-2 text-blue-500" /> 
                            {dayjs(shift.startTime).format('HH:mm')} - {dayjs(shift.endTime).format('HH:mm')}
                          </div>

                          {/* Assigned Users */}
                          {shift.users && shift.users.length > 0 && (
                            <div className="mb-3">
                              <Text className="text-xs text-gray-400 uppercase tracking-wider font-semibold block mb-1">Phân công:</Text>
                              <div className="flex flex-wrap gap-1.5">
                                {shift.users.map(u => (
                                  <Tag className="!m-0 !rounded-md border-blue-200 bg-blue-50 text-blue-600" key={u.id}>
                                    {u.name}
                                  </Tag>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Registered Users */}
                          <div className="mb-4">
                            <Text className="text-xs text-gray-400 uppercase tracking-wider font-semibold block mb-1">
                              Đã đăng ký ({registers.length}):
                            </Text>
                            <div className="flex flex-wrap gap-1.5">
                              {registers.length > 0 ? (
                                registers.map(r => (
                                  <Tag 
                                    className={`!m-0 !rounded-md ${r.id === user?.id ? "border-green-300 bg-green-50 text-green-700 font-medium" : ""}`} 
                                    key={r.id}
                                  >
                                    {r.name}
                                  </Tag>
                                ))
                              ) : (
                                <Text className="text-xs text-gray-400 italic">Chưa có ai</Text>
                              )}
                            </div>
                          </div>

                          {/* Action Button */}
                          <Button 
                            block 
                            size="large"
                            type={isRegistered ? "default" : "primary"}
                            danger={isRegistered}
                            disabled={isPast || loadingAction}
                            onClick={() => handleToggleRegistration(shift, isRegistered)}
                            className={`rounded-xl font-medium ${!isRegistered && !isPast ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-200 shadow-sm' : ''}`}
                          >
                            {isRegistered ? 'Hủy đăng ký' : 'Đăng ký ca này'}
                          </Button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Custom styles to hide scrollbar but keep functionality */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default StaffShifts;
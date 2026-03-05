import React, { useState, useEffect } from 'react';
import { Typography, Spin, message } from 'antd';
import dayjs from 'dayjs';
import AttendanceFilter from './partials/AttendanceFilter';
import SlotList from './partials/SlotList';
import { getSlotsByDateFilter } from '../../../data/Center/classQuery';

const { Title } = Typography;

const StaffAttendance = () => {
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState([]);
  
  // Filter States
  const [filterMode, setFilterMode] = useState('date'); // 'date' or 'month'
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  useEffect(() => {
    fetchSlots();
  }, [filterMode, selectedDate]); // Refetch when date changes

  const fetchSlots = async () => {
    setLoading(true);
    try {
      let fetchedSlots = [];
      if (filterMode === 'date') {
        const dateStr = selectedDate.format('YYYY-MM-DD');
        fetchedSlots = await getSlotsByDateFilter(dateStr);
      } else {
        const startOfMonth = selectedDate.startOf('month').format('YYYY-MM-DD');
        const endOfMonth = selectedDate.endOf('month').format('YYYY-MM-DD');
        fetchedSlots = await getSlotsByDateFilter(startOfMonth, endOfMonth);
      }
      setSlots(fetchedSlots);
    } catch (error) {
      message.error("Lỗi khi tải dữ liệu lớp học.");
    }
    setLoading(false);
  };

  // Client-side filtering for Grade and Subject 
  // (Assuming your slot objects have gradeId and subjectId attached. If they are attached to the 'class' object, 
  // you might need to hydrate them or attach them when creating slots).
  const filteredSlots = slots.filter(slot => {
    const matchGrade = selectedGrade ? slot.gradeId === selectedGrade : true;
    const matchSubject = selectedSubject ? slot.subjectId === selectedSubject : true;
    return matchGrade && matchSubject;
  });

  return (
    <div>
      <Title level={3}>Điểm danh lớp học</Title>
      
      <AttendanceFilter 
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedGrade={selectedGrade}
        setSelectedGrade={setSelectedGrade}
        selectedSubject={selectedSubject}
        setSelectedSubject={setSelectedSubject}
      />

      <div style={{ marginTop: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <SlotList slots={filteredSlots} />
        )}
      </div>
    </div>
  );
};

export default StaffAttendance;
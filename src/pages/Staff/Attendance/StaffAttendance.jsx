import React, { useState, useEffect } from 'react';
import { Typography, Spin, message, Modal, List, Radio, Button } from 'antd';
import dayjs from 'dayjs';
import AttendanceFilter from './partials/AttendanceFilter';
import SlotList from './partials/SlotList';
import { getSlotsByDateFilter, updateSlot, getClassById } from '../../../data/Center/classQuery'; 
import { getClassMembers } from '../../../data/Center/classMember';

const { Title, Text } = Typography;

// HELPER: Remove Vietnamese accents for flexible searching
const removeVietnameseTones = (str) => {
  if (!str) return "";
  return str
    .normalize('NFD') // Decompose combined characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/đ/g, 'd') // Replace special Vietnamese 'đ'
    .replace(/Đ/g, 'D') // Replace special Vietnamese 'Đ'
    .toLowerCase()
    .trim();
};

const StaffAttendance = () => {
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState([]);
  
  // State to hold class details (grade, subject, members, name)
  const [classDetails, setClassDetails] = useState({});
  
  // Filter States
  const [filterMode, setFilterMode] = useState('date');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  
  // Search state
  const [searchText, setSearchText] = useState('');

  // --- Attendance States ---
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [currentAttendanceSlot, setCurrentAttendanceSlot] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [fetchingStudents, setFetchingStudents] = useState(false);

  useEffect(() => {
    fetchSlots();
  }, [filterMode, selectedDate]); 

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
      
      // Fetch class info and members for these slots for the filters to work
      const uniqueClassIds = [...new Set(fetchedSlots.map(s => s.classId).filter(Boolean))];
      const newDetails = {};
      
      await Promise.all(uniqueClassIds.map(async (classId) => {
        const classInfo = await getClassById(classId);
        const members = await getClassMembers(classId);
        newDetails[classId] = { 
            ...(classInfo || {}), 
            members: members || [] 
        };
      }));
      
      setClassDetails(prev => ({ ...prev, ...newDetails }));
      setSlots(fetchedSlots);
      
    } catch (error) {
      message.error("Lỗi khi tải dữ liệu lớp học.");
    }
    setLoading(false);
  };

  const filteredSlots = slots.filter(slot => {
    const cDetail = classDetails[slot.classId] || {};
    
    // Compare with class.grade and class.subject
    const matchGrade = selectedGrade ? cDetail.grade === selectedGrade : true;
    const matchSubject = selectedSubject ? cDetail.subject === selectedSubject : true;
    
    // Check search text against class name OR student names (Unaccented comparison)
    let matchSearch = true;
    if (searchText) {
       const normalizedSearch = removeVietnameseTones(searchText);
       
       const normalizedClassName = removeVietnameseTones(cDetail.name || "");
       const matchClassName = normalizedClassName.includes(normalizedSearch);
       
       const members = cDetail.members || [];
       const matchStudent = members.some(m => 
         removeVietnameseTones(m.name || "").includes(normalizedSearch)
       );
       
       matchSearch = matchClassName || matchStudent;
    }

    return matchGrade && matchSubject && matchSearch;
  });

  // --- Attendance Functions ---
  const handleOpenAttendance = async (slot) => {
    setCurrentAttendanceSlot(slot);
    setIsAttendanceModalOpen(true);
    setFetchingStudents(true);

    try {
      const fetchedStudents = await getClassMembers(slot.classId);
      setStudents(fetchedStudents);

      const initialData = {};
      const previousAttendance = slot.attendance || [];

      fetchedStudents.forEach((student) => {
        const record = previousAttendance.find((r) => r.studentId === student.id);
        initialData[student.id] = record ? record.status : "Vắng"; 
      });

      setAttendanceData(initialData);
    } catch (error) {
      message.error("Lỗi tải danh sách học sinh.");
    } finally {
      setFetchingStudents(false);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData((prev) => ({ ...prev, [studentId]: status }));
  };

  const setAllAttendance = (status) => {
    const newData = {};
    students.forEach((s) => (newData[s.id] = status));
    setAttendanceData(newData);
  };

  const handleSaveAttendance = async () => {
    if (!currentAttendanceSlot) return;
    
    const attendanceArray = students.map((student) => ({
      studentId: student.id,
      name: student.name,
      status: attendanceData[student.id],
    }));

    const result = await updateSlot(currentAttendanceSlot.id, {
      attendance: attendanceArray,
    });

    if (result.success) {
      message.success("Lưu điểm danh thành công");
      setIsAttendanceModalOpen(false);
      fetchSlots(); 
    } else {
      message.error(result.message);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto bg-slate-50/50 min-h-screen">
      <div className="mb-8">
        <Title level={2} className="!mb-1 !text-gray-800">Điểm danh lớp học</Title>
        <Text className="text-gray-500">Tìm kiếm lớp học, chọn ngày và thực hiện điểm danh học viên.</Text>
      </div>
      
      <AttendanceFilter 
        filterMode={filterMode}
        setFilterMode={setFilterMode}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedGrade={selectedGrade}
        setSelectedGrade={setSelectedGrade}
        selectedSubject={selectedSubject}
        setSelectedSubject={setSelectedSubject}
        searchText={searchText}
        setSearchText={setSearchText}
      />

      <div style={{ marginTop: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <SlotList slots={filteredSlots} onOpenAttendance={handleOpenAttendance} />
        )}
      </div>

      {/* ATTENDANCE MODAL */}
      <Modal
        title={`Điểm danh - ${currentAttendanceSlot?.topic || 'Buổi học'}`}
        open={isAttendanceModalOpen}
        onCancel={() => setIsAttendanceModalOpen(false)}
        onOk={handleSaveAttendance}
        width={600}
      >
        {fetchingStudents ? (
           <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#c42121' }}><Spin /></div>
        ) : students.length === 0 ? (
          <div style={{ textAlign: "center", color: "#999" }}>
            Không có học sinh trong lớp này.
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 15, display: "flex", gap: 10 }}>
              <Button size="small" onClick={() => setAllAttendance("Có mặt")}>
                Đánh dấu tất cả Có mặt
              </Button>
              <Button size="small" onClick={() => setAllAttendance("Vắng")}>
                Đánh dấu tất cả Vắng
              </Button>
            </div>
            <List
              dataSource={students}
              renderItem={(item) => (
                <List.Item>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      width: "100%",
                      alignItems: "center", 
                    }}
                  >
                    <div>
                      <Text strong>{item.name}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: "12px" }}>
                        {item.username}
                      </Text>
                    </div>
                    <Radio.Group
                      value={attendanceData[item.id]}
                      onChange={(e) =>
                        handleAttendanceChange(item.id, e.target.value)
                      }
                      buttonStyle="solid"
                    >
                      <Radio.Button value="Có mặt">
                        Có mặt
                      </Radio.Button>
                      <Radio.Button value="Vắng">
                        Vắng
                      </Radio.Button>
                    </Radio.Group>
                  </div>
                </List.Item>
              )}
              style={{ maxHeight: "400px", overflowY: "auto" }}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

export default StaffAttendance;
// src/pages/Admin/Classes/partials/AttendanceModal.jsx
import React, { useEffect, useState } from "react";
import { Modal, Button, List, Typography, Radio, Grid } from "antd";

const { useBreakpoint } = Grid;

export default function AttendanceModal({ isOpen, onClose, onSave, students, currentSlot }) {
  const [attendanceData, setAttendanceData] = useState({});
  const screens = useBreakpoint();

  useEffect(() => {
    if (isOpen && currentSlot) {
      const initialData = {};
      const previousAttendance = currentSlot.attendance || [];

      students.forEach((student) => {
        const record = previousAttendance.find((r) => r.studentId === student.id);
        initialData[student.id] = record ? record.status : "Có mặt";
      });

      setAttendanceData(initialData);
    }
  }, [isOpen, currentSlot, students]);

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData((prev) => ({ ...prev, [studentId]: status }));
  };

  const setAllAttendance = (status) => {
    const newData = {};
    students.forEach((s) => (newData[s.id] = status));
    setAttendanceData(newData);
  };

  const handleSubmit = () => {
    const attendanceArray = students.map((student) => ({
      studentId: student.id,
      name: student.name,
      status: attendanceData[student.id],
    }));
    onSave(attendanceArray);
  };

  return (
    <Modal
      title="Điểm danh"
      open={isOpen}
      onCancel={onClose}
      onOk={handleSubmit}
      width={screens.xs ? "100%" : 600}
    >
      {students.length === 0 ? (
        <div className="text-center text-gray-400">No students in this class.</div>
      ) : (
        <>
          <div className="flex gap-2.5 mb-4">
            <Button size="small" onClick={() => setAllAttendance("Có mặt")}>
              Mark All Present
            </Button>
            <Button size="small" onClick={() => setAllAttendance("Vắng")}>
              Mark All Absent
            </Button>
          </div>
          <List
            dataSource={students}
            className="max-h-[400px] overflow-y-auto"
            renderItem={(item) => (
              <List.Item>
                <div className="flex justify-between w-full items-center">
                  <div>
                    <Typography.Text strong>{item.name}</Typography.Text>
                    <br />
                    <Typography.Text type="secondary" className="text-xs">
                      {item.username}
                    </Typography.Text>
                  </div>
                  <Radio.Group
                    value={attendanceData[item.id]}
                    onChange={(e) => handleAttendanceChange(item.id, e.target.value)}
                    buttonStyle="solid"
                  >
                    <Radio.Button value="Có mặt" className="text-green-600">
                      Có mặt
                    </Radio.Button>
                    <Radio.Button value="Vắng" className="text-red-600">
                      Vắng
                    </Radio.Button>
                  </Radio.Group>
                </div>
              </List.Item>
            )}
          />
        </>
      )}
    </Modal>
  );
}
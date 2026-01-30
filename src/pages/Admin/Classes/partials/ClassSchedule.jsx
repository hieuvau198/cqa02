// src/pages/Admin/Classes/partials/ClassSchedule.jsx
import React, { useEffect, useState } from 'react';
import { 
  Table, Button, Modal, Form, DatePicker, TimePicker, Input, 
  Radio, message, Popconfirm, Tag, Space, List, Typography, Grid 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, CheckSquareOutlined, ClockCircleOutlined, TableOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import * as ClassQuery from '../../../../data/Center/classQuery'; 
import * as ClassMember from '../../../../data/Center/classMember'; // <--- ADD THIS IMPORT
import ClassAttendanceMatrix from './ClassAttendanceMatrix'; 

const { TextArea } = Input;
const { useBreakpoint } = Grid;

export default function ClassSchedule({ classId }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]); 

  // ... (keep existing state definitions) ...
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [currentAttendanceSlot, setCurrentAttendanceSlot] = useState(null);
  const [attendanceData, setAttendanceData] = useState({}); 

  const [isMatrixOpen, setIsMatrixOpen] = useState(false);

  const [form] = Form.useForm();
  const screens = useBreakpoint();

  // --- 1. Initial Data Fetching ---
  const fetchData = async () => {
    setLoading(true);
    try {
      // FIX: Use ClassMember.getClassMembers instead of ClassQuery.getStudentsInClass
      const [fetchedSlots, fetchedStudents] = await Promise.all([
          ClassQuery.getSlotsByClass(classId),
          ClassMember.getClassMembers(classId) 
      ]);
      setSlots(fetchedSlots);
      setStudents(fetchedStudents);
    } catch (error) {
      console.error(error);
      message.error("Failed to load schedule data");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (classId) fetchData();
  }, [classId]);

  // --- 2. Slot Management ---
  
  const handleOpenSlotModal = (slot = null) => {
    setEditingSlot(slot);
    if (slot) {
      form.setFieldsValue({
        date: dayjs(slot.date),
        startTime: slot.startTime ? dayjs(slot.startTime, 'HH:mm') : null,
        endTime: slot.endTime ? dayjs(slot.endTime, 'HH:mm') : null,
        topic: slot.topic
      });
    } else {
      form.resetFields();
      form.setFieldValue('date', dayjs()); 
    }
    setIsSlotModalOpen(true);
  };

  const handleSaveSlot = async (values) => {
    const payload = {
      classId,
      date: values.date.format('YYYY-MM-DD'),
      startTime: values.startTime ? values.startTime.format('HH:mm') : null,
      endTime: values.endTime ? values.endTime.format('HH:mm') : null,
      topic: values.topic || '',
    };

    let result;
    if (editingSlot) {
      result = await ClassQuery.updateSlot(editingSlot.id, payload);
    } else {
      payload.attendance = []; 
      result = await ClassQuery.addSlot(payload);
    }

    if (result.success) {
      message.success(editingSlot ? "Slot updated" : "Slot created");
      setIsSlotModalOpen(false);
      fetchData();
    } else {
      message.error(result.message);
    }
  };

  const handleDeleteSlot = async (id) => {
    const result = await ClassQuery.deleteSlot(id);
    if (result.success) {
      message.success("Slot deleted");
      fetchData();
    } else {
      message.error(result.message);
    }
  };

  // --- 3. Attendance Logic ---

  const handleOpenAttendance = (slot) => {
    setCurrentAttendanceSlot(slot);
    const initialData = {};
    const previousAttendance = slot.attendance || [];

    students.forEach(student => {
        const record = previousAttendance.find(r => r.studentId === student.id);
        initialData[student.id] = record ? record.status : 'Có mặt';
    });

    setAttendanceData(initialData);
    setIsAttendanceModalOpen(true);
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: status }));
  };

  const setAllAttendance = (status) => {
    const newData = {};
    students.forEach(s => newData[s.id] = status);
    setAttendanceData(newData);
  };

  const handleSaveAttendance = async () => {
    if (!currentAttendanceSlot) return;
    const attendanceArray = students.map(student => ({
        studentId: student.id,
        name: student.name, 
        status: attendanceData[student.id]
    }));

    const result = await ClassQuery.updateSlot(currentAttendanceSlot.id, {
        attendance: attendanceArray
    });

    if (result.success) {
        message.success("Attendance saved");
        setIsAttendanceModalOpen(false);
        fetchData();
    } else {
        message.error(result.message);
    }
  };

  // --- 4. Columns & Render ---

  const columns = [
    {
      title: 'Date & Time',
      key: 'datetime',
      width: 200,
      render: (_, record) => (
          <div>
              <div style={{ fontWeight: 'bold' }}>{dayjs(record.date).format('DD/MM/YYYY')}</div>
              {record.startTime && (
                  <div style={{ color: '#666', fontSize: '12px' }}>
                      <ClockCircleOutlined style={{ marginRight: 5 }}/>
                      {record.startTime} - {record.endTime}
                  </div>
              )}
          </div>
      ),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Topic',
      dataIndex: 'topic',
      key: 'topic',
    },
    {
        title: 'Điểm danh',
        key: 'attendance',
        width: 150,
        render: (_, record) => {
            const list = record.attendance || [];
            if (list.length === 0) return <Tag>Not taken</Tag>;
            
            const presentCount = list.filter(x => x.status === 'Có mặt').length;
            const absentCount = list.filter(x => x.status === 'Vắng').length;
            
            return (
                <Space direction="vertical" size={0} style={{ fontSize: '12px' }}>
                    <span style={{ color: 'green' }}>Present: {presentCount}</span>
                    <span style={{ color: 'red' }}>Absent: {absentCount}</span>
                </Space>
            );
        }
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button 
            icon={<CheckSquareOutlined />} 
            onClick={() => handleOpenAttendance(record)}
            size="small"
          >
            Điểm danh
          </Button>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleOpenSlotModal(record)} 
            size="small"
          />
          <Popconfirm 
            title="Delete?" 
            onConfirm={() => handleDeleteSlot(record.id)}
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, gap: '10px' }}>
        <Button icon={<TableOutlined />} onClick={() => setIsMatrixOpen(true)}>
          View Details
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenSlotModal(null)}>
          Thêm buổi
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={slots} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 5 }}
        scroll={{ x: 700 }}
      />

      {/* MATRIX MODAL */}
      <ClassAttendanceMatrix 
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
        slots={slots}
        students={students}
      />

      {/* CREATE / EDIT SLOT MODAL */}
      <Modal
        title={editingSlot ? "Edit Slot" : "New Slot"}
        open={isSlotModalOpen}
        onCancel={() => setIsSlotModalOpen(false)}
        onOk={() => form.submit()}
        // UPDATE: Responsive width
        width={screens.xs ? '100%' : 520}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveSlot}>
            <Form.Item name="date" label="Date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
            
            <Form.Item label="Time Range" style={{ marginBottom: 0 }}>
                 <div style={{ display: 'flex', gap: '10px' }}>
                     <Form.Item name="startTime" rules={[{ required: true, message: 'Start time required' }]} style={{ flex: 1 }}>
                        <TimePicker format="HH:mm" placeholder="Start Time" style={{ width: '100%' }} />
                     </Form.Item>
                     <Form.Item name="endTime" rules={[{ required: true, message: 'End time required' }]} style={{ flex: 1 }}>
                        <TimePicker format="HH:mm" placeholder="End Time" style={{ width: '100%' }} />
                     </Form.Item>
                 </div>
            </Form.Item>

            <Form.Item name="topic" label="Topic / Content">
                <TextArea rows={3} placeholder="What will be taught?" />
            </Form.Item>
        </Form>
      </Modal>

      {/* ATTENDANCE MODAL */}
      <Modal
        // ... title prop ...
        open={isAttendanceModalOpen}
        onCancel={() => setIsAttendanceModalOpen(false)}
        onOk={handleSaveAttendance}
        // UPDATE: Responsive width
        width={screens.xs ? '100%' : 600}
      >
        {students.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999' }}>No students in this class.</div>
        ) : (
            <>
                <div style={{ marginBottom: 15, display: 'flex', gap: 10 }}>
                    <Button size="small" onClick={() => setAllAttendance('Có mặt')}>Mark All Present</Button>
                    <Button size="small" onClick={() => setAllAttendance('Vắng')}>Mark All Absent</Button>
                </div>
                <List
                    dataSource={students}
                    renderItem={item => (
                        <List.Item>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                <div>
                                    <Typography.Text strong>{item.name}</Typography.Text>
                                    <br />
                                    <Typography.Text type="secondary" style={{ fontSize: '12px' }}>{item.username}</Typography.Text>
                                </div>
                                <Radio.Group 
                                    value={attendanceData[item.id]} 
                                    onChange={(e) => handleAttendanceChange(item.id, e.target.value)}
                                    buttonStyle="solid"
                                >
                                    <Radio.Button value="Có mặt" style={{ color: 'green' }}>Có mặt</Radio.Button>
                                    <Radio.Button value="Vắng" style={{ color: 'red' }}>Vắng</Radio.Button>
                                </Radio.Group>
                            </div>
                        </List.Item>
                    )}
                    style={{ maxHeight: '400px', overflowY: 'auto' }}
                />
            </>
        )}
      </Modal>
    </div>
  );
}
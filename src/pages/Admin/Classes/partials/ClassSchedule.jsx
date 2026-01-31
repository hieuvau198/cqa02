// src/pages/Admin/Classes/partials/ClassSchedule.jsx
import React, { useEffect, useState } from 'react';
import { 
  Table, Button, Modal, Form, DatePicker, TimePicker, Input, 
  Radio, message, Popconfirm, Tag, Space, List, Typography, Grid, Empty
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, CheckSquareOutlined, ClockCircleOutlined, TableOutlined, LinkOutlined, AppstoreOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import * as ClassQuery from '../../../../data/Center/classQuery'; 
import * as ClassMember from '../../../../data/Center/classMember'; 
import ClassAttendanceMatrix from './ClassAttendanceMatrix'; 

const { TextArea } = Input;
const { useBreakpoint } = Grid;

export default function ClassSchedule({ classId }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]); 

  // --- Slot State ---
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  
  // --- Attendance State ---
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [currentAttendanceSlot, setCurrentAttendanceSlot] = useState(null);
  const [attendanceData, setAttendanceData] = useState({}); 

  // --- Matrix State ---
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);

  // --- Activity State (NEW) ---
  const [slotActivities, setSlotActivities] = useState({}); // Map: slotId -> [activities]
  const [loadingActivities, setLoadingActivities] = useState({}); // Map: slotId -> boolean
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [currentSlotForActivity, setCurrentSlotForActivity] = useState(null);

  const [form] = Form.useForm();
  const [activityForm] = Form.useForm();
  const screens = useBreakpoint();

  // --- 1. Initial Data Fetching ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedSlots, fetchedStudents] = await Promise.all([
          ClassQuery.getSlotsByClass(classId),
          ClassMember.getClassMembers(classId) 
      ]);
      setSlots(fetchedSlots);
      setStudents(fetchedStudents);
      // Clear activity cache on full refresh to ensure data consistency
      setSlotActivities({});
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

  // --- 4. Activity Logic (NEW) ---

  const fetchActivities = async (slotId) => {
    setLoadingActivities(prev => ({ ...prev, [slotId]: true }));
    const acts = await ClassQuery.getActivitiesBySlot(slotId);
    setSlotActivities(prev => ({ ...prev, [slotId]: acts }));
    setLoadingActivities(prev => ({ ...prev, [slotId]: false }));
  };

  const handleOpenActivityModal = (slot, activity = null) => {
    setCurrentSlotForActivity(slot);
    setEditingActivity(activity);
    if (activity) {
      activityForm.setFieldsValue({
        name: activity.name,
        description: activity.description,
        link: activity.link
      });
    } else {
      activityForm.resetFields();
    }
    setIsActivityModalOpen(true);
  };

  const handleSaveActivity = async (values) => {
    if (!currentSlotForActivity) return;

    const payload = {
      slotId: currentSlotForActivity.id,
      name: values.name,
      description: values.description || '',
      link: values.link || ''
    };

    let result;
    if (editingActivity) {
      result = await ClassQuery.updateActivity(editingActivity.id, payload);
    } else {
      result = await ClassQuery.addActivity(payload);
    }

    if (result.success) {
      message.success(editingActivity ? "Activity updated" : "Activity added");
      setIsActivityModalOpen(false);
      // Refresh activities for this slot
      fetchActivities(currentSlotForActivity.id);
    } else {
      message.error(result.message);
    }
  };

  const handleDeleteActivity = async (activityId, slotId) => {
    const result = await ClassQuery.deleteActivity(activityId);
    if (result.success) {
      message.success("Activity deleted");
      fetchActivities(slotId);
    } else {
      message.error(result.message);
    }
  };

  // --- 5. Renderers ---

  // Sub-table for Activities
  const activityColumns = [
    { title: 'Activity Name', dataIndex: 'name', key: 'name', width: '25%' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { 
      title: 'Link', 
      key: 'link', 
      width: '20%',
      render: (_, r) => r.link ? <a href={r.link} target="_blank" rel="noreferrer"><LinkOutlined /> {r.link}</a> : '-'
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, r) => (
        <Space>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleOpenActivityModal(currentSlotForActivity, r)} // Note: logic handled by parent scope usually, but here we need slot info. 
            // Wait, inside expandedRowRender we might not have 'currentSlotForActivity' in state if we just clicked expand.
            // Better to pass slot explicitly.
          />
          <Popconfirm title="Delete activity?" onConfirm={() => handleDeleteActivity(r.id, r.slotId)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const expandedRowRender = (slot) => {
    const acts = slotActivities[slot.id] || [];
    const isLoading = loadingActivities[slot.id];

    return (
      <div style={{ padding: '10px 20px', background: '#fafafa', borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <Typography.Text strong><AppstoreOutlined /> Activities</Typography.Text>
            <Button 
                size="small" 
                type="dashed" 
                icon={<PlusOutlined />} 
                onClick={() => handleOpenActivityModal(slot)}
            >
                Add Activity
            </Button>
        </div>
        <Table 
            columns={[
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
                            <Button 
                                size="small" 
                                icon={<EditOutlined />} 
                                onClick={() => handleOpenActivityModal(slot, r)} 
                            />
                            <Popconfirm title="Delete?" onConfirm={() => handleDeleteActivity(r.id, slot.id)}>
                                <Button size="small" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                        </Space>
                    )
                }
            ]}
            dataSource={acts}
            rowKey="id"
            pagination={false}
            loading={isLoading}
            locale={{ emptyText: <Empty description="No activities found" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        />
      </div>
    );
  };

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
        pagination={{ pageSize: 10 }} // Increased page size for better view
        scroll={{ x: 700 }}
        expandable={{
            expandedRowRender: expandedRowRender,
            onExpand: (expanded, record) => {
                if (expanded && !slotActivities[record.id]) {
                    fetchActivities(record.id);
                }
            }
        }}
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

      {/* ACTIVITY MODAL (NEW) */}
      <Modal
        title={editingActivity ? "Edit Activity" : "New Activity"}
        open={isActivityModalOpen}
        onCancel={() => setIsActivityModalOpen(false)}
        onOk={() => activityForm.submit()}
      >
        <Form form={activityForm} layout="vertical" onFinish={handleSaveActivity}>
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

      {/* ATTENDANCE MODAL */}
      <Modal
        title="Điểm danh"
        open={isAttendanceModalOpen}
        onCancel={() => setIsAttendanceModalOpen(false)}
        onOk={handleSaveAttendance}
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
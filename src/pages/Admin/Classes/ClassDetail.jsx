// src/pages/Admin/Classes/ClassDetail.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Table, Button, Space, Drawer, Form, Input, message, Popconfirm, Typography, Card, Radio, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import * as ClassQuery from '../../../data/Center/classQuery';

const { Title } = Typography;
const { Option } = Select;

export default function ClassDetail() {
  const { id: classId } = useParams();
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [candidates, setCandidates] = useState([]); // All available students in the system
  const [loading, setLoading] = useState(false);
  
  // Drawer State
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [addMode, setAddMode] = useState('new'); // 'new' or 'existing'
  const [form] = Form.useForm();

  // --- Fetch Data ---
  const fetchData = async () => {
    setLoading(true);
    const cls = await ClassQuery.getClassById(classId);
    setClassInfo(cls);
    
    const stds = await ClassQuery.getStudentsInClass(classId);
    setStudents(stds);
    setLoading(false);
  };

  const fetchCandidates = async () => {
    const users = await ClassQuery.getAllStudentCandidates();
    setCandidates(users);
  }

  useEffect(() => {
    if (classId) fetchData();
  }, [classId]);

  // Compute students that can be added (candidates not already in class)
  const availableCandidates = useMemo(() => {
    return candidates.filter(c => !students.some(s => s.id === c.id));
  }, [candidates, students]);

  // --- Actions ---
  const showDrawer = async (student = null) => {
    setEditingStudent(student);
    setAddMode('new'); // Default to new
    
    if (student) {
      // Editing Mode
      form.setFieldsValue(student);
    } else {
      // Adding Mode
      form.resetFields();
      // Fetch candidates in case we want to choose 'existing'
      await fetchCandidates();
    }
    setDrawerVisible(true);
  };

  const handleSave = async (values) => {
    setLoading(true);
    let result;

    if (editingStudent) {
      // Update existing student info (Name/Pass)
      result = await ClassQuery.updateStudentInClass(editingStudent.id, values);
    } else {
      // Create logic based on Mode
      if (addMode === 'existing') {
        // Link existing user
        result = await ClassQuery.addExistingStudentToClass(classId, values.userId);
      } else {
        // Create New user and Link
        result = await ClassQuery.addStudentToClass(classId, values);
      }
    }

    if (result.success) {
      message.success(editingStudent ? "Student updated" : "Student added");
      setDrawerVisible(false);
      fetchData();
    } else {
      message.error(result.message);
    }
    setLoading(false);
  };

  const handleDelete = async (student) => {
    const result = await ClassQuery.deleteStudentFromClass(classId, student.id, student.relationId);
    if (result.success) {
      message.success("Student removed from class");
      fetchData();
    } else {
      message.error(result.message);
    }
  };

  // --- Columns ---
  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Username', dataIndex: 'username', key: 'username' },
    { title: 'Password', dataIndex: 'password', key: 'password', render: (text) => <code>{text}</code> },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => showDrawer(record)} />
          <Popconfirm 
            title="Remove Student?" 
            description="This will remove the student from this class but keep their account."
            onConfirm={() => handleDelete(record)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <Title level={2}>{classInfo ? `Class: ${classInfo.name}` : 'Loading...'}</Title>
            <Typography.Text type="secondary">Manage students in this class</Typography.Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showDrawer(null)}>
            Add Student
          </Button>
        </div>

        <Table 
          columns={columns} 
          dataSource={students} 
          rowKey="id" 
          loading={loading} 
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Drawer
        title={editingStudent ? "Edit Student" : "Add Student"}
        width={400}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {!editingStudent && (
             <div style={{ marginBottom: 20, textAlign: 'center' }}>
                 <Radio.Group value={addMode} onChange={e => setAddMode(e.target.value)} buttonStyle="solid">
                    <Radio.Button value="existing">Tài Khoản Có Sẵn</Radio.Button>
                    <Radio.Button value="new">Tạo Mới</Radio.Button>
                 </Radio.Group>
             </div>
        )}

        <Form layout="vertical" form={form} onFinish={handleSave}>
          
          {/* Logic for NEW Student or EDITING Student */}
          {(addMode === 'new' || editingStudent) && (
            <>
                <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
                    <Input prefix={<UserOutlined />} placeholder="Full Name" />
                </Form.Item>
                <Form.Item name="username" label="Username" rules={[{ required: true }]}>
                    <Input placeholder="Username" disabled={!!editingStudent} />
                </Form.Item>
                <Form.Item name="password" label="Password" rules={[{ required: !editingStudent }]}>
                    <Input.Password placeholder="Password" />
                </Form.Item>
            </>
          )}

          {/* Logic for EXISTING Student */}
          {(!editingStudent && addMode === 'existing') && (
             <Form.Item name="userId" label="Select Student" rules={[{ required: true, message: 'Please select a student' }]}>
                <Select 
                    placeholder="Search for a student"
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                        (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                >
                    {availableCandidates.map(u => (
                        <Option key={u.id} value={u.id}>
                            {u.name} ({u.username})
                        </Option>
                    ))}
                </Select>
             </Form.Item>
          )}

          <Button type="primary" htmlType="submit" block loading={loading} style={{ marginTop: 10 }}>
            {editingStudent ? "Update Info" : (addMode === 'existing' ? "Add to Class" : "Create & Add")}
          </Button>
        </Form>
      </Drawer>
    </div>
  );
}
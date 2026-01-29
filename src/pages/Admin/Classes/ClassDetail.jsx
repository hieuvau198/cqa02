// src/pages/Admin/Classes/ClassDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Table, Button, Space, Drawer, Form, Input, message, Popconfirm, Typography, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import * as ClassQuery from '../../../data/Center/classQuery';

const { Title } = Typography;

export default function ClassDetail() {
  const { id: classId } = useParams();
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Drawer State
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
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

  useEffect(() => {
    if (classId) fetchData();
  }, [classId]);

  // --- Actions ---
  const showDrawer = (student = null) => {
    setEditingStudent(student);
    if (student) form.setFieldsValue(student);
    else form.resetFields();
    setDrawerVisible(true);
  };

  const handleSave = async (values) => {
    setLoading(true);
    let result;

    if (editingStudent) {
      // Update existing student
      result = await ClassQuery.updateStudentInClass(editingStudent.id, values);
    } else {
      // Add new student
      result = await ClassQuery.addStudentToClass(classId, values);
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
      message.success("Student removed");
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
          <Popconfirm title="Delete Student?" onConfirm={() => handleDelete(record)}>
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
        />
      </Card>

      <Drawer
        title={editingStudent ? "Edit Student" : "Add New Student"}
        width={400}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        <Form layout="vertical" form={form} onFinish={handleSave}>
          <Form.Item name="name" label="Full Name" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} placeholder="Full Name" />
          </Form.Item>
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input placeholder="Username" disabled={!!editingStudent} />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: !editingStudent }]}>
            <Input.Password placeholder="Password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            {editingStudent ? "Update" : "Add to Class"}
          </Button>
        </Form>
      </Drawer>
    </div>
  );
}
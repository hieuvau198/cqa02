// src/pages/Admin/Classes/partials/ClassMembers.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, Space, Drawer, Form, Input, message, Popconfirm, Radio, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import * as ClassQuery from '../../../../data/Center/classQuery'; // Adjust path

const { Option } = Select;

export default function ClassMembers({ classId }) {
  const [students, setStudents] = useState([]);
  const [candidates, setCandidates] = useState([]); 
  const [loading, setLoading] = useState(false);
  
  // Drawer State
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [addMode, setAddMode] = useState('new'); 
  const [form] = Form.useForm();

  const fetchStudents = async () => {
    setLoading(true);
    const stds = await ClassQuery.getStudentsInClass(classId);
    setStudents(stds);
    setLoading(false);
  };

  const fetchCandidates = async () => {
    const users = await ClassQuery.getAllStudentCandidates();
    setCandidates(users);
  };

  useEffect(() => {
    if (classId) fetchStudents();
  }, [classId]);

  const availableCandidates = useMemo(() => {
    return candidates.filter(c => !students.some(s => s.id === c.id));
  }, [candidates, students]);

  const showDrawer = async (student = null) => {
    setEditingStudent(student);
    setAddMode('new');
    
    if (student) {
      form.setFieldsValue(student);
    } else {
      form.resetFields();
      await fetchCandidates();
    }
    setDrawerVisible(true);
  };

  const handleSave = async (values) => {
    setLoading(true);
    let result;

    if (editingStudent) {
      result = await ClassQuery.updateStudentInClass(editingStudent.id, values);
    } else {
      if (addMode === 'existing') {
        result = await ClassQuery.addExistingStudentToClass(classId, values.userId);
      } else {
        result = await ClassQuery.addStudentToClass(classId, values);
      }
    }

    if (result.success) {
      message.success(editingStudent ? "Student updated" : "Student added");
      setDrawerVisible(false);
      fetchStudents();
    } else {
      message.error(result.message);
    }
    setLoading(false);
  };

  const handleDelete = async (student) => {
    const result = await ClassQuery.deleteStudentFromClass(classId, student.id, student.relationId);
    if (result.success) {
      message.success("Student removed from class");
      fetchStudents();
    } else {
      message.error(result.message);
    }
  };

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
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showDrawer(null)}>
          Thêm học sinh
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={students} 
        rowKey="id" 
        loading={loading} 
        pagination={{ pageSize: 10 }}
      />

      <Drawer
        title={editingStudent ? "Edit Student" : "Add Student"}
        width={400}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {!editingStudent && (
             <div style={{ marginBottom: 20, textAlign: 'center' }}>
                 <Radio.Group value={addMode} onChange={e => setAddMode(e.target.value)} buttonStyle="solid">
                    <Radio.Button value="existing">Existing Account</Radio.Button>
                    <Radio.Button value="new">Create New</Radio.Button>
                 </Radio.Group>
             </div>
        )}

        <Form layout="vertical" form={form} onFinish={handleSave}>
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
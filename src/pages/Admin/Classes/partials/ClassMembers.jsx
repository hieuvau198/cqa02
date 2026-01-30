// src/pages/Admin/Classes/partials/ClassMembers.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Table, Button, Space, Drawer, Form, Input, message, Popconfirm, Radio, Select, Tag, Divider, Row, Col, Grid } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, PhoneOutlined, HomeOutlined, BankOutlined } from '@ant-design/icons';
import * as ClassMember from '../../../../data/Center/classMember';

const { Option } = Select;
const { useBreakpoint } = Grid;

export default function ClassMembers({ classId }) {
  const [students, setStudents] = useState([]);
  const [candidates, setCandidates] = useState([]); 
  const [loading, setLoading] = useState(false);
  
  // Drawer State
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [addMode, setAddMode] = useState('new'); 
  const [form] = Form.useForm();
  const screens = useBreakpoint();

  const fetchStudents = async () => {
    setLoading(true);
    const stds = await ClassMember.getClassMembers(classId);
    setStudents(stds);
    setLoading(false);
  };

  const fetchCandidates = async () => {
    const users = await ClassMember.getStudentCandidates();
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
      form.setFieldsValue({ status: 'Đang học' }); // Default
      await fetchCandidates();
    }
    setDrawerVisible(true);
  };

  const handleSave = async (values) => {
    setLoading(true);
    let result;

    if (editingStudent) {
      // Update
      result = await ClassMember.updateMember(classId, editingStudent.id, editingStudent.relationId, values);
    } else {
      // Add
      if (addMode === 'existing') {
        result = await ClassMember.addMemberExisting(classId, values.userId, values.status);
      } else {
        result = await ClassMember.addMemberNew(classId, values);
      }
    }

    if (result.success) {
      message.success(editingStudent ? "Thông tin đã cập nhật" : "Đã thêm học sinh");
      setDrawerVisible(false);
      fetchStudents();
    } else {
      message.error(result.message);
    }
    setLoading(false);
  };

  const handleDelete = async (student) => {
    const result = await ClassMember.deleteMember(classId, student.relationId);
    if (result.success) {
      message.success("Đã xóa học sinh khỏi lớp");
      fetchStudents();
    } else {
      message.error(result.message);
    }
  };

  const columns = [
    { 
      title: 'Họ tên & Tài khoản', 
      key: 'info',
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{r.name}</div>
          <div style={{ color: '#888', fontSize: '12px' }}>@{r.username}</div>
        </div>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        if (status === 'Đang học') color = 'green';
        if (status === 'Đã nghỉ') color = 'red';
        if (status === 'Hoàn thành lớp học') color = 'blue';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    { 
      title: 'Phụ huynh', 
      key: 'parent',
      render: (_, r) => (
        <div>
          {r.parentName ? <div>{r.parentName}</div> : <span style={{color:'#ccc'}}>--</span>}
          {r.parentPhone && <div><PhoneOutlined /> {r.parentPhone}</div>}
        </div>
      )
    },
    { 
      title: 'Thông tin thêm', 
      key: 'details',
      responsive: ['lg'],
      render: (_, r) => (
         <div style={{ fontSize: '12px' }}>
            {r.officialSchool && <div><BankOutlined /> {r.officialSchool}</div>}
            {r.address && <div><HomeOutlined /> {r.address}</div>}
         </div>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => showDrawer(record)} />
          <Popconfirm 
            title="Xóa khỏi lớp?" 
            description="Học sinh sẽ bị xóa khỏi danh sách lớp này."
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

      {/* UPDATE: Add scroll prop for mobile table scrolling */}
      <Table 
        columns={columns} 
        dataSource={students} 
        rowKey="id" 
        loading={loading} 
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }} 
      />

      <Drawer
        title={editingStudent ? "Cập nhật thông tin" : "Thêm học sinh mới"}
        // UPDATE: Responsive width (100% on mobile, 480px on desktop)
        width={screens.xs ? '100%' : 480}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {!editingStudent && (
             <div style={{ marginBottom: 20, textAlign: 'center' }}>
                 <Radio.Group value={addMode} onChange={e => setAddMode(e.target.value)} buttonStyle="solid">
                    <Radio.Button value="new">Tạo tài khoản mới</Radio.Button>
                    <Radio.Button value="existing">Chọn tài khoản có sẵn</Radio.Button>
                 </Radio.Group>
             </div>
        )}

        <Form layout="vertical" form={form} onFinish={handleSave}>
            {/* Status Field - Always Visible */}
            <Form.Item name="status" label="Trạng thái học tập" rules={[{ required: true }]}>
                <Select>
                    <Option value="Đang học">Đang học</Option>
                    <Option value="Đã nghỉ">Đã nghỉ</Option>
                    <Option value="Hoàn thành lớp học">Hoàn thành lớp học</Option>
                </Select>
            </Form.Item>

            <Divider dashed />

            {/* Existing User Mode */}
            {(!editingStudent && addMode === 'existing') && (
                <Form.Item name="userId" label="Chọn học sinh" rules={[{ required: true, message: 'Vui lòng chọn học sinh' }]}>
                    <Select 
                        placeholder="Tìm kiếm theo tên hoặc username"
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

            {/* New User Mode OR Editing */}
            {(addMode === 'new' || editingStudent) && (
            <>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="name" label="Họ và tên" rules={[{ required: true }]}>
                            <Input prefix={<UserOutlined />} placeholder="Ví dụ: Nguyễn Văn A" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                         <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true }]}>
                            <Input placeholder="username" disabled={!!editingStudent} />
                        </Form.Item>
                    </Col>
                </Row>
                
                {!editingStudent && (
                    <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }]}>
                        <Input.Password placeholder="Nhập mật khẩu" />
                    </Form.Item>
                )}

                <Divider orientation="left">Thông tin cá nhân</Divider>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="parentName" label="Tên phụ huynh">
                            <Input placeholder="Tên cha/mẹ" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="parentPhone" label="SĐT Phụ huynh">
                            <Input prefix={<PhoneOutlined />} placeholder="09xxx..." />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item name="officialSchool" label="Trường đang học">
                    <Input prefix={<BankOutlined />} placeholder="Ví dụ: THPT Chuyên..." />
                </Form.Item>

                <Form.Item name="address" label="Địa chỉ nhà">
                    <Input prefix={<HomeOutlined />} placeholder="Số nhà, đường, quận..." />
                </Form.Item>
            </>
            )}

            <div style={{ marginTop: 24 }}>
                <Button type="primary" htmlType="submit" block loading={loading} size="large">
                    {editingStudent ? "Lưu thay đổi" : (addMode === 'existing' ? "Thêm vào lớp" : "Tạo & Thêm")}
                </Button>
            </div>
        </Form>
      </Drawer>
    </div>
  );
}
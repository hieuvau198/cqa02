import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Drawer, 
  Form, 
  Input, 
  Select, 
  message, 
  Popconfirm,
  Tag 
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { 
  getAllUsers, 
  handleRegisterLogic, 
  updateUser, 
  deleteUser 
} from '../../../data/Firebase/firebaseQuery';

const { Option } = Select;

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  // --- Fetch Users ---
  const fetchUsers = async () => {
    setLoading(true);
    const data = await getAllUsers();
    // Sort by creation time if available, or name
    const sortedData = data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    setUsers(sortedData);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- Drawer Actions ---
  const showDrawer = (user = null) => {
    setEditingUser(user);
    if (user) {
      form.setFieldsValue(user);
    } else {
      form.resetFields();
    }
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setEditingUser(null);
    form.resetFields();
  };

  // --- CRUD Operations ---
  const handleSubmit = async (values) => {
    setLoading(true);
    let result;

    if (editingUser) {
      // Edit Mode
      result = await updateUser(editingUser.id, values);
      if (result.success) {
        message.success('User updated successfully');
      }
    } else {
      // Add Mode
      result = await handleRegisterLogic(
        values.name, 
        values.username, 
        values.password, 
        values.role
      );
      if (result.success) {
        message.success('User added successfully');
      }
    }

    if (result.success) {
      closeDrawer();
      fetchUsers();
    } else {
      message.error(result.message || 'Operation failed');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const result = await deleteUser(id);
    if (result.success) {
      message.success('User deleted successfully');
      fetchUsers();
    } else {
      message.error(result.message);
    }
  };

  // --- Table Columns ---
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        let color = 'geekblue';
        if (role === 'Admin') color = 'red';
        if (role === 'Teacher') color = 'green';
        return <Tag color={color}>{role.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_,kz) => (
        <Space size="middle">
          <Button 
            type="primary" 
            ghost 
            icon={<EditOutlined />} 
            onClick={() => showDrawer(kz)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete the user"
            description="Are you sure to delete this user?"
            onConfirm={() => handleDelete(kz.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>User Management</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showDrawer(null)}>
          Add New User
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={users} 
        rowKey="id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Drawer
        title={editingUser ? "Edit User" : "Add New User"}
        width={400}
        onCXlose={closeDrawer}
        open={drawerVisible}
        styles={{ body: { paddingBottom: 80 } }}
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter full name' }]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Please enter username' }]}
          >
            <Input placeholder="Enter username" disabled={!!editingUser} />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: !editingUser, message: 'Please enter password' }]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select placeholder="Select a role">
              <Option value="Student">Student</Option>
              <Option value="Teacher">Teacher</Option>
              <Option value="Staff">Staff</Option>
              <Option value="Admin">Admin</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={closeDrawer}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingUser ? "Update" : "Submit"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default AdminUsers;
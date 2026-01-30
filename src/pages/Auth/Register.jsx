import { Form, Input, Button, Card, Select, Alert, Typography, message } from 'antd';
import { handleRegisterLogic } from '../../data/Firebase/firebaseQuery';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';

const { Title } = Typography;
const { Option } = Select;

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    setError('');

    const result = await handleRegisterLogic(
      values.name,
      values.username,
      values.password,
      values.role,
      values.grade // Pass grade to register logic
    );

    if (result.success) {
      message.success("Account created successfully!");
      navigate('/login');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const gradeOptions = Array.from({ length: 12 }, (_, i) => `Lớp ${i + 1}`);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 450, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>Create Account</Title>
        </div>

        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Form
          name="register_form"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          initialValues={{ role: 'Student' }}
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please input your full name!' }]}
          >
            <Input placeholder="John Doe" />
          </Form.Item>

          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Please input a username!' }]}
          >
            <Input placeholder="johndoe123" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select a role!' }]}
          >
            <Select>
              <Option value="Student">Student</Option>
              <Option value="Teacher">Teacher</Option>
              <Option value="Staff">Staff</Option>
              <Option value="Admin">Admin</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="grade"
            label="Grade"
            extra="Required for students"
          >
            <Select placeholder="Select your grade" allowClear>
              {gradeOptions.map(g => (
                <Option key={g} value={g}>{g}</Option>
              ))}
              <Option value="Khác">Khác</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Register
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
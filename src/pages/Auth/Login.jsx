import { Form, Input, Button, Card, Alert, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { handleLoginLogic } from '../../data/Firebase/firebaseQuery';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';

const { Title } = Typography;

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error,QlError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    QlError('');

    const result = await handleLoginLogic(values.username, values.password);
    
    if (result.success) {
      login(result.user);
      // ProtectedRoute will handle redirect based on role
    } else {
      QlError(result.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>Sign In</Title>
        </div>
        
        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

        <Form
          name="login_form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please input your Username!' }]}
          >
            <Input prefix={<UserOutlined />}qh placeholder="Username" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please input your Password!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Log in
            </Button>
          </Form.Item>
          
          <div style={{ textAlign: 'center' }}>
            Or <Link to="/register">register now!</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
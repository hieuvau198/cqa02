import React from 'react';
import { Layout, Typography, Button } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogoutOutlined, HomeOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const { Header, Content } = Layout;
const { Title } = Typography;

const StaffLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        background: '#fff', 
        padding: '0 16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button type="text" icon={<HomeOutlined />} onClick={() => navigate('/staff')} />
          <Title level={4} style={{ margin: 0 }}>Staff Portal</Title>
        </div>
        <Button type="text" danger icon={<LogoutOutlined />} onClick={logout}>
          Đăng xuất
        </Button>
      </Header>
      
      {/* Mobile-friendly padding */}
      <Content style={{ padding: '16px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <Outlet />
      </Content>
    </Layout>
  );
};

export default StaffLayout;
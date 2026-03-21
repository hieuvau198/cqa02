import React from 'react';
import { Layout, Typography, Button } from 'antd';
import { Outlet, useNavigate } from 'react-router-dom';
// IMPORT CalendarOutlined here
import { LogoutOutlined, HomeOutlined, CalendarOutlined } from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';

const { Header, Content } = Layout;
const { Title } = Typography;

const StaffLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <Layout className="min-h-screen bg-yellow-50/30">
      
      <Header className="sticky top-0 z-50 flex justify-between items-center px-4 md:px-8 !bg-white/90 backdrop-blur-md shadow-sm border-b-[3px] border-yellow-400 !h-16 leading-[normal]">
        
        {/* Left Side: Navigation & Title */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/staff')}
            className="flex items-center justify-center w-10 h-10 bg-yellow-100 text-yellow-600 rounded-xl hover:bg-yellow-400 hover:text-white transition-all duration-300 shadow-sm cursor-pointer border-none outline-none"
            title="Trang chủ"
          >
            <HomeOutlined className="text-lg" />
          </button>
          
          {/* NEW BUTTON: Navigate to Shifts */}
          <button 
            onClick={() => navigate('/staff/shifts')}
            className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-500 hover:text-white transition-all duration-300 shadow-sm cursor-pointer border-none outline-none"
            title="Đăng ký ca làm"
          >
            <CalendarOutlined className="text-lg" />
          </button>
          
          <Title level={4} className="!mb-0 !text-gray-800 font-semibold tracking-wide">
            Cổng Quản Lý Trung Tâm CQA
          </Title>
        </div>
        
        {/* Right Side: Logout Action */}
        <Button 
          type="text" 
          danger 
          icon={<LogoutOutlined />} 
          onClick={logout}
          className="flex items-center hover:bg-red-50 rounded-xl px-4 py-5 font-medium transition-colors"
        >
          Đăng xuất
        </Button>

      </Header>
      
      {/* Main Content Area */}
      <Content className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all">
        <Outlet />
      </Content>
      
    </Layout>
  );
};

export default StaffLayout;
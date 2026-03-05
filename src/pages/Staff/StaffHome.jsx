import React from 'react';
import { Row, Col, Typography } from 'antd';
import { CheckSquareOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const StaffHome = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-10">
        <Title level={2} className="!mb-2 !text-gray-800 flex items-center gap-3">
          <AppstoreOutlined className="text-blue-500" />
          Bảng điều khiển
        </Title>
        <Text className="text-gray-500 text-base">
          Chào mừng bạn trở lại! Chọn một chức năng bên dưới để bắt đầu công việc.
        </Text>
      </div>

      {/* Feature Cards */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={8}>
          <div 
            onClick={() => navigate('/staff/attendance')}
            className="group relative bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 cursor-pointer flex flex-col items-center text-center overflow-hidden"
          >
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {/* Icon Wrapper */}
            <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-blue-500 transition-colors duration-300">
              <CheckSquareOutlined className="text-4xl text-blue-500 group-hover:text-white transition-colors duration-300" />
            </div>
            
            {/* Text Content */}
            <Title level={4} className="!mb-3 !text-gray-800 group-hover:text-blue-600 transition-colors">
              Điểm danh
            </Title>
            <Text className="text-gray-500 leading-relaxed">
              Quản lý và theo dõi điểm danh học viên theo ngày hoặc tháng một cách nhanh chóng.
            </Text>
          </div>
        </Col>
        {/* You can easily add more features (Cols) here later */}
      </Row>
    </div>
  );
};

export default StaffHome;
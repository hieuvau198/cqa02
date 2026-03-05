import React from 'react';
import { Row, Col, Card, Typography } from 'antd';
import { CheckSquareOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const StaffHome = () => {
  const navigate = useNavigate();

  return (
    <div className="mt-6">
      <Title level={3}>Trang chủ</Title>
      <Text type="secondary">Chọn một chức năng bên dưới để bắt đầu.</Text>

      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} sm={12} md={8}>
          <Card 
            hoverable 
            onClick={() => navigate('/staff/attendance')}
            className="text-center rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <CheckSquareOutlined className="text-5xl text-blue-500 mb-4" />
            <Title level={4}>Điểm danh</Title>
            <Text type="secondary">Quản lý điểm danh học viên theo ngày hoặc tháng.</Text>
          </Card>
        </Col>
        {/* You can easily add more features (Cols) here later */}
      </Row>
    </div>
  );
};

export default StaffHome;
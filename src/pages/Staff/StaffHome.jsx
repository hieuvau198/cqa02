import React from 'react';
import { Row, Col, Card, Typography } from 'antd';
import { CheckSquareOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const StaffHome = () => {
  const navigate = useNavigate();

  return (
    <div style={{ marginTop: '24px' }}>
      <Title level={3}>Trang chủ</Title>
      <Text type="secondary">Chọn một chức năng bên dưới để bắt đầu.</Text>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} sm={12} md={8}>
          <Card 
            hoverable 
            onClick={() => navigate('/staff/attendance')}
            style={{ textAlign: 'center', borderRadius: '12px' }}
          >
            <CheckSquareOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
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
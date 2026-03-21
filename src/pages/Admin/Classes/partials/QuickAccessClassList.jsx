// src/pages/Admin/Classes/partials/QuickAccessClassList.jsx
import React from 'react';
import { Card, Space, Button, Typography, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;

export default function QuickAccessClassList({ classes, subjects, role = "admin" }) {
  const navigate = useNavigate();

  if (!classes || classes.length === 0 || !subjects) return null;

  const classesBySubject = subjects.map(subject => {
    return {
      ...subject,
      items: classes.filter(c => c.subject === subject.id)
    };
  }).filter(subject => subject.items.length > 0);

  if (classesBySubject.length === 0) return null;

  return (
    <Card 
      title={<Text strong style={{ color: '#003eb3' }}>⚡ Quick Access</Text>} 
      size="small" 
      // Add a subtle background color and border to the main card
      style={{ 
        backgroundColor: '#f0f5ff', 
        borderColor: '#adc6ff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}
      headStyle={{ borderBottom: '1px solid #adc6ff' }}
      bodyStyle={{ padding: '16px' }}
    >
      <Row gutter={[16, 16]}>
        {classesBySubject.map(subject => (
          <Col xs={24} sm={12} md={8} lg={6} key={subject.id}>
            <Card 
              type="inner" 
              title={subject.name} 
              size="small"
              // Keep inner cards white so they pop against the blue background
              style={{ backgroundColor: '#ffffff' }}
            >
              <Space wrap>
                {subject.items.map(cls => (
                  <Button 
                    key={cls.id} 
                    type="primary" // Changed to primary or dashed to make it look more clickable
                    ghost
                    size="small"
                    onClick={() => navigate(`/${role.toLowerCase()}/classes/${cls.id}`)}
                  >
                    {cls.name}
                  </Button>
                ))}
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
}
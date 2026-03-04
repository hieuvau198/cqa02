import React from 'react';
import { Card, Col, Row, List, Button, Typography, Space, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, RightOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function ClassBoard({
  selectedTerm, subjects, grades,
  activeSubject, activeGrade, setActiveSubject, setActiveGrade,
  classes, openModal, handleDelete
}) {
  const filteredClasses = classes.filter(
    c => c.subject === activeSubject?.id && c.grade === activeGrade?.id
  );

  if (!selectedTerm) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999', backgroundColor: '#fafafa', borderRadius: '8px' }}>
        <Text type="secondary" style={{ fontSize: '16px' }}>Please select a Year and Term from the top filters to manage classes</Text>
      </div>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={16}>
        <Row gutter={[16, 16]}>
          {subjects.map(subject => (
            <Col xs={24} sm={12} xl={8} key={subject.id}>
              <Card title={subject.name} size="small" style={{ height: '100%' }}>
                <Space wrap>
                  {grades.map(grade => {
                    const isSelected = activeSubject?.id === subject.id && activeGrade?.id === grade.id;
                    return (
                      <Button 
                        key={grade.id}
                        type={isSelected ? "primary" : "default"}
                        onClick={() => { setActiveSubject(subject); setActiveGrade(grade); }}
                      >
                        {grade.name}
                      </Button>
                    );
                  })}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Col>

      <Col xs={24} md={8}>
        <Card 
          title={activeSubject && activeGrade ? `${activeSubject.name} - ${activeGrade.name}` : 'Classes'}
          extra={activeSubject && activeGrade ? <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => openModal('class')} /> : null}
          style={{ height: '100%' }}
          bodyStyle={{ padding: 0, height: '500px', overflowY: 'auto' }}
        >
          {activeSubject && activeGrade ? (
            <List
              dataSource={filteredClasses}
              locale={{ emptyText: 'No classes found' }}
              renderItem={item => (
                <List.Item 
                  actions={[
                    <EditOutlined key="edit" onClick={(e) => { e.stopPropagation(); openModal('class', item); }} />,
                    <Popconfirm title="Delete?" onConfirm={(e) => { e.stopPropagation(); handleDelete('class', item.id); }}>
                      <DeleteOutlined key="delete" style={{ color: 'red' }} onClick={(e) => e.stopPropagation()} />
                    </Popconfirm>
                  ]}
                  onClick={() => window.open(`/admin/classes/${item.id}`, '_blank')}
                  style={{ cursor: 'pointer', padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', paddingRight: 24 }}>
                    <Text strong>{item.name}</Text>
                    <RightOutlined style={{ fontSize: 10, color: '#ccc', alignSelf: 'center' }} />
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: '#999' }}>
              Select a subject and grade to view classes
            </div>
          )}
        </Card>
      </Col>
    </Row>
  );
}
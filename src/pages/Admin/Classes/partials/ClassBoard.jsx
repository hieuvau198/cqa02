import React from 'react';
import { Card, Col, Row, List, Button, Typography, Space, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, RightOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function ClassBoard({
  selectedTerm, subjects, grades,
  activeSubject, activeGrade, setActiveSubject, setActiveGrade,
  classes, openModal, handleDelete,
  isReadOnly = false, role = "admin" // <-- Thêm các prop này
}) {
  const filteredClasses = classes.filter(
    c => c.subject === activeSubject?.id && c.grade === activeGrade?.id
  );

  if (!selectedTerm) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999', backgroundColor: '#fafafa', borderRadius: '8px' }}>
        <Text type="secondary" style={{ fontSize: '16px' }}>Please select a Year and Term from the top filters to view classes</Text>
      </div>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={16}>
        <Row gutter={[16, 16]}>
          {subjects.map(subject => {
            // NẾU LÀ GIÁO VIÊN: Chỉ hiển thị các khối (grade) mà giáo viên có lớp dạy thuộc môn học này
            const relevantGrades = isReadOnly 
              ? grades.filter(g => classes.some(c => c.subject === subject.id && c.grade === g.id))
              : grades;

            // Nếu không có lớp nào ở môn học này, không hiển thị cả cục (Card) môn học đó luôn
            if (isReadOnly && relevantGrades.length === 0) return null;

            return (
              <Col xs={24} sm={12} xl={8} key={subject.id}>
                <Card title={subject.name} size="small" style={{ height: '100%' }}>
                  <Space wrap>
                    {relevantGrades.map(grade => {
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
            );
          })}
        </Row>
      </Col>

      <Col xs={24} md={8}>
        <Card 
          title={activeSubject && activeGrade ? `${activeSubject.name} - ${activeGrade.name}` : 'Classes'}
          // Ẩn nút Add Class nếu là Read Only
          extra={(!isReadOnly && activeSubject && activeGrade) ? <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => openModal('class')} /> : null}
          style={{ height: '100%' }}
          bodyStyle={{ padding: 0, height: '500px', overflowY: 'auto' }}
        >
          {activeSubject && activeGrade ? (
            <List
              dataSource={filteredClasses}
              locale={{ emptyText: 'No classes found' }}
              renderItem={item => (
                <List.Item 
                  // Ẩn actions sửa/xóa nếu là Read Only
                  actions={isReadOnly ? [] : [
                    <EditOutlined key="edit" onClick={(e) => { e.stopPropagation(); openModal('class', item); }} />,
                    <Popconfirm key="delete" title="Delete?" onConfirm={(e) => { e.stopPropagation(); handleDelete('class', item.id); }}>
                      <DeleteOutlined style={{ color: 'red' }} onClick={(e) => e.stopPropagation()} />
                    </Popconfirm>
                  ]}
                  // Tự động điều hướng theo Role (admin -> /admin/classes/..., teacher -> /teacher/classes/...)
                  onClick={() => window.open(`/${role.toLowerCase()}/classes/${item.id}`, '_blank')}
                  style={{ cursor: 'pointer', padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', paddingRight: isReadOnly ? 0 : 24 }}>
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
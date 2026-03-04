import React from 'react';
import { Card, Col, Row, Select, Button, Popconfirm, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function ClassFilterBar({ 
  years, terms, selectedYear, selectedTerm, 
  handleSelectYear, handleSelectTerm, openModal, handleDelete,
  isReadOnly = false // <-- Thêm prop này
}) {
  return (
    <Card bodyStyle={{ padding: '16px 24px' }}>
      <Row gutter={24} align="middle">
        <Col>
          <Text strong>Year: </Text>
          <Select 
            placeholder="Select Year" 
            style={{ width: 150, marginLeft: 8 }} 
            value={selectedYear?.id} 
            onChange={handleSelectYear}
          >
            {years.map(y => <Select.Option key={y.id} value={y.id}>{y.name}</Select.Option>)}
          </Select>
          {!isReadOnly && <Button type="link" icon={<PlusOutlined />} onClick={() => openModal('year')}>Add</Button>}
          {!isReadOnly && selectedYear && <Button type="text" icon={<EditOutlined />} onClick={() => openModal('year', selectedYear)} />}
          {!isReadOnly && selectedYear && (
            <Popconfirm title="Delete year?" onConfirm={() => handleDelete('year', selectedYear.id)}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Col>

        <Col>
          <Text strong>Term: </Text>
          <Select 
            placeholder="Select Term" 
            style={{ width: 150, marginLeft: 8 }} 
            value={selectedTerm?.id} 
            onChange={handleSelectTerm}
            disabled={!selectedYear}
          >
            {terms.map(t => <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>)}
          </Select>
          {!isReadOnly && <Button type="link" icon={<PlusOutlined />} onClick={() => openModal('term')} disabled={!selectedYear}>Add</Button>}
          {!isReadOnly && selectedTerm && <Button type="text" icon={<EditOutlined />} onClick={() => openModal('term', selectedTerm)} />}
          {!isReadOnly && selectedTerm && (
            <Popconfirm title="Delete term?" onConfirm={() => handleDelete('term', selectedTerm.id)}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Col>
      </Row>
    </Card>
  );
}
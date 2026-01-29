// src/pages/Admin/Classes/AdminClasses.jsx
import React, { useEffect, useState } from 'react';
import { Card, Col, Row, List, Button, Input, Modal, message, Popconfirm, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, RightOutlined } from '@ant-design/icons';
import * as ClassQuery from '../../../data/Center/classQuery';

const { Title, Text } = Typography;

export default function AdminClasses() {
  const [years, setYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);

  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'year', 'term', 'class'
  const [editingItem, setEditingItem] = useState(null);
  const [itemName, setItemName] = useState('');

  // --- Fetching Data ---

  const fetchYears = async () => {
    const data = await ClassQuery.getAllYears();
    setYears(data);
  };

  const fetchTerms = async (yearId) => {
    const data = await ClassQuery.getTermsByYear(yearId);
    setTerms(data);
  };

  // FIXED: Updated function name here
  const fetchClasses = async (termId) => {
    const data = await ClassQuery.getClassesByTerm(termId);
    setClasses(data);
  };

  useEffect(() => {
    fetchYears();
  }, []);

  // --- Selection Handlers ---

  const handleSelectYear = (year) => {
    setSelectedYear(year);
    setSelectedTerm(null);
    setClasses([]);
    fetchTerms(year.id);
  };

  const handleSelectTerm = (term) => {
    setSelectedTerm(term);
    fetchClasses(term.id);
  };

  // --- CRUD Handlers ---

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setItemName(item ? item.name : '');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!itemName.trim()) return message.error("Name cannot be empty");
    
    let result;
    // YEAR
    if (modalType === 'year') {
      if (editingItem) result = await ClassQuery.updateYear(editingItem.id, { name: itemName });
      else result = await ClassQuery.addYear(itemName);
      if (result.success) fetchYears();
    }
    // TERM
    else if (modalType === 'term') {
      if (editingItem) result = await ClassQuery.updateTerm(editingItem.id, { name: itemName });
      else result = await ClassQuery.addTerm(itemName, selectedYear.id);
      if (result.success) fetchTerms(selectedYear.id);
    }
    // CLASS
    else if (modalType === 'class') {
      if (editingItem) result = await ClassQuery.updateClass(editingItem.id, { name: itemName });
      else result = await ClassQuery.addClass(itemName, selectedTerm.id);
      if (result.success) fetchClasses(selectedTerm.id);
    }

    if (result.success) {
      message.success("Saved successfully");
      setIsModalOpen(false);
    } else {
      message.error(result.message);
    }
  };

  const handleDelete = async (type, id) => {
    let result;
    if (type === 'year') {
      result = await ClassQuery.deleteYear(id);
      if (result.success) {
        setYears(years.filter(y => y.id !== id));
        if (selectedYear?.id === id) { setSelectedYear(null); setTerms([]); setClasses([]); }
      }
    } else if (type === 'term') {
      result = await ClassQuery.deleteTerm(id);
      if (result.success) {
        setTerms(terms.filter(t => t.id !== id));
        if (selectedTerm?.id === id) { setSelectedTerm(null); setClasses([]); }
      }
    } else if (type === 'class') {
      result = await ClassQuery.deleteClass(id);
      if (result.success) {
        setClasses(classes.filter(c => c.id !== id));
      }
    }
    
    if (result.success) message.success("Deleted successfully");
    else message.error(result.message);
  };

  const handleClassClick = (cls) => {
    // Open in new tab
    window.open(`/admin/classes/${cls.id}`, '_blank');
  };

  // --- Render Helpers ---

  const renderList = (title, data, type, selectedId, onSelect, parentSelected) => (
    <Card 
      title={title} 
      extra={parentSelected ? <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => openModal(type)} /> : null}
      style={{ height: '100%' }}
      bodyStyle={{ padding: 0, height: '400px', overflowY: 'auto' }}
    >
      <List
        dataSource={data}
        renderItem={item => (
          <List.Item 
            actions={[
              <EditOutlined key="edit" onClick={(e) => { e.stopPropagation(); openModal(type, item); }} />,
              <Popconfirm title="Delete?" onConfirm={(e) => { e.stopPropagation(); handleDelete(type, item.id); }}>
                <DeleteOutlined key="delete" style={{ color: 'red' }} onClick={(e) => e.stopPropagation()} />
              </Popconfirm>
            ]}
            onClick={() => onSelect && onSelect(item)}
            style={{ 
              cursor: onSelect ? 'pointer' : 'default',
              padding: '12px 16px',
              backgroundColor: item.id === selectedId ? '#e6f7ff' : 'transparent',
              borderLeft: item.id === selectedId ? '3px solid #1890ff' : '3px solid transparent'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', paddingRight: 24 }}>
              <Text strong>{item.name}</Text>
              {onSelect && <RightOutlined style={{ fontSize: 10, color: '#ccc', alignSelf: 'center' }} />}
            </div>
          </List.Item>
        )}
      />
      {!parentSelected && data.length === 0 && <div style={{ padding: 16, textAlign: 'center', color: '#999' }}>Select parent to add items</div>}
    </Card>
  );

  return (
    <div>
      <Title level={3} style={{ marginBottom: 20 }}>Class Management</Title>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          {renderList("Năm học", years, 'year', selectedYear?.id, handleSelectYear, true)}
        </Col>
        <Col xs={24} md={8}>
          {renderList("Kỳ học", terms, 'term', selectedTerm?.id, handleSelectTerm, !!selectedYear)}
        </Col>
        <Col xs={24} md={8}>
          {/* CHANGE: Pass handleClassClick here */}
          {renderList("Lớp học", classes, 'class', null, handleClassClick, !!selectedTerm)}
        </Col>
      </Row>

      <Modal 
        title={`${editingItem ? 'Edit' : 'Add'} ${modalType.charAt(0).toUpperCase() + modalType.slice(1)}`}
        open={isModalOpen} 
        onOk={handleSave} 
        onCancel={() => setIsModalOpen(false)}
      >
        <Input 
          placeholder={`Enter ${modalType} name`} 
          value={itemName} 
          onChange={(e) => setItemName(e.target.value)} 
          onPressEnter={handleSave}
        />
      </Modal>
    </div>
  );
}
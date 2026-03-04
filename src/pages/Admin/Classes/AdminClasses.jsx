// src/pages/Admin/Classes/AdminClasses.jsx
import React, { useEffect, useState } from 'react';
import { Card, Col, Row, List, Button, Input, Modal, message, Popconfirm, Typography, Form, Select, DatePicker, InputNumber } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import * as ClassQuery from '../../../data/Center/classQuery';
import {getAllUsers} from '../../../data/Users/userQuery';
import {getGrades, getSubjects } from '../../../data/Center/sectionQuery';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function AdminClasses() {
  const [years, setYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  
  // Real Firebase Data States
  const [teachers, setTeachers] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'year', 'term', 'class'
  const [editingItem, setEditingItem] = useState(null);
  const [itemName, setItemName] = useState('');
  
  const [form] = Form.useForm();

  // --- Fetching Data ---

  const fetchYears = async () => {
    const data = await ClassQuery.getAllYears();
    setYears(data);
  };

  const fetchTerms = async (yearId) => {
    const data = await ClassQuery.getTermsByYear(yearId);
    setTerms(data);
  };

  const fetchClasses = async (termId) => {
    const data = await ClassQuery.getClassesByTerm(termId);
    setClasses(data);
  };

  // Fetch Users (Teachers)
  const fetchTeachers = async () => {
    const allUsers = await getAllUsers();
    setTeachers(allUsers.filter(u => u.role === 'Teacher'));
  };

  // Fetch Grades and Subjects
  const fetchGradesAndSubjects = async () => {
    const fetchedGrades = await getGrades();
    const fetchedSubjects = await getSubjects();
    setGrades(fetchedGrades);
    setSubjects(fetchedSubjects);
  };

  useEffect(() => {
    fetchYears();
    fetchTeachers();
    fetchGradesAndSubjects();
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

    if (type === 'class') {
      if (item) {
        form.setFieldsValue({
          name: item.name,
          grade: item.grade,       // Sets the dropdown to the saved ID
          subject: item.subject,   // Sets the dropdown to the saved ID
          teacher: item.teacher,   // Sets the dropdown to the saved ID
          dates: [dayjs(item.startTime), dayjs(item.endTime)],
          fee: item.fee,
          status: item.status
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          fee: 300000,
          status: 'Active',
          dates: [dayjs().startOf('month'), dayjs().endOf('month')]
        });
      }
    }
    
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    let result;
    
    if (modalType === 'class') {
      try {
        const values = await form.validateFields();
        const classData = {
          name: values.name,
          grade: values.grade,     // This is strictly the ID string from the Select
          subject: values.subject, // This is strictly the ID string from the Select
          teacher: values.teacher, // This is strictly the ID string from the Select
          startTime: values.dates[0].toISOString(),
          endTime: values.dates[1].toISOString(),
          fee: values.fee,
          status: values.status
        };

        if (editingItem) {
          result = await ClassQuery.updateClass(editingItem.id, classData);
        } else {
          result = await ClassQuery.addClass(classData, selectedTerm.id);
        }
        
        if (result.success) fetchClasses(selectedTerm.id);
      } catch (error) {
        return; // Form validation failed
      }
    } else {
      if (!itemName.trim()) return message.error("Name cannot be empty");

      if (modalType === 'year') {
        if (editingItem) result = await ClassQuery.updateYear(editingItem.id, { name: itemName });
        else result = await ClassQuery.addYear(itemName);
        if (result.success) fetchYears();
      }
      else if (modalType === 'term') {
        if (editingItem) result = await ClassQuery.updateTerm(editingItem.id, { name: itemName });
        else result = await ClassQuery.addTerm(itemName, selectedYear.id);
        if (result.success) fetchTerms(selectedYear.id);
      }
    }

    if (result && result.success) {
      message.success("Saved successfully");
      setIsModalOpen(false);
    } else if (result) {
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
          {renderList("Lớp học", classes, 'class', null, handleClassClick, !!selectedTerm)}
        </Col>
      </Row>

      <Modal 
        title={`${editingItem ? 'Edit' : 'Add'} ${modalType.charAt(0).toUpperCase() + modalType.slice(1)}`}
        open={isModalOpen} 
        onOk={handleSave} 
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
      >
        {modalType === 'class' ? (
          <Form form={form} layout="vertical">
            <Form.Item name="name" label="Class Name" rules={[{ required: true, message: 'Please enter a name' }]}>
              <Input placeholder="Enter class name" />
            </Form.Item>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="grade" label="Grade" rules={[{ required: true }]}>
                  <Select placeholder="Select Grade">
                    {/* The value={g.id} guarantees we only save the ID string to Firebase */}
                    {grades.map(g => <Select.Option key={g.id} value={g.id}>{g.name}</Select.Option>)}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="subject" label="Subject" rules={[{ required: true }]}>
                  <Select placeholder="Select Subject">
                    {/* The value={s.id} guarantees we only save the ID string to Firebase */}
                    {subjects.map(s => <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>)}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="teacher" label="Teacher" rules={[{ required: true }]}>
              <Select placeholder="Select Teacher">
                {/* The value={t.id} guarantees we only save the ID string to Firebase */}
                {teachers.map(t => <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>)}
              </Select>
            </Form.Item>

            <Form.Item name="dates" label="Duration (Start Date - End Date)" rules={[{ required: true }]}>
              <RangePicker style={{ width: '100%' }} />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="fee" label="Fee (VND)" rules={[{ required: true }]}>
                  <InputNumber style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                  <Select disabled={!editingItem}>
                    <Select.Option value="Active">Active</Select.Option>
                    {editingItem && <Select.Option value="Complete">Complete</Select.Option>}
                    {editingItem && <Select.Option value="Cancel">Cancel</Select.Option>}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        ) : (
          <Input 
            placeholder={`Enter ${modalType} name`} 
            value={itemName} 
            onChange={(e) => setItemName(e.target.value)} 
            onPressEnter={handleSave}
          />
        )}
      </Modal>
    </div>
  );
}
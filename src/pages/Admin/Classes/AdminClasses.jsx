// src/pages/Admin/Classes/AdminClasses.jsx
import React, { useEffect, useState } from 'react';
import { Card, Col, Row, List, Button, Input, Modal, message, Popconfirm, Typography, Form, Select, DatePicker, InputNumber, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import * as ClassQuery from '../../../data/Center/classQuery';
import { getAllUsers } from '../../../data/Users/userQuery';
import { getGrades, getSubjects } from '../../../data/Center/sectionQuery';

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

  // Filter States
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  
  // Selection States for Subject & Grade
  const [activeSubject, setActiveSubject] = useState(null);
  const [activeGrade, setActiveGrade] = useState(null);

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

  const handleSelectYear = (yearId) => {
    const year = years.find(y => y.id === yearId);
    setSelectedYear(year);
    setSelectedTerm(null);
    setClasses([]);
    setActiveSubject(null);
    setActiveGrade(null);
    fetchTerms(year.id);
  };

  const handleSelectTerm = (termId) => {
    const term = terms.find(t => t.id === termId);
    setSelectedTerm(term);
    fetchClasses(term.id);
    setActiveSubject(null);
    setActiveGrade(null);
  };

  const handleSelectSubjectGrade = (subject, grade) => {
    setActiveSubject(subject);
    setActiveGrade(grade);
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
          grade: item.grade,
          subject: item.subject,
          teacher: item.teacher,
          dates: [dayjs(item.startTime), dayjs(item.endTime)],
          fee: item.fee,
          status: item.status
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          fee: 300000,
          status: 'Active',
          dates: [dayjs().startOf('month'), dayjs().endOf('month')],
          // Automatically pre-fill the selected subject and grade
          subject: activeSubject?.id,
          grade: activeGrade?.id
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
          grade: values.grade,
          subject: values.subject,
          teacher: values.teacher,
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
        if (selectedYear?.id === id) { 
          setSelectedYear(null); 
          setTerms([]); 
          setClasses([]); 
        }
      }
    } else if (type === 'term') {
      result = await ClassQuery.deleteTerm(id);
      if (result.success) {
        setTerms(terms.filter(t => t.id !== id));
        if (selectedTerm?.id === id) { 
          setSelectedTerm(null); 
          setClasses([]); 
        }
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

  // --- Derived Data ---
  const filteredClasses = classes.filter(
    c => c.subject === activeSubject?.id && c.grade === activeGrade?.id
  );

  return (
    <div>
      <Title level={3} style={{ marginBottom: 20 }}>Class Management</Title>
      
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Top Filters */}
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
              <Button type="link" icon={<PlusOutlined />} onClick={() => openModal('year')}>Add</Button>
              {selectedYear && <Button type="text" icon={<EditOutlined />} onClick={() => openModal('year', selectedYear)} />}
              {selectedYear && (
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
              <Button type="link" icon={<PlusOutlined />} onClick={() => openModal('term')} disabled={!selectedYear}>Add</Button>
              {selectedTerm && <Button type="text" icon={<EditOutlined />} onClick={() => openModal('term', selectedTerm)} />}
              {selectedTerm && (
                <Popconfirm title="Delete term?" onConfirm={() => handleDelete('term', selectedTerm.id)}>
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              )}
            </Col>
          </Row>
        </Card>

        {/* Main Content Area */}
        {selectedTerm ? (
          <Row gutter={[16, 16]}>
            {/* Subjects & Grades Cards */}
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
                              onClick={() => handleSelectSubjectGrade(subject, grade)}
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

            {/* Target Classes List */}
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
                        onClick={() => handleClassClick(item)}
                        style={{ 
                          cursor: 'pointer',
                          padding: '12px 16px',
                          borderBottom: '1px solid #f0f0f0'
                        }}
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
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999', backgroundColor: '#fafafa', borderRadius: '8px' }}>
            <Text type="secondary" style={{ fontSize: '16px' }}>Please select a Year and Term from the top filters to manage classes</Text>
          </div>
        )}
      </Space>

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
                    {grades.map(g => <Select.Option key={g.id} value={g.id}>{g.name}</Select.Option>)}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="subject" label="Subject" rules={[{ required: true }]}>
                  <Select placeholder="Select Subject">
                    {subjects.map(s => <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>)}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="teacher" label="Teacher" rules={[{ required: true }]}>
              <Select placeholder="Select Teacher">
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
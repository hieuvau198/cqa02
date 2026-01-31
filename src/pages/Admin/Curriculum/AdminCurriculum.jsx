// src/pages/Admin/Curriculum/AdminCurriculum.jsx
import React, { useEffect, useState } from 'react';
import { Card, Col, Row, List, Button, Input, Modal, message, Popconfirm, Typography, Select, Form, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import * as SectionQuery from '../../../data/Center/sectionQuery';
import * as ActivityQuery from '../../../data/Center/activityQuery';
import ActivityManager from './partials/ActivityManager';

const { Title, Text } = Typography;
const { Option } = Select;

export default function AdminCurriculum() {
  const [form] = Form.useForm();
  const [sections, setSections] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const [selectedSection, setSelectedSection] = useState(null);
  const [activityRefresh, setActivityRefresh] = useState(0); // Trigger to reload activities

  const [filterGrade, setFilterGrade] = useState(null);
  const [filterSubject, setFilterSubject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('section'); 
  const [editingItem, setEditingItem] = useState(null);

  const refreshData = async () => {
    const [s, g, sub] = await Promise.all([
      SectionQuery.getSections(),
      SectionQuery.getGrades(),
      SectionQuery.getSubjects()
    ]);
    setSections(s);
    setGrades(g);
    setSubjects(sub);
  };

  useEffect(() => { refreshData(); }, []);

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    setIsModalOpen(true);
    if (item) {
      form.setFieldsValue({ name: item.name, gradeId: item.gradeId, subjectId: item.subjectId });
    } else {
      form.resetFields();
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      let res;
      
      if (modalType === 'activity') {
        const data = { name: values.name, sectionId: selectedSection.id };
        res = editingItem 
          ? await ActivityQuery.updateActivity(editingItem.id, data)
          : await ActivityQuery.addActivity(data);
      } else {
        const relations = modalType === 'section' ? { gradeId: values.gradeId, subjectId: values.subjectId } : {};
        res = editingItem 
          ? await SectionQuery.updateItem(modalType, editingItem.id, values.name, relations)
          : await SectionQuery.addItem(modalType, values.name, relations);
      }

      if (res.success) {
        message.success("Thành công");
        setIsModalOpen(false);
        if (modalType === 'activity') setActivityRefresh(prev => prev + 1);
        else refreshData();
      }
    } catch (error) { console.error(error); }
  };

  const filteredSections = sections.filter(s => 
    (!filterGrade || s.gradeId === filterGrade) && (!filterSubject || s.subjectId === filterSubject)
  );

  return (
    <div>
      <Title level={3}>Quản lý Chương trình</Title>
      <Card style={{ marginBottom: 20 }}>
        <Space>
          <Text strong>Bộ lọc:</Text>
          <Select placeholder="Khối" style={{ width: 150 }} allowClear onChange={setFilterGrade}>
            {grades.map(g => <Option key={g.id} value={g.id}>{g.name}</Option>)}
          </Select>
          <Select placeholder="Môn" style={{ width: 150 }} allowClear onChange={setFilterSubject}>
            {subjects.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}
          </Select>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card title="Sections" extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => openModal('section')}>Thêm</Button>}>
            <List
              dataSource={filteredSections}
              renderItem={item => (
                <List.Item 
                  onClick={() => setSelectedSection(item)}
                  style={{ cursor: 'pointer', backgroundColor: selectedSection?.id === item.id ? '#f0f5ff' : 'inherit' }}
                  actions={[
                    <EditOutlined onClick={(e) => { e.stopPropagation(); openModal('section', item); }} />,
                    <Popconfirm title="Xóa?" onConfirm={() => SectionQuery.deleteItem('section', item.id).then(refreshData)}>
                      <DeleteOutlined style={{ color: 'red' }} />
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta title={item.name} description={`${grades.find(g => g.id === item.gradeId)?.name || ''} - ${subjects.find(s => s.id === item.subjectId)?.name || ''}`} />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col span={8}>
          <ActivityManager 
            section={selectedSection} 
            onOpenModal={openModal} 
            refreshTrigger={activityRefresh} 
          />
        </Col>

        <Col span={8}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Card title="Khối" extra={<Button size="small" icon={<PlusOutlined />} onClick={() => openModal('grade')} />}>
              <List size="small" dataSource={grades} renderItem={g => <List.Item actions={[<EditOutlined onClick={() => openModal('grade', g)} />]}>{g.name}</List.Item>} />
            </Card>
            <Card title="Môn" extra={<Button size="small" icon={<PlusOutlined />} onClick={() => openModal('subject')} />}>
              <List size="small" dataSource={subjects} renderItem={s => <List.Item actions={[<EditOutlined onClick={() => openModal('subject', s)} />]}>{s.name}</List.Item>} />
            </Card>
          </Space>
        </Col>
      </Row>

      <Modal title={`${editingItem ? 'Sửa' : 'Thêm'} ${modalType}`} open={isModalOpen} onOk={handleSave} onCancel={() => setIsModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          {modalType === 'section' && (
            <>
              <Form.Item name="gradeId" label="Khối" rules={[{ required: true }]}><Select>{grades.map(g => <Option key={g.id} value={g.id}>{g.name}</Option>)}</Select></Form.Item>
              <Form.Item name="subjectId" label="Môn" rules={[{ required: true }]}><Select>{subjects.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}</Select></Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
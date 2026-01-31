import React, { useEffect, useState } from 'react';
import { Card, Col, Row, List, Button, Input, Modal, message, Popconfirm, Typography, Select, Form, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import * as SectionQuery from '../../../data/Center/sectionQuery';

const { Title, Text } = Typography;
const { Option } = Select;

export default function AdminCurriculum() {
  const [form] = Form.useForm();
  const [sections, setSections] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  // States for filters at the top
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
      form.setFieldsValue({
        name: item.name,
        gradeId: item.gradeId,
        subjectId: item.subjectId
      });
    } else {
      form.resetFields();
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      let res;
      
      const relations = modalType === 'section' ? {
        gradeId: values.gradeId,
        subjectId: values.subjectId
      } : {};

      if (editingItem) {
        res = await SectionQuery.updateItem(modalType, editingItem.id, values.name, relations);
      } else {
        res = await SectionQuery.addItem(modalType, values.name, relations);
      }

      if (res.success) {
        message.success("Lưu thành công");
        setIsModalOpen(false);
        refreshData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Filter logic for the main list
  const filteredSections = sections.filter(s => 
    (!filterGrade || s.gradeId === filterGrade) && 
    (!filterSubject || s.subjectId === filterSubject)
  );

  return (
    <div>
      <Title level={3}>Quản lý Chương trình</Title>
      
      {/* Top Filters */}
      <Card style={{ marginBottom: 20 }}>
        <Text strong>Bộ lọc: </Text>
        <Select 
          placeholder="Lọc theo Khối" 
          style={{ width: 200, marginLeft: 10 }} 
          allowClear 
          onChange={setFilterGrade}
        >
          {grades.map(g => <Option key={g.id} value={g.id}>{g.name}</Option>)}
        </Select>
        <Select 
          placeholder="Lọc theo Môn" 
          style={{ width: 200, marginLeft: 10 }} 
          allowClear 
          onChange={setFilterSubject}
        >
          {subjects.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}
        </Select>
      </Card>

      <Row gutter={[16, 16]}>
        {/* Sections List */}
        <Col span={16}>
          <Card 
            title="Danh sách Section" 
            extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openModal('section')}>Thêm Section</Button>}
          >
            <List
              dataSource={filteredSections}
              renderItem={item => (
                <List.Item actions={[
                  <EditOutlined key="edit" onClick={() => openModal('section', item)} />,
                  <Popconfirm key="del" title="Xóa section này?" onConfirm={() => SectionQuery.deleteItem('section', item.id).then(refreshData)}>
                    <DeleteOutlined style={{ color: 'red' }} />
                  </Popconfirm>
                ]}>
                  <List.Item.Meta
                    title={item.name}
                    description={
                      <Space>
                        <Text type="secondary">Khối: {grades.find(g => g.id === item.gradeId)?.name || 'Chưa chọn'}</Text>
                        <Text type="secondary">|</Text>
                        <Text type="secondary">Môn: {subjects.find(s => s.id === item.subjectId)?.name || 'Chưa chọn'}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Grade & Subject Management */}
        <Col span={8}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card title="Khối (Grades)" extra={<Button size="small" icon={<PlusOutlined />} onClick={() => openModal('grade')} />}>
              <List size="small" dataSource={grades} renderItem={g => (
                <List.Item actions={[
                  <EditOutlined onClick={() => openModal('grade', g)} />,
                  <Popconfirm title="Xóa?" onConfirm={() => SectionQuery.deleteItem('grade', g.id).then(refreshData)}><DeleteOutlined style={{ color: 'red' }}/></Popconfirm>
                ]}>{g.name}</List.Item>
              )} />
            </Card>
            <Card title="Môn học (Subjects)" extra={<Button size="small" icon={<PlusOutlined />} onClick={() => openModal('subject')} />}>
              <List size="small" dataSource={subjects} renderItem={s => (
                <List.Item actions={[
                  <EditOutlined onClick={() => openModal('subject', s)} />,
                  <Popconfirm title="Xóa?" onConfirm={() => SectionQuery.deleteItem('subject', s.id).then(refreshData)}><DeleteOutlined style={{ color: 'red' }}/></Popconfirm>
                ]}>{s.name}</List.Item>
              )} />
            </Card>
          </Space>
        </Col>
      </Row>

      {/* Unified Modal for all 3 types */}
      <Modal 
        title={`${editingItem ? 'Sửa' : 'Thêm'} ${modalType}`} 
        open={isModalOpen} 
        onOk={handleSave} 
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label={`Tên ${modalType}`} rules={[{ required: true }]}>
            <Input placeholder="Nhập tên..." />
          </Form.Item>

          {modalType === 'section' && (
            <>
              <Form.Item name="gradeId" label="Thuộc Khối" rules={[{ required: true }]}>
                <Select placeholder="Chọn khối">
                  {grades.map(g => <Option key={g.id} value={g.id}>{g.name}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item name="subjectId" label="Thuộc Môn" rules={[{ required: true }]}>
                <Select placeholder="Chọn môn học">
                  {subjects.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}
                </Select>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
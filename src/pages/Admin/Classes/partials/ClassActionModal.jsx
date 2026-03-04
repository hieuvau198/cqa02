import React from 'react';
import { Modal, Form, Input, Select, Row, Col, DatePicker, InputNumber } from 'antd';

const { RangePicker } = DatePicker;

export default function ClassActionModal({
  isModalOpen, setIsModalOpen, modalType,
  editingItem, itemName, setItemName,
  form, handleSave, grades, subjects, teachers
}) {
  return (
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
  );
}
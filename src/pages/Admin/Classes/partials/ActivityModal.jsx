// src/pages/Admin/Classes/partials/ActivityModal.jsx
import React, { useEffect } from "react";
import { Modal, Form, Input } from "antd";
import { LinkOutlined } from "@ant-design/icons";

const { TextArea } = Input;

export default function ActivityModal({ isOpen, onClose, onSave, editingActivity }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (isOpen) {
      if (editingActivity) {
        form.setFieldsValue({
          name: editingActivity.name,
          description: editingActivity.description,
          link: editingActivity.link,
        });
      } else {
        form.resetFields();
      }
    }
  }, [isOpen, editingActivity, form]);

  return (
    <Modal
      title={editingActivity ? "Edit Activity" : "New Activity"}
      open={isOpen}
      onCancel={onClose}
      onOk={() => form.submit()}
    >
      <Form form={form} layout="vertical" onFinish={onSave}>
        <Form.Item
          name="name"
          label="Activity Name"
          rules={[{ required: true, message: "Please enter a name" }]}
        >
          <Input placeholder="e.g. Quiz, Group Discussion" />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <TextArea rows={2} placeholder="Instructions or details..." />
        </Form.Item>
        <Form.Item name="link" label="Source / Link">
          <Input prefix={<LinkOutlined />} placeholder="https://..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}
// src/pages/Admin/Classes/partials/SlotModal.jsx
import React, { useEffect } from "react";
import { Modal, Form, DatePicker, TimePicker, Input, Grid } from "antd";
import dayjs from "dayjs";

const { TextArea } = Input;
const { useBreakpoint } = Grid;

export default function SlotModal({ isOpen, onClose, onSave, editingSlot, isSaving }) {
  const [form] = Form.useForm();
  const screens = useBreakpoint();

  useEffect(() => {
    if (isOpen) {
      if (editingSlot) {
        form.setFieldsValue({
          date: dayjs(editingSlot.date),
          startTime: editingSlot.startTime ? dayjs(editingSlot.startTime, "HH:mm") : null,
          endTime: editingSlot.endTime ? dayjs(editingSlot.endTime, "HH:mm") : null,
          topic: editingSlot.topic,
        });
      } else {
        form.resetFields();
        form.setFieldValue("date", [dayjs()]);
      }
    }
  }, [isOpen, editingSlot, form]);

  return (
    <Modal
      title={editingSlot ? "Edit Slot" : "New Slot"}
      open={isOpen}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={isSaving}
      width={screens.xs ? "100%" : 520}
    >
      <Form form={form} layout="vertical" onFinish={onSave}>
        <Form.Item
          name="date"
          label={editingSlot ? "Ngày học" : "Chọn các ngày học"}
          rules={[{ required: true, message: "Vui lòng chọn ngày" }]}
        >
          {editingSlot ? (
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          ) : (
            <DatePicker
              multiple
              maxTagCount="responsive"
              className="w-full"
              format="DD/MM/YYYY"
              placeholder="Chọn nhiều ngày (Click để chọn thêm)"
            />
          )}
        </Form.Item>

        <Form.Item label="Time Range" className="mb-0">
          <div className="flex gap-2.5">
            <Form.Item
              name="startTime"
              rules={[{ required: true, message: "Start time required" }]}
              className="flex-1"
            >
              <TimePicker format="HH:mm" placeholder="Start Time" className="w-full" />
            </Form.Item>
            <Form.Item
              name="endTime"
              rules={[{ required: true, message: "End time required" }]}
              className="flex-1"
            >
              <TimePicker format="HH:mm" placeholder="End Time" className="w-full" />
            </Form.Item>
          </div>
        </Form.Item>

        <Form.Item name="topic" label="Topic / Content">
          <TextArea rows={3} placeholder="What will be taught?" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
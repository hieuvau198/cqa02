import React, { useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Select, Space, TimePicker } from 'antd';
import dayjs from 'dayjs';

const ShiftModal = ({ open, onCancel, onSubmit, shiftData, users }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      if (shiftData) {
        const startDayjs = dayjs(shiftData.startTime);
        const endDayjs = dayjs(shiftData.endTime);
        const startStr = startDayjs.format('HH:mm');
        const endStr = endDayjs.format('HH:mm');
        const slotStr = `${startStr}-${endStr}`;
        const isPreset = ['07:30-11:00', '08:00-11:00', '13:00-17:00', '15:00-19:00'].includes(slotStr);

        const userIds = shiftData.users ? shiftData.users.map(u => u.id) : (shiftData.userId ? [shiftData.userId] : []);

        form.setFieldsValue({
          name: shiftData.name,
          description: shiftData.description,
          userIds: userIds,
          date: startDayjs,
          timeSlot: isPreset ? slotStr : 'custom',
          customTime: isPreset ? null : [startDayjs, endDayjs],
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          date: dayjs(),
          timeSlot: '15:00-19:00', // Set new default to match your most common shift
          userIds: [], // Empty by default
        });
      }
    }
  }, [open, shiftData, form]);

  const handleFinish = (values) => {
    onSubmit(values, shiftData?.id);
  };

  return (
    <Modal
      title={shiftData ? 'Chỉnh sửa Ca làm' : 'Thêm Ca làm mới'}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="name" label="Tên Ca làm" rules={[{ required: true, message: 'Vui lòng nhập tên ca' }]}>
          <Input placeholder="Vd: Ca sáng, Ca tối..." />
        </Form.Item>
        
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={2} placeholder="Mô tả công việc trong ca..." />
        </Form.Item>

        {/* Cập nhật phần này trong file ShiftModal.jsx */}
        <Form.Item name="userIds" label="Nhân viên">
          <Select 
            mode="multiple" 
            placeholder="Chọn các nhân viên (Có thể để trống)" 
            showSearch 
            optionFilterProp="children"
            allowClear
          >
            {users
              .filter(user => user.role === 'Staff') // Lọc chỉ hiển thị những user có role là 'staff'
              .map(user => (
              <Select.Option key={user.id} value={user.id}>
                {user.name} ({user.username} - {user.role})
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Space style={{ display: 'flex', marginBottom: 8 }} align="start">
          <Form.Item name="date" label="Ngày làm việc" rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}>
            <DatePicker format="DD/MM/YYYY" style={{ width: 160 }} />
          </Form.Item>

          <Form.Item name="timeSlot" label="Khung giờ" rules={[{ required: true }]}>
            <Select style={{ width: 180 }}>
              <Select.Option value="07:30-11:00">07:30 to 11:00</Select.Option>
              <Select.Option value="08:00-11:00">08:00 to 11:00</Select.Option>
              <Select.Option value="13:00-17:00">13:00 to 17:00</Select.Option>
              <Select.Option value="15:00-19:00">15:00 to 19:00</Select.Option>
              <Select.Option value="custom">Tùy chỉnh (Khác)</Select.Option>
            </Select>
          </Form.Item>
        </Space>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.timeSlot !== currentValues.timeSlot}
        >
          {({ getFieldValue }) =>
            getFieldValue('timeSlot') === 'custom' ? (
              <Form.Item name="customTime" label="Thời gian tùy chỉnh" rules={[{ required: true, message: 'Chọn thời gian tùy chỉnh' }]}>
                <TimePicker.RangePicker format="HH:mm" />
              </Form.Item>
            ) : null
          }
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ShiftModal;
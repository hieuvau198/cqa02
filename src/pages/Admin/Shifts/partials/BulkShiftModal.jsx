import React from 'react';
import { Modal, Form, DatePicker, Alert } from 'antd';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

const BulkShiftModal = ({ open, onCancel, onSubmit }) => {
  const [form] = Form.useForm();

  const handleFinish = (values) => {
    // Get the exact Monday of the selected week
    const startOfWeek = values.week.startOf('isoWeek');
    onSubmit(startOfWeek);
  };

  return (
    <Modal
      title="Thêm Lịch Mặc Định (Cả Tuần)"
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnClose
    >
      <Alert 
        message="Lịch mặc định sẽ được tạo:"
        description={
          <ul style={{ paddingLeft: 20, margin: '10px 0' }}>
            <li><b>Thứ 2 - Thứ 6:</b> 1 ca (15:00 - 19:00)</li>
            <li><b>Thứ 7 & Chủ Nhật:</b> 2 ca (07:30 - 11:00, 13:00 - 17:00)</li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
      />
      <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ week: dayjs() }}>
        <Form.Item 
          name="week" 
          label="Chọn Tuần để áp dụng" 
          rules={[{ required: true, message: 'Vui lòng chọn tuần' }]}
        >
          <DatePicker picker="week" format="[Tuần] w-YYYY" style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BulkShiftModal;
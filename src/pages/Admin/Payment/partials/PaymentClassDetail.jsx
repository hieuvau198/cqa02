// src/pages/Admin/Payment/partials/PaymentClassDetail.jsx
import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Drawer, Form, InputNumber, Select, message, Tag, Input, Grid } from 'antd';
import { PlusOutlined, EditOutlined, DollarOutlined } from '@ant-design/icons';
import * as PaymentQuery from '../../../../data/Center/paymentQuery'; 
import * as ClassMember from '../../../../data/Center/classMember'; 

const { Option } = Select;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

export default function PaymentClassDetail({ classId, classInfo }) {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [form] = Form.useForm();
  const screens = useBreakpoint();

  const STATUS_OPTIONS = [
    { value: 'Chưa thanh toán', color: 'red' },
    { value: 'Đã thanh toán', color: 'green' },
    { value: 'Đã Hủy', color: 'default' },
    { value: 'Được Miễn', color: 'blue' },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedPayments, fetchedStudents] = await Promise.all([
        PaymentQuery.getPaymentsByClass(classId),
        ClassMember.getClassMembers(classId)
      ]);
      setPayments(fetchedPayments);
      setStudents(fetchedStudents);
    } catch (error) {
      message.error("Could not load data");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (classId) fetchData();
  }, [classId]);

  const showDrawer = (student, record = null) => {
    setEditingPayment(record);
    if (record) {
      form.setFieldsValue(record);
    } else {
      form.resetFields();
      const defaultFee = classInfo?.fee || 0; 
      form.setFieldsValue({ 
        studentId: student.id,
        studentName: student.name,
        className: classInfo?.name || '',
        status: 'Đã thanh toán', 
        amountPaid: defaultFee,  
        totalPrice: defaultFee, 
        note: 'Thu học phí',
      });
    }
    setDrawerVisible(true);
  };

  const handleSave = async (values) => {
    setLoading(true);
    const payload = { ...values, classId };

    let result;
    if (editingPayment) {
      result = await PaymentQuery.updatePayment(editingPayment.id, payload);
    } else {
      result = await PaymentQuery.addPayment(payload);
    }

    if (result.success) {
      message.success("Lưu khoản thu thành công");
      setDrawerVisible(false);
      fetchData();
    } else {
      message.error(result.message);
    }
    setLoading(false);
  };

  const formatMoney = (amount) => {
    if (amount === undefined || amount === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Combine Students and their Payment Status
  const tableData = students.map(student => {
    const payment = payments.find(p => p.studentId === student.id);
    return {
      key: student.id,
      studentId: student.id,
      studentName: student.name,
      username: student.username,
      paymentRecord: payment || null
    };
  });

  const columns = [
    { 
      title: 'Student', 
      key: 'student',
      render: (_, record) => <b>{record.studentName}</b>
    },
    { 
      title: 'Status', 
      key: 'status',
      render: (_, record) => {
        if (!record.paymentRecord) return <Tag color="volcano">Chưa nộp</Tag>;
        const status = record.paymentRecord.status;
        const opt = STATUS_OPTIONS.find(o => o.value === status);
        return <Tag color={opt ? opt.color : 'default'}>{status}</Tag>;
      }
    },
    { 
      title: 'Receive', 
      key: 'amountPaid',
      render: (_, record) => <span style={{color: 'green'}}>
        {formatMoney(record.paymentRecord?.amountPaid || 0)}
      </span>
    },
    
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.paymentRecord ? (
            <Button icon={<EditOutlined />} size="small" onClick={() => showDrawer(record, record.paymentRecord)}>Sửa</Button>
          ) : (
            <Button type="primary" icon={<PlusOutlined />} size="small" onClick={() => showDrawer(record, null)}>Thu tiền</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Table 
        columns={columns} 
        dataSource={tableData} 
        loading={loading} 
        pagination={false}
        size="small"
        locale={{ emptyText: 'Chưa có học sinh trong lớp này' }}
        scroll={{ x: 600 }}
      />

      <Drawer
        title={editingPayment ? "Sửa khoản thu" : "Tạo khoản thu mới"}
        width={screens.xs ? '100%' : 450}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        <Form layout="vertical" form={form} onFinish={handleSave}>
          <Form.Item name="studentId" hidden><Input /></Form.Item>
          
          <Form.Item name="studentName" label="Học sinh" >
            <Input disabled />
          </Form.Item>

          <Form.Item name="className" label="Lớp">
            <Input disabled />
          </Form.Item>

          <Form.Item 
            name="totalPrice" 
            label="Tổng học phí" 
            rules={[{ required: true, message: 'Nhập số tiền' }]}
          >
            <InputNumber 
                style={{ width: '100%' }} 
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                prefix="₫"
                onChange={(val) => {
                    if (!editingPayment && form.getFieldValue('status') === 'Đã thanh toán') {
                       form.setFieldsValue({ amountPaid: val });
                    }
                }}
            />
          </Form.Item>

          <Form.Item name="amountPaid" label="Đã thanh toán">
            <InputNumber 
                style={{ width: '100%' }} 
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                prefix="₫"
            />
          </Form.Item>

          <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
            <Select>
                {STATUS_OPTIONS.map(opt => (
                    <Option key={opt.value} value={opt.value}>
                         <Tag color={opt.color}>{opt.value}</Tag>
                    </Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item name="note" label="Ghi chú">
            <TextArea rows={3} placeholder="Nhập ghi chú (VD: Thu học phí)" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block loading={loading} icon={<DollarOutlined />}>
            {editingPayment ? "Cập nhật" : "Lưu khoản thu"}
          </Button>
        </Form>
      </Drawer>
    </div>
  );
}
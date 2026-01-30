// src/pages/Admin/Classes/partials/ClassPayment.jsx
import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Drawer, Form, InputNumber, Select, message, Popconfirm, Tag, Input, Grid } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined } from '@ant-design/icons';
import * as ClassQuery from '../../../../data/Center/classQuery';
import * as PaymentQuery from '../../../../data/Center/paymentQuery'; 
import * as ClassMember from '../../../../data/Center/classMember'; // <--- ADD THIS IMPORT

const { Option } = Select;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

export default function ClassPayment({ classId }) {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // ... (keep existing state definitions) ...
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [form] = Form.useForm();
  const screens = useBreakpoint();

  // Status Constants
  const STATUS_OPTIONS = [
    { value: 'Chưa thanh toán', color: 'red' },
    { value: 'Đã thanh toán', color: 'green' },
    { value: 'Đã Hủy', color: 'default' },
    { value: 'Được Miễn', color: 'blue' },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      // FIX: Use ClassMember.getClassMembers instead of ClassQuery.getStudentsInClass
      const [fetchedPayments, fetchedStudents] = await Promise.all([
        PaymentQuery.getPaymentsByClass(classId),
        ClassMember.getClassMembers(classId)
      ]);
      setPayments(fetchedPayments);
      setStudents(fetchedStudents);
    } catch (error) {
      console.error(error);
      message.error("Could not load data");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (classId) fetchData();
  }, [classId]);

  const showDrawer = (record = null) => {
    setEditingPayment(record);
    if (record) {
      form.setFieldsValue(record);
    } else {
      form.resetFields();
      // Defaults for new payment
      form.setFieldsValue({ 
        status: 'Chưa thanh toán',
        amountPaid: 0,
        note: 'Thu học phí' // <--- Default value added here
      });
    }
    setDrawerVisible(true);
  };

  const handleSave = async (values) => {
    setLoading(true);
    const payload = {
      ...values,
      classId, 
    };

    let result;
    if (editingPayment) {
      result = await PaymentQuery.updatePayment(editingPayment.id, payload);
    } else {
      result = await PaymentQuery.addPayment(payload);
    }

    if (result.success) {
      message.success(editingPayment ? "Payment record updated" : "Payment record added");
      setDrawerVisible(false);
      fetchData();
    } else {
      message.error(result.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const result = await PaymentQuery.deletePayment(id);
    if (result.success) {
      message.success("Payment record removed");
      fetchData();
    } else {
      message.error(result.message);
    }
  };

  // Helper to format VND
  const formatMoney = (amount) => {
    if (amount === undefined || amount === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Helper to get Student Name from ID
  const getStudentName = (studentId) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : <i style={{color:'#999'}}>Unknown Student</i>;
  };

  const columns = [
    { 
      title: 'Học sinh', 
      dataIndex: 'studentId', 
      key: 'student',
      render: (id) => <b>{getStudentName(id)}</b>
    },
    { 
      title: 'Học phí (Tổng)', 
      dataIndex: 'totalPrice', 
      key: 'totalPrice',
      render: (val) => formatMoney(val)
    },
    { 
      title: 'Đã đóng', 
      dataIndex: 'amountPaid', 
      key: 'amountPaid',
      render: (val) => <span style={{color: 'green'}}>{formatMoney(val)}</span>
    },
    { 
      title: 'Còn lại', 
      key: 'remaining',
      render: (_, record) => {
        if (record.status === 'Đã Hủy' || record.status === 'Được Miễn') {
            return <span style={{color: '#999'}}>-</span>;
        }
        const remaining = (record.totalPrice || 0) - (record.amountPaid || 0);
        return <span style={{color: remaining > 0 ? 'red' : 'black', fontWeight: remaining > 0 ? 'bold' : 'normal'}}>
            {formatMoney(remaining)}
        </span>;
      }
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => {
        const opt = STATUS_OPTIONS.find(o => o.value === status);
        return <Tag color={opt ? opt.color : 'default'}>{status}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => showDrawer(record)} />
          <Popconfirm 
            title="Delete payment record?" 
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => showDrawer(null)}>
          Tạo khoản thu
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={payments} 
        rowKey="id" 
        loading={loading} 
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: 'Chưa có dữ liệu học phí' }}
        scroll={{ x: 800 }}
      />

      <Drawer
        title={editingPayment ? "Sửa khoản thu" : "Tạo khoản thu mới"}
        // UPDATE: Responsive width
        width={screens.xs ? '100%' : 450}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        <Form layout="vertical" form={form} onFinish={handleSave}>
          
          <Form.Item 
            name="studentId" 
            label="Học sinh" 
            rules={[{ required: true, message: 'Vui lòng chọn học sinh' }]}
          >
            <Select 
                placeholder="Chọn học sinh" 
                showSearch
                optionFilterProp="children"
            >
                {students.map(s => (
                    <Option key={s.id} value={s.id}>
                        {s.name} ({s.username})
                    </Option>
                ))}
            </Select>
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
            />
          </Form.Item>

          <Form.Item 
            name="amountPaid" 
            label="Đã thanh toán" 
          >
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
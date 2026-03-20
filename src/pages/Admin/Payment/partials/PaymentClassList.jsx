// src/pages/Admin/Payment/partials/PaymentClassList.jsx
import React, { useEffect, useState } from 'react';
import { Collapse, Empty, Card, Spin } from 'antd';
import PaymentClassDetail from './PaymentClassDetail';
import * as PaymentQuery from '../../../../data/Center/paymentQuery';
import * as ClassMember from '../../../../data/Center/classMember';

// Custom component for the Collapse Header to fetch and display the ratio
const ClassPaymentHeader = ({ cls }) => {
  const [total, setTotal] = useState(0);
  const [paid, setPaid] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const [payments, students] = await Promise.all([
          PaymentQuery.getPaymentsByClass(cls.id),
          ClassMember.getClassMembers(cls.id)
        ]);

        // Đếm số lượng học sinh đã nộp (Status: Đã thanh toán hoặc Được Miễn)
        const paidStudents = payments.filter(
          p => p.status === 'Đã thanh toán' || p.status === 'Được Miễn'
        );

        setTotal(students.length);
        setPaid(paidStudents.length);
      } catch (error) {
        console.error("Error fetching payment summary:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [cls.id]);

  if (loading) {
    return (
      <span>
        <b>{cls.name}</b> - <Spin size="small" style={{ marginLeft: 8 }} />
      </span>
    );
  }

  // Tự động đổi màu nếu đã nộp đủ
  const isCompleted = total > 0 && paid === total;
  
  return (
    <span style={{ color: isCompleted ? 'green' : 'inherit' }}>
      <b>{cls.name}</b> - Đã đóng {paid}/{total}
    </span>
  );
};

export default function PaymentClassList({ classes }) {
  if (!classes || classes.length === 0) {
    return (
      <Card>
        <Empty description="Không có lớp học nào trong kỳ này" />
      </Card>
    );
  }

  const items = classes.map(cls => ({
    key: cls.id,
    label: <ClassPaymentHeader cls={cls} />,
    children: <PaymentClassDetail classId={cls.id} classInfo={cls} />
  }));

  return (
    <Card>
      <Collapse items={items} />
    </Card>
  );
}
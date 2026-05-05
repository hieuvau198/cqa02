import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin } from 'antd';
import { TeamOutlined, WalletOutlined, MoneyCollectOutlined } from '@ant-design/icons';
import * as PaymentQuery from '../../../../data/Center/paymentQuery';
import * as ClassMember from '../../../../data/Center/classMember';

export default function PaymentSummaryCards({ classes }) {
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summary, setSummary] = useState({
    totalStudents: 0,
    paidStudents: 0,
    currentCollected: 0,
    expectedTotal: 0
  });

  useEffect(() => {
    const calculateSummary = async () => {
      if (!classes || classes.length === 0) {
        setSummary({ totalStudents: 0, paidStudents: 0, currentCollected: 0, expectedTotal: 0 });
        return;
      }
      
      setLoadingSummary(true);
      let totalStu = 0;
      let paidStu = 0;
      let currentMoney = 0;
      let expectedMoney = 0;

      try {
        const promises = classes.map(async (cls) => {
          const [payments, students] = await Promise.all([
            PaymentQuery.getPaymentsByClass(cls.id),
            ClassMember.getClassMembers(cls.id)
          ]);
          
          const numStudents = students.length;
          totalStu += numStudents;
          
          const classFee = cls.fee ? Number(cls.fee) : 300000;
          expectedMoney += (classFee * numStudents);
          
          const validPayments = payments.filter(
            p => p.status === 'Đã thanh toán' || p.status === 'Được Miễn'
          );
          paidStu += validPayments.length;
          
          payments.forEach(p => {
            if (p.status === 'Đã thanh toán' && p.amountPaid) {
              currentMoney += Number(p.amountPaid);
            }
          });
        });

        await Promise.all(promises);
        
        setSummary({
          totalStudents: totalStu,
          paidStudents: paidStu,
          currentCollected: currentMoney,
          expectedTotal: expectedMoney
        });
      } catch (error) {
        console.error("Lỗi khi tính toán tổng quan học phí:", error);
      } finally {
        setLoadingSummary(false);
      }
    };

    calculateSummary();
  }, [classes]);

  return (
    <Spin spinning={loadingSummary}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '12px' }}>
            <Statistic
              title={<span style={{ fontWeight: 500, color: '#8c8c8c' }}>Học phí đã thu</span>}
              value={`${summary.paidStudents} / ${summary.totalStudents}`}
              prefix={<TeamOutlined style={{ color: '#1890ff', marginRight: '8px' }} />}
              valueStyle={{ color: summary.paidStudents === summary.totalStudents && summary.totalStudents > 0 ? '#3f8600' : '#1890ff', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '12px' }}>
            <Statistic
              title={<span style={{ fontWeight: 500, color: '#8c8c8c' }}>Thực thu hiện tại</span>}
              value={summary.currentCollected}
              prefix={<WalletOutlined style={{ color: '#52c41a', marginRight: '8px' }} />}
              valueStyle={{ color: '#52c41a', fontWeight: 600 }}
              formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: '12px' }}>
            <Statistic
              title={<span style={{ fontWeight: 500, color: '#8c8c8c' }}>Tổng thu dự kiến</span>}
              value={summary.expectedTotal}
              prefix={<MoneyCollectOutlined style={{ color: '#faad14', marginRight: '8px' }} />}
              valueStyle={{ color: '#faad14', fontWeight: 600 }}
              formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
            />
          </Card>
        </Col>
      </Row>
    </Spin>
  );
}
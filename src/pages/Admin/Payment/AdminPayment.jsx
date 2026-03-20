// src/pages/Admin/Payment/AdminPayment.jsx
import React, { useEffect, useState } from 'react';
import { Space, Typography, Card, Row, Col, Statistic, Spin, Divider } from 'antd';
import { TeamOutlined, WalletOutlined, MoneyCollectOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import * as ClassQuery from '../../../data/Center/classQuery';
import * as PaymentQuery from '../../../data/Center/paymentQuery';
import * as ClassMember from '../../../data/Center/classMember';
import ClassFilterBar from '../Classes/partials/ClassFilterBar';
import PaymentClassList from './partials/PaymentClassList';

const { Title } = Typography;

export default function AdminPayment() {
  const [years, setYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);

  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);

  // States cho phần Summary Dashboard
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summary, setSummary] = useState({
    totalStudents: 0,
    paidStudents: 0,
    currentCollected: 0,
    expectedTotal: 0
  });

  useEffect(() => {
    const initializeData = async () => {
      const fetchedYears = await ClassQuery.getAllYears();
      setYears(fetchedYears);

      // AUTO-SELECT LOGIC
      const currentYearStr = dayjs().year().toString();
      const matchedYear = fetchedYears.find(y => y.name === currentYearStr);

      if (matchedYear) {
        setSelectedYear(matchedYear);
        const fetchedTerms = await ClassQuery.getTermsByYear(matchedYear.id);
        setTerms(fetchedTerms);

        const currentMonthStr = `Tháng ${dayjs().month() + 1}`;
        const matchedTerm = fetchedTerms.find(t => t.name === currentMonthStr);

        if (matchedTerm) {
          setSelectedTerm(matchedTerm);
          const fetchedClasses = await ClassQuery.getClassesByTerm(matchedTerm.id);
          setClasses(fetchedClasses);
        }
      }
    };
    initializeData();
  }, []);

  // Tính toán tóm tắt mỗi khi danh sách Lớp học (classes) thay đổi
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

          // Học phí của lớp, nếu không có mặc định là 300.000
          const classFee = cls.fee ? Number(cls.fee) : 300000;
          expectedMoney += (classFee * numStudents);

          // Đếm học sinh đã thanh toán hoặc được miễn
          const validPayments = payments.filter(
            p => p.status === 'Đã thanh toán' || p.status === 'Được Miễn'
          );
          paidStu += validPayments.length;

          // Tính tổng số tiền đã thu (Chỉ tính những giao dịch đã thanh toán)
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

  const handleSelectYear = async (yearId) => {
    const year = years.find(y => y.id === yearId);
    setSelectedYear(year);
    setSelectedTerm(null);
    setClasses([]);
    setTerms(await ClassQuery.getTermsByYear(year.id));
  };

  const handleSelectTerm = async (termId) => {
    const term = terms.find(t => t.id === termId);
    setSelectedTerm(term);
    setClasses(await ClassQuery.getClassesByTerm(term.id));
  };

  return (
    <div >
      <Space direction="vertical" style={{ width: '100%'}} size="large">
        

        {/* BỘ LỌC */}
          <ClassFilterBar 
            years={years} 
            terms={terms} 
            selectedYear={selectedYear} 
            selectedTerm={selectedTerm}
            handleSelectYear={handleSelectYear} 
            handleSelectTerm={handleSelectTerm}
            isReadOnly={true}
          />
        

        {/* THỐNG KÊ (DASHBOARD) */}
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
                  title={<span style={{ fontWeight: 500, color: '#8c8c8c' }}>Thu hiện tại</span>}
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
                  title={<span style={{ fontWeight: 500, color: '#8c8c8c' }}>Thu dự kiến</span>}
                  value={summary.expectedTotal}
                  prefix={<MoneyCollectOutlined style={{ color: '#faad14', marginRight: '8px' }} />}
                  valueStyle={{ color: '#faad14', fontWeight: 600 }}
                  formatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
                />
              </Card>
            </Col>
          </Row>
        </Spin>


        {/* DANH SÁCH LỚP HỌC */}
        <div >
          <PaymentClassList classes={classes} />
        </div>
      </Space>
    </div>
  );
}
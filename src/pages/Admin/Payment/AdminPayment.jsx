// src/pages/Admin/Payment/AdminPayment.jsx
import React, { useEffect, useState } from 'react';
import { Space, Typography, Card, Row, Col, Statistic, Spin, Button, Modal, Checkbox, Radio, message, Divider } from 'antd';
import { TeamOutlined, WalletOutlined, MoneyCollectOutlined, PrinterOutlined } from '@ant-design/icons';
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

  // States cho tính năng In (Print)
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [printClasses, setPrintClasses] = useState([]);
  const [printStatus, setPrintStatus] = useState('ALL'); // 'ALL', 'UNPAID', 'PAID'
  const [printData, setPrintData] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);

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

  // --- LOGIC IN ẤN ---
  const showPrintModal = () => {
    if (classes.length === 0) {
      message.warning("Không có lớp nào để in trong kỳ này.");
      return;
    }
    // Mặc định chọn tất cả các lớp khi mở modal
    setPrintClasses(classes.map(c => c.id));
    setPrintStatus('ALL');
    setPrintModalVisible(true);
  };

  const handleExecutePrint = async () => {
    if (printClasses.length === 0) {
      message.warning("Vui lòng chọn ít nhất 1 lớp để in.");
      return;
    }

    setIsPrinting(true);
    let allPrintRows = [];

    try {
      const promises = classes
        .filter(cls => printClasses.includes(cls.id))
        .map(async (cls) => {
          const [payments, students] = await Promise.all([
            PaymentQuery.getPaymentsByClass(cls.id),
            ClassMember.getClassMembers(cls.id)
          ]);

          const classFee = cls.fee ? Number(cls.fee) : 300000;

          students.forEach(student => {
            const payment = payments.find(p => p.studentId === student.id);
            const isPaid = payment && (payment.status === 'Đã thanh toán' || payment.status === 'Được Miễn');
            
            // Lọc theo trạng thái thanh toán
            if (printStatus === 'PAID' && !isPaid) return;
            if (printStatus === 'UNPAID' && isPaid) return;

            // Ngày thanh toán (nếu có)
            let paymentDateStr = '';
            if (isPaid && payment) {
              paymentDateStr = payment.createdAt 
                ? dayjs(payment.createdAt).format('DD/MM/YYYY') 
                : dayjs().format('DD/MM/YYYY');
            }

            allPrintRows.push({
              className: cls.name,
              studentName: student.name,
              fee: classFee,
              isPaid: isPaid,
              paidValue: isPaid ? payment.amountPaid : null,
              paymentDate: paymentDateStr,
            });
          });
        });

      await Promise.all(promises);

      // Sắp xếp danh sách in theo Lớp -> Tên học sinh
      allPrintRows.sort((a, b) => {
        if (a.className !== b.className) return a.className.localeCompare(b.className);
        return a.studentName.localeCompare(b.studentName);
      });

      setPrintData(allPrintRows);
      setPrintModalVisible(false);

      // Chờ React render Print Data vào DOM, sau đó gọi window.print()
      setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 500);

    } catch (error) {
      console.error("Lỗi khi chuẩn bị dữ liệu in:", error);
      message.error("Có lỗi xảy ra khi chuẩn bị dữ liệu in.");
      setIsPrinting(false);
    }
  };

  const handleCheckAllClasses = (e) => {
    setPrintClasses(e.target.checked ? classes.map(c => c.id) : []);
  };

  return (
    <div>
      {/* STYLE CHỈ DÙNG CHO PRINT */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-hidden {
              display: none !important;
            }
            #printable-section, #printable-section * {
              visibility: visible;
            }
            #printable-section {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              display: block !important;
            }
            table { page-break-inside:auto; }
            tr    { page-break-inside:avoid; page-break-after:auto; }
          }
        `}
      </style>

      {/* GIAO DIỆN CHÍNH (Ẩn khi in) */}
      <div className="print-hidden">
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <ClassFilterBar 
                years={years} 
                terms={terms} 
                selectedYear={selectedYear} 
                selectedTerm={selectedTerm}
                handleSelectYear={handleSelectYear} 
                handleSelectTerm={handleSelectTerm}
                isReadOnly={true}
              />
            </div>
            <Button 
              type="primary" 
              icon={<PrinterOutlined />} 
              onClick={showPrintModal}
              loading={isPrinting}
            >
              In danh sách thu tiền
            </Button>
          </div>

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
          <div>
            <PaymentClassList classes={classes} />
          </div>
        </Space>
      </div>

      {/* MODAL CẤU HÌNH IN */}
      <Modal
        title="Tuỳ chọn in danh sách"
        open={printModalVisible}
        onCancel={() => setPrintModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setPrintModalVisible(false)}>
            Hủy
          </Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handleExecutePrint} loading={isPrinting}>
            Bắt đầu In
          </Button>
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>1. Chọn lớp học:</div>
            <Checkbox 
              indeterminate={printClasses.length > 0 && printClasses.length < classes.length}
              checked={printClasses.length === classes.length && classes.length > 0}
              onChange={handleCheckAllClasses}
              style={{ marginBottom: 8 }}
            >
              <b>Chọn tất cả</b>
            </Checkbox>
            <Checkbox.Group 
              style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}
              value={printClasses} 
              onChange={setPrintClasses}
            >
              {classes.map(c => (
                <Checkbox key={c.id} value={c.id}>{c.name}</Checkbox>
              ))}
            </Checkbox.Group>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          <div>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>2. Chọn đối tượng học sinh:</div>
            <Radio.Group onChange={(e) => setPrintStatus(e.target.value)} value={printStatus}>
              <Space direction="vertical">
                <Radio value="ALL">Tất cả học sinh (Cả đã nộp & chưa nộp)</Radio>
                <Radio value="UNPAID">Chỉ học sinh CHƯA NỘP (Để in danh sách đi thu tiền)</Radio>
                <Radio value="PAID">Chỉ học sinh ĐÃ NỘP (Để lưu trữ biên lai)</Radio>
              </Space>
            </Radio.Group>
          </div>
        </Space>
      </Modal>

      {/* GIAO DIỆN IN BẢN CỨNG (Sẽ bị ẩn trên màn hình thường) */}
      <div id="printable-section" style={{ display: 'none', padding: '20px', backgroundColor: '#fff' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '4px' }}>DANH SÁCH THU HỌC PHÍ</h2>
        <p style={{ textAlign: 'center', marginTop: 0, fontStyle: 'italic', marginBottom: '24px' }}>
          {selectedTerm?.name} - {selectedYear?.name}
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }} border="1">
          <thead>
            <tr>
              <th style={{ padding: '8px', textAlign: 'center' }}>STT</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Lớp</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>Học sinh</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>Mức thu</th>
              <th style={{ padding: '8px', textAlign: 'right' }}>Đã thu</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>Ngày thu</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>Ký nhận / Check</th>
            </tr>
          </thead>
          <tbody>
            {printData.map((row, index) => (
              <tr key={index}>
                <td style={{ padding: '8px', textAlign: 'center' }}>{index + 1}</td>
                <td style={{ padding: '8px' }}>{row.className}</td>
                <td style={{ padding: '8px' }}><b>{row.studentName}</b></td>
                <td style={{ padding: '8px', textAlign: 'right' }}>
                  {new Intl.NumberFormat('vi-VN').format(row.fee)} ₫
                </td>
                <td style={{ padding: '8px', textAlign: 'right' }}>
                  {row.isPaid && row.paidValue ? `${new Intl.NumberFormat('vi-VN').format(row.paidValue)} ₫` : ''}
                </td>
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  {row.paymentDate}
                </td>
                <td style={{ padding: '8px', textAlign: 'center' }}>
                  {/* Khoảng trống cho chữ ký hoặc tick chọn nếu chưa thanh toán */}
                </td>
              </tr>
            ))}
            {printData.length === 0 && (
              <tr>
                <td colSpan="7" style={{ padding: '16px', textAlign: 'center' }}>
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
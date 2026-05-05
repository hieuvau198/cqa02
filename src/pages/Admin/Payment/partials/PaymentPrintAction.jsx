import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, Modal, Space, Checkbox, Divider, Radio, message } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import * as PaymentQuery from '../../../../data/Center/paymentQuery';
import * as ClassMember from '../../../../data/Center/classMember';

export default function PaymentPrintAction({ classes, selectedTerm, selectedYear }) {
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [printClasses, setPrintClasses] = useState([]);
  const [printStatus, setPrintStatus] = useState('ALL');
  const [printData, setPrintData] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);

  const showPrintModal = () => {
    if (!classes || classes.length === 0) {
      message.warning("Không có lớp để in trong kỳ này.");
      return;
    }
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
            
            if (printStatus === 'PAID' && !isPaid) return;
            if (printStatus === 'UNPAID' && isPaid) return;
            
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
      
      allPrintRows.sort((a, b) => {
        if (a.className !== b.className) return a.className.localeCompare(b.className);
        return a.studentName.localeCompare(b.studentName);
      });
      
      setPrintData(allPrintRows);
      setPrintModalVisible(false);
      
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
    <>
      <Button type="primary" icon={<PrinterOutlined />} onClick={showPrintModal} loading={isPrinting}>
        In danh sách thu tiền
      </Button>

      <Modal
        title="Tùy chọn in danh sách"
        open={printModalVisible}
        onCancel={() => setPrintModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setPrintModalVisible(false)}>Hủy</Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handleExecutePrint} loading={isPrinting}>
            Bắt đầu In
          </Button>
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <div style={{ marginBottom: 8, fontWeight: 600 }}>1. Chọn lớp:</div>
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
            <div style={{ marginBottom: 8, fontWeight: 600 }}>2. Chọn nhóm học sinh:</div>
            <Radio.Group onChange={(e) => setPrintStatus(e.target.value)} value={printStatus}>
              <Space direction="vertical">
                <Radio value="ALL">Tất cả học sinh (Chưa nộp & đã nộp)</Radio>
                <Radio value="UNPAID">Chỉ học sinh CHƯA nộp (Để in danh sách đi thu tiền)</Radio>
                <Radio value="PAID">Chỉ học sinh ĐÃ nộp (Để lưu trữ biên lai)</Radio>
              </Space>
            </Radio.Group>
          </div>
        </Space>
      </Modal>

      {/* Renders the printable section at the document body level to prevent inheritance hiding */}
      {createPortal(
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
                    {new Intl.NumberFormat('vi-VN').format(row.fee)}đ
                  </td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>
                    {row.isPaid && row.paidValue ? `${new Intl.NumberFormat('vi-VN').format(row.paidValue)}đ` : ''}
                  </td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{row.paymentDate}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}></td>
                </tr>
              ))}
              {printData.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '16px', textAlign: 'center' }}>Không có dữ liệu</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>,
        document.body
      )}
    </>
  );
}
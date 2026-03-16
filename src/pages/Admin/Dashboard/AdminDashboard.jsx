// src/pages/Admin/Dashboard/AdminDashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { getAllPayments } from '../../../data/Center/paymentQuery';

dayjs.extend(isSameOrAfter);

const AdminDashboard = () => {
  const [payments, setPayments] = useState([]);
  const [timeRange, setTimeRange] = useState('day'); // 'day', 'week', 'month'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      const data = await getAllPayments();
      // Filter only completed payments
      const paidPayments = data.filter(p => p.status === 'Đã thanh toán');
      setPayments(paidPayments);
      setLoading(false);
    };
    fetchPayments();
  }, []);

  const chartData = useMemo(() => {
    if (!payments.length) return [];

    const now = dayjs();
    const dataMap = new Map();

    // Initialize the buckets 
    for (let i = 9; i >= 0; i--) {
      let key;
      if (timeRange === 'day') {
        key = now.subtract(i, 'day').format('DD/MM'); // Changed format to DD/MM
      } else if (timeRange === 'week') {
        const startOfWeek = now.subtract(i, 'week').startOf('week');
        const endOfWeek = now.subtract(i, 'week').endOf('week');
        key = `${startOfWeek.format('DD/MM')} - ${endOfWeek.format('DD/MM')}`;
      } else if (timeRange === 'month') {
        key = now.subtract(i, 'month').format('MM'); // Changed format to MM
      }
      // Added students: []
      dataMap.set(key, { label: key, total: 0, count: 0, students: [] }); 
    }

    // Populate the buckets
    payments.forEach(payment => {
      const paymentDate = payment.createdAt?.toMillis 
        ? dayjs(payment.createdAt.toMillis()) 
        : dayjs(payment.createdAt);

      if (!paymentDate.isValid()) return;

      let key;
      if (timeRange === 'day') {
        key = paymentDate.format('DD/MM'); // Changed format
      } else if (timeRange === 'week') {
        const startOfWeek = paymentDate.startOf('week');
        const endOfWeek = paymentDate.endOf('week');
        key = `${startOfWeek.format('DD/MM')} - ${endOfWeek.format('DD/MM')}`;
      } else if (timeRange === 'month') {
        key = paymentDate.format('MM'); // Changed format
      }

      if (dataMap.has(key)) {
        const currentData = dataMap.get(key);
        currentData.total += Number(payment.amountPaid || payment.totalPrice || 0);
        currentData.count += 1; 
        
        // Push the student's name. Change "studentName" if your database field is different (e.g., payment.name, payment.fullName)
        const nameToDisplay = payment.studentName || payment.fullName || payment.name || 'Học viên ẩn danh';
        currentData.students.push(nameToDisplay);
      }
    });

    return Array.from(dataMap.values());
  }, [payments, timeRange]);

  if (loading) return <div style={{ padding: 20 }}>Loading dashboard...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Thống kê doanh thu</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setTimeRange('day')} 
          style={{ marginRight: 10, fontWeight: timeRange === 'day' ? 'bold' : 'normal' }}
        >
          10 Ngày Gần Nhất
        </button>
        <button 
          onClick={() => setTimeRange('week')} 
          style={{ marginRight: 10, fontWeight: timeRange === 'week' ? 'bold' : 'normal' }}
        >
          10 Tuần Gần Nhất
        </button>
        <button 
          onClick={() => setTimeRange('month')}
          style={{ fontWeight: timeRange === 'month' ? 'bold' : 'normal' }}
        >
          10 Tháng Gần Nhất
        </button>
      </div>

      <div style={{ height: 400, width: '100%', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis 
              tickFormatter={(value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
            />
            <Tooltip 
              formatter={(value, name, props) => {
                const formattedMoney = new Intl.NumberFormat('vi-VN', { 
                  style: 'currency', 
                  currency: 'VND' 
                }).format(value);

                const students = props.payload.students || [];

                return [
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span><strong>Số lượng:</strong> {props.payload.count}</span>
                    <span><strong>Tổng:</strong> {formattedMoney}</span>
                    
                    {students.length > 0 && (
                      <div style={{ marginTop: '8px', borderTop: '1px solid #ccc', paddingTop: '8px' }}>
                        <strong>Học viên:</strong>
                        {students.map((student, idx) => (
                          <span key={idx} style={{ display: 'block', fontSize: '13px' }}>
                            - {student}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>,
                  name
                ];
              }}
            />
            <Legend />
            <Bar dataKey="total" name="Doanh thu" fill="#4caf50" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdminDashboard;
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

    // Initialize the buckets (ADD count: 0 HERE)
    for (let i = 9; i >= 0; i--) {
      let key;
      if (timeRange === 'day') {
        key = now.subtract(i, 'day').format('DD/MM/YYYY');
      } else if (timeRange === 'week') {
        const startOfWeek = now.subtract(i, 'week').startOf('week');
        const endOfWeek = now.subtract(i, 'week').endOf('week');
        key = `${startOfWeek.format('DD/MM')} - ${endOfWeek.format('DD/MM')}`;
      } else if (timeRange === 'month') {
        key = now.subtract(i, 'month').format('MM/YYYY');
      }
      // Added count: 0
      dataMap.set(key, { label: key, total: 0, count: 0 }); 
    }

    // Populate the buckets
    payments.forEach(payment => {
      const paymentDate = payment.createdAt?.toMillis 
        ? dayjs(payment.createdAt.toMillis()) 
        : dayjs(payment.createdAt);

      if (!paymentDate.isValid()) return;

      let key;
      if (timeRange === 'day') {
        key = paymentDate.format('DD/MM/YYYY');
      } else if (timeRange === 'week') {
        const startOfWeek = paymentDate.startOf('week');
        const endOfWeek = paymentDate.endOf('week');
        key = `${startOfWeek.format('DD/MM')} - ${endOfWeek.format('DD/MM')}`;
      } else if (timeRange === 'month') {
        key = paymentDate.format('MM/YYYY');
      }

      if (dataMap.has(key)) {
        const currentData = dataMap.get(key);
        currentData.total += Number(payment.amountPaid || payment.totalPrice || 0);
        // INCREMENT THE COUNT HERE
        currentData.count += 1; 
      }
    });

    return Array.from(dataMap.values());
  }, [payments, timeRange]);

  if (loading) return <div style={{ padding: 20 }}>Loading dashboard...</div>;

  return (
    <div style={{ padding: '20px' }}>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setTimeRange('day')} 
          style={{ marginRight: 10, fontWeight: timeRange === 'day' ? 'bold' : 'normal' }}
        >
          10 Ngày
        </button>
        <button 
          onClick={() => setTimeRange('week')} 
          style={{ marginRight: 10, fontWeight: timeRange === 'week' ? 'bold' : 'normal' }}
        >
          10 Tuần
        </button>
        <button 
          onClick={() => setTimeRange('month')}
          style={{ fontWeight: timeRange === 'month' ? 'bold' : 'normal' }}
        >
          10 Tháng
        </button>
      </div>

      <div style={{ height: 400, width: '100%', backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis 
              tickFormatter={(value) => new Intl.NumberFormat({ style: 'currency', currency: 'VND' }).format(value)}
            />
            <Tooltip 
  formatter={(value, name, props) => {
    const formattedMoney = new Intl.NumberFormat({ 
      style: 'currency', 
      currency: 'VND' 
    }).format(value);

    return [
      <span>
        {props.payload.count}
        <br />
        {formattedMoney}
      </span>,
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
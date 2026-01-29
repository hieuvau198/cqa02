// src/pages/Admin/Classes/partials/ClassPayment.jsx
import React from 'react';
import { Empty, Button } from 'antd';
import { DollarOutlined } from '@ant-design/icons';

export default function ClassPayment({ classId }) {
  // Logic for Payment goes here
  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
       <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={<span>Payment history for Class ID: <b>{classId}</b> is coming soon.</span>}
       >
         <Button type="primary" icon={<DollarOutlined />}>Record Payment</Button>
       </Empty>
    </div>
  );
}
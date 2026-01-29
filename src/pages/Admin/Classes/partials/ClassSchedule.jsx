// src/pages/Admin/Classes/partials/ClassSchedule.jsx
import React from 'react';
import { Empty, Button } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';

export default function ClassSchedule({ classId }) {
  // Logic for Schedule goes here
  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
       <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={<span>Schedule management for Class ID: <b>{classId}</b> is coming soon.</span>}
       >
        <Button type="primary" icon={<CalendarOutlined />}>Create Schedule</Button>
       </Empty>
    </div>
  );
}
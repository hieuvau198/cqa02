// src/pages/Admin/Classes/ClassDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Card, Tabs, Spin } from 'antd';
import * as ClassQuery from '../../../data/Center/classQuery';

// Import Partials
import ClassMembers from './partials/ClassMembers';
import ClassSchedule from './partials/ClassSchedule';
import ClassPayment from './partials/ClassPayment';

const { Title } = Typography;

export default function ClassDetail() {
  const { id: classId } = useParams();
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch only basic class info here
  useEffect(() => {
    const fetchClassInfo = async () => {
      setLoading(true);
      const cls = await ClassQuery.getClassById(classId);
      setClassInfo(cls);
      setLoading(false);
    };

    if (classId) fetchClassInfo();
  }, [classId]);

  const items = [
    {
      key: 'members',
      label: 'Class Members',
      children: <ClassMembers classId={classId} />,
    },
    {
      key: 'schedule',
      label: 'Schedule',
      children: <ClassSchedule classId={classId} />,
    },
    {
      key: 'payment',
      label: 'Payment',
      children: <ClassPayment classId={classId} />,
    },
  ];

  if (loading) return <Spin style={{ margin: 24 }} />;

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>{classInfo ? `Class: ${classInfo.name}` : 'Unknown Class'}</Title>
          <Typography.Text type="secondary">
             Manage details, schedule, and payments.
          </Typography.Text>
        </div>

        <Tabs defaultActiveKey="members" items={items} />
      </Card>
    </div>
  );
}
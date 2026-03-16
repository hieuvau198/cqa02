import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Card, Tabs, Spin, Button, Dropdown, message } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import * as ClassQuery from '../../../data/Center/classQuery';

// Import Partials
import ClassMembers from './partials/ClassMembers';
import ClassSchedule from './partials/ClassSchedule';
import ClassPayment from './partials/ClassPayment';

const { Title } = Typography;

export default function ClassDetail() {
  const { id: classId } = useParams();
  const navigate = useNavigate(); // Add hook for redirection
  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClassInfo = async () => {
      setLoading(true);
      const cls = await ClassQuery.getClassById(classId);
      setClassInfo(cls);
      setLoading(false);
    };

    if (classId) fetchClassInfo();
  }, [classId]);

  // --- MIGRATION HANDLERS ---
  const handleMigrateThis = async () => {
    message.loading({ content: 'Updating ID...', key: 'migrate' });
    const res = await ClassQuery.migrateClassId(classId);
    if (res.success) {
      message.success({ content: 'Class ID updated successfully!', key: 'migrate' });
      // Redirect seamlessly to the new Class ID URL
      navigate(`/admin/classes/${res.newId}`, { replace: true });
    } else {
      message.error({ content: res.message || 'Update failed', key: 'migrate' });
    }
  };

  const handleMigrateAll = async () => {
    message.loading({ content: 'Updating all class IDs...', key: 'migrateAll' });
    const res = await ClassQuery.migrateAllClasses();
    if (res.success) {
      message.success({ content: `Successfully updated ${res.count} classes!`, key: 'migrateAll' });
      // Reload page to reflect potential route data swaps
      window.location.reload();
    } else {
      message.error({ content: res.message || 'Update failed', key: 'migrateAll' });
    }
  };

  const menuItems = [
    { key: '1', label: 'Update This Class ID', onClick: handleMigrateThis },
    { key: '2', label: 'Update All Class IDs', onClick: handleMigrateAll },
  ];

  const items = [
    {
      key: 'members',
      label: 'Danh sách',
      children: <ClassMembers classId={classId} />,
    },
    {
      key: 'schedule',
      label: 'Lịch học',
      children: <ClassSchedule classId={classId} />,
    },
    {
      key: 'payment',
      label: 'Học phí',
      children: <ClassPayment classId={classId} classInfo={classInfo} />,
    },
  ];

  if (loading) return <Spin style={{ margin: 24 }} />;

  return (
    <div>
      <Card>
        {/* Updated Header with Migration Dropdown */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2}>{classInfo ? `${classInfo.name}` : 'Unknown Class'}</Title>
          <Dropdown menu={{ items: menuItems }} placement="bottomRight">
            <Button type="primary" icon={<SettingOutlined />}>Migrate ID</Button>
          </Dropdown>
        </div>

        <Tabs defaultActiveKey="members" items={items} />
      </Card>
    </div>
  );
}
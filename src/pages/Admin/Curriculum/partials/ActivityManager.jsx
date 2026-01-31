// src/pages/Admin/Curriculum/partials/ActivityManager.jsx
import React, { useEffect, useState } from 'react';
import { Card, List, Button, Popconfirm, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';
import * as ActivityQuery from '../../../../data/Center/activityQuery';

const { Text } = Typography;

export default function ActivityManager({ section, onOpenModal, refreshTrigger }) {
  const [activities, setActivities] = useState([]);

  const loadActivities = async () => {
    if (section?.id) {
      const data = await ActivityQuery.getActivitiesBySection(section.id);
      setActivities(data);
    } else {
      setActivities([]);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [section, refreshTrigger]);

  const handleDelete = async (id) => {
    const res = await ActivityQuery.deleteActivity(id);
    if (res.success) {
      loadActivities();
    }
  };

  return (
    <Card 
      title={`Hoạt động: ${section?.name || 'Chọn Section'}`}
      extra={
        <Button 
          type="primary" 
          size="small" 
          icon={<PlusOutlined />} 
          disabled={!section}
          onClick={() => onOpenModal('activity')}
        >
          Thêm Hoạt động
        </Button>
      }
    >
      <List
        dataSource={activities}
        renderItem={item => (
          <List.Item 
            actions={[
              <EditOutlined key="edit" onClick={() => onOpenModal('activity', item)} />,
              <Popconfirm 
                key="del" 
                title="Xóa hoạt động này?" 
                onConfirm={() => handleDelete(item.id)}
              >
                <DeleteOutlined style={{ color: 'red' }} />
              </Popconfirm>
            ]}
          >
            {/* Using Meta to show name, URL, and description */}
            <List.Item.Meta
              title={
                <span>
                  {item.name} 
                  {item.url && (
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ marginLeft: 8 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <LinkOutlined />
                    </a>
                  )}
                </span>
              }
            />
          </List.Item>
        )}
        locale={{ emptyText: section ? 'Chưa có hoạt động' : 'Vui lòng chọn một section' }}
      />
    </Card>
  );
}
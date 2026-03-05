import React from 'react';
import { List, Card, Tag, Button, Typography } from 'antd';
import { ClockCircleOutlined, TeamOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

// Receive onOpenAttendance as a prop
const SlotList = ({ slots, onOpenAttendance }) => { 
  return (
    <List
      grid={{
        gutter: 16,
        xs: 1, 
        sm: 2, 
        md: 2, 
        lg: 3, 
        xl: 4,
      }}
      dataSource={slots}
      locale={{ emptyText: 'Không có lớp học nào phù hợp với bộ lọc.' }}
      renderItem={(item) => (
        <List.Item>
          <Card 
            hoverable 
            style={{ borderRadius: '8px' }}
            bodyStyle={{ padding: '16px' }}
            actions={[
              <Button 
                type="primary" 
                key="attendance" 
                onClick={() => onOpenAttendance(item)} // Call the handler here
              >
                Điểm danh ngay
              </Button>
            ]}
          >
            <Card.Meta
              title={item.topic || "Tên Lớp (Chưa cập nhật)"}
              description={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  <Text type="secondary">
                    <ClockCircleOutlined style={{ marginRight: 4 }} /> 
                    {dayjs(item.date).format('DD/MM/YYYY')} | {item.startTime} - {item.endTime}
                  </Text>
                  
                  <Text type="secondary">
                    <TeamOutlined style={{ marginRight: 4 }} /> 
                    Phòng: {item.room || 'N/A'}
                  </Text>
                  
                  <div>
                    {item.subjectName && <Tag color="blue">{item.subjectName}</Tag>}
                    {item.gradeName && <Tag color="cyan">{item.gradeName}</Tag>}
                  </div>
                </div>
              }
            />
          </Card>
        </List.Item>
      )}
    />
  );
};

export default SlotList;
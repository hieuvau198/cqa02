import React from 'react';
import { List, Button, Typography, Tag } from 'antd';
import { ClockCircleOutlined, EnvironmentOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

const SlotList = ({ slots, onOpenAttendance }) => { 
  return (
    <List
      grid={{ gutter: 24, xs: 1, sm: 1, md: 2, lg: 3, xl: 3, xxl: 4 }}
      dataSource={slots}
      locale={{ emptyText: 'Không có lớp học nào phù hợp với bộ lọc.' }}
      renderItem={(item) => (
        <List.Item>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden group">
            
            {/* Card Body */}
            <div className="p-6 flex-grow">
              <div className="flex justify-between items-start mb-4">
                <Title level={5} className="!mb-0 !text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {item.topic || "Tên Lớp (Chưa cập nhật)"}
                </Title>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center text-gray-500">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mr-3">
                    <ClockCircleOutlined className="text-blue-500" />
                  </div>
                  <Text className="text-gray-600 font-medium">
                    {dayjs(item.date).format('DD/MM/YYYY')} <span className="mx-1 text-gray-300">•</span> {item.startTime} - {item.endTime}
                  </Text>
                </div>
                
                <div className="flex items-center text-gray-500">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center mr-3">
                    <EnvironmentOutlined className="text-indigo-500" />
                  </div>
                  <Text className="text-gray-600 font-medium">
                    Phòng: {item.room || 'Chưa xếp phòng'}
                  </Text>
                </div>
              </div>

              {/* Tags */}
              <div className="mt-5 flex flex-wrap gap-2">
                {item.subjectName && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full border border-blue-100">
                    {item.subjectName}
                  </span>
                )}
                {item.gradeName && (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full border border-emerald-100">
                    {item.gradeName}
                  </span>
                )}
              </div>
            </div>

            {/* Card Footer / Action */}
            <div className="p-4 border-t border-gray-50 bg-gray-50/50">
              <Button 
                type="primary" 
                size="large"
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 border-none shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                onClick={() => onOpenAttendance(item)}
              >
                <CheckCircleOutlined /> Điểm danh ngay
              </Button>
            </div>
            
          </div>
        </List.Item>
      )}
    />
  );
};

export default SlotList;
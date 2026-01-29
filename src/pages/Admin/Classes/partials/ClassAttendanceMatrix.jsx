// src/pages/Admin/Classes/partials/ClassAttendanceMatrix.jsx
import React from 'react';
import { Modal, Table, Tooltip } from 'antd';
import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
import dayjs from 'dayjs';

export default function ClassAttendanceMatrix({ isOpen, onClose, slots, students }) {
  // Sort slots ascending by date (Oldest -> Newest) for the horizontal timeline
  // Note: The main schedule usually shows Newest -> Oldest, but matrices read better Left -> Right
  const sortedSlots = [...slots].sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));

  const columns = [
    {
      title: 'Học sinh',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 180,
      render: (text) => <strong style={{ color: '#1890ff' }}>{text}</strong>,
    },
    ...sortedSlots.map((slot) => ({
      title: (
        <Tooltip title={slot.topic || 'No topic recorded'}>
          <div style={{ textAlign: 'center' }}>
            <div>{dayjs(slot.date).format('DD/MM')}</div>
            <div style={{ fontSize: '10px', color: '#888' }}>
               {slot.startTime ? dayjs(slot.startTime, 'HH:mm').format('HH:mm') : ''}
            </div>
          </div>
        </Tooltip>
      ),
      dataIndex: slot.id,
      key: slot.id,
      width: 100,
      align: 'center',
      render: (_, student) => {
        // 1. If slot is in the future (compared to end of today), leave blank
        if (dayjs(slot.date).isAfter(dayjs(), 'day')) {
          return null;
        }

        // 2. Find attendance record for this student
        const record = slot.attendance?.find((r) => r.studentId === student.id);

        // 3. Render Status
        if (!record) {
             // Slot is past but no record found (maybe attendance wasn't taken)
             return <span style={{ color: '#ccc' }}>-</span>; 
        }

        if (record.status === 'Có mặt') {
          return <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: '20px' }} />;
        }
        
        if (record.status === 'Vắng') {
           return <CloseCircleTwoTone twoToneColor="#f5222d" style={{ fontSize: '20px' }} />;
        }

        return <span>{record.status}</span>;
      },
    })),
  ];

  return (
    <Modal
      title="Chi tiết điểm danh (Attendance Matrix)"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={1200}
      centered
    >
      <Table
        dataSource={students}
        columns={columns}
        rowKey="id"
        pagination={false}
        scroll={{ x: 'max-content', y: 600 }}
        bordered
        size="middle"
      />
    </Modal>
  );
}
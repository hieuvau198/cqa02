// src/pages/Admin/Classes/partials/ClassSchedule.jsx
import React, { useEffect, useState } from "react";
import { Table, Button, message, Popconfirm, Tag, Space } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
  TableOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import * as ClassQuery from "../../../../data/Center/classQuery";
import * as ClassMember from "../../../../data/Center/classMember";
import ClassAttendanceMatrix from "./ClassAttendanceMatrix";
import ActivityManager from "./partials/ActivityManager";

// Imported Refactored Modals
import SlotModal from "./SlotModal";
import AttendanceModal from "./AttendanceModal";
import ActivityModal from "./ActivityModal";

export default function ClassSchedule({ classId }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Modal States
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [isSavingSlot, setIsSavingSlot] = useState(false);

  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [currentAttendanceSlot, setCurrentAttendanceSlot] = useState(null);

  const [isMatrixOpen, setIsMatrixOpen] = useState(false);

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [currentSlotForActivity, setCurrentSlotForActivity] = useState(null);

  // --- 1. Initial Data Fetching ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedSlots, fetchedStudents] = await Promise.all([
        ClassQuery.getSlotsByClass(classId),
        ClassMember.getClassMembers(classId),
      ]);
      setSlots(fetchedSlots);
      setStudents(fetchedStudents);
    } catch (error) {
      console.error(error);
      message.error("Failed to load schedule data");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (classId) fetchData();
  }, [classId]);

  // --- 2. Slot Management ---
  const handleOpenSlotModal = (slot = null) => {
    setEditingSlot(slot);
    setIsSlotModalOpen(true);
  };

  const handleSaveSlot = async (values) => {
    if (isSavingSlot) return;
    setIsSavingSlot(true);

    const dates = Array.isArray(values.date) ? values.date : [values.date];

    if (editingSlot) {
      const payload = {
        classId,
        date: dates[0].format("YYYY-MM-DD"),
        startTime: values.startTime ? values.startTime.format("HH:mm") : null,
        endTime: values.endTime ? values.endTime.format("HH:mm") : null,
        topic: values.topic || "",
      };
      const result = await ClassQuery.updateSlot(editingSlot.id, payload);
      if (result.success) {
        message.success("Cập nhật buổi học thành công");
        setIsSlotModalOpen(false);
        fetchData();
      } else {
        message.error(result.message);
      }
    } else {
      try {
        const promises = dates.map((d) => {
          const payload = {
            classId,
            date: d.format("YYYY-MM-DD"),
            startTime: values.startTime ? values.startTime.format("HH:mm") : null,
            endTime: values.endTime ? values.endTime.format("HH:mm") : null,
            topic: values.topic || "",
            attendance: [],
          };
          return ClassQuery.addSlot(payload);
        });

        const results = await Promise.all(promises);
        const hasError = results.some((res) => !res.success);

        if (hasError) {
          message.error("Có lỗi xảy ra ở một vài buổi học, vui lòng kiểm tra lại");
        } else {
          message.success(`Đã tạo thành công ${dates.length} buổi học`);
          setIsSlotModalOpen(false);
          fetchData();
        }
      } catch (error) {
        message.error("Lỗi khi tạo lịch học hàng loạt");
      }
    }
    setIsSavingSlot(false);
  };

  const handleDeleteSlot = async (id) => {
    const result = await ClassQuery.deleteSlot(id);
    if (result.success) {
      message.success("Đã xóa buổi học");
      fetchData();
    } else {
      message.error(result.message);
    }
  };

  const handleDeleteSelected = async () => {
    setLoading(true);
    try {
      const promises = selectedRowKeys.map((id) => ClassQuery.deleteSlot(id));
      await Promise.all(promises);
      message.success(`Đã xóa ${selectedRowKeys.length} buổi học đã chọn`);
      setSelectedRowKeys([]);
      fetchData();
    } catch (error) {
      message.error("Có lỗi xảy ra khi xóa danh sách buổi học");
    }
    setLoading(false);
  };

  // --- 3. Attendance Logic ---
  const handleOpenAttendance = (slot) => {
    setCurrentAttendanceSlot(slot);
    setIsAttendanceModalOpen(true);
  };

  const handleSaveAttendance = async (attendanceArray) => {
    if (!currentAttendanceSlot) return;

    const result = await ClassQuery.updateSlot(currentAttendanceSlot.id, {
      attendance: attendanceArray,
    });

    if (result.success) {
      message.success("Attendance saved");
      setIsAttendanceModalOpen(false);
      fetchData();
    } else {
      message.error(result.message);
    }
  };

  // --- 4. Activity Logic ---
  const handleSaveActivity = async (values) => {
    if (!currentSlotForActivity) return;

    const payload = {
      slotId: currentSlotForActivity.id,
      name: values.name,
      description: values.description || "",
      link: values.link || "",
    };

    let result;
    if (editingActivity) {
      result = await ClassQuery.updateActivity(editingActivity.id, payload);
    } else {
      result = await ClassQuery.addActivity(payload);
    }

    if (result.success) {
      message.success(editingActivity ? "Activity updated" : "Activity added");
      setIsActivityModalOpen(false);
      fetchData(); // Simplistic refresh, or pass a callback down if preferred
    } else {
      message.error(result.message);
    }
  };

  // --- 5. Renderers ---
  const columns = [
    {
      title: "Date & Time",
      key: "datetime",
      width: 200,
      render: (_, record) => (
        <div>
          <div className="font-bold">{dayjs(record.date).format("DD/MM/YYYY")}</div>
          {record.startTime && (
            <div className="text-gray-500 text-xs flex items-center gap-1 mt-1">
              <ClockCircleOutlined />
              {record.startTime} - {record.endTime}
            </div>
          )}
        </div>
      ),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      defaultSortOrder: "ascend",
    },
    {
      title: "Topic",
      dataIndex: "topic",
      key: "topic",
    },
    {
      title: "Điểm danh",
      key: "attendance",
      width: 150,
      render: (_, record) => {
        const list = record.attendance || [];
        if (list.length === 0) return <Tag>Not taken</Tag>;

        const presentCount = list.filter((x) => x.status === "Có mặt").length;
        const absentCount = list.filter((x) => x.status === "Vắng").length;

        return (
          <Space direction="vertical" size={0} className="text-xs">
            <span className="text-green-600 font-medium">Present: {presentCount}</span>
            <span className="text-red-500 font-medium">Absent: {absentCount}</span>
          </Space>
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            icon={<CheckSquareOutlined />}
            onClick={() => handleOpenAttendance(record)}
            size="small"
          >
            Điểm danh
          </Button>
          <Button icon={<EditOutlined />} onClick={() => handleOpenSlotModal(record)} size="small" />
          <Popconfirm title="Delete?" onConfirm={() => handleDeleteSlot(record.id)}>
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="py-5">
      <div className="flex justify-end mb-4 gap-2.5">
        {selectedRowKeys.length > 0 && (
          <Popconfirm
            title={`Xóa ${selectedRowKeys.length} buổi học đã chọn?`}
            onConfirm={handleDeleteSelected}
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />}>
              Xóa đã chọn ({selectedRowKeys.length})
            </Button>
          </Popconfirm>
        )}

        <Button icon={<TableOutlined />} onClick={() => setIsMatrixOpen(true)}>
          View Details
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenSlotModal(null)}>
          Thêm buổi
        </Button>
      </div>

      <Table
        rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
        columns={columns}
        dataSource={slots}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 700 }}
        expandable={{
          expandedRowRender: (slot) => <ActivityManager slot={slot} />,
        }}
      />

      {/* MATRIX MODAL */}
      <ClassAttendanceMatrix
        isOpen={isMatrixOpen}
        onClose={() => setIsMatrixOpen(false)}
        slots={slots}
        students={students}
      />

      {/* SEPARATED MODALS */}
      <SlotModal
        isOpen={isSlotModalOpen}
        onClose={() => setIsSlotModalOpen(false)}
        onSave={handleSaveSlot}
        editingSlot={editingSlot}
        isSaving={isSavingSlot}
      />

      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        onSave={handleSaveAttendance}
        students={students}
        currentSlot={currentAttendanceSlot}
      />

      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        onSave={handleSaveActivity}
        editingActivity={editingActivity}
      />
    </div>
  );
}
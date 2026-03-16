// src/pages/Admin/Classes/partials/ClassMembers.jsx
import React, { useEffect, useState } from "react";
import { Table, Button, Space, message, Popconfirm, Tag, Input } from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PhoneOutlined,
  HomeOutlined,
  BankOutlined,
} from "@ant-design/icons";
import * as ClassMember from "../../../../data/Center/classMember";
import ClassMemberDrawer from "./ClassMemberDrawer"; // Import the separated component

export default function ClassMembers({ classId }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState(""); // State for search

  // Drawer State
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const fetchStudents = async () => {
    setLoading(true);
    const stds = await ClassMember.getClassMembers(classId);
    setStudents(stds);
    setLoading(false);
  };

  useEffect(() => {
    if (classId) fetchStudents();
  }, [classId]);

  const showDrawer = (student = null) => {
    setEditingStudent(student);
    setDrawerVisible(true);
  };

  const handleDelete = async (student) => {
    const result = await ClassMember.deleteMember(classId, student.relationId);
    if (result.success) {
      message.success("Đã xóa học sinh khỏi lớp");
      fetchStudents();
    } else {
      message.error(result.message);
    }
  };

  // Filter students based on search text (name or username)
  const filteredStudents = students.filter(student => {
    const searchLower = searchText.toLowerCase();
    return (
      student.name?.toLowerCase().includes(searchLower) ||
      student.username?.toLowerCase().includes(searchLower)
    );
  });

  const columns = [
    {
      title: "Họ tên & Tài khoản",
      key: "info",
      render: (_, r) => (
        <div>
          <div style={{ fontWeight: "bold" }}>{r.name}</div>
          <div style={{ color: "#888", fontSize: "12px" }}>@{r.username}</div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "default";
        if (status === "Đang học") color = "green";
        if (status === "Đã nghỉ") color = "red";
        if (status === "Hoàn thành lớp học") color = "blue";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Phụ huynh",
      key: "parent",
      render: (_, r) => (
        <div>
          {r.parentName ? (
            <div>{r.parentName}</div>
          ) : (
            <span style={{ color: "#ccc" }}>--</span>
          )}
          {r.parentPhone && (
            <div>
              <PhoneOutlined /> {r.parentPhone}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Thông tin thêm",
      key: "details",
      responsive: ["lg"],
      render: (_, r) => (
        <div style={{ fontSize: "12px" }}>
          {r.officialSchool && (
            <div>
              <BankOutlined /> {r.officialSchool}
            </div>
          )}
          {r.address && (
            <div>
              <HomeOutlined /> {r.address}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 100,
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => showDrawer(record)} />
          <Popconfirm
            title="Xóa khỏi lớp?"
            description="Học sinh sẽ bị xóa khỏi danh sách lớp này."
            onConfirm={() => handleDelete(record)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between", // Changed to space-between
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Input.Search
          placeholder="Tìm kiếm học sinh theo tên, tài khoản..."
          allowClear
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showDrawer(null)}
        >
          Thêm học sinh
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredStudents} // Use filtered list
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 800 }}
      />

      {/* Render the extracted Drawer Component */}
      <ClassMemberDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        classId={classId}
        editingStudent={editingStudent}
        onSuccess={fetchStudents}
        students={students}
      />
    </div>
  );
}
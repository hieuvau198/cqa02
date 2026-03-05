// src/pages/Admin/Classes/partials/ClassMemberDrawer.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Drawer, Form, Input, Button, Radio, Select, Divider, Row, Col, message, Grid } from "antd";
import { UserOutlined } from "@ant-design/icons";
import * as ClassMember from "../../../../data/Center/classMember";

const { Option } = Select;
const { useBreakpoint } = Grid;

const gradeOptions = Array.from({ length: 12 }, (_, i) => `Lớp ${i + 1}`);

// Helper to remove Vietnamese accents and spaces
const toSafeString = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/\s+/g, "")
    .toLowerCase();
};

export default function ClassMemberDrawer({ visible, onClose, classId, editingStudent, onSuccess, students }) {
  const [addMode, setAddMode] = useState("existing");
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Track if user manually typed in these fields so we don't overwrite them
  const [manualEdits, setManualEdits] = useState({ username: false, password: false });
  
  const [form] = Form.useForm();
  const screens = useBreakpoint();

  useEffect(() => {
    if (visible) {
      if (editingStudent) {
        setAddMode("existing");
        form.setFieldsValue(editingStudent);
      } else {
        setAddMode("existing");
        form.resetFields();
        form.setFieldsValue({ status: "Đang học" });
        setManualEdits({ username: false, password: false });
        fetchCandidates();
      }
    }
  }, [visible, editingStudent, form]);

  const fetchCandidates = async () => {
    const users = await ClassMember.getStudentCandidates();
    setCandidates(users);
  };

  const availableCandidates = useMemo(() => {
    return candidates.filter((c) => !students.some((s) => s.id === c.id));
  }, [candidates, students]);

  const handleValuesChange = (changedValues, allValues) => {
    // 1. Check if user manually edited username or password
    if (changedValues.username !== undefined) {
      setManualEdits((prev) => ({ ...prev, username: true }));
    }
    if (changedValues.password !== undefined) {
      setManualEdits((prev) => ({ ...prev, password: true }));
    }

    // 2. Auto-generate logic for new users
    if (!editingStudent && addMode === "new") {
      if (changedValues.name !== undefined || changedValues.grade !== undefined) {
        const name = allValues.name || "";
        const grade = allValues.grade || "";
        
        const updates = {};
        
        updates.username = `${toSafeString(grade)}${toSafeString(name)}`;
        updates.password = "111111";

        if (Object.keys(updates).length > 0) {
          form.setFieldsValue(updates);
        }
      }
    }
  };

  const handleSave = async (values) => {
    setLoading(true);
    let result;

    if (editingStudent) {
      result = await ClassMember.updateMember(
        classId,
        editingStudent.id,
        editingStudent.relationId,
        values
      );
    } else {
      if (addMode === "existing") {
        result = await ClassMember.addMemberExisting(classId, values.userId, values.status);
      } else {
        result = await ClassMember.addMemberNew(classId, values);
      }
    }

    if (result.success) {
      message.success(editingStudent ? "Thông tin đã cập nhật" : "Đã thêm học sinh");
      onClose();
      onSuccess();
    } else {
      message.error(result.message);
    }
    setLoading(false);
  };

  return (
    <Drawer
      title={editingStudent ? "Cập nhật thông tin" : "Thêm học sinh mới"}
      size={screens.xs ? "100%" : 480}
      open={visible}
      onClose={onClose}
    >
      {!editingStudent && (
        <div style={{ marginBottom: 20, textAlign: "center" }}>
          <Radio.Group
            value={addMode}
            onChange={(e) => {
                setAddMode(e.target.value);
                setManualEdits({ username: false, password: false });
            }}
            buttonStyle="solid"
          >
            <Radio.Button value="existing">Chọn tài khoản có sẵn</Radio.Button>
            <Radio.Button value="new">Tạo tài khoản mới</Radio.Button>
          </Radio.Group>
        </div>
      )}

      <Form 
        layout="vertical" 
        form={form} 
        onFinish={handleSave}
        onValuesChange={handleValuesChange}
      >
        <Form.Item name="status" label="Trạng thái học tập" rules={[{ required: true }]}>
          <Select>
            <Option value="Đang học">Đang học</Option>
            <Option value="Đã nghỉ">Đã nghỉ</Option>
            <Option value="Hoàn thành lớp học">Hoàn thành lớp học</Option>
          </Select>
        </Form.Item>

        <Divider dashed />

        {/* Existing User Mode */}
        {!editingStudent && addMode === "existing" && (
          <Form.Item
            name="userId"
            label="Chọn học sinh"
            rules={[{ required: true, message: "Vui lòng chọn học sinh" }]}
          >
            <Select
              placeholder="Tìm kiếm theo tên hoặc username"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children ?? "").toLowerCase().includes(input.toLowerCase())
              }
            >
              {availableCandidates.map((u) => (
                <Option key={u.id} value={u.id}>
                  {`${u.name} (${u.username})`}
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

        {/* New User Mode OR Editing */}
        {(addMode === "new" || editingStudent) && (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="name" label="Họ và tên" rules={[{ required: true }]}>
                  <Input prefix={<UserOutlined />} placeholder="Ví dụ: Nguyễn Văn A" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true }]}>
                  <Input placeholder="username" disabled={!!editingStudent} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              {!editingStudent && (
                <Col span={12}>
                  <Form.Item name="password" label="Mật khẩu" rules={[{ required: true }]}>
                    <Input.Password placeholder="Nhập mật khẩu" />
                  </Form.Item>
                </Col>
              )}
              <Col span={editingStudent ? 24 : 12}>
                <Form.Item name="grade" label="Khối/Lớp">
                  <Select placeholder="Chọn khối/lớp" allowClear>
                    {gradeOptions.map((g) => (
                      <Option key={g} value={g}>{g}</Option>
                    ))}
                    <Option value="Khác">Khác</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        <div style={{ marginTop: 24 }}>
          <Button type="primary" htmlType="submit" block loading={loading} size="large">
            {editingStudent ? "Lưu thay đổi" : addMode === "existing" ? "Thêm vào lớp" : "Tạo & Thêm"}
          </Button>
        </div>
      </Form>
    </Drawer>
  );
}
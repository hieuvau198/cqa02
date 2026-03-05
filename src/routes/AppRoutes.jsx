// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import AdminLayout from '../pages/Admin/Layout';
import ProtectedRoute from './ProtectedRoute';
import AdminUsers from '../pages/Admin/Users/AdminUsers';
import AdminClasses from '../pages/Admin/Classes/AdminClasses';
import ClassDetail from '../pages/Admin/Classes/ClassDetail';
import AdminCurriculum from '../pages/Admin/Curriculum/AdminCurriculum';
import TeacherLayout from '../pages/Teacher/TeacherLayout';
import TeacherClasses from '../pages/Teacher/Classes/TeacherClasses';

// New Staff Imports
import StaffLayout from '../pages/Staff/StaffLayout';
import StaffHome from '../pages/Staff/StaffHome';
import StaffAttendance from '../pages/Staff/Attendance/StaffAttendance';

// Temporary placeholder for other roles
const RoleDashboard = ({ role }) => (
  <div style={{ padding: 50, textAlign: 'center' }}>
    <h1>{role} Dashboard</h1>
    <p>This page is under construction.</p>
  </div>
);

const EmptyProgram = () => (
  <div style={{ padding: 50, textAlign: 'center' }}>
    <h1>Chương trình giảng dạy</h1>
    <p>Nội dung đang được cập nhật...</p>
  </div>
);

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to={`/${user.role.toLowerCase()}`} />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to={`/${user.role.toLowerCase()}`} />} />
      
      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" />} />
          <Route path="dashboard" element={<div>Admin Dashboard Content</div>} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="classes" element={<AdminClasses />} /> 
          <Route path="classes/:id" element={<ClassDetail />} />
          <Route path="curriculum" element={<AdminCurriculum />} />
        </Route>
      </Route>

      {/* Staff Routes */}
      <Route element={<ProtectedRoute allowedRoles={['Staff']} />}>
        <Route path="/staff" element={<StaffLayout />}>
          <Route index element={<StaffHome />} />
          <Route path="attendance" element={<StaffAttendance />} />
        </Route>
      </Route>

      {/* Teacher Routes */}
      <Route element={<ProtectedRoute allowedRoles={['Teacher']} />}>
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<Navigate to="classes" />} />
          <Route path="classes" element={<TeacherClasses />} />
          <Route path="classes/:id" element={<ClassDetail />} />
          <Route path="curriculum" element={<EmptyProgram />} />
        </Route>
      </Route>

      {/* Student Routes */}
      <Route element={<ProtectedRoute allowedRoles={['Student']} />}>
        <Route path="/student" element={<RoleDashboard role="Student" />} />
      </Route>

      {/* Default Redirect */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default AppRoutes;
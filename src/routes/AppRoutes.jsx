import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import AdminLayout from '../pages/Admin/Layout';
import ProtectedRoute from './ProtectedRoute';

// Temporary placeholder for other roles
const RoleDashboard = ({ role }) => (
  <div style={{ padding: 50, textAlign: 'center' }}>
    <h1>{role} Dashboard</h1>
    <p>This page is under construction.</p>
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
          <Route path="users" element={<div>User Management Content</div>} />
        </Route>
      </Route>

      {/* Staff Routes (Temporary) */}
      <Route element={<ProtectedRoute allowedRoles={['Staff']} />}>
        <Route path="/staff" element={<RoleDashboard role="Staff" />} />
      </Route>

      {/* Teacher Routes (Temporary) */}
      <Route element={<ProtectedRoute allowedRoles={['Teacher']} />}>
        <Route path="/teacher" element={<RoleDashboard role="Teacher" />} />
      </Route>

      {/* Student Routes (Temporary) */}
      <Route element={<ProtectedRoute allowedRoles={['Student']} />}>
        <Route path="/student" element={<RoleDashboard role="Student" />} />
      </Route>

      {/* Default Redirect */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default AppRoutes;
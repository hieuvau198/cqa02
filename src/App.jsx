import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import './App.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  return (
    <div className="card">
      <h1>Dashboard</h1>
      <p>Welcome, <strong>{user.name}</strong> ({user.role})</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

const MainLayout = () => {
  const { user } = useAuth();
  const [view, setView] = useState('login');

  if (user) return <Dashboard />;

  return (
    <div className="app-container">
      {view === 'login' ? (
        <Login onNavigateToRegister={() => setView('register')} />
      ) : (
        <Register onNavigateToLogin={() => setView('login')} />
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

export default App;
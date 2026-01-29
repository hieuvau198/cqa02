import { useState } from 'react';
import { handleRegisterLogic } from '../../data/Firebase/firebaseQuery';

export default function Register({ onNavigateToLogin }) {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'Student'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const result = await handleRegisterLogic(
      formData.name,
      formData.username,
      formData.password,
      formData.role
    );

    if (result.success) {
      setSuccess("Account created! Redirecting...");
      setTimeout(() => onNavigateToLogin(), 1500);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="card">
        <h2>Register</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Full Name</label>
          <input name="name" type="text" onChange={handleChange} required />
          
          <label>Username</label>
          <input name="username" type="text" onChange={handleChange} required />
          
          <label>Password</label>
          <input name="password" type="password" onChange={handleChange} required />
          
          <label>Role</label>
          <select name="role" value={formData.role} onChange={handleChange}>
            <option value="Student">Student</option>
            <option value="Teacher">Teacher</option>
            <option value="Staff">Staff</option>
            <option value="Admin">Admin</option>
          </select>

          {error && <p className="error-text">{error}</p>}
          {success && <p className="success-text">{success}</p>}
          
          <button type="submit">Register</button>
        </form>
        <p>
          Already have an account? 
          <button className="link-btn" onClick={onNavigateToLogin}>
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
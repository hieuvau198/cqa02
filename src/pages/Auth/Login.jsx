import { useState } from 'react';
import { handleLoginLogic } from '../../data/Firebase/firebaseQuery';
import { useAuth } from '../../context/AuthContext';

export default function Login({ onNavigateToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await handleLoginLogic(username, password);
    
    if (result.success) {
      login(result.user);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="card">
        <h2>Login</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <input 
            type="text" 
            placeholder="Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit">Sign In</button>
        </form>
        <p>
          New here? 
          <button className="link-btn" onClick={onNavigateToRegister}>
            Create an Account
          </button>
        </p>
      </div>
    </div>
  );
}
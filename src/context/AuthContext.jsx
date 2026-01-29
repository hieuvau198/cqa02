import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // FIX: Initialize state directly from localStorage so it's available on first render
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("VX_USER_SESSION");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Failed to parse user session", error);
      return null;
    }
  });

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("VX_USER_SESSION", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("VX_USER_SESSION");
  };

  // We no longer need the useEffect for initial retrieval
  // But if you want to sync state changes across tabs, you could listen to storage events (optional)

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
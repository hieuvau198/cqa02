import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Optional: Persist session on refresh using localStorage
  useEffect(() => {
    const storedUser = localStorage.VX_USER_SESSION;
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("VX_USER_SESSION", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("VX_USER_SESSION");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
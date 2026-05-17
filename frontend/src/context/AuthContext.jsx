import React, { createContext, useContext } from 'react';

const AuthContext = createContext();

// Provide a default guest user so the app opens directly to the dashboard
export const AuthProvider = ({ children }) => {
  const user = { id: 'guest', full_name: 'Guest User', role: 'user', is_active: true };
  const token = null;
  const login = () => {};
  const logout = () => {};
  const loading = false;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

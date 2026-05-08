import React, { createContext, useContext, useState, useEffect } from 'react';
import API_BASE_URL from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('cached_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(!user); // Don't show global loader if we have a cached user

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        localStorage.setItem('cached_user', JSON.stringify(data));
      } else if (res.status === 401 || res.status === 403) {
        // Only logout if token is explicitly invalid
        logout();
      } else {
        // Server might be waking up or having temporary issues
        console.warn(`Server responded with ${res.status}. Not logging out yet.`);
      }
    } catch (err) {
      console.error("Fetch user error (backend might be waking up):", err);
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cached_user');
    localStorage.removeItem('cached_tasks');
    localStorage.removeItem('cached_users');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

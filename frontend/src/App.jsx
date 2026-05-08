import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Footer from './components/Footer';
import API_BASE_URL from './config';

const AppContent = () => {
  const { token, loading } = useAuth();

  // Wake up the backend immediately on load
  useEffect(() => {
    const wakeBackend = async () => {
      console.log("Pre-warming backend...");
      try {
        await fetch(`${API_BASE_URL}/health`);
        console.log("Backend is awake!");
      } catch (e) {
        console.log("Backend still waking up...");
      }
    };
    wakeBackend();
    // Retry every 20s if not awake
    const interval = setInterval(wakeBackend, 20000);
    return () => clearInterval(interval);
  }, []);

  // Only show global loading if we are during initial session check and have no token
  if (loading && !token) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="animate-pulse" style={{ color: 'var(--primary)', fontWeight: '600' }}>Loading Aura...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1 }}>
        {token ? <Dashboard /> : <Auth />}
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

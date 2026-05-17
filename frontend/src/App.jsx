import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import Footer from './components/Footer';
import API_BASE_URL from './config';

const AppContent = () => {
  const { token, loading } = useAuth();

  // Wake up the backend immediately on load
  useEffect(() => {
    const wakeBackend = async () => {
      // Fast readiness check that does not block on DB availability
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        const url = `${API_BASE_URL}/ready`;
        console.log(`Trying to wake up: ${url || '(Relative)/ready'}`);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          console.log('Backend process is up (ready)');
        } else {
          console.log('Backend process responded but not OK');
        }
      } catch (e) {
        clearTimeout(timeout);
        console.log('Backend still waking up or unreachable (ready check)...');
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
        <Dashboard />
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

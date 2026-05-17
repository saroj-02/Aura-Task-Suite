import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, ShieldCheck } from 'lucide-react';
import API_BASE_URL from '../config';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('user');
  const [adminKey, setAdminKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const endpoint = isLogin ? '/login' : '/register';
    
    // Create a controller to handle timeouts
    const controller = new AbortController();
    // Use a specific reason to avoid "signal is aborted without reason" message
    const timeoutId = setTimeout(() => controller.abort("Request timed out"), 10000); // 10s timeout to fail fast

    try {
      let body;
      let headers = { 'Content-Type': 'application/json' };

      if (isLogin) {
        // Use URLSearchParams for application/x-www-form-urlencoded
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);
        body = params;
        headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
      } else {
        body = JSON.stringify({ email, password, full_name: fullName, role, admin_key: adminKey });
      }

      const res = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      let data = {};
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      }

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('API endpoint not found (404). Please ensure the backend is running.');
        }
        throw new Error(data.detail || `Server error: ${res.status}`);
      }

      if (isLogin) {
        if (data.access_token) {
          login(data.access_token);
        } else {
          throw new Error('No access token received from server.');
        }
      } else {
        setIsLogin(true);
        setError('Registration successful! Please login.');
        setLoading(false);
      }
    } catch (err) {
      clearTimeout(timeoutId);

      // Auto-retry once if it's a network error or timeout
      const isColdStart = err.message === 'Failed to fetch' || err.name === 'AbortError';
      if (isColdStart && !e.isRetry) {
        console.warn("Detecting backend cold start/timeout, retrying once in 1 second...");
        setTimeout(() => {
          const fakeEvent = { preventDefault: () => {}, isRetry: true };
          handleSubmit(fakeEvent);
        }, 1000);
        return; // Stay in loading state
      }

      if (err.name === 'AbortError') {
        console.warn('Auth Request Aborted:', err.message);
        setError('Server is taking too long to respond. Please try again.');
      } else {
        console.error('Auth Error:', err);
        setError(err.message === 'Failed to fetch' 
          ? 'Backend is waking up... Please wait a few seconds and try again.' 
          : err.message);
      }
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in" style={{ maxWidth: '450px', margin: '100px auto' }}>
      <div className="glass" style={{ padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <ShieldCheck size={48} color="var(--primary)" style={{ marginBottom: '10px' }} />
          <h2 style={{ fontSize: '2rem' }}>{isLogin ? 'Welcome Back' : 'Join Aura'}</h2>
          <p style={{ color: 'var(--text-muted)' }}>Experience the next level of task management</p>
        </div>

        {loading && (
          <div style={{ color: 'var(--primary)', textAlign: 'center', marginBottom: '15px', fontSize: '0.8rem' }} className="animate-pulse">
            Establishing secure connection to Aura... <br/>
            <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Performing encrypted handshake</span>
          </div>
        )}

        {error && (
          <div style={{ 
            padding: '12px', 
            backgroundColor: error.includes('successful') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: error.includes('successful') ? 'var(--success)' : 'var(--error)',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="input-group">
                <label>Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {role === 'admin' && (
                <div className="input-group animate-fade-in">
                  <label>Admin Secret Key</label>
                  <input 
                    type="password" 
                    value={adminKey} 
                    onChange={(e) => setAdminKey(e.target.value)} 
                    placeholder="Enter Admin Key To Proceed"
                    required 
                  />
                </div>
              )}
            </>
          )}
          <div className="input-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? (
              'Processing...'
            ) : isLogin ? (
              <><LogIn size={20} /> Sign In</>
            ) : (
              <><UserPlus size={20} /> Create Account</>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '600' }}
          >
            {isLogin ? 'Register' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Auth;

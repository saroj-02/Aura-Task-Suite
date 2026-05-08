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
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout for cold starts

    try {
      let body;
      let headers = { 'Content-Type': 'application/json' };

      if (isLogin) {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        body = formData;
        headers = {};
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Something went wrong');

      if (isLogin) {
        login(data.access_token);
      } else {
        setIsLogin(true);
        setError('Registration successful! Please login.');
      }
    } catch (err) {
      console.error('Auth Error:', err);
      
      // Auto-retry once if it's a cold start error
      if (err.message === 'Failed to fetch' && !e.isRetry) {
        console.log("Detecting cold start, retrying in 2 seconds...");
        setTimeout(() => {
          const fakeEvent = { preventDefault: () => {}, isRetry: true };
          handleSubmit(fakeEvent);
        }, 2000);
        return;
      }

      if (err.name === 'AbortError') {
        setError('Server is still waking up. Please wait a few more seconds...');
      } else {
        setError(err.message === 'Failed to fetch' 
          ? 'Backend is waking up... Please wait 10 seconds and click again.' 
          : err.message);
      }
    } finally {
      if (!e.isRetry) setLoading(false);
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

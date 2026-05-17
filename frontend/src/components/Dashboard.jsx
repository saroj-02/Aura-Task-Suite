import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, LogOut, CheckCircle2, Clock, AlertCircle, Trash2, Pencil, X, Save, Users } from 'lucide-react';
import API_BASE_URL from '../config';

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const [tasks, setTasks] = useState(() => {
    const cached = localStorage.getItem('cached_tasks');
    return cached ? JSON.parse(cached) : [];
  });
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('medium');
  const [activeTab, setActiveTab] = useState('tasks');
  const [allUsers, setAllUsers] = useState(() => {
    const cached = localStorage.getItem('cached_users');
    return cached ? JSON.parse(cached) : [];
  });
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');

  useEffect(() => {
    fetchTasks();
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchTasks = async () => {
    setLoading(true);
    // If no token (guest mode), load tasks from localStorage only
    if (!token) {
      const cached = localStorage.getItem('cached_tasks');
      setTasks(cached ? JSON.parse(cached) : []);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/tasks/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setTasks(data);
        localStorage.setItem('cached_tasks', JSON.stringify(data));
      } else {
        console.error('Failed to fetch tasks:', data);
      }
    } catch (err) {
      console.warn('Fetch Tasks Warning (Using Cache):', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setAllUsers(data);
        localStorage.setItem('cached_users', JSON.stringify(data));
      } else {
        const errMsg = data?.detail || 'Failed to load users';
        console.error('Failed to fetch users:', errMsg);
        setUsersError(errMsg);
      }
    } catch (err) {
      console.warn('Fetch Users Warning (Using Cache):', err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Create a temporary task object for immediate feedback
    const tempTask = {
      id: 'temp-' + Date.now(),
      title,
      description,
      priority,
      status: 'todo',
      created_at: new Date().toISOString(),
      is_optimistic: true // Mark as pending
    };
    
    // Update UI instantly
    setTasks(prev => [tempTask, ...prev]);
    setTitle('');
    setDescription('');

    try {
      if (!token) {
        // Guest mode: persist to localStorage only
        const current = JSON.parse(localStorage.getItem('cached_tasks') || '[]');
        const newTask = { ...tempTask };
        current.unshift(newTask);
        localStorage.setItem('cached_tasks', JSON.stringify(current));
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/tasks/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, priority }),
      });
      const data = await res.json();
      if (res.ok) {
        // Replace temp task with real one from server
        setTasks(prev => prev.map(t => t.id === tempTask.id ? data : t));
      } else {
        // Remove temp task if failed
        setTasks(prev => prev.filter(t => t.id !== tempTask.id));
        alert('Failed to create task');
      }
    } catch (err) {
      setTasks(prev => prev.filter(t => t.id !== tempTask.id));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id) => {
    // Optimistic Delete
    const originalTasks = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== id));

    if (!token) {
      // Persist deletion in localStorage for guest mode
      const current = JSON.parse(localStorage.getItem('cached_tasks') || '[]').filter(t => t.id !== id);
      localStorage.setItem('cached_tasks', JSON.stringify(current));
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // Revert if server fails
        setTasks(originalTasks);
        alert('Failed to delete task');
      }
    } catch (err) {
      setTasks(originalTasks);
      console.error(err);
    }
  };

  const updateStatus = async (id, status) => {
    // Optimistic Status Update
    const originalTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));

    if (!token) {
      // Persist in localStorage for guest mode
      const current = JSON.parse(localStorage.getItem('cached_tasks') || '[]').map(t => t.id === id ? { ...t, status } : t);
      localStorage.setItem('cached_tasks', JSON.stringify(current));
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setTasks(originalTasks);
      }
    } catch (err) {
      setTasks(originalTasks);
      console.error(err);
    }
  };

  const startEditing = (task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditPriority(task.priority);
  };

  const saveEdit = async (id) => {
    // Optimistic Edit
    const originalTasks = [...tasks];
    const updatedData = { title: editTitle, description: editDescription, priority: editPriority };
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updatedData } : t));
    setEditingTaskId(null);
    if (!token) {
      // Persist edits locally in guest mode
      const current = JSON.parse(localStorage.getItem('cached_tasks') || '[]').map(t => t.id === id ? { ...t, ...updatedData } : t);
      localStorage.setItem('cached_tasks', JSON.stringify(current));
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });
      if (!res.ok) {
        setTasks(originalTasks);
        alert('Failed to save changes');
      }
    } catch (err) {
      setTasks(originalTasks);
      console.error(err);
    }
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      default: return '#10b981';
    }
  };

  return (
    <div className="dashboard animate-fade-in" style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', background: 'linear-gradient(to right, #fff, var(--text-muted))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Aura Workspace
          </h1>
          <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Welcome back, <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{user?.full_name}</span> {user?.role === 'admin' && '(Admin)'}
            {loading && <span className="animate-pulse" style={{ fontSize: '0.7rem', color: 'var(--primary)', background: 'rgba(99, 102, 241, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>Syncing...</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          {user?.role === 'admin' && (
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
              <button 
                onClick={() => setActiveTab('tasks')}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: activeTab === 'tasks' ? 'var(--primary)' : 'transparent', color: activeTab === 'tasks' ? 'white' : 'var(--text-muted)' }}
              >
                Tasks
              </button>
              <button 
                onClick={() => {
                  setActiveTab('users');
                  fetchUsers();
                }}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: activeTab === 'users' ? 'var(--primary)' : 'transparent', color: activeTab === 'users' ? 'white' : 'var(--text-muted)' }}
              >
                Users
              </button>
            </div>
          )}
          <button onClick={logout} className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
            <LogOut size={20} /> Logout
          </button>
        </div>
      </header>

      {activeTab === 'users' && user?.role === 'admin' ? (
        <div className="glass animate-fade-in" style={{ padding: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={24} color="var(--primary)" /> Registered Users
            </h3>
            <button 
              onClick={fetchUsers} 
              disabled={usersLoading}
              className="btn" 
              style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            >
              <Clock size={14} className={usersLoading ? 'animate-spin' : ''} /> 
              {usersLoading ? 'Refreshing...' : 'Refresh List'}
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '15px', color: 'var(--text-muted)' }}>Name</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)' }}>Email</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)' }}>Role</th>
                  <th style={{ padding: '15px', color: 'var(--text-muted)' }}>ID</th>
                </tr>
              </thead>
              <tbody style={{ opacity: usersLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                {usersError ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--error)' }}>
                      <AlertCircle size={24} style={{ marginBottom: '8px' }} />
                      <p>{usersError}</p>
                    </td>
                  </tr>
                ) : allUsers.length === 0 && !usersLoading ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  allUsers.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '15px', fontWeight: '600' }}>{u.full_name}</td>
                      <td style={{ padding: '15px' }}>{u.email}</td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '100px', fontSize: '0.8rem', background: u.role === 'admin' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.1)', color: u.role === 'admin' ? '#a855f7' : 'white' }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '15px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.id}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        {/* Create Task Form */}
        <div className="glass" style={{ padding: '24px', height: 'fit-content' }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Plus size={20} color="var(--primary)" /> New Task
          </h3>
          <form onSubmit={createTask}>
            <div className="input-group">
              <label>Title</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" required />
            </div>
            <div className="input-group">
              <label>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add some details..." rows="3" />
            </div>
            <div className="input-group">
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
              {loading ? 'Create' : 'Create Task'}
            </button>
          </form>
        </div>

        {/* Task List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tasks.length === 0 ? (
            <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Clock size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
              <p>No tasks yet. Start by creating one!</p>
            </div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="glass animate-fade-in" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', width: '100%' }}>
                  <div 
                    onClick={() => updateStatus(task.id, task.status === 'completed' ? 'todo' : 'completed')}
                    style={{ cursor: 'pointer', color: task.status === 'completed' ? 'var(--success)' : 'var(--text-muted)' }}
                  >
                    <CheckCircle2 size={24} />
                  </div>
                  
                  {editingTaskId === task.id ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <input 
                        className="edit-input"
                        value={editTitle} 
                        onChange={(e) => setEditTitle(e.target.value)} 
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--primary)', borderRadius: '4px', color: 'white', padding: '5px' }}
                      />
                      <textarea 
                        className="edit-input"
                        value={editDescription} 
                        onChange={(e) => setEditDescription(e.target.value)}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white', padding: '5px' }}
                      />
                      <select 
                        value={editPriority} 
                        onChange={(e) => setEditPriority(e.target.value)}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: 'white', padding: '5px', width: 'fit-content' }}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  ) : (
                    <div>
                      <h4 style={{ textDecoration: task.status === 'completed' ? 'line-through' : 'none', opacity: task.status === 'completed' ? 0.5 : 1 }}>
                        {task.title}
                      </h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '4px' }}>{task.description}</p>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', border: `1px solid ${getPriorityColor(task.priority)}`, color: getPriorityColor(task.priority), textTransform: 'uppercase', fontWeight: 'bold' }}>
                          {task.priority}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={12} /> {new Date(task.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                        {user?.role === 'admin' && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: {task.id} | User: {task.owner_id}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {editingTaskId === task.id ? (
                    <>
                      <button onClick={() => saveEdit(task.id)} className="btn" style={{ color: 'var(--success)', padding: '8px' }}>
                        <Save size={18} />
                      </button>
                      <button onClick={() => setEditingTaskId(null)} className="btn" style={{ color: 'var(--text-muted)', padding: '8px' }}>
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      {task.status !== 'completed' && (
                        <button onClick={() => startEditing(task)} className="btn" style={{ color: 'var(--primary)', padding: '8px' }}>
                          <Pencil size={18} />
                        </button>
                      )}
                      <button onClick={() => deleteTask(task.id)} className="btn" style={{ color: 'var(--error)', padding: '8px' }}>
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default Dashboard;

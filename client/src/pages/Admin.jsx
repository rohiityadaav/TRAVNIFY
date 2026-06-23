import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Shield, RefreshCw, Crown, User, Search,
  AlertTriangle, CheckCircle, Map, Zap
} from 'lucide-react';
import { safeFetch } from '../lib/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function RoleBadge({ role }) {
  const isAdmin = role === 'admin';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
      padding: '0.2rem 0.6rem', borderRadius: '99px', fontSize: '0.72rem',
      fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase',
      background: isAdmin ? 'rgba(249,115,22,0.15)' : 'rgba(99,102,241,0.12)',
      color: isAdmin ? '#F97316' : '#818CF8',
      border: `1px solid ${isAdmin ? 'rgba(249,115,22,0.3)' : 'rgba(99,102,241,0.2)'}`,
    }}>
      {isAdmin ? <Crown size={10} /> : <User size={10} />}
      {role}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem',
      backdropFilter: 'blur(12px)', boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
        <div style={{ background: `${color}20`, borderRadius: '10px', padding: '0.5rem' }}>
          <Icon size={18} color={color} />
        </div>
      </div>
      <span style={{ fontSize: '2.2rem', fontWeight: '800', color: '#fff', lineHeight: 1 }}>{value}</span>
    </div>
  );
}

export default function Admin({ user }) {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [updatingRole, setUpdatingRole] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, usersRes] = await Promise.all([
        safeFetch('/api/admin/stats', { headers: authHeaders() }),
        safeFetch('/api/admin/users', { headers: authHeaders() }),
      ]);
      if (!statsRes.ok || !usersRes.ok) throw new Error('Failed to load admin data. Make sure you are logged in as an admin.');
      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      setStats(statsData);
      setUsers(usersData.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRoleToggle = async (targetUser) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    if (targetUser.id === user?.id && newRole === 'user') {
      showToast('You cannot remove your own admin role.', 'error');
      return;
    }
    setUpdatingRole(targetUser.id);
    try {
      const res = await safeFetch(`/api/admin/users/${targetUser.id}/role`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to update role');
      }
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u));
      if (stats) {
        const adminDelta = newRole === 'admin' ? 1 : -1;
        setStats(prev => ({ ...prev, totalAdmins: prev.totalAdmins + adminDelta }));
      }
      showToast(`${targetUser.name || targetUser.email} is now ${newRole === 'admin' ? 'an Admin' : 'a User'}.`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUpdatingRole(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.includes(q);
  });

  const wrapStyle = {
    minHeight: '80vh',
    background: 'linear-gradient(135deg, #0B1120 0%, #0F1E3D 50%, #071527 100%)',
    padding: '2rem 1.5rem 4rem',
    fontFamily: "'Outfit', 'Inter', sans-serif",
    borderRadius: '16px',
  };

  if (loading) {
    return (
      <div style={{ ...wrapStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <style>{`@keyframes spin-admin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #F97316', animation: 'spin-admin 0.9s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Loading admin dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...wrapStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#fff', maxWidth: '400px' }}>
          <AlertTriangle size={48} color="#EF4444" style={{ marginBottom: '1rem' }} />
          <h2 style={{ marginBottom: '0.5rem' }}>Unable to Load Dashboard</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={loadData} style={{ background: '#F97316', color: '#fff', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={wrapStyle}>
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          background: toast.type === 'error' ? '#EF4444' : '#10B981',
          color: '#fff', padding: '0.75rem 1.25rem', borderRadius: '12px',
          fontSize: '0.88rem', fontWeight: '600', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <CheckCircle size={16} />
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes spin-admin { to { transform: rotate(360deg); } }
        .admin-row:hover { background: rgba(255,255,255,0.05) !important; }
      `}</style>

      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
              <div style={{ background: 'linear-gradient(135deg,#F97316,#EF4444)', borderRadius: '12px', padding: '0.6rem' }}>
                <Shield size={22} color="#fff" />
              </div>
              <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                Admin Dashboard
              </h1>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', margin: 0 }}>
              Manage users, roles, and monitor platform activity
            </p>
          </div>
          <button
            onClick={loadData}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '10px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
              fontSize: '0.85rem', fontWeight: '600',
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <StatCard icon={Users} label="Total Users" value={stats?.totalUsers ?? '—'} color="#818CF8" />
          <StatCard icon={Map} label="Total Trips" value={stats?.totalTrips ?? '—'} color="#34D399" />
          <StatCard icon={Crown} label="Admins" value={stats?.totalAdmins ?? '—'} color="#F97316" />
          <StatCard icon={Zap} label="Premium" value={stats?.totalPremium ?? '—'} color="#FBBF24" />
        </div>

        {/* Users Table */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', overflow: 'hidden' }}>
          {/* Table top bar */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} color="#818CF8" />
              <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#fff' }}>
                Users <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: '400', fontSize: '0.82rem' }}>({filteredUsers.length})</span>
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
              <input
                type="text"
                placeholder="Search name, email, role…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '9px', color: '#fff', fontSize: '0.82rem',
                  padding: '0.45rem 0.75rem 0.45rem 2.1rem', outline: 'none', width: '220px',
                }}
              />
            </div>
          </div>

          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1.2fr 1.8fr 90px 80px 70px 120px',
            padding: '0.55rem 1.5rem', background: 'rgba(255,255,255,0.025)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            fontSize: '0.7rem', fontWeight: '700', color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.07em', textTransform: 'uppercase',
          }}>
            <span>Name</span><span>Email</span><span>Role</span><span>Premium</span><span>Credits</span><span style={{ textAlign: 'right' }}>Action</span>
          </div>

          {/* Rows */}
          {filteredUsers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.88rem' }}>
              No users match "{search}"
            </div>
          ) : filteredUsers.map((u, idx) => (
            <div
              key={u.id}
              className="admin-row"
              style={{
                display: 'grid', gridTemplateColumns: '1.2fr 1.8fr 90px 80px 70px 120px',
                padding: '0.85rem 1.5rem',
                borderBottom: idx < filteredUsers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                alignItems: 'center', transition: 'background 0.15s',
                background: u.id === user?.id ? 'rgba(249,115,22,0.04)' : 'transparent',
              }}
            >
              {/* Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', overflow: 'hidden' }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                  background: u.role === 'admin' ? 'linear-gradient(135deg,#F97316,#EF4444)' : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', fontWeight: '800', color: '#fff',
                }}>
                  {(u.name || u.email || 'U').slice(0, 2).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.name || '—'}
                  {u.id === user?.id && <span style={{ fontSize: '0.65rem', color: '#F97316', marginLeft: '0.3rem' }}>(you)</span>}
                </span>
              </div>

              {/* Email */}
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</span>

              {/* Role */}
              <div><RoleBadge role={u.role} /></div>

              {/* Premium */}
              <span style={{ fontSize: '0.78rem', color: u.isPremium ? '#FBBF24' : 'rgba(255,255,255,0.3)', fontWeight: u.isPremium ? '700' : '400' }}>
                {u.isPremium ? '✦ Yes' : 'No'}
              </span>

              {/* Credits */}
              <span style={{ fontSize: '0.78rem', color: u.dailyCreditsUsed >= 5 ? '#EF4444' : 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                {u.dailyCreditsUsed}/5
              </span>

              {/* Action */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handleRoleToggle(u)}
                  disabled={updatingRole === u.id}
                  style={{
                    background: u.role === 'admin' ? 'rgba(239,68,68,0.1)' : 'rgba(249,115,22,0.1)',
                    border: `1px solid ${u.role === 'admin' ? 'rgba(239,68,68,0.25)' : 'rgba(249,115,22,0.25)'}`,
                    color: u.role === 'admin' ? '#EF4444' : '#F97316',
                    padding: '0.3rem 0.65rem', borderRadius: '8px',
                    cursor: updatingRole === u.id ? 'not-allowed' : 'pointer',
                    fontSize: '0.73rem', fontWeight: '700',
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    opacity: updatingRole === u.id ? 0.5 : 1,
                  }}
                >
                  {updatingRole === u.id
                    ? <><RefreshCw size={11} style={{ animation: 'spin-admin 0.7s linear infinite' }} /> Updating…</>
                    : u.role === 'admin'
                      ? <><User size={11} /> Make User</>
                      : <><Crown size={11} /> Make Admin</>
                  }
                </button>
              </div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.18)', fontSize: '0.73rem', marginTop: '2rem' }}>
          Admin Dashboard · Changes take effect immediately · Users need to re-login for role changes to appear in their session
        </p>
      </div>
    </div>
  );
}

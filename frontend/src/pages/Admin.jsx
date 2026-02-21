import { useEffect, useState } from 'react'
import { Shield, Users, FileText, Filter, Eye, CheckCircle, XCircle, Trash2, AlertTriangle, Search } from 'lucide-react'
import api from '../utils/api'

function StatCard({ label, value, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: '12px', padding: '20px', transition: 'transform 0.2s'
    }} className="hover:scale-[1.02]">
      <p style={{ fontSize: '0.75rem', fontWeight: '600', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{label}</p>
      <p style={{ fontSize: '2rem', fontWeight: '800', color: color || 'white', letterSpacing: '-0.02em', lineHeight: '1' }}>{value}</p>
    </div>
  )
}

function StatusBadge({ status }) {
  if (status === 'approved') return <span className="badge badge-success">Approved</span>
  if (status === 'rejected') return <span className="badge badge-danger">Rejected</span>
  return <span className="badge badge-warning">Pending</span>
}

function AdminToast({ msg, type, onDismiss }) {
  return (
    <div className={`toast toast--${type}`}>
      {type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
      <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{msg}</span>
    </div>
  )
}

export default function Admin() {
  const [items, setItems] = useState([])
  const [users, setUsers] = useState([])
  const [minScore, setMinScore] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('papers')
  const [stats, setStats] = useState({ totalPapers: 0, pending: 0, approved: 0, users: 0 })
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadPapers = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (minScore) params.set('minScore', minScore)
    try {
      const { data } = await api.get('/api/admin/papers' + (params.toString() ? `?${params}` : ''))
      setItems(data)
      setStats(prev => ({
        ...prev,
        totalPapers: data.length,
        pending: data.filter(p => p.status === 'pending').length,
        approved: data.filter(p => p.status === 'approved').length
      }))
    } catch (e) {
      console.error('Failed to load papers:', e)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/auth/admin/users')
      setUsers(data)
      setStats(prev => ({ ...prev, users: data.length }))
    } catch (e) {
      console.error('Failed to load users:', e)
    } finally {
      setLoading(false)
    }
  }

  const setStatus = async (id, status) => {
    try {
      const url = status === 'approved' ? `/api/admin/papers/${id}/approve` : `/api/admin/papers/${id}/reject`
      await api.put(url)
      showToast(`Paper ${status === 'approved' ? 'approved' : 'rejected'} successfully`)
      await loadPapers()
    } catch (e) {
      showToast('Failed to update status', 'error')
      console.error('Failed to update status:', e)
    }
  }

  const deletePaper = async (id) => {
    if (!window.confirm('Permanently delete this paper?')) return
    try {
      await api.delete(`/api/admin/papers/${id}`)
      showToast('Paper deleted')
      await loadPapers()
    } catch (e) {
      showToast('Deletion failed', 'error')
      console.error('Failed to delete paper:', e)
    }
  }

  const deleteUser = async (id) => {
    if (!window.confirm('Permanently delete this user?')) return
    try {
      await api.delete(`/api/auth/admin/users/${id}`)
      showToast('User deleted')
      await loadUsers()
    } catch (e) {
      showToast('Deletion failed', 'error')
      console.error('Failed to delete user:', e)
    }
  }

  useEffect(() => {
    if (activeTab === 'papers') loadPapers()
    else loadUsers()
  }, [activeTab])

  return (
    <div className="section-gap animate-fade-in">
      {toast && <AdminToast msg={toast.msg} type={toast.type} onDismiss={() => setToast(null)} />}

      {/* Admin Header — dark identity */}
      <div className="admin-header animate-slide-up">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', letterSpacing: '-0.02em' }}>
              Admin Control Panel
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem' }}>
              Manage papers, users, and platform policies
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          <StatCard label="Total Papers" value={stats.totalPapers} />
          <StatCard label="Pending Review" value={stats.pending} color="#FCD34D" />
          <StatCard label="Approved" value={stats.approved} color="#6EE7B7" />
          <StatCard label="Active Users" value={stats.users} color="#93C5FD" />
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar animate-fade-in" style={{ maxWidth: '400px' }}>
        {[
          { key: 'papers', label: 'Paper Moderation', icon: FileText },
          { key: 'users', label: 'User Management', icon: Users }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`tab-btn ${activeTab === key ? 'tab-btn--active' : 'tab-btn--inactive'}`}
            style={activeTab === key ? { background: '#0F172A', color: 'white' } : {}}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'papers' ? (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Filter Bar */}
          <div className="card" style={{ padding: '16px 20px', borderRadius: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Min AI Score
                </label>
                <div style={{ position: 'relative' }}>
                  <Search className="w-4 h-4" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    className="glass-input"
                    type="number"
                    placeholder="e.g., 70"
                    style={{ paddingLeft: '38px' }}
                    value={minScore}
                    onChange={e => setMinScore(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadPapers()}
                  />
                </div>
              </div>
              <button className="btn-primary" onClick={loadPapers} disabled={loading} style={{ height: '42px' }}>
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>

          {/* Papers List */}
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0' }}>
              <div className="spinner" />
            </div>
          ) : items.length === 0 ? (
            <div className="card empty-state">
              <FileText className="empty-state-icon" />
              <p style={{ fontWeight: '700', color: 'var(--color-text)' }}>No papers found</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items.map(i => (
                <div key={i._id} className="card" style={{ padding: '20px', borderRadius: '12px', borderLeft: i.status === 'pending' ? '4px solid var(--color-warning)' : '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                    {/* Icon */}
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '10px',
                      background: 'var(--color-primary-light)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <FileText className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '700', color: 'var(--color-text)', fontSize: '1rem' }}>
                          {i.subject} ({i.year})
                        </span>
                        <StatusBadge status={i.status} />
                        {i.aiScore != null && (
                          <span style={{
                            fontSize: '0.75rem', fontWeight: '700', padding: '3px 10px', borderRadius: '9999px',
                            background: Number(i.aiScore) >= 70 ? 'var(--color-success-bg)' : Number(i.aiScore) >= 40 ? 'var(--color-warning-bg)' : 'var(--color-danger-bg)',
                            color: Number(i.aiScore) >= 70 ? 'var(--color-success)' : Number(i.aiScore) >= 40 ? '#92400E' : 'var(--color-danger)',
                            border: `1px solid ${Number(i.aiScore) >= 70 ? '#BBF7D0' : Number(i.aiScore) >= 40 ? '#FDE68A' : '#FECACA'}`
                          }}>
                            AI {i.aiScore}%
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>
                        {i.department} · {i.university || 'No university'}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                        Uploaded by <strong style={{ color: 'var(--color-text-secondary)' }}>{i.uploadedBy?.name || 'Unknown'}</strong>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: '8px',
                    marginTop: '16px', paddingTop: '16px',
                    borderTop: '1px solid var(--color-border)'
                  }}>
                    <a
                      href={i.fileUrl} target="_blank" rel="noreferrer"
                      className="btn-secondary"
                      style={{ textDecoration: 'none', padding: '7px 14px', fontSize: '0.8125rem', borderRadius: '8px', height: '34px' }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </a>
                    {i.status !== 'approved' && (
                      <button
                        className="btn-success"
                        style={{ padding: '7px 14px', fontSize: '0.8125rem', borderRadius: '8px', height: '34px' }}
                        onClick={() => setStatus(i._id, 'approved')}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve
                      </button>
                    )}
                    {i.status !== 'rejected' && (
                      <button
                        className="btn-warning"
                        style={{ padding: '7px 14px', fontSize: '0.8125rem', borderRadius: '8px', height: '34px' }}
                        onClick={() => setStatus(i._id, 'rejected')}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    )}
                    <button
                      className="btn-danger"
                      style={{ padding: '7px 14px', fontSize: '0.8125rem', borderRadius: '8px', marginLeft: 'auto', height: '34px' }}
                      onClick={() => deletePaper(i._id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Users Table */
        <div className="card animate-fade-in" style={{ borderRadius: '16px', overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 className="section-title">Registered Users</h2>
            {users.length > 0 && <span className="badge badge-neutral">{users.length} users</span>}
          </div>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px' }}>
              <div className="spinner" />
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: '24px' }}>User</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th style={{ textAlign: 'right', paddingRight: '24px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td style={{ paddingLeft: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            background: u.role === 'admin' ? '#0F172A' : 'var(--color-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: '700', fontSize: '0.875rem', flexShrink: 0
                          }}>
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>{u.name}</div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-neutral' : 'badge-primary'}`}
                          style={u.role === 'admin' ? { background: '#F1F5F9', color: '#0F172A' } : {}}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                        {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        <button
                          onClick={() => deleteUser(u._id)}
                          disabled={u.role === 'admin'}
                          className="btn-danger"
                          style={{
                            padding: '6px 12px', height: '32px',
                            cursor: u.role === 'admin' ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {users.length === 0 && !loading && (
            <div className="empty-state">
              <p style={{ color: 'var(--color-text-secondary)' }}>No users found</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

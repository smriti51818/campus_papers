import { useEffect, useState } from 'react'
import { LayoutDashboard, Upload as UploadIcon, CheckCircle, Download, BookOpen, Award, TrendingUp, Star, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

const BADGE_LABELS = {
  first_upload: '🎖 First Upload',
  ten_uploads: '🥈 10 Uploads',
  fifty_uploads: '🥇 50 Uploads',
  hundred_uploads: '💎 100 Uploads',
  popular: '⭐ Popular',
  quality_contributor: '✨ Quality Contributor',
  top_contributor: '🏆 Top Contributor'
}

function StatCard({ icon: Icon, label, value, color = '#2563EB', bg = '#EFF6FF' }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <p style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>{label}</p>
          <p style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-text)', letterSpacing: '-0.02em', lineHeight: '1' }}>{value}</p>
        </div>
        <div className="stat-card-icon" style={{ background: bg }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  if (status === 'approved') return <span className="badge badge-success">Approved</span>
  if (status === 'rejected') return <span className="badge badge-danger">Rejected</span>
  return <span className="badge badge-warning">Pending</span>
}

export default function Dashboard() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [badges, setBadges] = useState([])
  const [stats, setStats] = useState({ totalUploads: 0, totalDownloads: 0, approvedPapers: 0, avgAiScore: 0 })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/papers')
      const me = JSON.parse(localStorage.getItem('user') || 'null')
      const myItems = data.filter(d => d.uploadedBy?._id === me?.id)
      setItems(myItems)

      const approved = myItems.filter(i => i.status === 'approved').length
      const totalDownloads = myItems.reduce((sum, i) => sum + (i.downloads || 0), 0)
      const scores = myItems.map(i => Number(i.aiScore)).filter(s => !isNaN(s) && s > 0)
      const avgAiScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
      setStats({ totalUploads: myItems.length, totalDownloads, approvedPapers: approved, avgAiScore })

      if (user?.id) {
        try {
          const badgeData = await api.get(`/api/badges/${user.id}`)
          setBadges(badgeData.data.badges || [])
        } catch (e) {
          console.error('Failed to load badges:', e)
        }
      }
    } catch (e) {
      console.error('Failed to load data:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="section-gap animate-fade-in">
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <h1 style={{ fontSize: '1.625rem', fontWeight: '800', color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
              My Dashboard
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', marginLeft: '52px' }}>
            Welcome back, <strong style={{ color: 'var(--color-text)' }}>{user?.name}</strong>
          </p>
        </div>
        <Link to="/upload">
          <button className="btn-primary" style={{ borderRadius: '8px' }}>
            <UploadIcon className="w-4 h-4" />
            Upload Paper
          </button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard icon={UploadIcon} label="Total Uploads" value={stats.totalUploads} color="#2563EB" bg="#EFF6FF" />
        <StatCard icon={Download} label="Total Downloads" value={stats.totalDownloads} color="#16A34A" bg="#F0FDF4" />
        <StatCard icon={CheckCircle} label="Approved Papers" value={stats.approvedPapers} color="#7C3AED" bg="#F5F3FF" />
        <StatCard icon={Star} label="Avg AI Score" value={stats.avgAiScore > 0 ? `${stats.avgAiScore}%` : '—'} color="#F59E0B" bg="#FFFBEB" />
      </div>

      {/* Achievements */}
      {badges.length > 0 && (
        <div className="card" style={{ padding: '24px', borderRadius: '12px' }}>
          <div className="section-header">
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award className="w-5 h-5" style={{ color: '#F59E0B' }} />
              Achievements
            </h2>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {badges.map(b => (
              <span key={b} style={{
                padding: '7px 14px',
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: '9999px',
                fontSize: '0.8125rem',
                fontWeight: '600',
                color: '#92400E'
              }}>
                {BADGE_LABELS[b] || b.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* My Papers Table */}
      <div className="card" style={{ borderRadius: '12px', overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
            My Papers
          </h2>
          {items.length > 0 && (
            <span className="badge badge-neutral">{items.length} paper{items.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
            <div className="spinner" />
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <BookOpen className="empty-state-icon" />
            <p style={{ fontWeight: '600', color: 'var(--color-text)', marginBottom: '6px' }}>No papers uploaded yet</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
              Start contributing to earn badges and climb the leaderboard!
            </p>
            <Link to="/upload">
              <button className="btn-primary" style={{ borderRadius: '8px' }}>
                <UploadIcon className="w-4 h-4" />
                Upload Your First Paper
              </button>
            </Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Paper</th>
                <th>Year</th>
                <th>AI Score</th>
                <th>Downloads</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map(i => (
                <tr key={i._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        background: 'var(--color-primary-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <FileText className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: 'var(--color-text)', fontSize: '0.9375rem' }}>{i.subject}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{i.department}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>{i.year}</td>
                  <td>
                    {i.aiScore != null ? (
                      <span style={{ fontWeight: '700', color: Number(i.aiScore) >= 70 ? 'var(--color-success)' : Number(i.aiScore) >= 40 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                        {i.aiScore}%
                      </span>
                    ) : <span style={{ color: '#CBD5E1' }}>—</span>}
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)', fontWeight: '500' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Download className="w-3.5 h-3.5" />{i.downloads || 0}
                    </span>
                  </td>
                  <td><StatusBadge status={i.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

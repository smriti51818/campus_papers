import { useEffect, useState, useRef } from 'react'
import { LayoutDashboard, Upload as UploadIcon, CheckCircle, Download, BookOpen, Award, TrendingUp, Star, FileText, Trophy, User as UserIcon } from 'lucide-react'
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

const RANK_MEDALS = [
  { emoji: '🥇', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { emoji: '🥈', color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
  { emoji: '🥉', color: '#CD7F32', bg: '#FFF7ED', border: '#FED7AA' },
]

function CountUp({ end, duration = 1000 }) {
  const [count, setCount] = useState(0)
  const countRef = useRef(0)
  const startTimeRef = useRef(null)

  useEffect(() => {
    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const progress = timestamp - startTimeRef.current
      const percentage = Math.min(progress / duration, 1)

      const nextCount = Math.floor(end * percentage)
      if (nextCount !== countRef.current) {
        countRef.current = nextCount
        setCount(nextCount)
      }

      if (percentage < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
    return () => { startTimeRef.current = null }
  }, [end, duration])

  return <span>{count}</span>
}

function StatCard({ icon: Icon, label, value, color = '#2563EB', bg = '#EFF6FF', suffix = '' }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <p style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>{label}</p>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-text)', letterSpacing: '-0.02em', lineHeight: '1', display: 'flex', alignItems: 'baseline' }}>
            <CountUp end={value} />
            {suffix && <span style={{ fontSize: '1.25rem', marginLeft: '2px' }}>{suffix}</span>}
          </div>
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
  const [activeTab, setActiveTab] = useState('papers')
  const [items, setItems] = useState([])
  const [badges, setBadges] = useState([])
  const [stats, setStats] = useState({ totalUploads: 0, totalDownloads: 0, approvedPapers: 0, avgAiScore: 0 })
  const [loading, setLoading] = useState(true)

  // Leaderboard data
  const [leaderboard, setLeaderboard] = useState([])
  const [lbType, setLbType] = useState('uploads')
  const [lbLoading, setLbLoading] = useState(false)

  const loadDashboard = async () => {
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

  const loadLeaderboard = async () => {
    setLbLoading(true)
    try {
      const { data } = await api.get(`/api/leaderboard?type=${lbType}`)
      setLeaderboard(data)
    } catch (e) {
      console.error('Failed to load leaderboard:', e)
    } finally {
      setLbLoading(false)
    }
  }

  useEffect(() => { loadDashboard() }, [])
  useEffect(() => { if (activeTab === 'leaderboard') loadLeaderboard() }, [activeTab, lbType])

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
          <button className="btn-primary">
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
        <StatCard icon={Star} label="Avg AI Score" value={stats.avgAiScore} suffix="%" color="#F59E0B" bg="#FFFBEB" />
      </div>

      {/* Achievements (Horizontal Scroll or Wrap) */}
      {badges.length > 0 && (
        <div className="card" style={{ padding: '20px 24px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Award className="w-5 h-5" style={{ color: '#F59E0B' }} />
            <h2 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--color-text)' }}>Achievements</h2>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {badges.map(b => (
              <span key={b} className="badge badge-warning" style={{ padding: '6px 12px' }}>
                {BADGE_LABELS[b] || b.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Tabs */}
      <div className="card" style={{ borderRadius: '16px', overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '8px', borderBottom: '1px solid var(--color-border)', background: '#F8FAFC' }}>
          <div className="tab-bar">
            <button
              className={`tab-btn ${activeTab === 'papers' ? 'tab-btn--active' : 'tab-btn--inactive'}`}
              onClick={() => setActiveTab('papers')}
            >
              <FileText className="w-4 h-4" />
              My Papers
            </button>
            <button
              className={`tab-btn ${activeTab === 'leaderboard' ? 'tab-btn--active' : 'tab-btn--inactive'}`}
              onClick={() => setActiveTab('leaderboard')}
            >
              <Trophy className="w-4 h-4" />
              Leaderboard
            </button>
          </div>
        </div>

        <div style={{ minHeight: '300px' }}>
          {activeTab === 'papers' ? (
            loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px' }}>
                <div className="spinner" />
              </div>
            ) : items.length === 0 ? (
              <div className="empty-state animate-fade-in">
                <BookOpen className="empty-state-icon" />
                <p style={{ fontWeight: '700', color: 'var(--color-text)', marginBottom: '8px' }}>No papers uploaded yet</p>
                <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', marginBottom: '24px', maxWidth: '300px' }}>
                  Start contributing to the community and build your reputation.
                </p>
                <Link to="/upload">
                  <button className="btn-primary">
                    <UploadIcon className="w-4 h-4" />
                    Upload Your First Paper
                  </button>
                </Link>
              </div>
            ) : (
              <div className="animate-fade-in" style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: '24px' }}>Paper</th>
                      <th>Year</th>
                      <th>AI Score</th>
                      <th>Downloads</th>
                      <th style={{ paddingRight: '24px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(i => (
                      <tr key={i._id}>
                        <td style={{ paddingLeft: '24px' }}>
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
                        <td style={{ paddingRight: '24px' }}><StatusBadge status={i.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="animate-fade-in" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '800', color: 'var(--color-text)', letterSpacing: '-0.01em' }}>Community Rankings</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>See how you stack up against other contributors</p>
                </div>

                <div style={{ display: 'flex', background: 'var(--color-bg)', padding: '3px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <button
                    onClick={() => setLbType('uploads')}
                    style={{
                      padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700',
                      background: lbType === 'uploads' ? 'white' : 'transparent',
                      color: lbType === 'uploads' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      boxShadow: lbType === 'uploads' ? 'var(--shadow-sm)' : 'none',
                      border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >Top Contributors</button>
                  <button
                    onClick={() => setLbType('views')}
                    style={{
                      padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700',
                      background: lbType === 'views' ? 'white' : 'transparent',
                      color: lbType === 'views' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      boxShadow: lbType === 'views' ? 'var(--shadow-sm)' : 'none',
                      border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >Most Popular</button>
                </div>
              </div>

              {lbLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px' }}>
                  <div className="spinner" />
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="empty-state">
                  <Trophy className="empty-state-icon" />
                  <p style={{ fontWeight: '600', color: 'var(--color-text)' }}>No rankings available</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Top 3 Podium Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                    {[
                      { entry: leaderboard[1], rank: 1 },
                      { entry: leaderboard[0], rank: 0 },
                      { entry: leaderboard[2], rank: 2 }
                    ].filter(x => x.entry).map(({ entry, rank }) => (
                      <div key={entry.id} className="card-interactive" style={{
                        padding: '24px 16px', borderRadius: '16px', textAlign: 'center',
                        background: rank === 0 ? '#FFFDF5' : 'white',
                        border: rank === 0 ? '2px solid #FDE68A' : '1px solid var(--color-border)',
                        position: 'relative'
                      }}>
                        <div style={{ fontSize: '1.75rem', marginBottom: '8px' }}>{RANK_MEDALS[rank].emoji}</div>
                        <div style={{
                          width: '44px', height: '44px', borderRadius: '50%', background: 'var(--color-primary)',
                          margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: '800'
                        }}>{entry.name?.charAt(0).toUpperCase()}</div>
                        <div style={{ fontWeight: '700', fontSize: '0.9375rem', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.name}</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '800', color: RANK_MEDALS[rank].color }}>{entry.score}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: '600' }}>{lbType === 'uploads' ? 'papers' : 'views'}</div>
                        {user?.id === entry.id && <span className="badge badge-primary" style={{ marginTop: '10px' }}>You</span>}
                      </div>
                    ))}
                  </div>

                  {/* Rest of the table */}
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Contributor</th>
                          <th style={{ textAlign: 'right' }}>{lbType === 'uploads' ? 'Papers' : 'Views'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.slice(3).map((entry, idx) => (
                          <tr key={entry.id}>
                            <td style={{ fontWeight: '700', color: 'var(--color-text-secondary)', width: '60px', paddingLeft: '16px' }}>#{idx + 4}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                  width: '32px', height: '32px', borderRadius: '50%', background: '#E2E8F0',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: 'var(--color-text-secondary)', fontSize: '0.75rem', fontWeight: '700'
                                }}>{entry.name?.charAt(0).toUpperCase()}</div>
                                <span style={{ fontWeight: '600' }}>{entry.name}</span>
                                {user?.id === entry.id && <span className="badge badge-primary" style={{ fontSize: '10px' }}>You</span>}
                              </div>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: '700', paddingRight: '16px' }}>{entry.score}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

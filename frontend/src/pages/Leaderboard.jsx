import { useEffect, useState } from 'react'
import { Trophy, Medal, Award, User as UserIcon } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

const RANK_MEDALS = [
  { emoji: '🥇', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { emoji: '🥈', color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
  { emoji: '🥉', color: '#CD7F32', bg: '#FFF7ED', border: '#FED7AA' },
]

export default function Leaderboard() {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState([])
  const [type, setType] = useState('uploads')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/api/leaderboard?type=${type}`)
      setLeaderboard(data)
    } catch (e) {
      console.error('Failed to load leaderboard:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [type])

  const topThree = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <div className="section-gap animate-fade-in">
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: '#F59E0B',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: '800', color: 'var(--color-text)', letterSpacing: '-0.02em' }}>
            Leaderboard
          </h1>
        </div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', marginLeft: '52px' }}>
          Top contributors to the CampusPapers community
        </p>
      </div>

      {/* Toggle */}
      <div style={{
        display: 'flex',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '10px',
        padding: '4px',
        gap: '4px',
        maxWidth: '380px'
      }}>
        {[
          { key: 'uploads', label: 'Top Contributors', icon: Trophy },
          { key: 'views', label: 'Most Popular', icon: Award }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setType(key)}
            style={{
              flex: 1, padding: '9px 16px', borderRadius: '8px',
              fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer',
              border: 'none', transition: 'all 0.15s ease',
              background: type === key ? 'var(--color-primary)' : 'transparent',
              color: type === key ? 'white' : 'var(--color-text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <div className="spinner" />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="card empty-state">
          <Trophy className="empty-state-icon" />
          <p style={{ fontWeight: '600', color: 'var(--color-text)', marginBottom: '4px' }}>No data yet</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Be the first to contribute!</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {topThree.length >= 2 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              {/* Order: 2nd, 1st, 3rd */}
              {[
                { entry: topThree[1], rank: 1 },
                { entry: topThree[0], rank: 0 },
                { entry: topThree[2], rank: 2 }
              ].filter(x => x.entry).map(({ entry, rank }) => {
                const medal = RANK_MEDALS[rank]
                const isFirst = rank === 0
                return (
                  <div key={entry.id} className="card" style={{
                    padding: '24px 20px', textAlign: 'center', borderRadius: '12px',
                    border: isFirst ? `2px solid #FDE68A` : '1px solid var(--color-border)',
                    background: isFirst ? '#FFFDF5' : 'var(--color-surface)',
                    position: 'relative'
                  }}>
                    {isFirst && (
                      <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', fontSize: '1.5rem' }}>
                        👑
                      </div>
                    )}
                    <div style={{
                      fontSize: '2rem', lineHeight: '1', marginBottom: '12px', marginTop: isFirst ? '8px' : '0'
                    }}>
                      {medal.emoji}
                    </div>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 12px',
                      background: 'var(--color-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontWeight: '700', fontSize: '1.125rem'
                    }}>
                      {entry.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ fontWeight: '700', color: 'var(--color-text)', fontSize: '0.9375rem', marginBottom: '4px' }}>
                      {entry.name}
                    </div>
                    <div style={{ fontSize: '1.375rem', fontWeight: '800', color: medal.color, marginBottom: '2px' }}>
                      {entry.score}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: '500' }}>
                      {type === 'uploads' ? 'papers' : 'views'}
                    </div>
                    {user?.id === entry.id && (
                      <span className="badge badge-primary" style={{ marginTop: '8px' }}>You</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Full Table */}
          <div className="card" style={{ borderRadius: '12px', overflow: 'hidden', padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <h2 className="section-title">Full Rankings</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Rank</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th style={{ textAlign: 'right' }}>{type === 'uploads' ? 'Papers' : 'Views'}</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = user?.id === entry.id
                  const medal = RANK_MEDALS[index]
                  return (
                    <tr key={entry.id} style={{
                      background: isCurrentUser ? 'var(--color-primary-light)' : index % 2 === 0 ? 'var(--color-surface)' : '#FAFBFC'
                    }}>
                      <td>
                        {medal ? (
                          <span style={{ fontSize: '1.25rem' }}>{medal.emoji}</span>
                        ) : (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: '28px', height: '28px', borderRadius: '6px',
                            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                            fontSize: '0.8125rem', fontWeight: '700', color: 'var(--color-text-secondary)'
                          }}>
                            {index + 1}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: isCurrentUser ? 'var(--color-primary)' : '#E2E8F0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: '700', fontSize: '0.8125rem',
                            color: isCurrentUser ? 'white' : 'var(--color-text-secondary)'
                          }}>
                            {entry.name?.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>{entry.name}</span>
                          {isCurrentUser && <span className="badge badge-primary" style={{ fontSize: '0.6875rem', padding: '2px 8px' }}>You</span>}
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>{entry.email}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: 'var(--color-text)', fontSize: '1rem' }}>
                        {entry.score}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

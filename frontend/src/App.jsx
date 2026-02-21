import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { BookOpen, Upload as UploadIcon, LayoutDashboard, Trophy, Settings, LogOut, User, Menu, X, Shield } from 'lucide-react'
import AuthPage from './pages/AuthPage'
import Upload from './pages/Upload'
import Dashboard from './pages/Dashboard'
import Papers from './pages/Papers'
import Admin from './pages/Admin'
import Leaderboard from './pages/Leaderboard'
import { useAuth } from './context/AuthContext'

function Protected({ children, roles }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
  return children
}

function NavLink({ to, icon: Icon, children }) {
  const location = useLocation()
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
  return (
    <Link to={to} className={`nav-link ${isActive ? 'active' : ''}`}>
      <Icon className="w-4 h-4" />
      {children}
    </Link>
  )
}

function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Navbar */}
      <nav className="navbar sticky top-0 z-50">
        <div className="page-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
            {/* Logo */}
            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '8px',
                background: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span style={{ fontSize: '1.0625rem', fontWeight: '700', color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
                CampusPapers
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              <NavLink to="/papers" icon={BookOpen}>Papers</NavLink>
              {user?.role !== 'admin' && (
                <>
                  <NavLink to="/upload" icon={UploadIcon}>Upload</NavLink>
                  <NavLink to="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
                </>
              )}
              <NavLink to="/leaderboard" icon={Trophy}>Leaderboard</NavLink>
              {user?.role === 'admin' && (
                <NavLink to="/admin" icon={Shield}>Admin</NavLink>
              )}
            </div>

            {/* User Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Avatar */}
              <div className="hidden md:flex items-center gap-2" style={{
                padding: '6px 12px',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px'
              }}>
                <div style={{
                  width: '28px', height: '28px',
                  borderRadius: '50%',
                  background: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '0.75rem', fontWeight: '700', flexShrink: 0
                }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name}
                </span>
              </div>
              <button
                onClick={logout}
                className="btn-secondary hidden md:inline-flex"
                style={{ padding: '6px 12px', borderRadius: '8px', color: 'var(--color-danger)', borderColor: '#FECACA' }}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
              {/* Mobile hamburger */}
              <button
                className="md:hidden btn-secondary"
                style={{ padding: '6px 8px' }}
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div style={{
            background: 'var(--color-surface)',
            borderTop: '1px solid var(--color-border)',
            padding: '12px 16px 16px',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <NavLink to="/papers" icon={BookOpen}>Papers</NavLink>
              {user?.role !== 'admin' && (
                <>
                  <NavLink to="/upload" icon={UploadIcon}>Upload</NavLink>
                  <NavLink to="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>
                </>
              )}
              <NavLink to="/leaderboard" icon={Trophy}>Leaderboard</NavLink>
              {user?.role === 'admin' && (
                <NavLink to="/admin" icon={Shield}>Admin</NavLink>
              )}
              <hr style={{ margin: '8px 0', borderColor: 'var(--color-border)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 4px' }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  background: 'var(--color-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '0.8125rem', fontWeight: '700'
                }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--color-text)' }}>{user?.name}</span>
              </div>
              <button
                onClick={logout}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 12px', borderRadius: '8px',
                  color: 'var(--color-danger)', background: 'var(--color-danger-bg)',
                  border: '1px solid #FECACA', fontWeight: '600', fontSize: '0.875rem',
                  cursor: 'pointer', marginTop: '4px'
                }}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {children}
      </main>
    </div>
  )
}

export default function App() {
  const { user } = useAuth()

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Papers />} />
        <Route path="/papers" element={<Papers />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/admin" element={<Protected roles={['admin']}><Admin /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  )
}

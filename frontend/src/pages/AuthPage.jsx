import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Mail, Lock, User, AlertCircle, LogIn, UserPlus, Shield } from 'lucide-react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

export default function AuthPage() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [err, setErr] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [loading, setLoading] = useState(false)

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}$/
    return emailRegex.test(email)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setErr('')
    setEmailErr('')
    if (!validateEmail(form.email)) {
      setEmailErr(`Please enter a valid email address.`)
      return
    }
    setLoading(true)
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup'
      const { data } = await api.post(endpoint, form)
      login(data.token, data.user)
      if (data.user.role === 'admin') nav('/admin')
      else nav('/')
    } catch (e) {
      const errorMessage = e.response?.data?.message || (isLogin ? 'Login failed' : 'Signup failed')
      setErr(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const switchTab = (toLogin) => {
    setIsLogin(toLogin)
    setErr('')
    setEmailErr('')
    setForm({ name: '', email: '', password: '' })
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      background: 'var(--color-bg)'
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }} className="animate-fade-in">
        {/* Logo & Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '52px', height: '52px', borderRadius: '12px',
            background: 'var(--color-primary)', marginBottom: '16px',
            boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
          }}>
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-text)', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            CampusPapers
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
            Your academic question paper hub
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.07)'
        }}>
          {/* Tab Switcher */}
          <div style={{
            display: 'flex',
            background: 'var(--color-bg)',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '24px',
            gap: '4px'
          }}>
            <button
              onClick={() => switchTab(true)}
              style={{
                flex: 1, padding: '9px 16px', borderRadius: '8px',
                fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer',
                border: 'none', transition: 'all 0.15s ease',
                background: isLogin ? 'var(--color-surface)' : 'transparent',
                color: isLogin ? 'var(--color-text)' : 'var(--color-text-secondary)',
                boxShadow: isLogin ? 'var(--shadow-sm)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
            <button
              onClick={() => switchTab(false)}
              style={{
                flex: 1, padding: '9px 16px', borderRadius: '8px',
                fontWeight: '600', fontSize: '0.875rem', cursor: 'pointer',
                border: 'none', transition: 'all 0.15s ease',
                background: !isLogin ? 'var(--color-surface)' : 'transparent',
                color: !isLogin ? 'var(--color-text)' : 'var(--color-text-secondary)',
                boxShadow: !isLogin ? 'var(--shadow-sm)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              <UserPlus className="w-4 h-4" />
              Sign Up
            </button>
          </div>

          {/* Error Banner */}
          {err && (
            <div style={{
              marginBottom: '20px', padding: '12px 14px',
              borderRadius: '8px', border: '1px solid #FECACA',
              background: 'var(--color-danger-bg)',
              display: 'flex', alignItems: 'flex-start', gap: '10px'
            }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-danger)', marginTop: '2px' }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--color-danger)', fontWeight: '500' }}>{err}</p>
            </div>
          )}

          <form onSubmit={onSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {!isLogin && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '6px' }}>
                    Full Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User className="w-4 h-4" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                    <input
                      className="glass-input"
                      style={{ paddingLeft: '38px' }}
                      placeholder="Enter your full name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '6px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail className="w-4 h-4" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                  <input
                    type="email"
                    className="glass-input"
                    style={{ paddingLeft: '38px' }}
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => { setForm({ ...form, email: e.target.value }); setEmailErr('') }}
                    required
                  />
                </div>
                {emailErr && (
                  <p style={{ marginTop: '6px', fontSize: '0.8125rem', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <AlertCircle className="w-3.5 h-3.5" />{emailErr}
                  </p>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: '600', color: 'var(--color-text)', marginBottom: '6px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock className="w-4 h-4" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                  <input
                    type="password"
                    className="glass-input"
                    style={{ paddingLeft: '38px' }}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '11px 20px', fontSize: '0.9375rem', borderRadius: '10px', marginTop: '4px' }}
              >
                {loading ? (
                  <><div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />Processing...</>
                ) : isLogin ? (
                  <><LogIn className="w-4 h-4" />Sign In to Account</>
                ) : (
                  <><UserPlus className="w-4 h-4" />Create Account</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Admin hint */}
        <div style={{ marginTop: '24px', padding: '14px 16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            Admin access is role-based. Sign in with your admin credentials.
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
          Secured with JWT authentication
        </p>
      </div>
    </div>
  )
}

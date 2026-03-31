import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../hooks/useApi'
import { Clock, RefreshCw, LogOut } from 'lucide-react'

export default function PendingApproval() {
  const { user, logout, updateApproval } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)

  const checkStatus = async () => {
    setChecking(true)
    try {
      const profile = await api.getProfile()
      if (profile.approved) {
        updateApproval(true)
        navigate('/')
      }
    } catch {
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: 16,
    }}>
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          padding: 16,
          borderRadius: 20,
          background: 'rgba(245, 158, 11, 0.12)',
          marginBottom: 20,
        }}>
          <Clock size={40} color="var(--warning)" />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
          Waiting for Approval
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
          Hi <strong>{user?.username}</strong>, your account has been created but needs
          to be approved by an existing member before you can access the grapevine.
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 28 }}>
          We check automatically every 15 seconds, or you can check manually.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={checkStatus}
            disabled={checking}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 24px',
              background: checking ? 'var(--bg-hover)' : 'var(--accent)',
              color: '#fff',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <RefreshCw size={16} style={checking ? { animation: 'spin 1s linear infinite' } : {}} />
            {checking ? 'Checking...' : 'Check Status'}
          </button>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 24px',
              background: 'var(--bg-hover)',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

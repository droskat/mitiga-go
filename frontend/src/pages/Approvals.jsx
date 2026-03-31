import { useState, useEffect } from 'react'
import { api } from '../hooks/useApi'
import { UserCheck, Check, X, Loader, ShieldCheck } from 'lucide-react'

export default function Approvals() {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(null)

  const fetchPending = async () => {
    try {
      const data = await api.getPendingUsers()
      setPending(data)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPending() }, [])

  const handleApprove = async (id) => {
    setActing(id)
    try {
      await api.approveUser(id)
      fetchPending()
    } catch {
    } finally {
      setActing(null)
    }
  }

  const handleReject = async (id) => {
    if (!window.confirm('Reject and permanently delete this user?')) return
    setActing(id)
    try {
      await api.rejectUser(id)
      fetchPending()
    } catch {
    } finally {
      setActing(null)
    }
  }

  const timeAgo = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <UserCheck size={24} color="var(--accent)" />
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>Pending Approvals</h2>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
        New members need approval from an existing member before they can access the grapevine.
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : pending.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60,
          background: 'var(--bg-card)', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
        }}>
          <ShieldCheck size={40} color="var(--success)" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>All clear!</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No pending approval requests right now.</p>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}>
          {pending.map((user, idx) => (
            <div key={user.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: idx < pending.length - 1 ? '1px solid var(--border)' : 'none',
              gap: 12,
              flexWrap: 'wrap',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <div style={{
                  width: 40, height: 40,
                  borderRadius: '50%',
                  background: 'rgba(245, 158, 11, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: 'var(--warning)',
                  flexShrink: 0,
                }}>
                  {user.username[0].toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{user.username}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {user.email} &middot; Registered {timeAgo(user.created_at)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => handleApprove(user.id)}
                  disabled={acting === user.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px',
                    background: 'var(--success)',
                    color: '#fff',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                    fontSize: 13,
                    opacity: acting === user.id ? 0.5 : 1,
                  }}
                >
                  <Check size={14} />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(user.id)}
                  disabled={acting === user.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: 'var(--danger)',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                    fontSize: 13,
                    opacity: acting === user.id ? 0.5 : 1,
                  }}
                >
                  <X size={14} />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

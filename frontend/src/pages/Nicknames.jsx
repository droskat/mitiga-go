import { useState, useEffect } from 'react'
import { api } from '../hooks/useApi'
import { Users, Plus, Trash2, Shield, Loader } from 'lucide-react'

export default function Nicknames() {
  const [nicknames, setNicknames] = useState([])
  const [realName, setRealName] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchNicknames = async () => {
    try {
      const data = await api.getNicknames()
      setNicknames(data)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNicknames() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!realName.trim() || !nickname.trim()) return
    setSaving(true)
    setError('')
    try {
      await api.upsertNickname({ real_name: realName, nickname: nickname })
      setRealName('')
      setNickname('')
      fetchNicknames()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.deleteNickname(id)
      fetchNicknames()
    } catch {}
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Users size={24} color="var(--accent)" />
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>Nickname Manager</h2>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
        Map nicknames to real names. Nicknames used in gossips will show as real names on the frontend.
      </p>

      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        padding: 24,
        border: '1px solid var(--border)',
        marginBottom: 24,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px',
          background: 'rgba(139,92,246,0.08)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 20,
          border: '1px solid rgba(139,92,246,0.2)',
        }}>
          <Shield size={16} color="var(--accent)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            All data is encrypted in the database. Nicknames are resolved client-side for display only.
          </span>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--danger)',
            fontSize: 13,
            marginBottom: 16,
          }}>{error}</div>
        )}

        <form onSubmit={handleAdd} className="nickname-form">
          <input
            type="text"
            value={realName}
            onChange={e => setRealName(e.target.value)}
            placeholder="Real name (e.g. John)"
            required
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 13,
              minWidth: 0,
            }}
          />
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="Nickname (e.g. TheWolf)"
            required
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'var(--bg-primary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 13,
              minWidth: 0,
            }}
          />
          <button
            type="submit"
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 18px',
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: 13,
              opacity: saving ? 0.5 : 1,
              flexShrink: 0,
            }}
          >
            <Plus size={14} />
            {saving ? 'Saving...' : 'Add'}
          </button>
        </form>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : nicknames.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60,
          background: 'var(--bg-card)', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
        }}>
          <Users size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No nicknames yet</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Add your first nickname mapping above</p>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}>
          {/* Desktop header */}
          <div className="nickname-table-header" style={{
            borderBottom: '1px solid var(--border)',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            <span>Real Name</span>
            <span>Nickname</span>
            <span></span>
          </div>

          {nicknames.map((n, idx) => (
            <div key={n.id} className="nickname-table-row" style={{
              borderBottom: idx < nicknames.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <span className="nn-real" style={{ fontSize: 14, fontWeight: 600 }}>{n.real_name}</span>
              <span className="nn-nick" style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 500 }}>{n.nickname}</span>
              <button
                className="nn-delete"
                onClick={() => handleDelete(n.id)}
                style={{
                  background: 'none',
                  color: 'var(--text-muted)',
                  padding: 4,
                  borderRadius: 4,
                }}
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

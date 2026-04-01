import { useState, useEffect } from 'react'
import { api } from '../hooks/useApi'

export default function ReactionTooltip({ gossipId, type }) {
  const [users, setUsers] = useState(null)

  useEffect(() => {
    let cancelled = false
    api.getReactions(gossipId).then(data => {
      if (!cancelled) setUsers(data[type] || [])
    }).catch(() => {})
    return () => { cancelled = true }
  }, [gossipId, type])

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: 6,
        padding: '8px 12px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        fontSize: 12,
        color: 'var(--text-primary)',
        whiteSpace: 'nowrap',
        zIndex: 50,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        minWidth: 80,
        textAlign: 'center',
      }}
    >
      {users === null ? (
        <span style={{ color: 'var(--text-muted)' }}>Loading...</span>
      ) : users.length === 0 ? (
        <span style={{ color: 'var(--text-muted)' }}>None</span>
      ) : (
        users.map((name, i) => (
          <div key={i} style={{ padding: '1px 0', fontWeight: 500 }}>{name}</div>
        ))
      )}
    </div>
  )
}

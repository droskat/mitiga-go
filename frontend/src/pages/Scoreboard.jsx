import { useState, useEffect } from 'react'
import { api } from '../hooks/useApi'
import { Trophy, TrendingUp, MessageCircle, Heart, FileText, Loader } from 'lucide-react'

const medals = ['#FFD700', '#C0C0C0', '#CD7F32']

export default function Scoreboard() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getScoreboard()
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Trophy size={24} color="var(--accent)" />
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>Scoreboard</h2>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
        Top contributors ranked by engagement (Posts x5 + Likes x3 + Comments x2)
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : entries.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60,
          background: 'var(--bg-card)', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
        }}>
          <Trophy size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No scores yet</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Start posting to climb the ranks!</p>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}>
          {/* Desktop header */}
          <div className="scoreboard-header" style={{
            borderBottom: '1px solid var(--border)',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            <span>Rank</span>
            <span>User</span>
            <span style={{ textAlign: 'center' }}>Posts</span>
            <span style={{ textAlign: 'center' }}>Likes</span>
            <span style={{ textAlign: 'center' }}>Comments</span>
            <span style={{ textAlign: 'right' }}>Score</span>
          </div>

          {entries.map((entry, idx) => (
            <div
              key={entry.user_id}
              className="scoreboard-row"
              style={{
                borderBottom: idx < entries.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* Rank */}
              <span className="sb-rank" style={{
                fontWeight: 800,
                fontSize: idx < 3 ? 18 : 14,
                color: idx < 3 ? medals[idx] : 'var(--text-muted)',
              }}>
                {idx < 3 ? ['🥇','🥈','🥉'][idx] : `#${idx + 1}`}
              </span>

              {/* User */}
              <div className="sb-user" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32,
                  borderRadius: '50%',
                  background: idx < 3
                    ? `linear-gradient(135deg, ${medals[idx]}33, ${medals[idx]}66)`
                    : 'var(--accent-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                  color: idx < 3 ? medals[idx] : 'var(--accent)',
                  border: idx < 3 ? `2px solid ${medals[idx]}44` : 'none',
                  flexShrink: 0,
                }}>
                  {entry.username[0].toUpperCase()}
                </div>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{entry.username}</span>
              </div>

              {/* Desktop stat columns */}
              <div className="sb-posts" style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: 13 }}>
                <FileText size={13} />
                {entry.posts}
              </div>
              <div className="sb-likes" style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: 13 }}>
                <Heart size={13} />
                {entry.likes}
              </div>
              <div className="sb-comments" style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--text-secondary)', fontSize: 13 }}>
                <MessageCircle size={13} />
                {entry.comments}
              </div>

              {/* Mobile-only inline stats */}
              <div className="sb-stats">
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-muted)', fontSize: 11 }}>
                  <FileText size={11} /> {entry.posts} <span className="scoreboard-stat-label">posts</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-muted)', fontSize: 11 }}>
                  <Heart size={11} /> {entry.likes} <span className="scoreboard-stat-label">likes</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-muted)', fontSize: 11 }}>
                  <MessageCircle size={11} /> {entry.comments} <span className="scoreboard-stat-label">comments</span>
                </span>
              </div>

              {/* Score */}
              <div className="sb-score" style={{
                textAlign: 'right',
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4,
                fontWeight: 800,
                fontSize: idx < 3 ? 18 : 15,
                color: idx < 3 ? medals[idx] : 'var(--accent)',
              }}>
                <TrendingUp size={14} />
                {entry.score}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

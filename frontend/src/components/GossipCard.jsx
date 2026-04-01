import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, HeartCrack, MessageCircle, TrendingUp } from 'lucide-react'
import TagBadge from './TagBadge'
import ReactionTooltip from './ReactionTooltip'
import { api } from '../hooks/useApi'

export default function GossipCard({ gossip, nicknameMap, onUpdate }) {
  const navigate = useNavigate()
  const [likeHover, setLikeHover] = useState(false)
  const [dislikeHover, setDislikeHover] = useState(false)

  function resolveNicknames(text) {
    if (!nicknameMap || !text) return text
    let result = text
    for (const [nick, real] of Object.entries(nicknameMap)) {
      result = result.replaceAll(nick, real)
    }
    return result
  }

  const handleLike = async (e) => {
    e.stopPropagation()
    try {
      await api.toggleLike(gossip.id)
      onUpdate?.()
    } catch {}
  }

  const handleDislike = async (e) => {
    e.stopPropagation()
    try {
      await api.toggleDislike(gossip.id)
      onUpdate?.()
    } catch {}
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
    <div
      onClick={() => navigate(`/gossip/${gossip.id}`)}
      style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        padding: 20,
        cursor: 'pointer',
        border: '1px solid var(--border)',
        transition: 'all 0.15s ease',
        marginBottom: 12,
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28,
            borderRadius: '50%',
            background: 'var(--accent-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: 'var(--accent)',
          }}>
            {gossip.author_name?.[0]?.toUpperCase()}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{gossip.author_name}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(gossip.created_at)}</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '2px 8px', borderRadius: 12,
          background: 'var(--accent-soft)',
          fontSize: 11, fontWeight: 700, color: 'var(--accent)',
        }}>
          <TrendingUp size={12} />
          {gossip.score}
        </div>
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, lineHeight: 1.4 }}>
        {resolveNicknames(gossip.title)}
      </h3>
      <p style={{
        fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6,
        marginBottom: 12,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {resolveNicknames(gossip.content)}
      </p>

      <div className="gossip-card-footer">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {gossip.tags?.map(tag => (
            <TagBadge key={tag.id} name={tag.name} />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setLikeHover(true)}
            onMouseLeave={() => setLikeHover(false)}
          >
            <button
              onClick={handleLike}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'none', fontSize: 13,
                color: gossip.liked_by_me ? '#ef4444' : 'var(--text-muted)',
                fontWeight: gossip.liked_by_me ? 600 : 400,
              }}
            >
              <Heart size={15} fill={gossip.liked_by_me ? '#ef4444' : 'none'} />
              {gossip.like_count}
            </button>
            {likeHover && gossip.like_count > 0 && (
              <ReactionTooltip gossipId={gossip.id} type="liked_by" />
            )}
          </div>

          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setDislikeHover(true)}
            onMouseLeave={() => setDislikeHover(false)}
          >
            <button
              onClick={handleDislike}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'none', fontSize: 13,
                color: gossip.disliked_by_me ? '#3b82f6' : 'var(--text-muted)',
                fontWeight: gossip.disliked_by_me ? 600 : 400,
              }}
            >
              <HeartCrack size={15} color={gossip.disliked_by_me ? '#3b82f6' : 'var(--text-muted)'} />
              {gossip.dislike_count}
            </button>
            {dislikeHover && gossip.dislike_count > 0 && (
              <ReactionTooltip gossipId={gossip.id} type="disliked_by" />
            )}
          </div>

          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--text-muted)' }}>
            <MessageCircle size={15} />
            {gossip.comment_count}
          </span>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../hooks/useApi'
import TagBadge from '../components/TagBadge'
import ReactionTooltip from '../components/ReactionTooltip'
import { Heart, HeartCrack, MessageCircle, TrendingUp, ArrowLeft, Send, Loader } from 'lucide-react'

export default function GossipDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [gossip, setGossip] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [nicknameMap, setNicknameMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [commenting, setCommenting] = useState(false)
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

  const fetchData = async () => {
    try {
      const [g, c, n] = await Promise.all([
        api.getGossip(id),
        api.getComments(id),
        api.getNicknameMap(),
      ])
      setGossip(g)
      setComments(c)
      setNicknameMap(n)
    } catch {
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const handleLike = async () => {
    await api.toggleLike(id)
    fetchData()
  }

  const handleDislike = async () => {
    await api.toggleDislike(id)
    fetchData()
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return
    setCommenting(true)
    try {
      await api.createComment(id, { content: newComment })
      setNewComment('')
      fetchData()
    } finally {
      setCommenting(false)
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

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
      <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  )

  if (!gossip) return null

  return (
    <div>
      <button
        onClick={() => navigate('/')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', color: 'var(--text-secondary)',
          fontSize: 13, fontWeight: 500, marginBottom: 20,
        }}
      >
        <ArrowLeft size={16} /> Back to feed
      </button>

      <div className="gossip-detail-card" style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        marginBottom: 24,
      }}>
        <div className="gossip-detail-meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36,
              borderRadius: '50%',
              background: 'var(--accent-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700, color: 'var(--accent)',
              flexShrink: 0,
            }}>
              {gossip.author_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{gossip.author_name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(gossip.created_at)}</div>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 12,
            background: 'var(--accent-soft)',
            fontSize: 14, fontWeight: 700, color: 'var(--accent)',
            flexShrink: 0,
          }}>
            <TrendingUp size={16} />
            Score: {gossip.score}
          </div>
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, lineHeight: 1.3, wordBreak: 'break-word' }}>
          {resolveNicknames(gossip.title)}
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {resolveNicknames(gossip.content)}
        </p>

        <div className="gossip-detail-actions">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {gossip.tags?.map(tag => <TagBadge key={tag.id} name={tag.name} size="md" />)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => setLikeHover(true)}
              onMouseLeave={() => setLikeHover(false)}
            >
              <button
                onClick={handleLike}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: gossip.liked_by_me ? 'rgba(239,68,68,0.1)' : 'var(--bg-hover)',
                  color: gossip.liked_by_me ? '#ef4444' : 'var(--text-secondary)',
                  padding: '8px 16px', borderRadius: 20,
                  fontSize: 13, fontWeight: 600,
                }}
              >
                <Heart size={16} fill={gossip.liked_by_me ? '#ef4444' : 'none'} />
                {gossip.like_count} {gossip.like_count === 1 ? 'Like' : 'Likes'}
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
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: gossip.disliked_by_me ? 'rgba(59,130,246,0.1)' : 'var(--bg-hover)',
                  color: gossip.disliked_by_me ? '#3b82f6' : 'var(--text-secondary)',
                  padding: '8px 16px', borderRadius: 20,
                  fontSize: 13, fontWeight: 600,
                }}
              >
                <HeartCrack size={16} color={gossip.disliked_by_me ? '#3b82f6' : 'var(--text-secondary)'} />
                {gossip.dislike_count} {gossip.dislike_count === 1 ? 'Dislike' : 'Dislikes'}
              </button>
              {dislikeHover && gossip.dislike_count > 0 && (
                <ReactionTooltip gossipId={gossip.id} type="disliked_by" />
              )}
            </div>

            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' }}>
              <MessageCircle size={16} />
              {gossip.comment_count} {gossip.comment_count === 1 ? 'Comment' : 'Comments'}
            </span>
          </div>
        </div>
      </div>

      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Comments</h3>
        </div>

        <form onSubmit={handleComment} className="comment-form" style={{
          borderBottom: '1px solid var(--border)',
        }}>
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add a comment..."
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
            disabled={commenting || !newComment.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 18px',
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13, fontWeight: 600,
              opacity: commenting || !newComment.trim() ? 0.5 : 1,
              flexShrink: 0,
            }}
          >
            <Send size={14} />
            Post
          </button>
        </form>

        {comments.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No comments yet. Be the first!
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{
                  width: 24, height: 24,
                  borderRadius: '50%',
                  background: 'var(--accent-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: 'var(--accent)',
                  flexShrink: 0,
                }}>
                  {comment.author_name?.[0]?.toUpperCase()}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{comment.author_name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(comment.created_at)}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, paddingLeft: 32, wordBreak: 'break-word' }}>
                {resolveNicknames(comment.content)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { api } from '../hooks/useApi'
import GossipCard from '../components/GossipCard'
import TagBadge from '../components/TagBadge'
import { Flame, Loader } from 'lucide-react'

export default function Feed() {
  const [gossips, setGossips] = useState([])
  const [tags, setTags] = useState([])
  const [activeTag, setActiveTag] = useState('')
  const [nicknameMap, setNicknameMap] = useState({})
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [g, t, n] = await Promise.all([
        api.getGossips(activeTag),
        api.getTags(),
        api.getNicknameMap(),
      ])
      setGossips(g)
      setTags(t)
      setNicknameMap(n)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    fetchData()
  }, [activeTag])

  const handleTagClick = (tagName) => {
    setActiveTag(prev => prev === tagName ? '' : tagName)
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Flame size={24} color="var(--accent)" />
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>The Grapevine</h2>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Latest gossips, rumours, and news from around the office
        </p>
      </div>

      <div style={{
        display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap',
        padding: '12px 16px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', alignSelf: 'center', marginRight: 4 }}>
          Filter:
        </span>
        {tags.map(tag => (
          <TagBadge
            key={tag.id}
            name={tag.name}
            active={activeTag === tag.name}
            onClick={() => handleTagClick(tag.name)}
            size="md"
          />
        ))}
        {activeTag && (
          <button
            onClick={() => setActiveTag('')}
            style={{
              background: 'var(--bg-hover)',
              color: 'var(--text-secondary)',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : gossips.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 60,
          background: 'var(--bg-card)', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
        }}>
          <Flame size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>No gossips yet</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Be the first to share something juicy!</p>
        </div>
      ) : (
        gossips.map(g => (
          <GossipCard key={g.id} gossip={g} nicknameMap={nicknameMap} onUpdate={fetchData} />
        ))
      )}
    </div>
  )
}

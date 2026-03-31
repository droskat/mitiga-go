import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../hooks/useApi'
import TagBadge from '../components/TagBadge'
import { PenLine, X, Plus } from 'lucide-react'

export default function CreateGossip() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [availableTags, setAvailableTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [customTag, setCustomTag] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.getTags().then(setAvailableTags).catch(() => {})
  }, [])

  const toggleTag = (tagName) => {
    setSelectedTags(prev =>
      prev.includes(tagName) ? prev.filter(t => t !== tagName) : [...prev, tagName]
    )
  }

  const addCustomTag = () => {
    const tag = customTag.trim().toLowerCase()
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag])
      if (!availableTags.find(t => t.name === tag)) {
        setAvailableTags(prev => [...prev, { id: Date.now(), name: tag }])
      }
    }
    setCustomTag('')
  }

  const handleCustomTagKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomTag()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (selectedTags.length === 0) {
      setError('Please select at least one tag')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.createGossip({ title, content, tags: selectedTags })
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <PenLine size={24} color="var(--accent)" />
        <h2 style={{ fontSize: 22, fontWeight: 800 }}>Spill the Tea</h2>
      </div>

      <div className="gossip-detail-card" style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
      }}>
        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--danger)',
            fontSize: 13,
            marginBottom: 20,
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              maxLength={200}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: 15,
                fontWeight: 600,
              }}
              placeholder="Give it a catchy title..."
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
              The Gossip
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              required
              rows={6}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: 14,
                resize: 'vertical',
                lineHeight: 1.6,
              }}
              placeholder="Spill the details... Use nicknames to keep it anonymous in the database!"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text-secondary)' }}>
              Tags (select one or more)
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {availableTags.map(tag => (
                <TagBadge
                  key={tag.id}
                  name={tag.name}
                  active={selectedTags.includes(tag.name)}
                  onClick={() => toggleTag(tag.name)}
                  size="md"
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                type="text"
                value={customTag}
                onChange={e => setCustomTag(e.target.value)}
                onKeyDown={handleCustomTagKey}
                style={{
                  flex: 1,
                  minWidth: 0,
                  padding: '8px 14px',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                }}
                placeholder="Create a custom tag..."
              />
              <button
                type="button"
                onClick={addCustomTag}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '8px 14px',
                  background: 'var(--bg-hover)',
                  color: 'var(--text-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13, fontWeight: 500,
                }}
              >
                <Plus size={14} /> Add
              </button>
            </div>

            {selectedTags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>Selected:</span>
                {selectedTags.map(tag => (
                  <span key={tag} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 10px', borderRadius: 12,
                    background: 'var(--accent-soft)', color: 'var(--accent)',
                    fontSize: 12, fontWeight: 600,
                  }}>
                    {tag}
                    <X
                      size={12}
                      style={{ cursor: 'pointer' }}
                      onClick={() => toggleTag(tag)}
                    />
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 28px',
                background: loading ? 'var(--bg-hover)' : 'var(--accent)',
                color: '#fff',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              {loading ? 'Publishing...' : 'Publish Gossip'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{
                padding: '12px 28px',
                background: 'var(--bg-hover)',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 500,
                fontSize: 14,
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

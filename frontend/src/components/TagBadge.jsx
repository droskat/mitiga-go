const tagColors = {
  rumour: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
  gossip: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  news: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
  fun: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' },
  exit: { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af' },
}

const defaultColor = { bg: 'rgba(139,92,246,0.15)', text: '#8b5cf6' }

export default function TagBadge({ name, onClick, active, size = 'sm' }) {
  const colors = tagColors[name.toLowerCase()] || defaultColor
  const isSmall = size === 'sm'

  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: isSmall ? '2px 10px' : '4px 14px',
        borderRadius: 20,
        fontSize: isSmall ? 11 : 13,
        fontWeight: 600,
        background: active ? colors.text : colors.bg,
        color: active ? '#fff' : colors.text,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        textTransform: 'lowercase',
        letterSpacing: '0.3px',
      }}
    >
      {name}
    </span>
  )
}

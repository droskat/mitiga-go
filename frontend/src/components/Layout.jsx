import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Flame, PenLine, Trophy, Users, UserCheck, LogOut } from 'lucide-react'

const navItems = [
  { to: '/', icon: Flame, label: 'Feed' },
  { to: '/create', icon: PenLine, label: 'New Gossip' },
  { to: '/scoreboard', icon: Trophy, label: 'Scoreboard' },
  { to: '/nicknames', icon: Users, label: 'Nicknames' },
  { to: '/approvals', icon: UserCheck, label: 'Approvals' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      {/* Desktop / Tablet sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1 style={{
            fontSize: 20,
            fontWeight: 800,
            background: 'linear-gradient(135deg, var(--accent), #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px',
          }}>
            Mitiga Go
          </h1>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Office Grapevine
          </p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-soft)' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: 14,
                marginBottom: 4,
                transition: 'all 0.15s ease',
                textDecoration: 'none',
              })}
            >
              <Icon size={18} />
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div className="user-info">
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.username}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Online</div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                color: 'var(--text-muted)',
                padding: 6,
                borderRadius: 6,
              }}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            fontSize: 10,
            color: 'var(--text-muted)',
            background: 'none',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </nav>

      {/* Mobile header */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 15 }} className="mobile-header-wrapper">
        <div className="mobile-header" style={{
          padding: '12px 16px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
        }}>
          <h1 style={{
            fontSize: 18,
            fontWeight: 800,
            background: 'linear-gradient(135deg, var(--accent), #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Mitiga Go
          </h1>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
            {user?.username}
          </span>
        </div>
      </div>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

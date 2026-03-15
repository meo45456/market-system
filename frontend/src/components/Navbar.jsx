import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (p) => location.pathname === p

  const links = user?.user_role === 'renter'
    ? [
        { to: '/home',        icon: '🗺️', label: 'แผงผัง' },
        { to: '/my-bookings', icon: '📋', label: 'การจองของฉัน' },
        { to: '/profile',     icon: '👤', label: 'โปรไฟล์' },
      ]
    : [{ to: '/staff', icon: '📊', label: 'Dashboard' }]

  return (
    <nav style={{ background: '#fff', borderBottom: '1px solid #d4eadb', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 8px rgba(26,92,53,0.06)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', height: 58, gap: 12 }}>

        {/* Logo → LandingPage */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#2dba6a,#1a7a45)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>🌾</div>
          <span className="hide-mobile" style={{ fontFamily: "'Prompt',sans-serif", fontSize: 15, fontWeight: 700, color: '#1a3a28' }}>ตลาดเกษตร มอ.</span>
        </Link>

        {/* Desktop links */}
        <div className="hide-mobile" style={{ display: 'flex', gap: 2, flex: 1 }}>
          {links.map(l => (
            <Link key={l.to} to={l.to} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 10, textDecoration: 'none',
              fontSize: 14, fontWeight: 500,
              color: isActive(l.to) ? '#15803d' : '#6b8f78',
              background: isActive(l.to) ? '#f0fdf4' : 'transparent',
              transition: 'all 0.18s',
            }}
              onMouseEnter={e => { if (!isActive(l.to)) { e.currentTarget.style.background = '#f7fbf8'; e.currentTarget.style.color = '#1a3a28' } }}
              onMouseLeave={e => { if (!isActive(l.to)) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b8f78' } }}
            >
              <span style={{ fontSize: 15 }}>{l.icon}</span>{l.label}
            </Link>
          ))}
        </div>

        <div className="hide-desktop" style={{ flex: 1 }} />

        {/* User badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 20, padding: '5px 12px 5px 7px', flexShrink: 0 }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#dcfce7', border: '1px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
            {user?.user_role === 'staff' ? '🧑‍💼' : '🛒'}
          </div>
          <span className="hide-mobile" style={{ color: '#15803d', fontSize: 13, fontWeight: 600 }}>{user?.user_name}</span>
        </div>

        {/* Logout desktop */}
        <button className="hide-mobile" onClick={handleLogout} style={{
          background: '#fff', border: '1.5px solid #d4eadb', color: '#6b8f78',
          borderRadius: 10, padding: '7px 14px', fontSize: 13, cursor: 'pointer',
          fontWeight: 500, flexShrink: 0, fontFamily: "'Sarabun',sans-serif", transition: 'all 0.18s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fff5f6'; e.currentTarget.style.borderColor = '#fda4af'; e.currentTarget.style.color = '#e11d48' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#d4eadb'; e.currentTarget.style.color = '#6b8f78' }}
        >ออกจากระบบ</button>

        {/* Hamburger mobile */}
        <button className="hide-desktop" onClick={() => setOpen(!open)} style={{
          background: open ? '#f0fdf4' : 'transparent',
          border: `1px solid ${open ? '#86efac' : 'transparent'}`,
          color: '#4a7a5e', borderRadius: 8, width: 36, height: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: 18, flexShrink: 0,
        }}>
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{ borderTop: '1px solid #d4eadb', padding: '8px 20px 14px', background: '#fafff8' }}>
          {links.map(l => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 14px', borderRadius: 10, textDecoration: 'none',
              fontSize: 15, fontWeight: 500, marginBottom: 2,
              color: isActive(l.to) ? '#15803d' : '#6b8f78',
              background: isActive(l.to) ? '#f0fdf4' : 'transparent',
            }}>
              <span>{l.icon}</span>{l.label}
            </Link>
          ))}
          <button onClick={handleLogout} style={{
            width: '100%', marginTop: 8, background: '#fff5f6',
            border: '1px solid #fda4af', color: '#e11d48',
            borderRadius: 10, padding: 10, fontSize: 14,
            cursor: 'pointer', fontWeight: 600, fontFamily: "'Sarabun',sans-serif",
          }}>ออกจากระบบ</button>
        </div>
      )}
    </nav>
  )
}
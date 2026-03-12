import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const C = {
  bg: 'linear-gradient(135deg, #0a3d20 0%, #0f4c2a 50%, #155c35 100%)',
  text: '#ffffff',
  muted: 'rgba(255,255,255,0.7)',
  hover: 'rgba(255,255,255,0.12)',
  active: 'rgba(255,255,255,0.2)',
  border: 'rgba(255,255,255,0.15)',
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }
  const isActive = (p) => location.pathname === p

  const links = user?.user_role === 'renter'
    ? [
        { to: '/',             icon: '🗺️',  label: 'แผงผัง' },
        { to: '/my-bookings',  icon: '📋',  label: 'การจองของฉัน' },
        { to: '/profile',      icon: '👤',  label: 'โปรไฟล์' },
      ]
    : [{ to: '/staff', icon: '📊', label: 'Dashboard' }]

  return (
    <>
      <nav style={{
        background: C.bg,
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 20px rgba(0,0,0,0.2)',
      }}>
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          padding: '0 16px',
          display: 'flex', alignItems: 'center',
          height: '58px', gap: '12px',
        }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', border: `1px solid ${C.border}`,
            }}>🌾</div>
            <span style={{
              fontFamily: "'Prompt', sans-serif",
              fontSize: '15px', fontWeight: '700',
              color: C.text, whiteSpace: 'nowrap',
            }}>ตลาดเกษตร มอ.</span>
          </Link>

          {/* Desktop links */}
          <div className="hide-mobile" style={{ display: 'flex', gap: '2px', flex: 1 }}>
            {links.map(l => (
              <Link key={l.to} to={l.to} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '10px',
                textDecoration: 'none', fontSize: '14px', fontWeight: '500',
                color: isActive(l.to) ? C.text : C.muted,
                background: isActive(l.to) ? C.active : 'transparent',
                transition: 'all 0.18s',
              }}
              onMouseEnter={e => { if (!isActive(l.to)) e.currentTarget.style.background = C.hover; e.currentTarget.style.color = C.text }}
              onMouseLeave={e => { if (!isActive(l.to)) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted }}}
              >
                <span style={{ fontSize: '15px' }}>{l.icon}</span>
                {l.label}
              </Link>
            ))}
          </div>

          {/* Spacer for mobile */}
          <div className="hide-desktop" style={{ flex: 1 }} />

          {/* User badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            background: 'rgba(255,255,255,0.12)',
            border: `1px solid ${C.border}`,
            borderRadius: '20px', padding: '5px 12px 5px 7px',
            flexShrink: 0,
          }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px',
            }}>
              {user?.user_role === 'staff' ? '🧑‍💼' : '🛒'}
            </div>
            <span className="hide-mobile" style={{ color: C.text, fontSize: '13px', fontWeight: '500' }}>
              {user?.user_name}
            </span>
          </div>

          {/* Logout - desktop */}
          <button className="hide-mobile" onClick={handleLogout} style={{
            background: 'rgba(255,255,255,0.1)',
            border: `1px solid ${C.border}`,
            color: C.text, borderRadius: '10px',
            padding: '7px 14px', fontSize: '13px',
            cursor: 'pointer', fontWeight: '500', flexShrink: 0,
            transition: 'background 0.18s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            ออกจากระบบ
          </button>

          {/* Hamburger */}
          <button className="hide-desktop" onClick={() => setOpen(!open)} style={{
            background: open ? C.active : 'transparent',
            border: `1px solid ${open ? 'rgba(255,255,255,0.3)' : 'transparent'}`,
            color: C.text, borderRadius: '8px',
            width: '36px', height: '36px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '18px', flexShrink: 0,
            transition: 'all 0.18s',
          }}>
            {open ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="slide-down" style={{
            borderTop: `1px solid ${C.border}`,
            padding: '8px 16px 12px',
            background: 'rgba(0,0,0,0.1)',
          }}>
            {links.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '11px 14px', borderRadius: '10px',
                textDecoration: 'none', fontSize: '15px', fontWeight: '500',
                color: isActive(l.to) ? C.text : C.muted,
                background: isActive(l.to) ? C.active : 'transparent',
                marginBottom: '2px',
              }}>
                <span>{l.icon}</span>{l.label}
              </Link>
            ))}
            <button onClick={handleLogout} style={{
              width: '100%', marginTop: '8px',
              background: 'rgba(255,255,255,0.1)',
              border: `1px solid ${C.border}`,
              color: C.text, borderRadius: '10px',
              padding: '10px', fontSize: '14px',
              cursor: 'pointer', fontWeight: '500',
            }}>
              ออกจากระบบ
            </button>
          </div>
        )}
      </nav>
    </>
  )
}
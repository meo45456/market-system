import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import Swal from 'sweetalert2'

export default function LoginPage() {
  const [form, setForm] = useState({ user_name: '', user_password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.user_name.trim() || !form.user_password.trim()) {
      Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน', confirmButtonColor: '#10b981' })
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      await Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 })
        .fire({ icon: 'success', title: `ยินดีต้อนรับ ${res.data.user.user_name} ครับ` })
      login(res.data.user, res.data.token)
      navigate(res.data.user.user_role === 'staff' ? '/staff' : '/home')
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'เข้าสู่ระบบไม่สำเร็จ', text: err.response?.data?.message || 'ตรวจสอบ username และ password อีกครั้ง', confirmButtonColor: '#10b981' })
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafb', display: 'flex', fontFamily: "'Sarabun', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&family=Prompt:wght@700;800;900&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .inp-field { transition: all 0.2s !important; }
        .inp-field:focus { border-color: #10b981 !important; background: #fff !important; box-shadow: 0 0 0 3px rgba(16,185,129,0.12) !important; outline: none !important; }
        .login-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(16,185,129,0.45) !important; }
        .login-btn:active:not(:disabled) { transform: scale(0.98); }
        .demo-chip:hover { background: #ecfdf5 !important; }
      `}</style>

      {/* Left Panel — decoration (hidden on mobile) */}
      <div style={{ flex: 1, background: 'linear-gradient(160deg,#064e3b 0%,#065f46 40%,#059669 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, position: 'relative', overflow: 'hidden' }} className="hide-mobile">
        <style>{`@media(max-width:768px){.hide-mobile{display:none!important}}`}</style>
        {/* Blobs */}
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', top: -100, right: -100 }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -80, left: -60 }} />
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', top: '30%', left: '10%' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', animation: 'fadeUp 0.6s ease' }}>
          <div style={{ fontSize: 80, marginBottom: 24, animation: 'float 3s ease-in-out infinite' }}>🌾</div>
          <h1 style={{ fontFamily: "'Prompt',sans-serif", fontSize: 32, fontWeight: 900, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.5px' }}>ตลาดเกษตร มอ.</h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1.7, maxWidth: 280 }}>ระบบจองแผงตลาดออนไลน์<br />สะดวก รวดเร็ว ทุกที่ทุกเวลา</p>

          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[{ icon: '📅', text: 'จองแผงได้ทุกวัน' }, { icon: '✅', text: 'ยืนยันผลภายใน 24 ชม.' }, { icon: '🔒', text: 'ระบบล็อกแผงชั่วคราวอัตโนมัติ' }].map(f => (
              <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 16px', backdropFilter: 'blur(8px)' }}>
                <span style={{ fontSize: 18 }}>{f.icon}</span>
                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 600 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — form */}
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 380, animation: 'fadeUp 0.5s ease' }}>

          {/* Mobile Logo */}
          <div style={{ textAlign: 'center', marginBottom: 28 }} className="show-mobile">
            <style>{`@media(min-width:769px){.show-mobile{display:none!important}}`}</style>
            <div style={{ width: 60, height: 60, margin: '0 auto 12px', background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: '0 6px 20px rgba(16,185,129,0.35)' }}>🌾</div>
            <h1 style={{ fontFamily: "'Prompt',sans-serif", fontSize: 22, fontWeight: 900, color: '#064e3b', margin: 0 }}>ตลาดเกษตร มอ.</h1>
          </div>

          <h2 style={{ fontFamily: "'Prompt',sans-serif", fontSize: 24, fontWeight: 900, color: '#111827', marginBottom: 6 }}>เข้าสู่ระบบ</h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 28 }}>ยินดีต้อนรับกลับมา 👋</p>

          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 7 }}>ชื่อผู้ใช้</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>👤</span>
                <input className="inp-field" type="text" placeholder="Username" value={form.user_name}
                  autoCorrect="off" autoCapitalize="none" autoComplete="username" spellCheck={false}
                  onChange={e => setForm({ ...form, user_name: e.target.value })}
                  style={{ width: '100%', background: '#f9fafb', border: '2px solid #e5e7eb', borderRadius: 12, padding: '13px 16px 13px 42px', fontSize: 15, color: '#111827', fontFamily: "'Sarabun',sans-serif", boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 7 }}>รหัสผ่าน</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>🔑</span>
                <input className="inp-field" type={showPass ? 'text' : 'password'} placeholder="Password" value={form.user_password}
                  onChange={e => setForm({ ...form, user_password: e.target.value })}
                  style={{ width: '100%', background: '#f9fafb', border: '2px solid #e5e7eb', borderRadius: 12, padding: '13px 44px 13px 42px', fontSize: 15, color: '#111827', fontFamily: "'Sarabun',sans-serif", boxSizing: 'border-box' }}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 0 }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="login-btn"
              style={{ width: '100%', background: loading ? '#d1d5db' : 'linear-gradient(135deg,#10b981,#059669)', color: loading ? '#9ca3af' : '#fff', border: 'none', borderRadius: 14, padding: '15px 0', fontSize: 16, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 6px 20px rgba(16,185,129,0.35)', fontFamily: "'Prompt',sans-serif", transition: 'all 0.2s', letterSpacing: '0.2px' }}>
              {loading ? '⏳ กำลังตรวจสอบ...' : 'เข้าสู่ระบบ →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#6b7280', marginTop: 20 }}>
            ยังไม่มีบัญชี?{' '}
            <Link to="/register" style={{ color: '#10b981', fontWeight: 700, textDecoration: 'none' }}>สมัครสมาชิก</Link>
          </p>

          {/* Demo accounts */}
          <div style={{ marginTop: 28, background: '#f0fdf4', border: '1.5px solid #a7f3d0', borderRadius: 16, padding: '14px 18px' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#059669', marginBottom: 10 }}>🧪 บัญชีทดสอบ</p>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'nowrap' }}>
              {[{ role: 'เจ้าหน้าที่', name: 'admin_staff', icon: '🏢' }, { role: 'ผู้เช่า', name: 'somchai_66', icon: '🛒' }, { role: 'ผู้เช่า', name: 'meozaza123', icon: '🐱' }].map(a => (
                <button key={a.name} className="demo-chip"
                  onClick={() => setForm({ user_name: a.name, user_password: a.name === 'meozaza123' ? '1234' : 'password' })}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #a7f3d0', borderRadius: 10, padding: '6px 10px', cursor: 'pointer', transition: 'all 0.15s', fontFamily: "'Sarabun',sans-serif", flex: 1, minWidth: 0 }}>
                  <span>{a.icon}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 10, color: '#059669', fontWeight: 700 }}>{a.role}</div>
                    <div style={{ fontSize: 12, color: '#111827', fontWeight: 600 }}>{a.name}</div>
                  </div>
                </button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#6b7280', marginTop: 8, marginBottom: 0 }}>กดที่บัญชีเพื่อกรอกอัตโนมัติ</p>
          </div>
        </div>
      </div>
    </div>
  )
}
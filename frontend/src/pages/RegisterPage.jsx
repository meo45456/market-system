import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import Swal from 'sweetalert2' // 1. นำเข้า SweetAlert2

const ZONES = ['โซนอาหาร', 'โซนผลไม้', 'โซนเสื้อผ้า', 'โซนของแห้ง']

const Field = ({ label, children }) => (
  <div style={{ marginBottom: '14px' }}>
    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4a6358', marginBottom: '6px' }}>
      {label}
    </label>
    {children}
  </div>
)

export default function RegisterPage() {
  const [form, setForm] = useState({
    user_name: '', user_password: '', user_role: 'renter',
    renter_shopname: '', renter_zone: '', renter_citizenid: '', renter_tel: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // ตรวจสอบข้อมูลก่อนส่ง
    if (!form.user_name || !form.user_password) {
        setError('กรุณากรอกข้อมูลบัญชีให้ครบถ้วน');
        return;
    }
    if (!form.renter_zone) { 
        setError('กรุณาเลือกโซนประเภทร้านค้า'); 
        return; 
    }

    setLoading(true); 
    setError('')

    try {
      await api.post('/auth/register', form)
      
      // 2. ใช้ SweetAlert2 เมื่อสมัครสำเร็จ
      Swal.fire({
        icon: 'success',
        title: 'ลงทะเบียนสำเร็จ!',
        text: 'ยินดีต้อนรับสู่ตลาดเกษตร มอ. กรุณาเข้าสู่ระบบ',
        confirmButtonColor: '#0f4c2a',
        confirmButtonText: 'เข้าสู่ระบบเลย',
        borderRadius: '20px',
      }).then(() => {
        navigate('/login')
      })

    } catch (err) {
      const msg = err.response?.data?.message || 'เกิดข้อผิดพลาดในการลงทะเบียน'
      setError(msg)
      
      // 3. ใช้ SweetAlert2 แจ้งเตือน Error (Optional)
      Swal.fire({
        icon: 'error',
        title: 'สมัครไม่สำเร็จ',
        text: msg,
        confirmButtonColor: '#dc2626',
      })
    } finally { 
      setLoading(false) 
    }
  }

  // --- ส่วนของ Style และ JSX คงเดิมไว้ตามที่คุณออกแบบ ---
  const inp = {
    width: '100%', border: '1.5px solid #d1e3d8', borderRadius: '12px',
    padding: '12px 14px', fontSize: '14px', outline: 'none',
    background: '#f9fbfa', color: '#1a2e23', transition: 'all 0.2s',
  }

  const focusStyle = (e) => {
    e.target.style.borderColor = '#1a7a45'
    e.target.style.background = '#fff'
    e.target.style.boxShadow = '0 0 0 3px rgba(26,122,69,0.1)'
  }

  const blurStyle  = (e) => {
    e.target.style.borderColor = '#d1e3d8'
    e.target.style.background = '#f9fbfa'
    e.target.style.boxShadow = 'none'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0a3d20 0%, #0f4c2a 40%, #1a7a45 100%)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '24px 16px', fontFamily: "'Sarabun', sans-serif",
    }}>
      <div className="fade-in" style={{ width: '100%', maxWidth: '440px' }}>

        {/* Logo Section */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px', height: '64px', margin: '0 auto 14px',
            background: 'rgba(255,255,255,0.15)', borderRadius: '18px',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px',
          }}>🌾</div>
          <h1 style={{ fontFamily: "'Prompt',sans-serif", fontSize: '22px', fontWeight: '700', color: '#fff', margin: '0 0 4px' }}>
            สมัครสมาชิก
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
            ตลาดเกษตร มอ.
          </p>
        </div>

        {/* Card Section */}
        <div style={{ background: '#fff', borderRadius: '24px', padding: '28px 24px', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>

          {/* Section 1: ข้อมูลบัญชี */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid #e8f0ec' }}>
              <span style={{ background: '#0f4c2a', color: '#fff', borderRadius: '8px', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' }}>1</span>
              <span style={{ fontFamily: "'Prompt',sans-serif", fontWeight: '600', color: '#0f4c2a', fontSize: '14px' }}>ข้อมูลบัญชี</span>
            </div>

            <Field label="ชื่อผู้ใช้ (Username) *">
              <input
                type="text" style={inp} placeholder="เช่น somchai_66"
                value={form.user_name}
                onChange={e => setForm(prev => ({ ...prev, user_name: e.target.value }))}
                onFocus={focusStyle} onBlur={blurStyle} required
              />
            </Field>

            <Field label="รหัสผ่าน *">
              <input
                type="password" style={inp} placeholder="อย่างน้อย 6 ตัวอักษร"
                value={form.user_password}
                onChange={e => setForm(prev => ({ ...prev, user_password: e.target.value }))}
                onFocus={focusStyle} onBlur={blurStyle} required
              />
            </Field>
          </div>

          {/* Section 2: ข้อมูลร้านค้า */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '10px', borderBottom: '1px solid #e8f0ec' }}>
              <span style={{ background: '#1a7a45', color: '#fff', borderRadius: '8px', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' }}>2</span>
              <span style={{ fontFamily: "'Prompt',sans-serif", fontWeight: '600', color: '#0f4c2a', fontSize: '14px' }}>ข้อมูลร้านค้า</span>
            </div>

            <Field label="ชื่อร้านค้า">
              <input
                type="text" style={inp} placeholder="เช่น ร้านข้าวแกงสมชาย"
                value={form.renter_shopname}
                onChange={e => setForm(prev => ({ ...prev, renter_shopname: e.target.value }))}
                onFocus={focusStyle} onBlur={blurStyle}
              />
            </Field>

            {/* Zone Selection Buttons */}
            <Field label="โซนประเภทร้านค้า *">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {ZONES.map(z => {
                  const icons = { 'โซนอาหาร': '🍱', 'โซนผลไม้': '🍎', 'โซนเสื้อผ้า': '👕', 'โซนของแห้ง': '🧺' }
                  const selected = form.renter_zone === z
                  return (
                    <button
                      key={z} type="button"
                      onClick={() => setForm(prev => ({ ...prev, renter_zone: z }))}
                      style={{
                        padding: '12px 8px', borderRadius: '12px', border: '1.5px solid',
                        borderColor: selected ? '#0f4c2a' : '#d1e3d8',
                        background: selected ? '#e8f5ee' : '#f9fbfa',
                        cursor: 'pointer', transition: 'all 0.18s',
                        boxShadow: selected ? '0 2px 8px rgba(15,76,42,0.15)' : 'none',
                      }}
                    >
                      <div style={{ fontSize: '22px', marginBottom: '4px' }}>{icons[z]}</div>
                      <div style={{ fontSize: '12px', fontWeight: selected ? '700' : '500', color: selected ? '#0f4c2a' : '#4a6358' }}>{z}</div>
                    </button>
                  )
                })}
              </div>
            </Field>

            <Field label="เลขบัตรประชาชน 13 หลัก *">
              <input
                type="text" style={inp} placeholder="x-xxxx-xxxxx-xx-x" maxLength={13}
                value={form.renter_citizenid}
                onChange={e => setForm(prev => ({ ...prev, renter_citizenid: e.target.value }))}
                onFocus={focusStyle} onBlur={blurStyle} required
              />
            </Field>

            <Field label="เบอร์โทรศัพท์ *">
              <input
                type="text" style={inp} placeholder="0xx-xxx-xxxx" maxLength={10}
                value={form.renter_tel}
                onChange={e => setForm(prev => ({ ...prev, renter_tel: e.target.value }))}
                onFocus={focusStyle} onBlur={blurStyle} required
              />
            </Field>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '11px 14px', borderRadius: '10px', marginBottom: '14px', fontSize: '13px' }}>
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #1a7a45, #0a3d20)',
              color: '#fff', border: 'none', borderRadius: '12px', padding: '14px',
              fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: loading ? 'none' : '0 4px 15px rgba(15,76,42,0.35)',
            }}
          >
            {loading ? 'กำลังลงทะเบียน...' : '✅ ลงทะเบียน'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#8a9e96', marginTop: '16px' }}>
            มีบัญชีแล้ว?{' '}
            <Link to="/login" style={{ color: '#1a7a45', fontWeight: '600', textDecoration: 'none' }}>
              เข้าสู่ระบบ
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}
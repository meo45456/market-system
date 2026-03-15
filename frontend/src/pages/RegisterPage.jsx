import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import Swal from 'sweetalert2'

const ZONES = ['โซนอาหาร', 'โซนผลไม้', 'โซนเสื้อผ้า', 'โซนของแห้ง']
const ZONE_ICONS = { 'โซนอาหาร': '🍱', 'โซนผลไม้': '🍎', 'โซนเสื้อผ้า': '👕', 'โซนของแห้ง': '🧺' }
const ZONE_DESC  = { 'โซนอาหาร': 'อาหาร / เครื่องดื่ม', 'โซนผลไม้': 'ผลไม้ / ผัก', 'โซนเสื้อผ้า': 'เสื้อผ้า / แฟชั่น', 'โซนของแห้ง': 'ของแห้ง / ของใช้' }

// ✅ Field และ inputStyle ต้องอยู่นอก component
// ถ้าอยู่ใน component React จะสร้างใหม่ทุก render → input เสีย focus ทุกครั้งที่พิมพ์
const inputStyle = {
  width: '100%', background: '#f9fafb', border: '2px solid #e5e7eb',
  borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#111827',
  fontFamily: "'Sarabun',sans-serif", boxSizing: 'border-box', outline: 'none', transition: 'all 0.2s'
}

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 7 }}>{label}</label>
    {children}
  </div>
)

export default function RegisterPage() {
  const [form, setForm] = useState({ user_name: '', user_password: '', user_role: 'renter', renter_shopname: '', renter_zone: '', renter_citizenid: '', renter_tel: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const navigate = useNavigate()

  const handleNext = (e) => {
    e.preventDefault()
    if (!form.user_name.trim()) { Swal.fire({ icon: 'warning', title: 'กรุณากรอก Username', confirmButtonColor: '#10b981' }); return }
    if (!form.user_password.trim()) { Swal.fire({ icon: 'warning', title: 'กรุณากรอกรหัสผ่าน', confirmButtonColor: '#10b981' }); return }
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.renter_zone) { Swal.fire({ icon: 'warning', title: 'กรุณาเลือกโซน', confirmButtonColor: '#10b981' }); return }
    if (!form.renter_citizenid || form.renter_citizenid.length !== 13) { Swal.fire({ icon: 'warning', title: 'เลขบัตรประชาชนต้องมี 13 หลัก', confirmButtonColor: '#10b981' }); return }
    if (!form.renter_tel) { Swal.fire({ icon: 'warning', title: 'กรุณากรอกเบอร์โทร', confirmButtonColor: '#10b981' }); return }
    setLoading(true)
    try {
      await api.post('/auth/register', form)
      await Swal.fire({ icon: 'success', title: 'ลงทะเบียนสำเร็จ! 🎉', text: 'ยินดีต้อนรับสู่ตลาดเกษตร มอ.', confirmButtonColor: '#10b981', confirmButtonText: 'เข้าสู่ระบบเลย' })
      navigate('/login')
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'สมัครไม่สำเร็จ', text: err.response?.data?.message || 'เกิดข้อผิดพลาด', confirmButtonColor: '#10b981' })
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafb', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 16px 60px', fontFamily: "'Sarabun',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&family=Prompt:wght@700;800;900&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        .inp-field:focus { border-color: #10b981 !important; background: #fff !important; box-shadow: 0 0 0 3px rgba(16,185,129,0.12) !important; }
        .zone-card:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(16,185,129,0.15) !important; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(16,185,129,0.45) !important; }
      `}</style>

      <div style={{ width: '100%', maxWidth: 440, animation: 'fadeUp 0.5s ease' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 60, height: 60, margin: '0 auto 12px', background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, boxShadow: '0 6px 20px rgba(16,185,129,0.35)' }}>🌾</div>
          <h1 style={{ fontFamily: "'Prompt',sans-serif", fontSize: 22, fontWeight: 900, color: '#064e3b', margin: '0 0 4px' }}>สมัครสมาชิก</h1>
          <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>ตลาดเกษตร มอ.</p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, gap: 0 }}>
          {[{ n: 1, label: 'บัญชีผู้ใช้' }, { n: 2, label: 'ข้อมูลร้าน' }].map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ textAlign: 'center', cursor: s.n < step ? 'pointer' : 'default' }} onClick={() => s.n < step && setStep(s.n)}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 5px', fontFamily: "'Prompt',sans-serif", fontWeight: 800, fontSize: 13, background: step >= s.n ? 'linear-gradient(135deg,#10b981,#059669)' : '#fff', border: step >= s.n ? 'none' : '2px solid #e5e7eb', color: step >= s.n ? '#fff' : '#9ca3af', boxShadow: step === s.n ? '0 4px 14px rgba(16,185,129,0.4)' : 'none' }}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <span style={{ fontSize: 11, color: step >= s.n ? '#059669' : '#9ca3af', fontWeight: step >= s.n ? 700 : 500 }}>{s.label}</span>
              </div>
              {i < 1 && <div style={{ width: 60, height: 2, background: step > 1 ? '#10b981' : '#e5e7eb', margin: '0 8px 20px', borderRadius: 2, transition: 'background 0.3s' }} />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 24, padding: '28px 24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>

          {/* ── Step 1: Account ── */}
          {step === 1 && (
            <form onSubmit={handleNext} style={{ animation: 'slideIn 0.3s ease' }}>
              <h3 style={{ fontFamily: "'Prompt',sans-serif", fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>👤</span> ข้อมูลบัญชี
              </h3>

              <Field label="ชื่อผู้ใช้ (Username) *">
                <div style={{ position: 'relative' }}>
                  <input className="inp-field" type="text" placeholder="เช่น somchai_66" value={form.user_name}
                    onChange={e => setForm(p => ({ ...p, user_name: e.target.value }))}
                    style={{ ...inputStyle, paddingLeft: 42 }} />
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15 }}>👤</span>
                </div>
              </Field>

              <Field label="รหัสผ่าน *">
                <div style={{ position: 'relative' }}>
                  <input className="inp-field" type={showPass ? 'text' : 'password'} placeholder="อย่างน้อย 6 ตัวอักษร" value={form.user_password}
                    onChange={e => setForm(p => ({ ...p, user_password: e.target.value }))}
                    style={{ ...inputStyle, paddingLeft: 42, paddingRight: 44 }} />
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15 }}>🔑</span>
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 0 }}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </Field>

              <button type="submit" className="submit-btn"
                style={{ width: '100%', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 0', fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 20px rgba(16,185,129,0.35)', fontFamily: "'Prompt',sans-serif", transition: 'all 0.2s', marginTop: 8 }}>
                ถัดไป →
              </button>
            </form>
          )}

          {/* ── Step 2: Shop Info ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} style={{ animation: 'slideIn 0.3s ease' }}>
              <h3 style={{ fontFamily: "'Prompt',sans-serif", fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>🏪</span> ข้อมูลร้านค้า
              </h3>

              <Field label="ชื่อร้านค้า">
                <input className="inp-field" type="text" placeholder="เช่น ร้านข้าวแกงสมชาย" value={form.renter_shopname}
                  onChange={e => setForm(p => ({ ...p, renter_shopname: e.target.value }))}
                  style={inputStyle} />
              </Field>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>โซนประเภทร้านค้า *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {ZONES.map(z => {
                    const sel = form.renter_zone === z
                    return (
                      <button key={z} type="button" className="zone-card" onClick={() => setForm(p => ({ ...p, renter_zone: z }))}
                        style={{ padding: '12px 8px', borderRadius: 14, border: `2px solid ${sel ? '#10b981' : '#e5e7eb'}`, background: sel ? '#ecfdf5' : '#f9fafb', cursor: 'pointer', textAlign: 'center', transition: 'all 0.18s', boxShadow: sel ? '0 2px 10px rgba(16,185,129,0.2)' : 'none', position: 'relative' }}>
                        {sel && <div style={{ position: 'absolute', top: 6, right: 8, fontSize: 11, color: '#059669', fontWeight: 800 }}>✓</div>}
                        <div style={{ fontSize: 24, marginBottom: 5 }}>{ZONE_ICONS[z]}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: sel ? '#059669' : '#374151' }}>{z}</div>
                        <div style={{ fontSize: 10, color: sel ? '#10b981' : '#9ca3af', marginTop: 2 }}>{ZONE_DESC[z]}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <Field label="เลขบัตรประชาชน 13 หลัก *">
                <input className="inp-field" type="text" placeholder="x-xxxx-xxxxx-xx-x" maxLength={13} value={form.renter_citizenid}
                  onChange={e => setForm(p => ({ ...p, renter_citizenid: e.target.value.replace(/\D/g, '') }))}
                  style={inputStyle} />
                {form.renter_citizenid && (
                  <div style={{ fontSize: 11, marginTop: 4, color: form.renter_citizenid.length === 13 ? '#059669' : '#f59e0b', fontWeight: 600 }}>
                    {form.renter_citizenid.length}/13 หลัก {form.renter_citizenid.length === 13 ? '✓' : ''}
                  </div>
                )}
              </Field>

              <Field label="เบอร์โทรศัพท์ *">
                <input className="inp-field" type="tel" placeholder="0xx-xxx-xxxx" maxLength={10} value={form.renter_tel}
                  onChange={e => setForm(p => ({ ...p, renter_tel: e.target.value.replace(/\D/g, '') }))}
                  style={inputStyle} />
              </Field>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setStep(1)}
                  style={{ flex: 1, background: '#fff', border: '2px solid #e5e7eb', color: '#6b7280', borderRadius: 14, padding: '13px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Sarabun',sans-serif' " }}>
                  ← ย้อนกลับ
                </button>
                <button type="submit" disabled={loading} className="submit-btn"
                  style={{ flex: 2, background: loading ? '#d1d5db' : 'linear-gradient(135deg,#10b981,#059669)', color: loading ? '#9ca3af' : '#fff', border: 'none', borderRadius: 14, padding: '13px 0', fontSize: 15, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 6px 20px rgba(16,185,129,0.35)', fontFamily: "'Prompt',sans-serif", transition: 'all 0.2s' }}>
                  {loading ? '⏳ กำลังสมัคร...' : '✅ ลงทะเบียน'}
                </button>
              </div>
            </form>
          )}

          <p style={{ textAlign: 'center', fontSize: 14, color: '#6b7280', marginTop: 18 }}>
            มีบัญชีแล้ว?{' '}
            <Link to="/login" style={{ color: '#10b981', fontWeight: 700, textDecoration: 'none' }}>เข้าสู่ระบบ</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
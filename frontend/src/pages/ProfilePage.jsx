import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import Swal from 'sweetalert2' // 1. นำเข้า SweetAlert2

const ZONES = ['โซนอาหาร', 'โซนผลไม้', 'โซนเสื้อผ้า', 'โซนของแห้ง']
const ZONE_ICONS = { 'โซนอาหาร': '🍱', 'โซนผลไม้': '🍎', 'โซนเสื้อผ้า': '👕', 'โซนของแห้ง': '🧺' }

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ renter_shopname: '', renter_zone: '', renter_tel: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()

  useEffect(() => { fetchProfile() }, [])

  const fetchProfile = async () => {
    try {
      const res = await api.get('/renters/me')
      setProfile(res.data.data)
      setForm({
        renter_shopname: res.data.data.renter_shopname || '',
        renter_zone: res.data.data.renter_zone || '',
        renter_tel: res.data.data.renter_tel || '',
      })
    } catch {}
    finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/renters/me', form)
      
      // 2. ใช้ SweetAlert2 เมื่อบันทึกสำเร็จ
      Swal.fire({
        icon: 'success',
        title: 'บันทึกข้อมูลเรียบร้อย',
        showConfirmButton: false,
        timer: 1500, // ป๊อปอัพจะหายไปเองใน 1.5 วินาที
        borderRadius: '20px',
      })

      fetchProfile()
    } catch (err) {
      // 3. แจ้งเตือนข้อผิดพลาด
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้',
        confirmButtonColor: '#dc2626',
      })
    } finally { setSaving(false) }
  }

  // Styles เดิมของคุณ
  const inp = {
    width: '100%', border: '1.5px solid #d1e3d8', borderRadius: '12px',
    padding: '12px 14px', fontSize: '14px', outline: 'none',
    background: '#f9fbfa', color: '#1a2e23', transition: 'all 0.2s',
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f4f7f5' }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '80px', color: '#9ca3af' }}>
        <div style={{ fontSize: '36px', marginBottom: '12px', animation: 'pulse 1.5s infinite' }}>⏳</div>
        <p>กำลังโหลด...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f5', fontFamily: "'Sarabun', sans-serif" }}>
      <Navbar />
      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '20px 16px 40px' }}>

        {/* Avatar Card */}
        <div className="fade-in" style={{
          background: 'linear-gradient(135deg, #0a3d20, #1a7a45)',
          borderRadius: '20px', padding: '28px 20px', textAlign: 'center',
          marginBottom: '14px', boxShadow: '0 8px 24px rgba(15,76,42,0.3)',
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', margin: '0 auto 12px',
          }}>🛒</div>
          <h2 style={{ fontFamily: "'Prompt',sans-serif", fontSize: '20px', fontWeight: '700', color: '#fff', margin: '0 0 4px' }}>
            {user?.user_name}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: '0 0 10px' }}>ผู้เช่าแผงตลาด</p>
          
          {profile?.renter_zone && (
            <div style={{
              background: 'rgba(255,255,255,0.2)', borderRadius: '20px',
              padding: '5px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '8px',
            }}>
              <span style={{ fontSize: '14px' }}>{ZONE_ICONS[profile.renter_zone]}</span>
              <span style={{ fontSize: '13px', color: '#fff', fontWeight: '600' }}>{profile.renter_zone}</span>
            </div>
          )}
        </div>

        {/* Form Card */}
        <div className="fade-in" style={{
          background: '#fff', borderRadius: '20px', padding: '24px',
          boxShadow: '0 2px 12px rgba(15,76,42,0.07)', border: '1px solid #e2ede7',
        }}>
          <h3 style={{ fontFamily: "'Prompt',sans-serif", fontSize: '15px', fontWeight: '600', color: '#0f4c2a', marginBottom: '18px' }}>
            ✏️ แก้ไขข้อมูลร้านค้า
          </h3>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4a6358', marginBottom: '6px' }}>🏪 ชื่อร้านค้า</label>
            <input type="text" style={inp} value={form.renter_shopname}
              onChange={e => setForm({ ...form, renter_shopname: e.target.value })}
              onFocus={e => { e.target.style.borderColor='#1a7a45'; e.target.style.background='#fff'; e.target.style.boxShadow='0 0 0 3px rgba(26,122,69,0.1)' }}
              onBlur={e => { e.target.style.borderColor='#d1e3d8'; e.target.style.background='#f9fbfa'; e.target.style.boxShadow='none' }}
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4a6358', marginBottom: '8px' }}>📍 โซนประเภทร้านค้า</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {ZONES.map(z => {
                const selected = form.renter_zone === z
                return (
                  <button key={z} type="button" onClick={() => setForm({ ...form, renter_zone: z })} style={{
                    padding: '10px 8px', borderRadius: '12px', border: '1.5px solid',
                    borderColor: selected ? '#0f4c2a' : '#d1e3d8',
                    background: selected ? '#e8f5ee' : '#f9fbfa',
                    cursor: 'pointer', transition: 'all 0.18s',
                  }}>
                    <div style={{ fontSize: '20px', marginBottom: '3px' }}>{ZONE_ICONS[z]}</div>
                    <div style={{ fontSize: '12px', fontWeight: selected ? '700' : '500', color: selected ? '#0f4c2a' : '#4a6358' }}>{z}</div>
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4a6358', marginBottom: '6px' }}>📞 เบอร์โทรศัพท์</label>
            <input type="text" style={inp} value={form.renter_tel}
              onChange={e => setForm({ ...form, renter_tel: e.target.value })}
              onFocus={e => { e.target.style.borderColor='#1a7a45'; e.target.style.background='#fff'; e.target.style.boxShadow='0 0 0 3px rgba(26,122,69,0.1)' }}
              onBlur={e => { e.target.style.borderColor='#d1e3d8'; e.target.style.background='#f9fbfa'; e.target.style.boxShadow='none' }}
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4a6358', marginBottom: '6px' }}>🪪 เลขบัตรประชาชน</label>
            <input type="text" style={{ ...inp, background: '#f0f5f2', color: '#9ca3af', cursor: 'not-allowed' }}
              value={profile?.renter_citizenid || '-'} disabled />
          </div>

          <button onClick={handleSave} disabled={saving} style={{
            width: '100%',
            background: saving ? '#9ca3af' : 'linear-gradient(135deg, #1a7a45, #0a3d20)',
            color: '#fff', border: 'none', borderRadius: '12px',
            padding: '14px', fontSize: '15px', fontWeight: '600',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            boxShadow: saving ? 'none' : '0 4px 15px rgba(15,76,42,0.35)',
          }}>
            {saving ? 'กำลังบันทึก...' : '💾 บันทึกข้อมูล'}
          </button>
        </div>
      </div>
    </div>
  )
}
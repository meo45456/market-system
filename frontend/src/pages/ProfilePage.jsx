import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import Swal from 'sweetalert2'

const ZONES = ['โซนอาหาร', 'โซนผลไม้', 'โซนเสื้อผ้า', 'โซนของแห้ง']
const ZONE_ICONS = { 'โซนอาหาร': '🍱', 'โซนผลไม้': '🍎', 'โซนเสื้อผ้า': '👕', 'โซนของแห้ง': '🧺' }
const ZONE_DESC  = { 'โซนอาหาร': 'อาหาร / เครื่องดื่ม', 'โซนผลไม้': 'ผลไม้ / ผัก', 'โซนเสื้อผ้า': 'เสื้อผ้า / แฟชั่น', 'โซนของแห้ง': 'ของแห้ง / ของใช้' }

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
      setForm({ renter_shopname: res.data.data.renter_shopname || '', renter_zone: res.data.data.renter_zone || '', renter_tel: res.data.data.renter_tel || '' })
    } catch {} finally { setLoading(false) }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/renters/me', form)
      Swal.fire({ icon: 'success', title: 'บันทึกสำเร็จ! 💾', showConfirmButton: false, timer: 1500 })
      fetchProfile()
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.response?.data?.message, confirmButtonColor: '#10b981' })
    } finally { setSaving(false) }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8fafb' }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: 100 }}>
        <div style={{ width: 40, height: 40, border: '4px solid #d1fae5', borderTop: '4px solid #10b981', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafb', fontFamily: "'Sarabun',sans-serif", color: '#111827' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&family=Prompt:wght@700;800;900&display=swap');
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .inp-field:focus { border-color: #10b981 !important; background: #fff !important; box-shadow: 0 0 0 3px rgba(16,185,129,0.12) !important; outline: none !important; }
        .zone-card { transition: all 0.18s ease !important; }
        .zone-card:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(16,185,129,0.15) !important; }
        .save-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(16,185,129,0.45) !important; }
      `}</style>

      <Navbar />
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '20px 16px 80px' }}>

        {/* ── Profile Hero ── */}
        <div style={{ background: 'linear-gradient(135deg,#064e3b,#065f46)', borderRadius: 24, padding: '28px 24px', textAlign: 'center', marginBottom: 16, boxShadow: '0 8px 32px rgba(6,78,59,0.25)', animation: 'fadeUp 0.4s ease', position: 'relative', overflow: 'hidden' }}>
          {/* Decorative blobs */}
          <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', top: -60, right: -40, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', bottom: -30, left: -20, pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 14px', backdropFilter: 'blur(8px)' }}>🛒</div>
            <h2 style={{ fontFamily: "'Prompt',sans-serif", fontSize: 20, fontWeight: 900, margin: '0 0 4px', color: '#fff' }}>{user?.user_name}</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 16px' }}>ผู้เช่าแผงตลาด</p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
              {profile?.renter_zone && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 16px', borderRadius: 20, backdropFilter: 'blur(8px)' }}>
                  <span style={{ fontSize: 15 }}>{ZONE_ICONS[profile.renter_zone]}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{profile.renter_zone}</span>
                </div>
              )}
              {profile?.renter_citizenid && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: 20, backdropFilter: 'blur(8px)' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>🪪 {profile.renter_citizenid}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Edit Form ── */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 24, padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', animation: 'fadeUp 0.5s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✏️</div>
            <h3 style={{ fontFamily: "'Prompt',sans-serif", fontSize: 15, fontWeight: 800, margin: 0, color: '#111827' }}>แก้ไขข้อมูลร้านค้า</h3>
          </div>

          {/* Shop Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 7 }}>🏪 ชื่อร้านค้า</label>
            <input className="inp-field" type="text" value={form.renter_shopname}
              onChange={e => setForm({ ...form, renter_shopname: e.target.value })}
              placeholder="เช่น ร้านข้าวแกงสมชาย"
              style={{ width: '100%', background: '#f9fafb', border: '2px solid #e5e7eb', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#111827', fontFamily: "'Sarabun',sans-serif", boxSizing: 'border-box', transition: 'all 0.2s' }}
            />
          </div>

          {/* Zone */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>📍 โซนประเภทร้านค้า</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {ZONES.map(z => {
                const sel = form.renter_zone === z
                return (
                  <button key={z} type="button" className="zone-card" onClick={() => setForm({ ...form, renter_zone: z })}
                    style={{ padding: '12px 8px', borderRadius: 14, border: `2px solid ${sel ? '#10b981' : '#e5e7eb'}`, background: sel ? '#ecfdf5' : '#f9fafb', cursor: 'pointer', textAlign: 'center', boxShadow: sel ? '0 2px 10px rgba(16,185,129,0.2)' : 'none', position: 'relative' }}>
                    {sel && <div style={{ position: 'absolute', top: 6, right: 8, fontSize: 11, color: '#059669', fontWeight: 800 }}>✓</div>}
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{ZONE_ICONS[z]}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: sel ? '#059669' : '#374151' }}>{z}</div>
                    <div style={{ fontSize: 10, color: sel ? '#10b981' : '#9ca3af', marginTop: 2 }}>{ZONE_DESC[z]}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tel */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 7 }}>📞 เบอร์โทรศัพท์</label>
            <input className="inp-field" type="tel" value={form.renter_tel}
              onChange={e => setForm({ ...form, renter_tel: e.target.value.replace(/\D/g, '') })}
              placeholder="0xx-xxx-xxxx" maxLength={10}
              style={{ width: '100%', background: '#f9fafb', border: '2px solid #e5e7eb', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#111827', fontFamily: "'Sarabun',sans-serif", boxSizing: 'border-box', transition: 'all 0.2s' }}
            />
          </div>

          {/* Citizen ID (readonly) */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 7 }}>🪪 เลขบัตรประชาชน <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>(แก้ไขไม่ได้)</span></label>
            <input type="text" value={profile?.renter_citizenid || '-'} disabled
              style={{ width: '100%', background: '#f3f4f6', border: '2px solid #e5e7eb', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#9ca3af', fontFamily: "'Sarabun',sans-serif", boxSizing: 'border-box', cursor: 'not-allowed' }}
            />
          </div>

          <button className="save-btn" onClick={handleSave} disabled={saving}
            style={{ width: '100%', background: saving ? '#d1d5db' : 'linear-gradient(135deg,#10b981,#059669)', color: saving ? '#9ca3af' : '#fff', border: 'none', borderRadius: 14, padding: '15px 0', fontSize: 15, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 6px 20px rgba(16,185,129,0.35)', fontFamily: "'Prompt',sans-serif", transition: 'all 0.2s' }}>
            {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึกข้อมูล'}
          </button>
        </div>
      </div>
    </div>
  )
}
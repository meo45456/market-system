import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import Swal from 'sweetalert2'

export default function HomePage() {
  const [stalls, setStalls] = useState([])
  const [zones, setZones] = useState([])
  const [zone, setZone] = useState('ทั้งหมด')
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [myZone, setMyZone] = useState(null)
  const [hasActiveBooking, setHasActiveBooking] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]
  const dateInputRef = useRef(null)

  const fetchStalls = useCallback(async (currentZone, currentDate) => {
    if (!currentDate) return
    setLoading(true)
    try {
      const params = { date: currentDate }
      if (currentZone && currentZone !== 'ทั้งหมด') params.zone = currentZone
      const res = await api.get('/stalls', { params })
      setStalls(res.data.data)
    } catch {}
    finally { setLoading(false) }
  }, [])

  const checkActiveBooking = useCallback(async () => {
    if (user?.user_role !== 'renter') return
    try {
      const res = await api.get('/bookings')
      const bookings = res.data.data || []
      const found = bookings.some(b => {
        const bDate = String(b.market_date).split('T')[0]
        if (b.booking_status === 'pending') return true
        if (b.booking_status === 'approved' && bDate >= today) return true
        return false
      })
      setHasActiveBooking(found)
    } catch {}
  }, [user, today])

  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get('/stalls/zones')
        setZones(['ทั้งหมด', ...res.data.data])
        if (user?.user_role === 'renter') {
          const me = await api.get('/renters/me')
          const renterZone = me.data.data?.renter_zone
          if (renterZone) { setMyZone(renterZone); setZone(renterZone) }
        }
      } catch {}
    }
    init()
    checkActiveBooking()
  }, [])

  useEffect(() => {
    if (date) { fetchStalls(zone, date); checkActiveBooking() }
    else setStalls([])
  }, [zone, date])

  const getStatus = (stall) => {
    const s = stall.date_status || stall.stall_status
    if (s === 'occupied')   return { label: 'ไม่ว่าง',       color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)',   dot: '#ef4444', btn: false }
    if (s === 'processing') return { label: 'ทำรายการอยู่',  color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.3)',   dot: '#f59e0b', btn: false }
    return                         { label: 'ว่าง',           color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.3)',   dot: '#10b981', btn: true  }
  }

  const handleBook = (stall) => {
    if (!date) {
      dateInputRef.current?.focus()
      dateInputRef.current?.showPicker?.()
      Swal.fire({ icon: 'info', title: 'เลือกวันที่ก่อนนะครับ', confirmButtonColor: '#10b981', timer: 2500 })
      return
    }
    if (hasActiveBooking) {
      Swal.fire({
        icon: 'warning', title: 'มีการจองค้างอยู่แล้ว',
        html: `<p style="font-family:'Sarabun',sans-serif;color:#6b7280">กรุณารอให้ครบกำหนดหรือยกเลิกก่อน จึงจะจองใหม่ได้ครับ</p>`,
        confirmButtonColor: '#10b981', confirmButtonText: 'ดูการจองของฉัน',
        showCancelButton: true, cancelButtonText: 'ปิด',
      }).then(r => { if (r.isConfirmed) navigate('/my-bookings') })
      return
    }
    if (user?.user_role === 'renter' && myZone && stall.stall_zone !== myZone) {
      Swal.fire({
        icon: 'warning', title: 'จองได้เฉพาะโซนที่ลงทะเบียน',
        text: `คุณลงทะเบียนไว้ใน "${myZone}"`, confirmButtonColor: '#10b981',
        showCancelButton: true, confirmButtonText: `ไปโซน ${myZone}`, cancelButtonText: 'ยกเลิก',
      }).then(r => { if (r.isConfirmed) setZone(myZone) })
      return
    }
    const st = getStatus(stall)
    if (!st.btn) {
      const s = stall.date_status || stall.stall_status
      Swal.fire({
        icon: s === 'processing' ? 'info' : 'error',
        title: s === 'processing' ? '⏳ มีคนกำลังทำรายการอยู่' : '🔴 แผงนี้ไม่ว่าง',
        text: s === 'processing' ? 'หากไม่ยืนยันภายใน 10 นาที แผงจะว่างอัตโนมัติครับ' : '',
        confirmButtonColor: '#10b981',
      })
      return
    }
    navigate('/booking', { state: { stall, date } })
  }

  const groups = stalls.reduce((acc, s) => {
    if (!acc[s.stall_zone]) acc[s.stall_zone] = []
    acc[s.stall_zone].push(s)
    return acc
  }, {})
  const availCount = stalls.filter(s => (s.date_status || s.stall_status) === 'available').length
  const zoneIcons = { 'โซนอาหาร': '🍱', 'โซนผลไม้': '🍎', 'โซนเสื้อผ้า': '👕', 'โซนของแห้ง': '🧺' }

  const dateLabel = date ? new Date(date).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafb', fontFamily: "'Sarabun', sans-serif", color: '#111827', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&family=Prompt:wght@600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.5 } }
        @keyframes shimmer { 0% { background-position: -400px 0 } 100% { background-position: 400px 0 } }
        .stall-card { transition: all 0.22s cubic-bezier(.4,0,.2,1) !important; }
        .stall-card:hover { transform: translateY(-4px) scale(1.03) !important; box-shadow: 0 12px 32px rgba(0,0,0,0.12) !important; }
        .zone-btn { transition: all 0.18s ease !important; }
        .zone-btn:hover { transform: translateY(-1px) !important; }
        .book-btn:active { transform: scale(0.96) !important; }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px 12px 80px' }}>

        {/* ── Hero Header ── */}
        <div style={{ marginBottom: 20, animation: 'fadeUp 0.5s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>🏪</div>
            <div>
              <h1 style={{ fontFamily: "'Prompt',sans-serif", fontSize: 22, fontWeight: 900, margin: 0, color: '#064e3b', letterSpacing: '-0.3px' }}>แผงผังตลาด</h1>
              <p style={{ margin: 0, fontSize: 12, color: '#6b7280', fontWeight: 500 }}>
                {date ? `📅 ${dateLabel} · ว่าง ${availCount}/${stalls.length} แผง` : 'เลือกวันที่เพื่อดูแผงว่าง'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Active Booking Banner ── */}
        {hasActiveBooking && user?.user_role === 'renter' && (
          <div style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1.5px solid #fcd34d', borderRadius: 16, padding: '14px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', animation: 'fadeUp 0.4s ease', boxShadow: '0 2px 12px rgba(245,158,11,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#fef9c3', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>⚠️</div>
              <div>
                <div style={{ fontWeight: 700, color: '#92400e', fontSize: 14, fontFamily: "'Prompt',sans-serif" }}>มีการจองที่ยังไม่เสร็จสิ้น</div>
                <div style={{ fontSize: 12, color: '#a16207', marginTop: 2 }}>กรุณารอให้ครบกำหนดหรือยกเลิกก่อน จึงจะจองแผงใหม่ได้ครับ</div>
              </div>
            </div>
            <button onClick={() => navigate('/my-bookings')} style={{ background: '#f59e0b', border: 'none', color: '#fff', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: "'Sarabun',sans-serif", whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(245,158,11,0.35)' }}>
              ดูการจอง →
            </button>
          </div>
        )}

        {/* ── My Zone Banner ── */}
        {myZone && user?.user_role === 'renter' && (
          <div style={{ background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', border: '1.5px solid #6ee7b7', borderRadius: 16, padding: '12px 18px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', boxShadow: '0 2px 10px rgba(16,185,129,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, background: '#fff', border: '1px solid #a7f3d0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{zoneIcons[myZone] || '📍'}</div>
              <div>
                <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginBottom: 1 }}>โซนที่ลงทะเบียนไว้</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#064e3b', fontFamily: "'Prompt',sans-serif" }}>{myZone}</div>
              </div>
            </div>
            <button className="zone-btn" onClick={() => setZone(zone === myZone ? 'ทั้งหมด' : myZone)}
              style={{ background: zone === myZone ? '#10b981' : '#fff', border: '1.5px solid #6ee7b7', color: zone === myZone ? '#fff' : '#059669', borderRadius: 20, padding: '6px 16px', fontSize: 12, cursor: 'pointer', fontWeight: 700, fontFamily: "'Sarabun',sans-serif" }}>
              {zone === myZone ? '✓ กรองอยู่' : 'กรองโซน'}
            </button>
          </div>
        )}

        {/* ── Filter Card ── */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '18px 20px', marginBottom: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb' }}>
          {/* Date Picker */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.3px' }}>
              📅 วันที่ต้องการออกร้าน
              {!date && <span style={{ marginLeft: 8, color: '#ef4444', fontSize: 11, fontWeight: 600, background: '#fef2f2', padding: '2px 8px', borderRadius: 20 }}>← เลือกก่อนนะครับ</span>}
            </label>
            <input ref={dateInputRef} type="date" min={today} value={date}
              onChange={e => setDate(e.target.value)}
              style={{ width: '100%', background: date ? '#f0fdf4' : '#f9fafb', border: `2px solid ${date ? '#10b981' : '#e5e7eb'}`, borderRadius: 12, padding: '12px 16px', fontSize: 15, outline: 'none', color: '#111827', cursor: 'pointer', fontFamily: "'Sarabun',sans-serif", boxSizing: 'border-box', transition: 'border-color 0.2s', WebkitAppearance: 'none', appearance: 'none' }}
            />
          </div>

          {/* Zone Chips */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 7, letterSpacing: '0.3px' }}>📍 กรองตามโซน</label>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {zones.map(z => (
                <button key={z} className="zone-btn" onClick={() => setZone(z)} style={{
                  padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', border: '1.5px solid',
                  background: zone === z ? '#10b981' : '#f9fafb',
                  borderColor: zone === z ? '#10b981' : (z === myZone ? '#6ee7b7' : '#e5e7eb'),
                  color: zone === z ? '#fff' : (z === myZone ? '#059669' : '#4b5563'),
                  fontFamily: "'Sarabun',sans-serif",
                  boxShadow: zone === z ? '0 2px 8px rgba(16,185,129,0.3)' : 'none',
                }}>
                  {z === myZone && zone !== z ? `${zoneIcons[z] || '⭐'} ` : ''}{z}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Legend ── */}
        {date && !loading && stalls.length > 0 && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 18, flexWrap: 'wrap', padding: '0 2px' }}>
            {[{ dot: '#10b981', label: 'ว่าง (จองได้)' }, { dot: '#f59e0b', label: 'กำลังทำรายการ' }, { dot: '#ef4444', label: 'ไม่ว่าง' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.dot, boxShadow: `0 0 6px ${l.dot}60` }} />
                <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{l.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Content Area ── */}
        {!date ? (
          // Empty State
          <div style={{ textAlign: 'center', padding: '52px 24px', background: '#fff', borderRadius: 24, border: '2px dashed #d1fae5', animation: 'fadeUp 0.5s ease' }}>
            <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 20px', boxShadow: '0 4px 20px rgba(16,185,129,0.15)' }}>📅</div>
            <h3 style={{ fontFamily: "'Prompt',sans-serif", fontSize: 20, fontWeight: 800, color: '#064e3b', marginBottom: 8 }}>เลือกวันที่ก่อนนะครับ</h3>
            <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
              เลือกวันที่ต้องการออกร้าน<br />ระบบจะแสดงสถานะแผงและเปิดให้จองได้ทันที
            </p>
            <button className="book-btn" onClick={() => { dateInputRef.current?.focus(); dateInputRef.current?.showPicker?.() }}
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: '#fff', borderRadius: 14, padding: '14px 36px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Sarabun',sans-serif", boxShadow: '0 6px 20px rgba(16,185,129,0.4)' }}>
              📅 เลือกวันที่ตรงนี้เลย
            </button>
          </div>

        ) : loading ? (
          // Loading Skeleton
          <div>
            {[1, 2].map(i => (
              <div key={i} style={{ marginBottom: 28 }}>
                <div style={{ width: 120, height: 20, background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)', backgroundSize: '400px 100%', borderRadius: 8, marginBottom: 14, animation: 'shimmer 1.4s infinite' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: 10 }}>
                  {[1,2,3,4].map(j => (
                    <div key={j} style={{ height: 110, background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)', backgroundSize: '400px 100%', borderRadius: 16, animation: `shimmer 1.4s infinite ${j * 0.1}s` }} />
                  ))}
                </div>
              </div>
            ))}
          </div>

        ) : stalls.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 15, fontWeight: 600 }}>ไม่พบแผงในโซนนี้</p>
          </div>

        ) : (
          // Stall Grid
          <div>
            {Object.entries(groups).map(([zoneName, zoneStalls], gi) => {
              const zoneAvail = zoneStalls.filter(s => (s.date_status || s.stall_status) === 'available').length
              return (
                <div key={zoneName} style={{ marginBottom: 28, animation: `fadeUp 0.4s ease ${gi * 0.08}s both` }}>
                  {/* Zone Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                      {zoneIcons[zoneName] || '🏷️'}
                    </div>
                    <div>
                      <h3 style={{ fontFamily: "'Prompt',sans-serif", fontSize: 15, fontWeight: 800, margin: 0, color: '#064e3b' }}>{zoneName}</h3>
                      <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>ว่าง {zoneAvail} จาก {zoneStalls.length} แผง</div>
                    </div>
                    <div style={{ marginLeft: 'auto', background: zoneAvail > 0 ? '#ecfdf5' : '#fef2f2', border: `1px solid ${zoneAvail > 0 ? '#a7f3d0' : '#fecaca'}`, color: zoneAvail > 0 ? '#059669' : '#dc2626', padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                      {zoneAvail > 0 ? `${zoneAvail} ว่าง` : 'เต็มแล้ว'}
                    </div>
                  </div>

                  {/* Stall Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: 10 }}>
                    {zoneStalls.map(stall => {
                      const st = getStatus(stall)
                      const canBook = st.btn && user?.user_role === 'renter' && !hasActiveBooking
                      return (
                        <div key={stall.stall_id} className="stall-card" onClick={() => handleBook(stall)}
                          style={{ background: '#fff', border: `2px solid ${st.border}`, borderRadius: 16, padding: '14px 8px 12px', textAlign: 'center', cursor: canBook ? 'pointer' : st.btn ? 'not-allowed' : 'default', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden', opacity: hasActiveBooking && st.btn ? 0.65 : 1 }}>
                          {/* Color top bar */}
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: st.color, borderRadius: '14px 14px 0 0' }} />

                          <div style={{ fontFamily: "'Prompt',sans-serif", fontSize: 19, fontWeight: 900, color: st.color, marginBottom: 5, marginTop: 2 }}>{stall.stall_number}</div>

                          {/* Status Badge */}
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: st.bg, border: `1px solid ${st.border}`, borderRadius: 20, padding: '3px 9px', marginBottom: 8 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: st.color, animation: st.btn ? 'none' : 'pulse 2s infinite' }} />
                            <span style={{ fontSize: 10, color: st.color, fontWeight: 700, whiteSpace: 'nowrap' }}>{st.label}</span>
                          </div>

                          <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: st.btn ? 10 : 0 }}>฿{stall.stall_rate}</div>

                          {user?.user_role === 'renter' && st.btn && (
                            <button className="book-btn" style={{ width: '100%', background: hasActiveBooking ? '#e5e7eb' : 'linear-gradient(135deg,#10b981,#059669)', color: hasActiveBooking ? '#9ca3af' : '#fff', border: 'none', borderRadius: 9, padding: '7px 0', fontSize: 12, fontWeight: 700, cursor: hasActiveBooking ? 'not-allowed' : 'pointer', fontFamily: "'Sarabun',sans-serif", boxShadow: hasActiveBooking ? 'none' : '0 2px 8px rgba(16,185,129,0.35)' }}>
                              {hasActiveBooking ? 'จองแล้ว' : 'จอง'}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
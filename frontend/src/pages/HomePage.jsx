import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import Swal from 'sweetalert2' // 1. นำเข้า SweetAlert2

export default function HomePage() {
  const [stalls, setStalls] = useState([])
  const [zones, setZones] = useState([])
  const [zone, setZone] = useState('ทั้งหมด')
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [myZone, setMyZone] = useState(null)
  const { user } = useAuth()
  const navigate = useNavigate()
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => { fetchZonesAndInit() }, [])
  useEffect(() => { fetchStalls() }, [zone, date])

  const fetchZonesAndInit = async () => {
    try {
      const res = await api.get('/stalls/zones')
      setZones(['ทั้งหมด', ...res.data.data])
      if (user?.user_role === 'renter') {
        const me = await api.get('/renters/me')
        const renterZone = me.data.data?.renter_zone
        if (renterZone) {
          setMyZone(renterZone)
          setZone(renterZone)
        }
      }
    } catch {}
  }

  const fetchStalls = async () => {
    setLoading(true)
    try {
      const params = {}
      if (zone !== 'ทั้งหมด') params.zone = zone
      if (date) params.date = date
      const res = await api.get('/stalls', { params })
      setStalls(res.data.data)
    } catch {}
    finally { setLoading(false) }
  }

  const getStatus = (stall) => {
    const s = stall.date_status || stall.stall_status
    if (s === 'occupied')   return { label: 'ไม่ว่าง',      bg: '#fff1f1', border: '#fca5a5', text: '#dc2626', dot: '#ef4444', btn: false }
    if (s === 'processing') return { label: 'กำลังรอชำระ', bg: '#fffbeb', border: '#fcd34d', text: '#d97706', dot: '#f59e0b', btn: false }
    return                         { label: 'ว่าง',        bg: '#f0fdf4', border: '#86efac', text: '#16a34a', dot: '#22c55e', btn: true  }
  }

  const handleBook = (stall) => {
    // 2. เช็คเรื่องการเลือกวันที่ก่อน
    if (!date) {
      Swal.fire({
        icon: 'info',
        title: 'กรุณาเลือกวันที่',
        text: 'รบกวนเลือกวันที่คุณต้องการออกร้านก่อนจองแผงนะครับ',
        confirmButtonColor: '#0f4c2a'
      })
      return
    }

    const st = getStatus(stall)
    if (!st.btn) {
      const s = stall.date_status || stall.stall_status
      Swal.fire({
        icon: s === 'processing' ? 'info' : 'error',
        title: s === 'processing' ? 'แผงนี้กำลังทำรายการ' : 'แผงนี้ไม่ว่างแล้ว',
        text: s === 'processing' 
          ? 'กำลังมีสมาชิกท่านอื่นทำรายการจองแผงนี้อยู่ครับ' 
          : 'แผงนี้มีการจองและชำระเงินเรียบร้อยแล้วในวันที่คุณเลือก',
        confirmButtonColor: '#0f4c2a'
      })
      return
    }

    // ถ้าผ่านหมด ให้ไปหน้าจอง
    navigate('/booking', { state: { stall, date } })
  }

  const groups = stalls.reduce((acc, s) => {
    if (!acc[s.stall_zone]) acc[s.stall_zone] = []
    acc[s.stall_zone].push(s)
    return acc
  }, {})

  const availCount = stalls.filter(s => (s.date_status || s.stall_status) === 'available').length
  const zoneIcons = { 'โซนอาหาร': '🍱', 'โซนผลไม้': '🍎', 'โซนเสื้อผ้า': '👕', 'โซนของแห้ง': '🧺' }

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f5', fontFamily: "'Sarabun', sans-serif" }}>
      <Navbar />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 16px' }}>

        {/* Page title */}
        <div className="fade-in" style={{ marginBottom: '20px' }}>
          <h2 style={{ fontFamily: "'Prompt',sans-serif", fontSize: '22px', fontWeight: '700', color: '#0f4c2a', margin: '0 0 4px' }}>
            🗺️ แผงผังตลาด
          </h2>
          <p style={{ color: '#6b7c72', fontSize: '14px', margin: 0 }}>
            {date ? `พบแผงว่าง ${availCount} จาก ${stalls.length} แผง` : 'เลือกวันที่เพื่อดูสถานะและจองแผง'}
          </p>
        </div>

        {/* My zone banner */}
        {myZone && user?.user_role === 'renter' && (
          <div className="fade-in" style={{
            background: 'linear-gradient(135deg, #0f4c2a, #1a7a45)',
            borderRadius: '14px', padding: '12px 18px', marginBottom: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>{zoneIcons[myZone] || '📍'}</span>
              <div>
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', margin: '0 0 2px' }}>โซนที่คุณลงทะเบียนไว้</p>
                <p style={{ color: '#fff', fontSize: '15px', fontWeight: '700', margin: 0 }}>{myZone}</p>
              </div>
            </div>
            <button onClick={() => setZone(zone === myZone ? 'ทั้งหมด' : myZone)} style={{
              background: zone === myZone ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)', color: '#fff',
              borderRadius: '20px', padding: '6px 14px', fontSize: '12px',
              cursor: 'pointer', fontWeight: '600',
            }}>
              {zone === myZone ? '✓ แสดงทั้งหมด' : 'กรองโซนของฉัน'}
            </button>
          </div>
        )}

        {/* Filter Card */}
        <div className="fade-in" style={{
          background: '#fff', borderRadius: '18px', padding: '18px 20px',
          marginBottom: '20px', boxShadow: '0 2px 12px rgba(15,76,42,0.07)', border: '1px solid #e2ede7',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            {/* Date picker */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7c72', marginBottom: '7px' }}>
                📅 เลือกวันที่ต้องการออกร้าน
              </label>
              <input type="date" min={today} value={date} onChange={e => setDate(e.target.value)} style={{
                width: '100%', border: '1.5px solid #d1e3d8', borderRadius: '12px',
                padding: '11px 14px', fontSize: '14px', outline: 'none',
                background: '#f9fbfa', color: '#1a2e23', cursor: 'pointer',
              }} />
            </div>

            {/* Zone filter */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b7c72', marginBottom: '7px' }}>
                📍 กรองตามโซนสินค้า
              </label>
              <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                {zones.map(z => (
                  <button key={z} onClick={() => setZone(z)} style={{
                    padding: '7px 15px', borderRadius: '20px', fontSize: '13px', fontWeight: '500',
                    cursor: 'pointer', border: '1.5px solid',
                    background: zone === z ? '#0f4c2a' : '#fff',
                    borderColor: zone === z ? '#0f4c2a' : (z === myZone ? '#1a7a45' : '#d1e3d8'),
                    color: zone === z ? '#fff' : '#4a6358',
                    transition: 'all 0.18s',
                  }}>
                    {z}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '14px', marginBottom: '18px', flexWrap: 'wrap', padding: '0 4px' }}>
          {[{ dot: '#22c55e', label: 'ว่าง (จองได้)' }, { dot: '#f59e0b', label: 'รอชำระเงิน' }, { dot: '#ef4444', label: 'ไม่ว่าง' }].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: l.dot }} />
              <span style={{ fontSize: '12px', color: '#6b7c72' }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Stalls Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px' }}>
             <div className="spinner" style={{ margin: '0 auto 15px' }}></div>
             <p style={{ color: '#9ca3af' }}>กำลังตรวจสอบสถานะแผง...</p>
          </div>
        ) : (
          <div className="stagger">
            {Object.entries(groups).map(([zoneName, zoneStalls]) => (
              <div key={zoneName} style={{ marginBottom: '32px' }}>
                <div style={{ marginBottom: '14px', paddingLeft: '4px' }}>
                  <h3 style={{ fontFamily: "'Prompt',sans-serif", fontSize: '16px', fontWeight: '700', color: '#1a2e23', margin: 0 }}>
                    {zoneIcons[zoneName] || '🏷️'} {zoneName}
                  </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                  {zoneStalls.map(stall => {
                    const st = getStatus(stall)
                    const canBook = st.btn && user?.user_role === 'renter'
                    return (
                      <div key={stall.stall_id}
                        onClick={() => handleBook(stall)}
                        style={{
                          background: st.bg, border: `2px solid ${st.border}`,
                          borderRadius: '16px', padding: '16px 10px', textAlign: 'center',
                          cursor: canBook ? 'pointer' : 'not-allowed',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                        }}
                        onMouseEnter={e => { if(canBook) e.currentTarget.style.transform = 'translateY(-3px)' }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
                      >
                        <div style={{ fontSize: '20px', fontWeight: '800', color: st.text, marginBottom: '4px' }}>
                          {stall.stall_number}
                        </div>
                        <div style={{ fontSize: '11px', color: st.text, fontWeight: '600', opacity: 0.8 }}>
                          {st.label}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                          ฿{stall.stall_rate}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
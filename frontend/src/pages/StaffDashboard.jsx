import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import api from '../api'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const STATUS = {
  processing: { label: 'กำลังทำรายการ', bg: 'rgba(245,158,11,0.08)',  text: '#b45309', border: 'rgba(245,158,11,0.3)',  icon: '⏳', dot: '#f59e0b' },
  pending:    { label: 'รออนุมัติ',      bg: 'rgba(249,115,22,0.08)',  text: '#c2410c', border: 'rgba(249,115,22,0.3)',  icon: '📋', dot: '#f97316' },
  approved:   { label: 'อนุมัติแล้ว',    bg: 'rgba(59,130,246,0.08)',  text: '#1d4ed8', border: 'rgba(59,130,246,0.3)',  icon: '✅', dot: '#3b82f6' },
  paid:       { label: 'รอตรวจสลิป',     bg: 'rgba(109,40,217,0.08)',  text: '#6d28d9', border: 'rgba(109,40,217,0.3)',  icon: '💳', dot: '#7c3aed' },
  rejected:   { label: 'ถูกปฏิเสธ',      bg: 'rgba(239,68,68,0.08)',   text: '#be123c', border: 'rgba(239,68,68,0.25)',  icon: '❌', dot: '#ef4444' },
}

const API_BASE = (import.meta.env.VITE_API_URL || 'https://market-system-production.up.railway.app/api').replace('/api', '')

export default function StaffDashboard() {
  const [tab, setTab] = useState('bookings')
  const [bookings, setBookings] = useState([])
  const [payments, setPayments] = useState([])
  const [stalls, setStalls] = useState([])
  const [renters, setRenters] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [bRes, pRes, sRes, rRes] = await Promise.allSettled([
        api.get('/bookings'), api.get('/payments'), api.get('/stalls'), api.get('/renters'),
      ])
      setBookings(bRes.status === 'fulfilled' ? (bRes.value.data.data || []) : [])
      setPayments(pRes.status === 'fulfilled' ? (pRes.value.data.data || []) : [])
      setStalls  (sRes.status === 'fulfilled' ? (sRes.value.data.data || []) : [])
      setRenters (rRes.status === 'fulfilled' ? (rRes.value.data.data || []) : [])
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const confirmAction = (type, b, p) => {
    const isApprove = type === 'approve'
    const slipUrl = p?.payment_slipimage 
  ? `https://res.cloudinary.com/dmwclg05m/image/upload/${p.payment_slipimage}` 
  : null
    MySwal.fire({
      title: (
        <div style={{ fontFamily: "'Prompt',sans-serif", fontSize: 18, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          {isApprove ? '✅' : '❌'} <span>{isApprove ? 'ยืนยันอนุมัติ' : 'ปฏิเสธรายการ'}</span>
        </div>
      ),
      html: (
        <div style={{ fontFamily: "'Sarabun',sans-serif", textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
            <div style={{ width: 42, height: 42, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Prompt',sans-serif", fontWeight: 900, color: '#059669', fontSize: 14, flexShrink: 0 }}>{b.stall_number}</div>
            <div>
              <div style={{ fontWeight: 700, color: '#111827', fontSize: 15 }}>{b.renter_shopname || b.user_name}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{b.stall_zone} • {new Date(b.market_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
            </div>
          </div>
          {p && (
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '14px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: slipUrl ? 12 : 0 }}>
                <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>ยอดโอน</span>
                <span style={{ fontFamily: "'Prompt',sans-serif", fontSize: 22, fontWeight: 900, color: '#10b981' }}>฿{p.payment_amount}</span>
              </div>
              {slipUrl && (
                <>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 600 }}>หลักฐานการโอน</div>
                  <img src={slipUrl} alt="สลิป" style={{ width: '100%', borderRadius: 10, border: '1px solid #e5e7eb', display: 'block', maxHeight: 280, objectFit: 'contain', background: '#fff' }}
                    onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
                  <div style={{ display: 'none', alignItems: 'center', justifyContent: 'center', height: 80, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, color: '#ef4444', fontSize: 13, fontWeight: 600 }}>⚠️ โหลดรูปไม่ได้</div>
                </>
              )}
            </div>
          )}
          <div style={{ fontSize: 13, color: '#6b7280', textAlign: 'center' }}>
            {isApprove ? 'ยืนยันการอนุมัติการจองนี้ใช่ไหมครับ?' : 'ยืนยันการปฏิเสธการจองนี้ใช่ไหมครับ?'}
          </div>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: isApprove ? '✅ ยืนยัน' : '❌ ปฏิเสธ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: isApprove ? '#10b981' : '#ef4444',
      cancelButtonColor: '#9ca3af',
      reverseButtons: true,
      width: 480,
    }).then(r => { if (r.isConfirmed) handleApprove(b.booking_id, p?.payment_id, isApprove) })
  }

  const handleApprove = async (bookingId, paymentId, isApproved) => {
    try {
      await api.patch(`/bookings/${bookingId}/status`, { booking_status: isApproved ? 'approved' : 'rejected' })
      if (paymentId) await api.patch(`/payments/${paymentId}/verify`, { verified: isApproved })
      Swal.fire({ icon: 'success', title: 'ดำเนินการสำเร็จ', timer: 1500, showConfirmButton: false })
      fetchAll()
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ผิดพลาด', text: err.response?.data?.message, confirmButtonColor: '#10b981' })
    }
  }

  const handleUpdateStall = async (id, field, value) => {
    try { await api.put(`/stalls/${id}`, { [field]: value }); fetchAll() }
    catch { Swal.fire({ icon: 'error', title: 'อัปเดตผิดพลาด', confirmButtonColor: '#10b981' }) }
  }

  const bookingsWithPayments = bookings.map(b => ({ ...b, payment: payments.find(p => p.booking_id === b.booking_id) }))
  const stats = {
    total:     bookings.length,
    pending:   bookings.filter(b => ['pending', 'paid'].includes(b.booking_status)).length,
    available: stalls.filter(s => s.stall_status === 'available').length,
  }
  const tabs = [
    { id: 'bookings', label: 'คำขอ / สลิป', icon: '📋', badge: stats.pending },
    { id: 'stalls',   label: 'จัดการแผง',   icon: '🏪', badge: 0 },
    { id: 'renters',  label: 'ผู้เช่า',      icon: '👥', badge: 0 },
  ]
  const inp = { width: '100%', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: 13, color: '#111827', outline: 'none', fontFamily: "'Sarabun',sans-serif" }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafb', fontFamily: "'Sarabun',sans-serif", color: '#111827' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&family=Prompt:wght@700;800;900&display=swap');
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .tab-btn { transition: all 0.18s ease !important; }
        .booking-row { transition: box-shadow 0.2s ease !important; }
        .booking-row:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.08) !important; }
        .stall-card { transition: all 0.2s ease !important; }
        .stall-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.08) !important; }
      `}</style>

      <Navbar />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 20px 60px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, animation: 'fadeUp 0.4s ease' }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>📊</div>
          <div>
            <h2 style={{ fontFamily: "'Prompt',sans-serif", fontSize: 20, fontWeight: 900, margin: 0, color: '#064e3b' }}>Staff Dashboard</h2>
            <p style={{ color: '#6b7280', fontSize: 12, margin: 0 }}>จัดการตลาดครบวงจร</p>
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20, animation: 'fadeUp 0.45s ease' }}>
          {[
            { label: 'คำขอทั้งหมด', val: stats.total,     color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd', icon: '📋' },
            { label: 'รอดำเนินการ', val: stats.pending,   color: '#c2410c', bg: '#fff7ed', border: '#fdba74', icon: '⏳' },
            { label: 'แผงว่าง',     val: stats.available, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: '✅' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 18, padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: "'Prompt',sans-serif", fontSize: 30, fontWeight: 900, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap', animation: 'fadeUp 0.5s ease' }}>
          {tabs.map(t => (
            <button key={t.id} className="tab-btn" onClick={() => setTab(t.id)} style={{ padding: '9px 18px', borderRadius: 12, fontSize: 13, cursor: 'pointer', border: '1.5px solid', fontFamily: "'Sarabun',sans-serif", fontWeight: 600, background: tab === t.id ? '#10b981' : '#fff', borderColor: tab === t.id ? '#10b981' : '#e5e7eb', color: tab === t.id ? '#fff' : '#4b5563', display: 'flex', alignItems: 'center', gap: 7, boxShadow: tab === t.id ? '0 4px 12px rgba(16,185,129,0.3)' : 'none' }}>
              {t.icon} {t.label}
              {t.badge > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: 10, padding: '0 7px', fontSize: 10, fontWeight: 700 }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ height: 90, background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)', backgroundSize: '400px 100%', borderRadius: 16, animation: `shimmer 1.4s infinite ${i*0.1}s` }} />
            ))}
          </div>
        ) : (
          <div>
            {/* ── Bookings Tab ── */}
            {tab === 'bookings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {bookingsWithPayments.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                    <p style={{ fontSize: 15 }}>ไม่มีรายการ</p>
                  </div>
                )}
                {bookingsWithPayments.map((b, idx) => {
                  const st = STATUS[b.booking_status] || STATUS.pending
                  const needsAction = ['pending', 'paid'].includes(b.booking_status)
                  return (
                    <div key={b.booking_id} className="booking-row"
                      style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden', animation: `fadeUp 0.4s ease ${idx*0.04}s both` }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: st.dot, borderRadius: '18px 0 0 18px' }} />
                      <div style={{ paddingLeft: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: needsAction ? 14 : 0 }}>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ width: 46, height: 46, background: '#ecfdf5', border: '1.5px solid #a7f3d0', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Prompt',sans-serif", fontWeight: 900, color: '#059669', fontSize: 15, flexShrink: 0 }}>{b.stall_number}</div>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{b.renter_shopname || b.user_name}</div>
                              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{b.stall_zone} • {new Date(b.market_date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}</div>
                              {b.payment && <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', marginTop: 2 }}>฿{b.payment.payment_amount}</div>}
                            </div>
                          </div>
                          <div style={{ background: st.bg, color: st.text, border: `1.5px solid ${st.border}`, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{st.icon} {st.label}</div>
                        </div>
                        {needsAction && (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => confirmAction('approve', b, b.payment)}
                              style={{ flex: 1, background: b.booking_status === 'paid' ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 0', cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: "'Sarabun',sans-serif", boxShadow: '0 3px 10px rgba(0,0,0,0.15)' }}>
                              {b.booking_status === 'paid' ? '🔍 ตรวจสลิป & อนุมัติ' : '✅ อนุมัติการจอง'}
                            </button>
                            <button onClick={() => confirmAction('reject', b, b.payment)}
                              style={{ padding: '10px 18px', background: '#fef2f2', color: '#ef4444', border: '1.5px solid #fecaca', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "'Sarabun',sans-serif" }}>
                              ปฏิเสธ
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── Stalls Tab ── */}
            {tab === 'stalls' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10 }}>
                {stalls.length === 0 && <p style={{ color: '#9ca3af', gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>ไม่พบข้อมูลแผง</p>}
                {stalls.map((s, idx) => (
                  <div key={s.stall_id} className="stall-card"
                    style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', animation: `fadeUp 0.4s ease ${idx*0.03}s both`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.stall_status === 'available' ? '#10b981' : '#ef4444', borderRadius: '16px 16px 0 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, marginTop: 4 }}>
                      <span style={{ fontFamily: "'Prompt',sans-serif", fontWeight: 900, fontSize: 18, color: '#064e3b' }}>{s.stall_number}</span>
                      <div style={{ fontSize: 10, fontWeight: 700, color: s.stall_status === 'available' ? '#059669' : '#ef4444', background: s.stall_status === 'available' ? '#ecfdf5' : '#fef2f2', border: `1px solid ${s.stall_status === 'available' ? '#a7f3d0' : '#fecaca'}`, borderRadius: 20, padding: '2px 8px' }}>
                        {s.stall_status === 'available' ? 'ว่าง' : 'ไม่ว่าง'}
                      </div>
                    </div>
                    <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 10, marginTop: 2 }}>{s.stall_zone}</p>
                    <input type="number" defaultValue={s.stall_rate} style={{ ...inp, marginBottom: 7 }}
                      onBlur={e => handleUpdateStall(s.stall_id, 'stall_rate', e.target.value)} />
                    <select value={s.stall_status} onChange={e => handleUpdateStall(s.stall_id, 'stall_status', e.target.value)} style={inp}>
                      <option value="available">ว่าง</option>
                      <option value="occupied">ไม่ว่าง</option>
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* ── Renters Tab ── */}
            {tab === 'renters' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {renters.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
                    <p style={{ fontSize: 15 }}>ไม่พบข้อมูลผู้เช่า</p>
                  </div>
                )}
                {renters.map((r, idx) => (
                  <div key={r.renter_id}
                    style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', animation: `fadeUp 0.4s ease ${idx*0.04}s both` }}>
                    <div style={{ width: 44, height: 44, borderRadius: 13, background: '#ecfdf5', border: '1.5px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🛒</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: '#111827', marginBottom: 2, fontSize: 14 }}>{r.renter_shopname || 'ไม่มีชื่อร้าน'}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{r.user_name} • {r.renter_zone || 'ยังไม่ระบุโซน'}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#059669', whiteSpace: 'nowrap' }}>📞 {r.renter_tel}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api'
import Swal from 'sweetalert2'

const STATUS = {
  processing: { label: 'กำลังดำเนินการ', bg: 'rgba(245,158,11,0.08)',  text: '#b45309', border: 'rgba(245,158,11,0.3)',  icon: '⏳', dot: '#f59e0b' },
  pending:    { label: 'รออนุมัติ',       bg: 'rgba(249,115,22,0.08)',  text: '#c2410c', border: 'rgba(249,115,22,0.3)',  icon: '📋', dot: '#f97316' },
  approved:   { label: 'อนุมัติแล้ว',     bg: 'rgba(59,130,246,0.08)',  text: '#1d4ed8', border: 'rgba(59,130,246,0.3)',  icon: '✅', dot: '#3b82f6' },
  rejected:   { label: 'ยกเลิก',          bg: 'rgba(239,68,68,0.08)',   text: '#be123c', border: 'rgba(239,68,68,0.25)',  icon: '❌', dot: '#ef4444' },
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    fetchBookings()
    if (location.state?.success) {
      Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 })
        .fire({ icon: 'success', title: 'ส่งคำขอจองสำเร็จ! 🎉' })
    }
  }, [location.state])

  const fetchBookings = async () => {
    try { const res = await api.get('/bookings'); setBookings(res.data.data) }
    catch {} finally { setLoading(false) }
  }

  const handleCancel = async (b) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'ยืนยันยกเลิกการจอง?',
      html: `<div style="font-family:'Sarabun',sans-serif;color:#374151">
        <p style="font-size:15px">แผง <strong style="color:#111827">${b.stall_number}</strong> — ${b.stall_zone}</p>
        <p style="margin-top:6px;color:#6b7280;font-size:13px">วันที่ ${new Date(b.market_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <div style="margin-top:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:10px 14px;font-size:13px;color:#dc2626">
          ⚠️ หากยกเลิกแล้ว จะสามารถจองแผงใหม่ได้ทันที
        </div>
      </div>`,
      showCancelButton: true,
      confirmButtonText: 'ยืนยันยกเลิก',
      cancelButtonText: 'ไม่ยกเลิก',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#9ca3af',
      reverseButtons: true,
    })
    if (!confirm.isConfirmed) return
    try {
      await api.delete(`/bookings/${b.booking_id}`)
      Swal.fire({ icon: 'success', title: 'ยกเลิกการจองสำเร็จ', timer: 2000, showConfirmButton: false })
      fetchBookings()
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ไม่สามารถยกเลิกได้', text: err.response?.data?.message || 'เกิดข้อผิดพลาด', confirmButtonColor: '#10b981' })
    }
  }

  const pendingCount  = bookings.filter(b => b.booking_status === 'pending').length
  const approvedCount = bookings.filter(b => b.booking_status === 'approved').length
  const rejectedCount = bookings.filter(b => b.booking_status === 'rejected').length

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.booking_status === filter)

  const FILTERS = [
    { id: 'all',      label: 'ทั้งหมด',    count: bookings.length },
    { id: 'pending',  label: 'รออนุมัติ',  count: pendingCount },
    { id: 'approved', label: 'อนุมัติแล้ว', count: approvedCount },
    { id: 'rejected', label: 'ยกเลิก',     count: rejectedCount },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafb', fontFamily: "'Sarabun',sans-serif", color: '#111827' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&family=Prompt:wght@700;800;900&display=swap');
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .booking-card { transition: all 0.2s ease !important; }
        .booking-card:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }
        .filter-btn { transition: all 0.18s ease !important; }
        .cancel-btn:hover { background: #fef2f2 !important; border-color: #f87171 !important; }
      `}</style>

      <Navbar />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 80px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20, animation: 'fadeUp 0.4s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>📋</div>
            <div>
              <h2 style={{ fontFamily: "'Prompt',sans-serif", fontSize: 20, fontWeight: 900, margin: 0, color: '#064e3b' }}>การจองของฉัน</h2>
              <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>{bookings.length > 0 ? `ทั้งหมด ${bookings.length} รายการ` : 'ยังไม่มีการจอง'}</p>
            </div>
          </div>
          <button onClick={() => navigate('/home')}
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: '#fff', borderRadius: 12, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.35)', fontFamily: "'Sarabun',sans-serif", whiteSpace: 'nowrap' }}>
            + จองแผงใหม่
          </button>
        </div>

        {/* ── Stats ── */}
        {bookings.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18, animation: 'fadeUp 0.45s ease' }}>
            {[
              { label: 'ทั้งหมด',    val: bookings.length, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
              { label: 'รออนุมัติ',  val: pendingCount,    color: '#c2410c', bg: '#fff7ed', border: '#fdba74' },
              { label: 'อนุมัติแล้ว', val: approvedCount,  color: '#1d4ed8', bg: '#eff6ff', border: '#93c5fd' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, border: `1.5px solid ${s.border}`, borderRadius: 16, padding: '14px 12px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <div style={{ fontFamily: "'Prompt',sans-serif", fontSize: 28, fontWeight: 900, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Filter Tabs ── */}
        {bookings.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', animation: 'fadeUp 0.5s ease' }}>
            {FILTERS.map(f => (
              <button key={f.id} className="filter-btn" onClick={() => setFilter(f.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1.5px solid', background: filter === f.id ? '#10b981' : '#fff', borderColor: filter === f.id ? '#10b981' : '#e5e7eb', color: filter === f.id ? '#fff' : '#4b5563', fontFamily: "'Sarabun',sans-serif", boxShadow: filter === f.id ? '0 2px 8px rgba(16,185,129,0.3)' : 'none' }}>
                {f.label}
                {f.count > 0 && <span style={{ background: filter === f.id ? 'rgba(255,255,255,0.25)' : '#f3f4f6', color: filter === f.id ? '#fff' : '#6b7280', borderRadius: 20, padding: '0 7px', fontSize: 11, fontWeight: 700 }}>{f.count}</span>}
              </button>
            ))}
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 110, background: 'linear-gradient(90deg,#f3f4f6 25%,#e5e7eb 50%,#f3f4f6 75%)', backgroundSize: '400px 100%', borderRadius: 18, animation: `shimmer 1.4s infinite ${i * 0.1}s` }} />
            ))}
          </div>

        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 24, border: '2px dashed #d1fae5', animation: 'fadeUp 0.5s ease' }}>
            <div style={{ width: 72, height: 72, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px' }}>📋</div>
            <h3 style={{ fontFamily: "'Prompt',sans-serif", fontSize: 17, color: '#064e3b', marginBottom: 8 }}>ยังไม่มีการจอง</h3>
            <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 24 }}>กดปุ่มด้านบนเพื่อจองแผงตลาดครับ</p>
            <button onClick={() => navigate('/home')} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: '#fff', borderRadius: 12, padding: '11px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Sarabun',sans-serif", boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>
              ไปจองแผงเลย →
            </button>
          </div>

        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#9ca3af' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
            <p style={{ fontSize: 14 }}>ไม่มีรายการในหมวดนี้</p>
          </div>

        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((b, idx) => {
              const st = STATUS[b.booking_status] || STATUS.pending
              const canCancel = ['pending', 'paid'].includes(b.booking_status)
              return (
                <div key={b.booking_id} className="booking-card"
                  style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18, padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', animation: `fadeUp 0.4s ease ${idx * 0.05}s both`, position: 'relative', overflow: 'hidden' }}>

                  {/* Color left bar */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: st.dot, borderRadius: '18px 0 0 18px' }} />

                  <div style={{ paddingLeft: 8 }}>
                    {/* Top row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 46, height: 46, borderRadius: 13, background: '#ecfdf5', border: '1.5px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Prompt',sans-serif", fontSize: 16, fontWeight: 900, color: '#059669', flexShrink: 0 }}>
                          {b.stall_number}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{b.stall_zone}</div>
                          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                            📅 {new Date(b.market_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      <div style={{ background: st.bg, color: st.text, border: `1.5px solid ${st.border}`, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {st.icon} {st.label}
                      </div>
                    </div>

                    {/* Bottom row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
                      <div>
                        <div style={{ fontFamily: "'Prompt',sans-serif", fontSize: 20, fontWeight: 900, color: '#10b981' }}>฿{b.stall_rate}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>จองเมื่อ {new Date(b.booking_date).toLocaleDateString('th-TH')}</div>
                      </div>
                      {canCancel && (
                        <button className="cancel-btn" onClick={() => handleCancel(b)}
                          style={{ background: '#fff', border: '1.5px solid #fecaca', color: '#ef4444', borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Sarabun',sans-serif", transition: 'all 0.18s' }}>
                          ✕ ยกเลิก
                        </button>
                      )}
                    </div>
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
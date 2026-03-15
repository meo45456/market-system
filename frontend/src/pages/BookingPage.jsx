import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api'
import Swal from 'sweetalert2'

const PROMPTPAY = '0808629507'

export default function BookingPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [slip, setSlip] = useState(null)
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [lockLoading, setLockLoading] = useState(true)
  const [lockError, setLockError] = useState('')
  const [timeLeft, setTimeLeft] = useState(600)
  const lockedRef = useRef(false)
  const submittedRef = useRef(false)

  if (!state?.stall) { navigate('/home'); return null }
  const { stall, date } = state

  useEffect(() => {
    if (lockedRef.current) return
    lockedRef.current = true
    const lockStall = async () => {
      try {
        await api.post(`/stalls/${stall.stall_id}/lock`, { market_date: date })
        setLockLoading(false)
      } catch (err) {
        const msg = err.response?.data?.message || 'ไม่สามารถจองแผงนี้ได้'
        setLockError(msg)
        setLockLoading(false)
        Swal.fire({ icon: 'error', title: 'ไม่สามารถจองได้', text: msg, confirmButtonColor: '#10b981' })
          .then(() => navigate('/home'))
      }
    }
    lockStall()
    return () => {
      if (!submittedRef.current) {
        api.delete(`/stalls/${stall.stall_id}/lock`, { data: { market_date: date } }).catch(() => {})
      }
    }
  }, [])

  useEffect(() => {
    if (lockLoading) return
    const t = setInterval(() => {
      setTimeLeft(p => {
        if (p <= 1) {
          clearInterval(t)
          Swal.fire({ icon: 'warning', title: 'หมดเวลา', text: 'เวลาจองหมดแล้ว กรุณาเริ่มใหม่ครับ', confirmButtonColor: '#10b981' })
            .then(() => navigate('/home'))
          return 0
        }
        return p - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [lockLoading])

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { Swal.fire('ไฟล์ใหญ่เกินไป', 'ไม่เกิน 5MB ครับ', 'warning'); return }
    setSlip(f); setPreview(URL.createObjectURL(f))
  }

  const handleSubmit = async () => {
    if (!slip) { Swal.fire({ icon: 'warning', title: 'ลืมแนบสลิป?', confirmButtonColor: '#10b981' }); return }
    const confirm = await Swal.fire({
      title: 'ยืนยันการจอง?', text: `แผง ${stall.stall_number} · ฿${stall.stall_rate}`,
      icon: 'question', showCancelButton: true, confirmButtonColor: '#10b981',
      cancelButtonColor: '#9ca3af', confirmButtonText: 'ยืนยัน', cancelButtonText: 'ยกเลิก',
    })
    if (!confirm.isConfirmed) return
    setLoading(true)
    Swal.fire({ title: 'กำลังอัปโหลด...', allowOutsideClick: false, didOpen: () => Swal.showLoading() })
    try {
      const fd = new FormData()
      fd.append('slip', slip)
      fd.append('stall_id', stall.stall_id)
      fd.append('market_date', date)
      fd.append('payment_method', 'PromptPay')
      fd.append('payment_amount', stall.stall_rate)
      await api.post('/bookings', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      submittedRef.current = true
      await Swal.fire({ icon: 'success', title: 'จองสำเร็จ! 🎉', text: 'เจ้าหน้าที่จะตรวจสอบภายใน 24 ชม.', confirmButtonColor: '#10b981', timer: 3000 })
      navigate('/my-bookings', { state: { success: true } })
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.response?.data?.message || 'ลองใหม่อีกครั้ง', confirmButtonColor: '#10b981' })
    } finally { setLoading(false) }
  }

  const handleCancel = async () => {
    try { await api.delete(`/stalls/${stall.stall_id}/lock`, { data: { market_date: date } }) } catch {}
    submittedRef.current = true
    navigate('/home')
  }

  const dateStr = new Date(date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const ss = String(timeLeft % 60).padStart(2, '0')
  const timerUrgent = timeLeft <= 120

  if (lockLoading) return (
    <div style={{ minHeight: '100vh', background: '#f8fafb', fontFamily: "'Sarabun',sans-serif" }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: '120px 20px' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', border: '4px solid #d1fae5', borderTop: '4px solid #10b981', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
        <p style={{ color: '#6b7280', fontSize: 15, fontWeight: 600 }}>กำลังจองแผง {stall.stall_number}...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  if (lockError) return null

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafb', fontFamily: "'Sarabun',sans-serif", color: '#111827' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&family=Prompt:wght@600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }
        @keyframes urgentPulse { 0%,100%{background:#fef2f2;border-color:#fecaca} 50%{background:#fee2e2;border-color:#fca5a5} }
        .upload-area:hover { border-color: #10b981 !important; background: #f0fdf4 !important; }
        .btn-cancel:hover { background: #f3f4f6 !important; }
      `}</style>

      <Navbar />
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px 80px' }}>

        {/* ── Stepper ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, animation: 'fadeUp 0.4s ease' }}>
          {[{ n: 1, label: 'แนบสลิป', active: true }, { n: 2, label: 'รออนุมัติ', active: false }, { n: 3, label: 'สำเร็จ', active: false }].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 5px', fontFamily: "'Prompt',sans-serif", background: s.active ? 'linear-gradient(135deg,#10b981,#059669)' : '#fff', border: s.active ? 'none' : '2px solid #e5e7eb', color: s.active ? '#fff' : '#d1d5db', boxShadow: s.active ? '0 4px 14px rgba(16,185,129,0.4)' : 'none' }}>{s.n}</div>
                <span style={{ fontSize: 11, color: s.active ? '#059669' : '#9ca3af', fontWeight: s.active ? 700 : 500 }}>{s.label}</span>
              </div>
              {i < 2 && <div style={{ width: 48, height: 2, background: '#e5e7eb', margin: '0 8px 20px', borderRadius: 2 }} />}
            </div>
          ))}
        </div>

        {/* ── Timer Banner ── */}
        <div style={{ borderRadius: 14, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: timerUrgent ? 'urgentPulse 1s infinite' : 'fadeUp 0.4s ease', background: timerUrgent ? '#fef2f2' : '#fffbeb', border: `1.5px solid ${timerUrgent ? '#fecaca' : '#fde68a'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20, animation: timerUrgent ? 'pulse 1s infinite' : 'none' }}>{timerUrgent ? '🚨' : '⏳'}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: timerUrgent ? '#dc2626' : '#b45309' }}>แผงถูกจองชั่วคราวให้คุณ</div>
              <div style={{ fontSize: 11, color: timerUrgent ? '#ef4444' : '#92400e', marginTop: 1 }}>กรุณาแนบสลิปและยืนยันก่อนหมดเวลา</div>
            </div>
          </div>
          <div style={{ fontFamily: "'Prompt',sans-serif", fontSize: 22, fontWeight: 900, color: timerUrgent ? '#dc2626' : '#b45309', background: timerUrgent ? '#fee2e2' : '#fef9c3', border: `1px solid ${timerUrgent ? '#fca5a5' : '#fde68a'}`, borderRadius: 10, padding: '4px 12px', minWidth: 72, textAlign: 'center' }}>
            {mm}:{ss}
          </div>
        </div>

        {/* ── Booking Info ── */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '18px', marginBottom: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb', animation: 'fadeUp 0.45s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 3, height: 18, background: 'linear-gradient(to bottom,#10b981,#059669)', borderRadius: 2 }} />
            <span style={{ fontFamily: "'Prompt',sans-serif", fontSize: 14, fontWeight: 800, color: '#064e3b' }}>รายละเอียดการจอง</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'แผงหมายเลข', value: stall.stall_number, accent: true },
              { label: 'โซน',         value: stall.stall_zone,   accent: false },
              { label: 'วันที่',       value: dateStr,            accent: false, full: true },
              { label: 'ค่าเช่า',      value: `฿${stall.stall_rate}`, accent: true },
            ].map((item) => (
              <div key={item.label} style={{ gridColumn: item.full ? '1/-1' : 'auto', background: item.accent ? '#ecfdf5' : '#f9fafb', border: `1px solid ${item.accent ? '#a7f3d0' : '#e5e7eb'}`, borderRadius: 12, padding: '11px 14px' }}>
                <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: item.accent ? 20 : 13, fontWeight: item.accent ? 900 : 600, color: item.accent ? '#059669' : '#111827', fontFamily: item.accent ? "'Prompt',sans-serif" : 'inherit', lineHeight: 1.3 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── QR PromptPay ── */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '20px', marginBottom: 14, textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb', animation: 'fadeUp 0.5s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
            <div style={{ width: 3, height: 18, background: 'linear-gradient(to bottom,#10b981,#059669)', borderRadius: 2 }} />
            <span style={{ fontFamily: "'Prompt',sans-serif", fontSize: 14, fontWeight: 800, color: '#064e3b' }}>ชำระผ่าน PromptPay</span>
          </div>
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 16, padding: 12, display: 'inline-block', marginBottom: 14 }}>
            <img src={`https://promptpay.io/${PROMPTPAY}/${stall.stall_rate}`} alt="QR"
              style={{ width: 180, height: 180, borderRadius: 10, display: 'block' }}
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
            <div style={{ display: 'none', width: 180, height: 180, background: '#f0fdf4', border: '2px dashed #a7f3d0', borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 32 }}>📱</div>
              <div style={{ fontSize: 12, color: '#059669', fontWeight: 700, textAlign: 'center' }}>โอนผ่าน PromptPay<br/>{PROMPTPAY}</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>{PROMPTPAY}</div>
          <div style={{ fontFamily: "'Prompt',sans-serif", fontSize: 32, fontWeight: 900, color: '#10b981', letterSpacing: '-0.5px' }}>฿{stall.stall_rate}</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>สแกน QR ด้านบนเพื่อโอนเงิน</div>
        </div>

        {/* ── Upload Slip ── */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '18px', marginBottom: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #e5e7eb', animation: 'fadeUp 0.55s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 3, height: 18, background: 'linear-gradient(to bottom,#10b981,#059669)', borderRadius: 2 }} />
            <span style={{ fontFamily: "'Prompt',sans-serif", fontSize: 14, fontWeight: 800, color: '#064e3b' }}>แนบสลิปโอนเงิน</span>
            {slip && <span style={{ marginLeft: 'auto', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>✓ เลือกแล้ว</span>}
          </div>
          <label className="upload-area" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 160, border: `2px dashed ${slip ? '#10b981' : '#d1d5db'}`, borderRadius: 16, cursor: 'pointer', background: slip ? '#f0fdf4' : '#fafafa', transition: 'all 0.2s', overflow: 'hidden' }}>
            {preview ? (
              <div style={{ position: 'relative', width: '100%', textAlign: 'center' }}>
                <img src={preview} alt="slip" style={{ maxHeight: 220, maxWidth: '100%', objectFit: 'contain', borderRadius: 10 }} />
                <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600, backdropFilter: 'blur(4px)' }}>เปลี่ยนรูป</div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ width: 52, height: 52, background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 12px' }}>📎</div>
                <div style={{ fontSize: 14, color: '#374151', fontWeight: 700, marginBottom: 4 }}>แตะเพื่อเลือกสลิป</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>JPG, PNG ไม่เกิน 5MB</div>
              </div>
            )}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
          </label>
        </div>

        {/* ── Action Buttons ── */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-cancel" onClick={handleCancel} disabled={loading}
            style={{ flex: 1, background: '#fff', border: '2px solid #e5e7eb', color: '#6b7280', borderRadius: 14, padding: '14px 0', fontSize: 14, cursor: 'pointer', fontWeight: 700, fontFamily: "'Sarabun',sans-serif", transition: 'all 0.18s' }}>
            ยกเลิก
          </button>
          <button onClick={handleSubmit} disabled={loading || !slip}
            style={{ flex: 2, background: (!slip || loading) ? '#e5e7eb' : 'linear-gradient(135deg,#10b981,#059669)', color: (!slip || loading) ? '#9ca3af' : '#fff', border: 'none', borderRadius: 14, padding: '14px 0', fontSize: 15, fontWeight: 800, cursor: (!slip || loading) ? 'not-allowed' : 'pointer', boxShadow: (!slip || loading) ? 'none' : '0 6px 20px rgba(16,185,129,0.4)', fontFamily: "'Prompt',sans-serif", transition: 'all 0.18s', letterSpacing: '0.2px' }}>
            {loading ? '⏳ กำลังส่ง...' : '✅ ยืนยันการจอง'}
          </button>
        </div>
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import api from '../api'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const STATUS = {
  processing: { label: 'กำลังทำรายการ', bg: '#fffbeb', text: '#d97706', border: '#fcd34d', icon: '⏳' },
  pending:    { label: 'รออนุมัติ',      bg: '#fff7ed', text: '#c2410c', border: '#fdba74', icon: '📋' },
  approved:   { label: 'อนุมัติแล้ว',    bg: '#eff6ff', text: '#1d4ed8', border: '#93c5fd', icon: '✅' },
  paid:       { label: 'รอตรวจสลิป',     bg: '#faf5ff', text: '#7c3aed', border: '#c4b5fd', icon: '💳' },
  rejected:   { label: 'ถูกปฏิเสธ',      bg: '#fef2f2', text: '#dc2626', border: '#fca5a5', icon: '❌' },
}

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
      const [b, p, s, r] = await Promise.all([
        api.get('/bookings'), api.get('/payments'),
        api.get('/stalls'), api.get('/renters'),
      ])
      setBookings(b.data.data); setPayments(p.data.data)
      setStalls(s.data.data); setRenters(r.data.data)
    } catch {}
    finally { setLoading(false) }
  }

  // ฟังก์ชันแสดงป๊อปอัพยืนยัน (SweetAlert2)
  const confirmAction = (type, b, p) => {
    const isApprove = type === 'approve';
    
    MySwal.fire({
      title: <span style={{ fontFamily: 'Prompt' }}>{isApprove ? '✨ ยืนยันอนุมัติ' : '❌ ปฏิเสธรายการ'}</span>,
      html: (
        <div style={{ fontFamily: 'Sarabun' }}>
          <p style={{ margin: '0 0 15px', color: '#666' }}>
            แผงหมายเลข {b.stall_number} | ร้าน {b.renter_shopname || b.user_name}
          </p>
          {p && (
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1px solid #eee' }}>
              <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#1d4ed8' }}>💰 ยอดโอน ฿{p.payment_amount}</p>
              <img 
                src={`http://localhost:5000/uploads/${p.payment_slipimage}`} 
                style={{ width: '100%', borderRadius: '8px', marginTop: '10px' }} 
                alt="slip"
              />
            </div>
          )}
          <p style={{ marginTop: '15px' }}>คุณแน่ใจใช่หรือไม่ที่จะทำรายการนี้?</p>
        </div>
      ),
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: isApprove ? '#0f4c2a' : '#dc2626',
      cancelButtonColor: '#94a3b8',
      reverseButtons: true,
      borderRadius: '20px'
    }).then((result) => {
      if (result.isConfirmed) {
        handleApproveProcess(b.booking_id, p?.payment_id, isApprove);
      }
    });
  };

  const handleApproveProcess = async (bookingId, paymentId, isApproved) => {
    try {
      const status = isApproved ? 'approved' : 'rejected'
      await api.patch(`/bookings/${bookingId}/status`, { booking_status: status })
      if (paymentId) {
        await api.patch(`/payments/${paymentId}/verify`, { verified: isApproved })
      }
      
      Swal.fire({
        icon: 'success',
        title: 'ดำเนินการสำเร็จ',
        timer: 1500,
        showConfirmButton: false
      });
      
      fetchAll()
    } catch (err) { 
      Swal.fire('ผิดพลาด', err.response?.data?.message || 'ไม่สามารถทำรายการได้', 'error');
    }
  }

  const handleUpdateStall = async (id, field, value) => {
    try {
      await api.put(`/stalls/${id}`, { [field]: value });
      fetchAll()
    } catch (err) { alert('อัปเดตแผงผิดพลาด') }
  }

  const bookingsWithPayments = bookings.map(b => ({
    ...b,
    payment: payments.find(p => p.booking_id === b.booking_id)
  }))

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.booking_status === 'pending' || b.booking_status === 'paid').length,
    available: stalls.filter(s => s.stall_status === 'available').length,
  }

  const tabs = [
    { id: 'bookings', label: 'คำขอ/ตรวจสลิป', icon: '📋', badge: stats.pending },
    { id: 'stalls', label: 'จัดการแผง', icon: '🏪', badge: 0 },
    { id: 'renters', label: 'ผู้เช่า', icon: '👥', badge: 0 },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f5', fontFamily: "'Sarabun', sans-serif" }}>
      <Navbar />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 16px 40px' }}>
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontFamily: "'Prompt',sans-serif", fontSize: '22px', fontWeight: '700', color: '#0f4c2a', margin: '0' }}>
            📊 Dashboard เจ้าหน้าที่
          </h2>
          <p style={{ color: '#6b7c72', fontSize: '14px' }}>จัดการตลาดครบวงจรในหน้าเดียว</p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
            <StatCard label="คำขอทั้งหมด" value={stats.total} icon="📋" bg="#eff6ff" text="#1d4ed8" />
            <StatCard label="รอดำเนินการ" value={stats.pending} icon="⏳" bg="#fff7ed" text="#c2410c" />
            <StatCard label="แผงว่าง" value={stats.available} icon="✅" bg="#f0fdf4" text="#16a34a" />
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: '10px 18px', borderRadius: '12px', fontSize: '14px', cursor: 'pointer', border: '1.5px solid',
                whiteSpace: 'nowrap', transition: '0.2s',
                background: tab === t.id ? '#0f4c2a' : '#fff', 
                borderColor: tab === t.id ? '#0f4c2a' : '#d1e3d8',
                color: tab === t.id ? '#fff' : '#4a6358', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              {t.icon} {t.label}
              {t.badge > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: '10px', padding: '0 6px', fontSize: '10px' }}>{t.badge}</span>}
            </button>
          ))}
        </div>

        {loading ? (
            <div style={{ textAlign: 'center', padding: '100px', color: '#9ca3af' }}>⏳ กำลังโหลดข้อมูล...</div>
        ) : (
          <div>
            {/* 1. TAB: BOOKINGS */}
            {tab === 'bookings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {bookingsWithPayments.length === 0 && <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>ไม่มีรายการคำขอ</p>}
                {bookingsWithPayments.map(b => {
                  const st = STATUS[b.booking_status] || STATUS.pending
                  const needsAction = b.booking_status === 'pending' || b.booking_status === 'paid'

                  return (
                    <div key={b.booking_id} style={{ background: '#fff', borderRadius: '16px', padding: '16px', border: '1px solid #e2ede7' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                           <div style={{ width: '45px', height: '45px', background: '#e8f5ee', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#0f4c2a' }}>{b.stall_number}</div>
                           <div>
                              <div style={{ fontWeight: '600', fontSize: '15px' }}>{b.renter_shopname || b.user_name}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>{b.stall_zone} • {b.renter_product}</div>
                           </div>
                        </div>
                        <div style={{ background: st.bg, color: st.text, padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>
                          {st.icon} {st.label}
                        </div>
                      </div>

                      {needsAction && (
                        <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                          <button 
                            onClick={() => confirmAction('approve', b, b.payment)}
                            style={{ flex: 1, background: b.booking_status === 'paid' ? '#7c3aed' : '#0f4c2a', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px', cursor: 'pointer', fontWeight: '600' }}
                          >
                            {b.booking_status === 'paid' ? '🔍 ตรวจสลิป & อนุมัติ' : '✅ อนุมัติการจอง'}
                          </button>
                          <button 
                            onClick={() => confirmAction('reject', b, b.payment)}
                            style={{ padding: '10px 18px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '10px', cursor: 'pointer' }}
                          >
                            ปฏิเสธ
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            
            {/* 2. TAB: STALLS */}
            {tab === 'stalls' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                {stalls.map(s => (
                  <div key={s.stall_id} style={{ background: '#fff', borderRadius: '14px', padding: '14px', border: '1px solid #e2ede7' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'Prompt', fontWeight: '700', fontSize: '18px', color: '#0f4c2a' }}>{s.stall_number}</span>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.stall_status === 'available' ? '#22c55e' : '#ef4444' }}></div>
                    </div>
                    <p style={{ fontSize: '12px', color: '#6b7c72', marginBottom: '10px' }}>โซน: {s.stall_zone}</p>
                    <input
                      type="number"
                      defaultValue={s.stall_rate}
                      style={{ width: '100%', border: '1px solid #d1e3d8', borderRadius: '6px', padding: '6px', fontSize: '13px', marginBottom: '8px' }}
                      onBlur={e => handleUpdateStall(s.stall_id, 'stall_rate', e.target.value)}
                    />
                    <select
                      value={s.stall_status}
                      onChange={e => handleUpdateStall(s.stall_id, 'stall_status', e.target.value)}
                      style={{ width: '100%', border: '1px solid #d1e3d8', borderRadius: '6px', padding: '6px', fontSize: '12px' }}
                    >
                      <option value="available">ว่าง</option>
                      <option value="occupied">ไม่ว่าง</option>
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* 3. TAB: RENTERS */}
            {tab === 'renters' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {renters.map(r => (
                  <div key={r.renter_id} style={{ background: '#fff', borderRadius: '16px', padding: '16px', border: '1px solid #e2ede7', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🛒</div>
                    <div>
                      <div style={{ fontWeight: '600' }}>{r.renter_shopname || 'ไม่มีชื่อร้าน'}</div>
                      <div style={{ fontSize: '13px', color: '#6b7c72' }}>เจ้าของ: {r.user_name} • สินค้า: {r.renter_product}</div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f4c2a' }}>📞 {r.renter_tel}</div>
                    </div>
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

function StatCard({ label, value, icon, bg, text }) {
    return (
        <div style={{ background: bg, borderRadius: '16px', padding: '16px', border: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: '20px', marginBottom: '8px' }}>{icon}</div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: text, fontFamily: 'Prompt' }}>{value}</div>
            <div style={{ fontSize: '12px', color: text, opacity: 0.8 }}>{label}</div>
        </div>
    )
}
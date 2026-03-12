import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api'
import Swal from 'sweetalert2'

const STATUS = {
  processing: { label: 'กำลังดำเนินการ', bg: '#fffbeb', text: '#d97706', border: '#fcd34d', icon: '⏳' },
  pending:    { label: 'รออนุมัติ',      bg: '#fff7ed', text: '#c2410c', border: '#fdba74', icon: '📋' },
  approved:   { label: 'อนุมัติแล้ว',    bg: '#eff6ff', text: '#1d4ed8', border: '#93c5fd', icon: '✅' },
  rejected:   { label: 'ถูกปฏิเสธ',      bg: '#fef2f2', text: '#dc2626', border: '#fca5a5', icon: '❌' },
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    fetchBookings()
    
    // ถ้ามี success state มาจากหน้าจองแผง ให้โชว์ SweetAlert2 Toast
    if (location.state?.success) {
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      })
      Toast.fire({
        icon: 'success',
        title: 'ส่งคำขอจองสำเร็จ!',
        text: 'รอเจ้าหน้าที่ตรวจสอบข้อมูลครับ'
      })
    }
  }, [location.state])

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings')
      setBookings(res.data.data)
    } catch (err) {
      console.error("Fetch bookings error:", err)
    } finally { 
      setLoading(false) 
    }
  }

  const pendingCount = bookings.filter(b => b.booking_status === 'pending').length
  const approvedCount = bookings.filter(b => b.booking_status === 'approved').length

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f5', fontFamily: "'Sarabun', sans-serif" }}>
      <Navbar />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '20px 16px 40px' }}>

        {/* Header Section */}
        <div className="fade-in" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontFamily: "'Prompt',sans-serif", fontSize: '22px', fontWeight: '700', color: '#0f4c2a', margin: '0 0 4px' }}>
              📋 การจองของฉัน
            </h2>
            <p style={{ color: '#6b7c72', fontSize: '14px', margin: 0 }}>
              {bookings.length > 0 ? `ทั้งหมด ${bookings.length} รายการ` : 'ยังไม่มีการจอง'}
            </p>
          </div>
          <button onClick={() => navigate('/')} style={{
            background: '#0f4c2a', color: '#fff', border: 'none',
            borderRadius: '12px', padding: '10px 18px', fontSize: '14px',
            fontWeight: '600', cursor: 'pointer',
            boxShadow: '0 3px 10px rgba(15,76,42,0.3)',
          }}>
            + จองแผงใหม่
          </button>
        </div>

        {/* Dashboard Stats */}
        {bookings.length > 0 && (
          <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
            {[
              { label: 'ทั้งหมด', value: bookings.length, color: '#0f4c2a', bg: '#e8f5ee' },
              { label: 'รออนุมัติ', value: pendingCount, color: '#c2410c', bg: '#fff7ed' },
              { label: 'อนุมัติแล้ว', value: approvedCount, color: '#1d4ed8', bg: '#eff6ff' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: '800', color: s.color, fontFamily: "'Prompt',sans-serif" }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: s.color, opacity: 0.8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Bookings List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
             <div className="spinner" style={{ margin: '0 auto 10px' }}></div>
             <p>กำลังโหลดรายการ...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ fontFamily: "'Prompt',sans-serif", fontSize: '18px', color: '#4a6358' }}>ยังไม่มีการจอง</h3>
            <p style={{ color: '#9ca3af', marginBottom: '20px', fontSize: '14px' }}>คุณยังไม่ได้จองแผงในขณะนี้</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bookings.map(b => {
              const st = STATUS[b.booking_status] || STATUS.pending

              return (
                <div key={b.booking_id} style={{
                  background: '#fff', borderRadius: '18px', padding: '18px',
                  border: '1px solid #e2ede7', boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '46px', height: '46px', borderRadius: '12px',
                        background: '#e8f5ee', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px', fontWeight: '700', color: '#0f4c2a',
                      }}>
                        {b.stall_number}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1a2e23' }}>{b.stall_zone}</div>
                        <div style={{ fontSize: '13px', color: '#6b7c72' }}>
                          {new Date(b.market_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      background: st.bg, color: st.text, border: `1px solid ${st.border}`,
                      padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600'
                    }}>
                      {st.icon} {st.label}
                    </div>
                  </div>

                  {/* ลบส่วนปุ่มแจ้งชำระเงินออก เหลือแค่วันที่จอง */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f0f5f2' }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f4c2a' }}>฿{b.stall_rate}</div>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>จองเมื่อ {new Date(b.booking_date).toLocaleDateString('th-TH')}</span>
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
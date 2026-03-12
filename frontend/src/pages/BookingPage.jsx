import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api'
import Swal from 'sweetalert2' // 1. นำเข้า SweetAlert2

const PROMPTPAY = '0808629507'

export default function BookingPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [slip, setSlip] = useState(null)
  const [preview, setPreview] = useState(null)
  const [method, setMethod] = useState('PromptPay')
  const [loading, setLoading] = useState(false)

  if (!state?.stall) { navigate('/'); return null }
  const { stall, date } = state

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    
    // ดักขนาดไฟล์เบื้องต้น (เช่น ไม่เกิน 5MB)
    if (f.size > 5 * 1024 * 1024) {
      Swal.fire('ไฟล์ใหญ่เกินไป', 'กรุณาเลือกรูปภาพขนาดไม่เกิน 5MB ครับ', 'warning')
      return
    }

    setSlip(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleSubmit = async () => {
    if (!slip) {
      Swal.fire({ icon: 'warning', title: 'ลืมแนบสลิปหรือเปล่า?', text: 'กรุณาแนบสลิปการโอนเงินเพื่อยืนยันด้วยนะครับ', confirmButtonColor: '#0f4c2a' })
      return
    }

    // 2. เพิ่มการยืนยันก่อนส่ง
    const confirmResult = await Swal.fire({
      title: 'ยืนยันการส่งข้อมูล?',
      text: `แผง ${stall.stall_number} วันที่ ${dateStr} ยอดเงิน ฿${stall.stall_rate}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1a7a45',
      cancelButtonColor: '#6b7c72',
      confirmButtonText: 'ใช่, ส่งข้อมูลเลย',
      cancelButtonText: 'ตรวจสอบอีกครั้ง'
    })

    if (!confirmResult.isConfirmed) return

    setLoading(true)
    
    // แสดง Loading ระหว่างรอ Server ประมวลผล
    Swal.fire({
      title: 'กำลังอัปโหลด...',
      text: 'กรุณารอสักครู่ ระบบกำลังบันทึกข้อมูลการจองของคุณ',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading() }
    })

    try {
      const fd = new FormData()
      fd.append('slip', slip)
      fd.append('stall_id', stall.stall_id)
      fd.append('market_date', date)
      fd.append('payment_method', method)
      fd.append('payment_amount', stall.stall_rate)
      
      await api.post('/bookings', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      
      // 3. แจ้งเตือนเมื่อสำเร็จ
      await Swal.fire({
        icon: 'success',
        title: 'ส่งคำขอจองเรียบร้อย!',
        text: 'เจ้าหน้าที่จะตรวจสอบสลิปภายใน 24 ชม. ครับ',
        confirmButtonColor: '#1a7a45',
        timer: 3000
      })

      navigate('/my-bookings', { state: { success: true } })
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: err.response?.data?.message || 'ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่ภายหลัง',
        confirmButtonColor: '#dc2626'
      })
    } finally { 
      setLoading(false) 
    }
  }

  const dateStr = new Date(date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f5', fontFamily: "'Sarabun', sans-serif" }}>
      <Navbar />

      <div style={{ maxWidth: '520px', margin: '0 auto', padding: '20px 16px 40px' }}>

        {/* Steps indicator */}
        <div className="fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '24px' }}>
          {[
            { n: '1', label: 'แจ้งโอน', active: true },
            { n: '2', label: 'รออนุมัติ', active: false },
            { n: '3', label: 'สำเร็จ', active: false },
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', fontSize: '13px', fontWeight: '700',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step.active ? '#0f4c2a' : '#e2ede7',
                  color: step.active ? '#fff' : '#9ca3af',
                  boxShadow: step.active ? '0 3px 10px rgba(15,76,42,0.3)' : 'none',
                }}>{step.n}</div>
                <span style={{ fontSize: '11px', fontWeight: step.active ? '600' : '400', color: step.active ? '#0f4c2a' : '#9ca3af' }}>{step.label}</span>
              </div>
              {i < 2 && <div style={{ width: '40px', height: '2px', background: '#d1e3d8', margin: '0 4px', marginBottom: '18px' }} />}
            </div>
          ))}
        </div>

        {/* Booking summary */}
        <div className="fade-in" style={{
          background: '#fff', borderRadius: '20px', padding: '20px',
          marginBottom: '14px', boxShadow: '0 2px 12px rgba(15,76,42,0.07)',
          border: '1px solid #e2ede7',
        }}>
          <h3 style={{ fontFamily: "'Prompt',sans-serif", fontSize: '15px', fontWeight: '600', color: '#0f4c2a', marginBottom: '14px' }}>
            📋 รายละเอียดการจอง
          </h3>
          <div style={{ background: '#f4f7f5', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#6b7c72' }}>แผงหมายเลข</span>
              <span style={{ fontSize: '18px', fontWeight: '700', color: '#0f4c2a', fontFamily: "'Prompt',sans-serif" }}>{stall.stall_number}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#6b7c72' }}>วันที่จอง</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1a2e23' }}>{dateStr}</span>
            </div>
            <div style={{ borderTop: '1px dashed #d1e3d8', marginTop: '6px', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#4a6358' }}>ยอดเงินที่ต้องโอน</span>
              <span style={{ fontSize: '24px', fontWeight: '800', color: '#1a7a45', fontFamily: "'Prompt',sans-serif" }}>฿{stall.stall_rate}</span>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="fade-in" style={{
          background: '#fff', borderRadius: '20px', padding: '24px 20px',
          marginBottom: '14px', boxShadow: '0 2px 12px rgba(15,76,42,0.07)',
          border: '1px solid #e2ede7', textAlign: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
             <img src="https://upload.wikimedia.org/wikipedia/commons/c/c5/PromptPay-logo.png" alt="PromptPay" style={{ height: '24px' }} />
          </div>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
            <img
              src={`https://promptpay.io/${PROMPTPAY}/${stall.stall_rate}`}
              alt="QR PromptPay"
              style={{ width: '200px', height: '200px', borderRadius: '12px', padding: '10px', background: '#fff', border: '1px solid #eee' }}
            />
          </div>
          <p style={{ fontSize: '14px', fontWeight: '700', color: '#1a2e23', margin: '0 0 4px' }}>{PROMPTPAY}</p>
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>ชื่อบัญชี: ตลาดเกษตร มอ. (ทดสอบ)</p>
        </div>

        {/* Upload Slip Area */}
        <div className="fade-in" style={{
          background: '#fff', borderRadius: '20px', padding: '20px',
          marginBottom: '16px', boxShadow: '0 2px 12px rgba(15,76,42,0.07)',
          border: '1px solid #e2ede7',
        }}>
          <h3 style={{ fontFamily: "'Prompt',sans-serif", fontSize: '15px', fontWeight: '600', color: '#0f4c2a', marginBottom: '16px' }}>
            📸 อัปโหลดหลักฐานการโอน
          </h3>

          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            width: '100%', minHeight: '180px', border: `2px dashed ${slip ? '#1a7a45' : '#d1e3d8'}`,
            borderRadius: '16px', cursor: 'pointer', background: slip ? '#f0fdf4' : '#f9fbfa',
            transition: 'all 0.2s', overflow: 'hidden'
          }}>
            {preview ? (
              <div style={{ position: 'relative', width: '100%', textAlign: 'center' }}>
                <img src={preview} alt="preview" style={{ maxHeight: '220px', maxWidth: '100%', objectFit: 'contain' }} />
                <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>เปลี่ยนรูป</div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>📁</div>
                <p style={{ fontSize: '14px', color: '#4a6358', fontWeight: '600' }}>คลิกเพื่อเลือกรูปสลิป</p>
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>รองรับไฟล์ภาพ JPG, PNG</p>
              </div>
            )}
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
          </label>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => navigate('/')} disabled={loading} style={{
            flex: 1, border: '1.5px solid #d1e3d8', background: '#fff',
            color: '#6b7c72', borderRadius: '14px', padding: '14px',
            fontSize: '15px', cursor: 'pointer', fontWeight: '600'
          }}>
            ยกเลิก
          </button>
          <button onClick={handleSubmit} disabled={loading || !slip} style={{
            flex: 2,
            background: (!slip || loading) ? '#9ca3af' : 'linear-gradient(135deg, #1a7a45, #0a3d20)',
            color: '#fff', border: 'none', borderRadius: '14px', padding: '14px',
            fontSize: '15px', fontWeight: '700', cursor: (!slip || loading) ? 'not-allowed' : 'pointer',
            boxShadow: (!slip || loading) ? 'none' : '0 4px 15px rgba(15,76,42,0.35)',
            transition: 'all 0.2s'
          }}>
            {loading ? 'กำลังส่งข้อมูล...' : 'ยืนยันการจอง'}
          </button>
        </div>
      </div>
    </div>
  )
}
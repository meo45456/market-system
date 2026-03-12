import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api'
import Swal from 'sweetalert2' // 1. นำเข้า SweetAlert2

export default function PaymentPage() {
  const { bookingId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const booking = state?.booking

  const [slip, setSlip] = useState(null)
  const [preview, setPreview] = useState(null)
  const [method, setMethod] = useState('K-Plus')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setSlip(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    // 2. ใช้ Swal แจ้งเตือนกรณีลืมเลือกไฟล์
    if (!slip) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาเลือกไฟล์',
        text: 'รบกวนอัปโหลดภาพสลิปเพื่อยืนยันการชำระเงิน',
        confirmButtonColor: '#16a34a',
      })
      return
    }

    setLoading(true)
    setError('')
    
    // แสดง Loading แบบดูดีระหว่างอัปโหลดไฟล์
    Swal.fire({
      title: 'กำลังส่งหลักฐาน...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      }
    })

    try {
      const formData = new FormData()
      formData.append('slip', slip)
      formData.append('booking_id', bookingId)
      formData.append('payment_method', method)
      formData.append('payment_amount', booking?.stall_rate || 0)

      await api.post('/payments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      // 3. แจ้งเตือนสำเร็จ
      Swal.fire({
        icon: 'success',
        title: 'ส่งหลักฐานสำเร็จ!',
        text: 'เจ้าหน้าที่จะตรวจสอบความเรียบร้อยโดยเร็วที่สุด',
        confirmButtonColor: '#16a34a',
        confirmButtonText: 'ตกลง',
      }).then(() => {
        navigate('/my-bookings')
      })

    } catch (err) {
      const msg = err.response?.data?.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล'
      setError(msg)
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: msg,
        confirmButtonColor: '#dc2626',
      })
    } finally {
      setLoading(false)
    }
  }

  // --- ส่วน JSX (Tailwind) ของคุณคงเดิมไว้ ---
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">แจ้งชำระเงิน</h2>
          <p className="text-gray-500 text-sm mb-6">อัปโหลดสลิปการโอนเงิน</p>

          {booking && (
            <div className="bg-green-50 rounded-xl p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">แผง</span>
                <span className="font-semibold">{booking.stall_number} — {booking.stall_zone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">วันที่ตลาด</span>
                <span className="font-medium">
                  {new Date(booking.market_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-gray-600 font-medium">ยอดที่ต้องชำระ</span>
                <span className="font-bold text-green-700">฿{booking.stall_rate}</span>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">ช่องทางชำระเงิน</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-400"
              value={method}
              onChange={e => setMethod(e.target.value)}
            >
              <option>K-Plus</option>
              <option>SCB Easy</option>
              <option>PromptPay</option>
              <option>Cash</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">สลิปการโอนเงิน</label>
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-green-400 transition bg-gray-50">
              {preview ? (
                <img src={preview} alt="slip" className="h-full object-contain rounded-xl" />
              ) : (
                <div className="text-center">
                  <div className="text-3xl mb-2">📎</div>
                  <p className="text-sm text-gray-500">คลิกเพื่อเลือกไฟล์</p>
                  <p className="text-xs text-gray-400">JPG, PNG ไม่เกิน 5MB</p>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
              ⚠️ {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/my-bookings')}
              className="flex-1 border border-gray-300 text-gray-600 py-2.5 rounded-xl hover:bg-gray-50 transition"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !slip}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-50"
            >
              {loading ? 'กำลังส่ง...' : 'ส่งหลักฐาน'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
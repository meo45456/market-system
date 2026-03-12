import axios from 'axios'

const api = axios.create({
  // 1. ตรวจสอบว่ามี https:// นำหน้า และปิดท้ายด้วย /api
  baseURL: import.meta.env.VITE_API_URL || 'https://market-system-production.up.railway.app/api'
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 2. ถ้าเป็น 401 (Unauthorized) และไม่ได้อยู่ที่หน้า Login ให้ทำการ Logout
    if (error.response?.status === 401) {
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
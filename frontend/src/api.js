import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
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
    if (error.response?.status === 401) {
      // เช็คว่าถ้าไม่ใช่หน้า login ถึงจะทำการ logout และ redirect
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
    }
    // ส่ง error กลับไปให้หน้า LoginPage เพื่อเข้า block catch และโชว์ Swal
    return Promise.reject(error)
  }
)

export default api
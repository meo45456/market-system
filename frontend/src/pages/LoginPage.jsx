import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import Swal from 'sweetalert2'

export default function LoginPage() {
  const [form, setForm] = useState({ user_name: '', user_password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!form.user_name.trim() || !form.user_password.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'ข้อมูลไม่ครบ',
          text: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน',
          confirmButtonColor: '#1a7a45',
        });
        return;
      }

      setLoading(true);
      
      try {
        const res = await api.post('/auth/login', form);
        
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
        });
        
        await Toast.fire({
          icon: 'success',
          title: 'เข้าสู่ระบบสำเร็จ',
          text: `ยินดีต้อนรับคุณ ${res.data.user.user_name}`
        });

        login(res.data.user, res.data.token);
        navigate(res.data.user.user_role === 'staff' ? '/staff' : '/');
        
      } catch (err) {
        console.error("Login Debug:", err); // ดูใน Console ว่า err โครงสร้างเป็นยังไง

        // ดึงข้อความ Error จากหลายแหล่งให้แม่นยำขึ้น
        const msg = err.response?.data?.message || err.message || 'การเชื่อมต่อเซิร์ฟเวอร์ขัดข้อง';
        
        Swal.fire({
          icon: 'error',
          title: 'เข้าสู่ระบบไม่สำเร็จ',
          text: msg,
          confirmButtonColor: '#1a7a45',
          confirmButtonText: 'ตกลง',
          // เอา animation class ออกชั่วคราวถ้ายังไม่ได้ลง animate.css เพื่อป้องกันบั๊ก
          showClass: {
            popup: 'animate__animated animate__fadeInDown'
          }
        });
      } finally { 
        setLoading(false); 
      }
    };

  const inp = {
    width: '100%', border: '1.5px solid #d1e3d8', borderRadius: '12px',
    padding: '13px 16px', fontSize: '15px', outline: 'none',
    background: '#f9fbfa', transition: 'all 0.2s', color: '#1a2e23',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0a3d20 0%, #0f4c2a 35%, #1a7a45 65%, #2dba6a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', fontFamily: "'Sarabun', sans-serif",
    }}>
      {/* Decorative background blobs */}
      <div style={{ position: 'fixed', top: '-100px', right: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

      <div className="fade-in" style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '76px', height: '76px', margin: '0 auto 16px',
            background: 'rgba(255,255,255,0.15)', borderRadius: '22px', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '38px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          }}>🌾</div>
          <h1 style={{ fontFamily: "'Prompt', sans-serif", fontSize: '26px', fontWeight: '700', color: '#fff', margin: '0 0 6px' }}>
            ตลาดเกษตร มอ.
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px' }}>ระบบจองแผงตลาดออนไลน์</p>
        </div>

        <div style={{
          background: '#fff', borderRadius: '24px', padding: '32px 28px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        }}>
          <h2 style={{ fontFamily: "'Prompt', sans-serif", fontSize: '18px', fontWeight: '600', color: '#0f4c2a', marginBottom: '22px' }}>
            เข้าสู่ระบบ
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4a6358', marginBottom: '6px' }}>ชื่อผู้ใช้</label>
              <input
                type="text" placeholder="Username" style={inp}
                value={form.user_name}
                onChange={e => setForm({ ...form, user_name: e.target.value })}
                onFocus={e => { e.target.style.borderColor = '#1a7a45'; e.target.style.boxShadow = '0 0 0 3px rgba(26,122,69,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#d1e3d8'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#4a6358', marginBottom: '6px' }}>รหัสผ่าน</label>
              <input
                type="password" placeholder="Password" style={inp}
                value={form.user_password}
                onChange={e => setForm({ ...form, user_password: e.target.value })}
                onFocus={e => { e.target.style.borderColor = '#1a7a45'; e.target.style.boxShadow = '0 0 0 3px rgba(26,122,69,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#d1e3d8'; e.target.style.boxShadow = 'none' }}
              />
            </div>
            
            <button type="submit" disabled={loading} style={{
              width: '100%',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #1a7a45, #0a3d20)',
              color: '#fff', border: 'none', borderRadius: '12px',
              padding: '14px', fontSize: '15px', fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 4px 15px rgba(15,76,42,0.35)',
            }}>
              {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '14px', color: '#8a9e96', marginTop: '18px' }}>
            ยังไม่มีบัญชี?{' '}
            <Link to="/register" style={{ color: '#1a7a45', fontWeight: '600', textDecoration: 'none' }}>
              ลงทะเบียนที่นี่
            </Link>
          </p>
        </div>

        {/* Demo Section */}
        <div style={{
          marginTop: '16px', background: 'rgba(255,255,255,0.08)',
          borderRadius: '14px', padding: '14px 18px',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>
            👤 บัญชีทดสอบ (Demo)
          </p>
          <div style={{ display: 'grid', gap: '4px' }}>
             <p style={{ color: '#fff', fontSize: '12px', margin: 0 }}>เจ้าหน้าที่: <code style={{background: 'rgba(0,0,0,0.2)', padding: '2px 4px'}}>admin_staff</code></p>
             <p style={{ color: '#fff', fontSize: '12px', margin: 0 }}>ผู้เช่า: <code style={{background: 'rgba(0,0,0,0.2)', padding: '2px 4px'}}>somchai_66</code></p>
          </div>
        </div>
      </div>
    </div>
  )
}
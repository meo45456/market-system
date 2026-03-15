import { useNavigate } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const floatRef = useRef(null)

  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity = '1'
          e.target.style.transform = 'translateY(0)'
        }
      })
    }, { threshold: 0.1 })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const stalls = [
    { n: 'A01', status: 'av' }, { n: 'A02', status: 'pr' },
    { n: 'A03', status: 'oc' }, { n: 'A04', status: 'av' },
    { n: 'B01', status: 'oc' }, { n: 'B02', status: 'av' },
    { n: 'B03', status: 'av' }, { n: 'B04', status: 'pr' },
  ]
  const statusMap = {
    av: { label: 'ว่าง',   color: '#4ade80', bg: 'rgba(74,222,128,.12)', border: 'rgba(74,222,128,.3)' },
    pr: { label: 'รอชำระ', color: '#fbbf24', bg: 'rgba(251,191,36,.12)', border: 'rgba(251,191,36,.3)' },
    oc: { label: 'ไม่ว่าง',color: '#f87171', bg: 'rgba(248,113,113,.1)', border: 'rgba(248,113,113,.25)' },
  }
  const features = [
    { icon: '💳', title: 'ชำระผ่าน PromptPay', desc: 'สแกน QR โอนเงิน แนบสลิปได้ในหน้าเดียว' },
    { icon: '📱', title: 'ใช้ได้ทุกอุปกรณ์', desc: 'มือถือ แท็บเล็ต คอม เปิดเบราว์เซอร์ทำได้เลย' },
    { icon: '👨‍💼', title: 'Dashboard เจ้าหน้าที่', desc: 'ตรวจสลิป อนุมัติ ดูข้อมูลทั้งหมดในหน้าเดียว' },
    { icon: '🏪', title: 'แบ่งโซนชัดเจน', desc: 'อาหาร ผลไม้ เสื้อผ้า ของแห้ง — จองได้เฉพาะโซนที่ลงทะเบียน' },
  ]
  const homePath = user?.user_role === 'staff' ? '/staff' : '/home'

  return (
    <div style={{ fontFamily: "'Sarabun',sans-serif", background: '#050f07', color: '#fff', overflowX: 'hidden', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=Prompt:wght@600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        @keyframes fadeUp    { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes shimmerTx { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes pulse     { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:.9;transform:scale(1.06)} }
        @keyframes livedot   { 0%,100%{opacity:1} 50%{opacity:.25} }
        @keyframes gradMove  { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes borderGlow{ 0%,100%{box-shadow:0 0 0 0 rgba(45,186,106,0)} 50%{box-shadow:0 0 0 6px rgba(45,186,106,0.15)} }

        .reveal { opacity:0; transform:translateY(28px); transition:opacity .7s ease, transform .7s ease; }
        .fh  { animation:fadeUp .7s ease both; }
        .fh1 { animation:fadeUp .7s .1s ease both; }
        .fh2 { animation:fadeUp .7s .22s ease both; }
        .fh3 { animation:fadeUp .7s .34s ease both; }
        .float-anim { animation:float 5s ease-in-out infinite; }

        .shimmer-text {
          background: linear-gradient(135deg,#2dba6a 0%,#a7f3d0 45%,#2dba6a 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; animation: shimmerTx 3.5s linear infinite;
        }

        .btn-primary {
          padding: 15px 34px;
          background: linear-gradient(135deg,#10b981,#059669);
          border: none; border-radius: 14px; color: #fff;
          font-size: 15px; font-weight: 700; cursor: pointer;
          font-family: 'Sarabun',sans-serif;
          box-shadow: 0 6px 24px rgba(16,185,129,.4);
          transition: all .22s;
        }
        .btn-primary:hover { transform:translateY(-3px); box-shadow:0 14px 36px rgba(16,185,129,.55); }

        .btn-ghost {
          padding: 15px 34px;
          background: rgba(255,255,255,.07);
          border: 1.5px solid rgba(255,255,255,.18); border-radius: 14px;
          color: rgba(255,255,255,.85); font-size: 15px; font-weight: 600;
          cursor: pointer; font-family: 'Sarabun',sans-serif; transition: all .2s;
        }
        .btn-ghost:hover { background:rgba(255,255,255,.13); border-color:rgba(255,255,255,.3); }

        .nav-login:hover { background:rgba(255,255,255,.1) !important; }
        .nav-register:hover { transform:translateY(-1px); box-shadow:0 8px 24px rgba(16,185,129,.55) !important; }

        .feat-sm {
          background: rgba(255,255,255,.025);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 22px; padding: 22px 24px;
          display: flex; gap: 16px; align-items: flex-start;
          transition: all .22s; cursor: default;
        }
        .feat-sm:hover { border-color:rgba(16,185,129,.3) !important; background:rgba(16,185,129,.04) !important; transform:translateY(-3px); }

        .feat-big {
          background: rgba(255,255,255,.025);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 22px; overflow: hidden; transition: all .25s; cursor: default;
        }
        .feat-big:hover { border-color:rgba(16,185,129,.25) !important; }
        .feat-big:hover .feat-img { transform:scale(1.04); opacity:.85 !important; }

        .stall-cell { transition: all .15s; }
        .stall-cell:hover { transform:translateY(-2px); }

        .step-card {
          background: rgba(255,255,255,.025);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 20px; padding: 24px;
          transition: all .22s;
        }
        .step-card:hover { border-color:rgba(16,185,129,.25); transform:translateY(-3px); }

        @media(max-width:768px) {
          .floatcard-wrap { display:none !important; }
          .hero-grid { grid-template-columns:1fr !important; }
          .feat-layout { grid-template-columns:1fr !important; }
          .feat-big-row { grid-row:auto !important; }
          .steps-grid { grid-template-columns:1fr !important; }
          .stats-row { flex-direction:column !important; gap:16px !important; }
          .sbi { border-right:none !important; border-bottom:1px solid rgba(255,255,255,.08); padding-bottom:16px !important; }
          .sbi:last-child { border-bottom:none; }
          .nav-wrap { padding:12px 20px !important; }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav className="nav-wrap" style={{ position:'fixed', top:0, left:0, right:0, zIndex:999, padding:'13px 40px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(5,15,7,.85)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,.06)' }}>
        <div style={{ fontFamily:"'Prompt',sans-serif", fontSize:17, fontWeight:800, display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, background:'linear-gradient(135deg,#10b981,#059669)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, boxShadow:'0 4px 12px rgba(16,185,129,.4)' }}>🌾</div>
          ตลาดเกษตร มอ.
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {user ? (
            <button onClick={() => navigate(homePath)} style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)', padding:'7px 16px', borderRadius:20, fontSize:13, color:'#6ee7b7', fontWeight:700, cursor:'pointer', fontFamily:"'Sarabun',sans-serif", transition:'all .2s' }}>
              {user.user_role === 'staff' ? '🧑‍💼' : '🛒'} {user.user_name} →
            </button>
          ) : (
            <>
              <button className="nav-login" onClick={() => navigate('/login')} style={{ padding:'8px 18px', borderRadius:20, fontSize:13, fontWeight:600, cursor:'pointer', background:'transparent', border:'1.5px solid rgba(255,255,255,.2)', color:'rgba(255,255,255,.8)', fontFamily:"'Sarabun',sans-serif", transition:'all .2s' }}>เข้าสู่ระบบ</button>
              <button className="nav-register" onClick={() => navigate('/register')} style={{ padding:'8px 18px', borderRadius:20, fontSize:13, fontWeight:700, cursor:'pointer', background:'linear-gradient(135deg,#10b981,#059669)', border:'none', color:'#fff', fontFamily:"'Sarabun',sans-serif", transition:'all .2s', boxShadow:'0 4px 16px rgba(16,185,129,.4)' }}>สมัครฟรี</button>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight:'100vh', position:'relative', overflow:'hidden', display:'flex', alignItems:'center' }}>
        <img src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=60&auto=format" alt="ตลาดเกษตร"
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:.3, filter:'saturate(1.3) brightness(.85)' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(110deg,rgba(5,15,7,.98) 0%,rgba(5,15,7,.88) 45%,rgba(5,15,7,.35) 75%,rgba(5,15,7,.1) 100%)' }} />
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:220, background:'linear-gradient(to top,#050f07,transparent)' }} />

        {/* Ambient glows */}
        <div style={{ position:'absolute', width:600, height:600, background:'rgba(16,185,129,.08)', borderRadius:'50%', filter:'blur(100px)', top:-150, right:'5%', animation:'pulse 8s ease-in-out infinite', pointerEvents:'none' }} />
        <div style={{ position:'absolute', width:400, height:400, background:'rgba(6,95,46,.4)', borderRadius:'50%', filter:'blur(90px)', bottom:'5%', left:'-5%', animation:'pulse 10s ease-in-out infinite 2s', pointerEvents:'none' }} />

        <div className="hero-grid" style={{ position:'relative', zIndex:2, maxWidth:1100, margin:'0 auto', padding:'120px 40px 80px', width:'100%', display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center' }}>
          <div>
            {/* Badge */}
            <div className="fh" style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)', padding:'7px 16px', borderRadius:30, fontSize:12, fontWeight:700, color:'#6ee7b7', letterSpacing:'.05em', marginBottom:28 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#10b981', display:'inline-block', animation:'livedot 2s infinite' }} />
              ระบบจองแผงออนไลน์ มอ.
            </div>

            {/* Headline */}
            <h1 className="fh1" style={{ fontFamily:"'Prompt',sans-serif", fontSize:'clamp(38px,5vw,64px)', fontWeight:900, lineHeight:1.08, marginBottom:22, letterSpacing:-1.5 }}>
              จองแผงตลาด<br />
              <span className="shimmer-text">ง่าย เร็ว ปลอดภัย</span>
            </h1>

            <p className="fh2" style={{ fontSize:16, color:'rgba(255,255,255,.55)', lineHeight:1.85, maxWidth:460, marginBottom:40, fontWeight:400 }}>
              เลือกโซน → เลือกแผง → โอนเงิน<br />รอเจ้าหน้าที่อนุมัติ ทำได้ทุกที่ทุกเวลา
            </p>

            {/* CTA Buttons */}
            <div className="fh3" style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              {user ? (
                <>
                  <button className="btn-primary" onClick={() => navigate(homePath)}>
                    {user.user_role === 'staff' ? '📊 ไปที่ Dashboard' : '🗺️ ไปที่แผงผัง →'}
                  </button>
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'14px 20px', background:'rgba(16,185,129,.08)', border:'1px solid rgba(16,185,129,.2)', borderRadius:14, fontSize:13, color:'#6ee7b7', fontWeight:600 }}>
                    ✓ เข้าสู่ระบบแล้ว — <strong style={{ color:'#4ade80' }}>{user.user_name}</strong>
                  </div>
                </>
              ) : (
                <>
                  <button className="btn-primary" onClick={() => navigate('/register')}>🛒 จองแผงเลย</button>
                  <button className="btn-ghost" onClick={() => navigate('/login')}>เข้าสู่ระบบ →</button>
                </>
              )}
            </div>

            {/* Trust badges */}
            <div className="fh3" style={{ display:'flex', gap:20, marginTop:36, flexWrap:'wrap' }}>
              {[{ v:'200+', l:'ผู้เช่า' }, { v:'4', l:'โซนสินค้า' }, { v:'24h', l:'อนุมัติภายใน' }].map(b => (
                <div key={b.l} style={{ textAlign:'center' }}>
                  <div style={{ fontFamily:"'Prompt',sans-serif", fontSize:22, fontWeight:900, color:'#10b981' }}>{b.v}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:1 }}>{b.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Floating stall card */}
          <div className="floatcard-wrap" style={{ display:'flex', justifyContent:'center' }}>
            <div className="float-anim" ref={floatRef} style={{ background:'rgba(8,28,14,.8)', border:'1px solid rgba(16,185,129,.18)', borderRadius:24, padding:22, width:310, backdropFilter:'blur(24px)', boxShadow:'0 32px 80px rgba(0,0,0,.5), 0 0 0 1px rgba(16,185,129,.08)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                <div style={{ fontFamily:"'Prompt',sans-serif", fontSize:14, fontWeight:800, color:'rgba(255,255,255,.9)' }}>📍 แผงผังวันนี้</div>
                <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(16,185,129,.12)', border:'1px solid rgba(16,185,129,.25)', padding:'3px 10px', borderRadius:10, fontSize:10, fontWeight:800, color:'#6ee7b7' }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'#10b981', display:'inline-block', animation:'livedot 1.5s infinite' }} /> LIVE
                </div>
              </div>
              {['🍱 โซนอาหารสด', '🍎 โซนผลไม้'].map((zone, zi) => (
                <div key={zone}>
                  <div style={{ fontSize:10, color:'rgba(255,255,255,.3)', fontWeight:700, letterSpacing:'.08em', marginBottom:8, marginTop: zi > 0 ? 12 : 0 }}>{zone}</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
                    {stalls.slice(zi*4, zi*4+4).map(s => {
                      const st = statusMap[s.status]
                      return (
                        <div key={s.n} className="stall-cell" style={{ borderRadius:10, padding:'9px 4px', textAlign:'center', cursor:'pointer', background:st.bg, border:`1.5px solid ${st.border}` }}>
                          <div style={{ fontFamily:"'Prompt',sans-serif", fontSize:12, fontWeight:900, color:st.color }}>{s.n}</div>
                          <div style={{ fontSize:8, marginTop:2, color:st.color, opacity:.75 }}>{st.label}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              {/* Legend */}
              <div style={{ display:'flex', gap:12, marginTop:12, flexWrap:'wrap' }}>
                {[['#4ade80','ว่าง'],['#fbbf24','รอชำระ'],['#f87171','ไม่ว่าง']].map(([c,l]) => (
                  <div key={l} style={{ display:'flex', alignItems:'center', gap:4, fontSize:10, color:'rgba(255,255,255,.45)' }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:c }} /> {l}
                  </div>
                ))}
              </div>

              {/* Mini stats */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6, marginTop:14, paddingTop:14, borderTop:'1px solid rgba(255,255,255,.07)' }}>
                {[['#4ade80','7','ว่าง'],['#fbbf24','2','รอชำระ'],['#f87171','3','ไม่ว่าง']].map(([c,n,l]) => (
                  <div key={l} style={{ textAlign:'center' }}>
                    <div style={{ fontFamily:"'Prompt',sans-serif", fontSize:22, fontWeight:900, color:c }}>{n}</div>
                    <div style={{ fontSize:9, color:'rgba(255,255,255,.35)', marginTop:1 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div style={{ background:'linear-gradient(135deg,#061a0d,#0a2e14)', borderTop:'1px solid rgba(16,185,129,.1)', borderBottom:'1px solid rgba(16,185,129,.1)', padding:'28px 40px' }}>
        <div className="stats-row" style={{ maxWidth:900, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {[['200+','ผู้เช่าลงทะเบียน'],['12','แผงค้าขาย'],['4','โซนสินค้า'],['24h','อนุมัติภายใน']].map(([n,l],i) => (
            <div key={l} className="sbi" style={{ flex:1, textAlign:'center', padding:'0 32px', borderRight:i<3?'1px solid rgba(255,255,255,.08)':'none' }}>
              <div style={{ fontFamily:"'Prompt',sans-serif", fontSize:32, fontWeight:900, background:'linear-gradient(135deg,#10b981,#6ee7b7)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{n}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginTop:3, fontWeight:500 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding:'80px 40px', background:'#050f07', position:'relative' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 20% 50%,rgba(16,185,129,.04) 0%,transparent 60%)', pointerEvents:'none' }} />
        <div className="reveal" style={{ textAlign:'center', marginBottom:52 }}>
          <div style={{ fontSize:11, fontWeight:800, color:'#10b981', letterSpacing:'.15em', textTransform:'uppercase', marginBottom:10 }}>ขั้นตอนง่ายๆ</div>
          <div style={{ fontFamily:"'Prompt',sans-serif", fontSize:'clamp(24px,3vw,36px)', fontWeight:900, lineHeight:1.25, letterSpacing:-.5 }}>จองแผงใน 3 ขั้นตอน</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,.4)', marginTop:10 }}>ไม่ซับซ้อน ทำได้ทันที</div>
        </div>
        <div className="steps-grid reveal" style={{ maxWidth:900, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {[
            { n:'01', icon:'📅', title:'เลือกวันและแผง', desc:'เลือกวันที่ต้องการออกร้าน ดูสถานะแผงแบบ real-time แล้วกดจอง' },
            { n:'02', icon:'💸', title:'โอนเงินและแนบสลิป', desc:'สแกน QR PromptPay โอนเงิน แล้วแนบสลิปยืนยันในระบบได้เลย' },
            { n:'03', icon:'✅', title:'รอรับการอนุมัติ', desc:'เจ้าหน้าที่ตรวจสอบและอนุมัติภายใน 24 ชม. แจ้งผลทันที' },
          ].map((s, i) => (
            <div key={s.n} className="step-card reveal" style={{ animationDelay:`${i*0.1}s` }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <div style={{ fontFamily:"'Prompt',sans-serif", fontSize:11, fontWeight:900, color:'rgba(16,185,129,.4)', letterSpacing:'.1em' }}>{s.n}</div>
                <div style={{ flex:1, height:1, background:'rgba(16,185,129,.15)' }} />
              </div>
              <div style={{ fontSize:32, marginBottom:14 }}>{s.icon}</div>
              <div style={{ fontFamily:"'Prompt',sans-serif", fontSize:16, fontWeight:800, marginBottom:8, color:'rgba(255,255,255,.9)' }}>{s.title}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.4)', lineHeight:1.7 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding:'80px 40px', background:'#061209', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 80% 50%,rgba(16,185,129,.05) 0%,transparent 60%)', pointerEvents:'none' }} />
        <div className="reveal" style={{ textAlign:'center', marginBottom:52 }}>
          <div style={{ fontSize:11, fontWeight:800, color:'#10b981', letterSpacing:'.15em', textTransform:'uppercase', marginBottom:10 }}>ทำไมต้องใช้ระบบเรา</div>
          <div style={{ fontFamily:"'Prompt',sans-serif", fontSize:'clamp(24px,3vw,36px)', fontWeight:900, lineHeight:1.25, letterSpacing:-.5 }}>จัดการแผงตลาดครบในที่เดียว</div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,.4)', marginTop:10 }}>ออกแบบมาเพื่อผู้เช่าและเจ้าหน้าที่โดยเฉพาะ</div>
        </div>
        <div className="feat-layout reveal" style={{ maxWidth:1000, margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {/* Big card */}
          <div className="feat-big feat-big-row" style={{ gridRow:'span 2' }}>
            <div style={{ height:250, overflow:'hidden', position:'relative' }}>
              <img className="feat-img" src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80" alt="ตลาด"
                style={{ width:'100%', height:'100%', objectFit:'cover', opacity:.65, transition:'.35s', filter:'saturate(1.3)' }} />
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(5,12,7,.95) 0%,transparent 60%)' }} />
              <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'20px 24px' }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(16,185,129,.15)', border:'1px solid rgba(16,185,129,.25)', padding:'4px 10px', borderRadius:8, fontSize:11, fontWeight:700, color:'#6ee7b7', marginBottom:10 }}>🗺️ Real-time</div>
                <div style={{ fontFamily:"'Prompt',sans-serif", fontSize:18, fontWeight:800, lineHeight:1.3 }}>เห็นสถานะแผงสดๆ ทุกครั้ง</div>
              </div>
            </div>
            <div style={{ padding:'20px 24px 24px' }}>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.45)', lineHeight:1.75 }}>ระบบ lock แผงอัตโนมัติเมื่อมีคนทำรายการ ป้องกันการจองซ้อนกัน ผู้เช่าคนอื่นเห็นสถานะทันทีแบบ real-time</div>
            </div>
          </div>
          {/* Small cards */}
          {features.map(f => (
            <div key={f.title} className="feat-sm">
              <div style={{ width:46, height:46, background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.18)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{f.icon}</div>
              <div>
                <div style={{ fontFamily:"'Prompt',sans-serif", fontSize:14, fontWeight:800, marginBottom:5, color:'rgba(255,255,255,.9)' }}>{f.title}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', lineHeight:1.7 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:'90px 40px', position:'relative', overflow:'hidden', textAlign:'center' }}>
        <img src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1600&q=80" alt=""
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:.15, filter:'saturate(.7)' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(5,15,7,.98),rgba(6,40,20,.95))' }} />
        <div style={{ position:'absolute', width:700, height:400, background:'rgba(16,185,129,.06)', borderRadius:'50%', top:'50%', left:'50%', transform:'translate(-50%,-50%)', filter:'blur(80px)', pointerEvents:'none' }} />

        <div className="reveal" style={{ position:'relative', zIndex:2, maxWidth:580, margin:'0 auto' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.22)', padding:'6px 16px', borderRadius:20, fontSize:12, color:'#6ee7b7', fontWeight:700, marginBottom:22 }}>
            🌾 {user ? 'ยินดีต้อนรับกลับมาครับ' : 'เริ่มต้นวันนี้ ฟรี!'}
          </div>
          <div style={{ fontFamily:"'Prompt',sans-serif", fontSize:'clamp(28px,4vw,46px)', fontWeight:900, lineHeight:1.18, marginBottom:16, letterSpacing:-.8 }}>
            {user ? `สวัสดีครับ ${user.user_name} 👋` : 'พร้อมจองแผงแล้วหรือยัง?'}
          </div>
          <div style={{ fontSize:15, color:'rgba(255,255,255,.45)', marginBottom:36, lineHeight:1.75 }}>
            {user
              ? `คุณเข้าสู่ระบบในฐานะ${user.user_role === 'staff' ? 'เจ้าหน้าที่' : 'ผู้เช่า'} กดปุ่มด้านล่างเพื่อไปที่ระบบได้เลยครับ`
              : 'สมัครสมาชิกฟรี ไม่มีค่าใช้จ่าย\nเริ่มจองแผงตลาดเกษตร มอ. ได้เลยทันที'
            }
          </div>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            {user ? (
              <button className="btn-primary" onClick={() => navigate(homePath)} style={{ fontSize:16, padding:'16px 44px' }}>
                {user.user_role === 'staff' ? '📊 ไปที่ Dashboard' : '🗺️ ไปที่แผงผัง →'}
              </button>
            ) : (
              <>
                <button className="btn-primary" onClick={() => navigate('/register')} style={{ fontSize:16, padding:'16px 44px' }}>สมัครสมาชิกฟรี →</button>
                <button className="btn-ghost" onClick={() => navigate('/login')}>เข้าสู่ระบบ</button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:'#030a04', padding:'22px 40px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, borderTop:'1px solid rgba(255,255,255,.05)' }}>
        <div style={{ fontFamily:"'Prompt',sans-serif", fontSize:14, fontWeight:800, display:'flex', alignItems:'center', gap:8, color:'rgba(255,255,255,.5)' }}>
          <div style={{ width:26, height:26, background:'linear-gradient(135deg,#10b981,#059669)', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>🌾</div>
          ตลาดเกษตร มอ.
        </div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,.2)' }}>© 2025 ระบบจองแผงตลาดออนไลน์ · มหาวิทยาลัยสงขลานครินทร์</div>
      </footer>
    </div>
  )
}
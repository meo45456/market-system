require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// --- แก้ไขส่วนนี้ ---
// อนุญาตให้เข้าถึงจากทุก Domain เพื่อความสะดวกในการทดสอบ หรือระบุ URL ของ Vercel
app.use(cors({
  origin: '*', 
  credentials: true
}));
// -------------------

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ตรวจสอบโฟลเดอร์ uploads สำหรับเก็บรูปภาพ
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stalls', require('./routes/stalls'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/renters', require('./routes/renters'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ระบบทำงานปกติ' });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'ไม่พบ Endpoint นี้' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'เกิดข้อผิดพลาด' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  // แก้ไข Log เล็กน้อยเพื่อให้ดูง่ายขึ้นบนระบบ Cloud
  console.log(`🚀 Server running on port ${PORT}`);
});
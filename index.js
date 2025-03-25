// Điểm khởi đầu dành riêng cho Replit
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// Thêm route đặc biệt cho Replit
app.get('/', (req, res) => {
  res.send('Mikrotik Dashboard API is running. Please visit /backend/ for the actual application.');
});

// Chuyển hướng đến ứng dụng chính
app.use((req, res) => {
  res.redirect('/backend/');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Replit verification server running on port ${PORT}`);
  console.log(`The main application is running in the /backend/ directory`);
});
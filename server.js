// Máy chủ Express để phục vụ frontend và chuyển tiếp đến backend
const express = require('express');
const path = require('path');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Khởi tạo ứng dụng Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Thêm route kiểm tra đặc biệt cho Replit
app.get('/replit-alive-check', (req, res) => {
  res.set('Content-Type', 'text/html');
  res.send('<html><body><h1>Server is alive</h1><p>The Mikrotik Dashboard server is running correctly.</p></body></html>');
});

// Phục vụ thư mục tĩnh từ backend
app.use(express.static(path.join(__dirname, 'Mikrotik-Dashboard/backend/public')));

// Chuyển tiếp tất cả yêu cầu API đến backend
app.use('/api', (req, res) => {
  // Đơn giản chuyển tiếp đến đường dẫn API của backend
  const apiPath = req.originalUrl;
  
  // Thực hiện yêu cầu đến backend
  const backendUrl = 'http://localhost:3001' + apiPath;
  
  // Gửi thông báo rằng đang chuyển tiếp
  console.log(`Chuyển tiếp yêu cầu đến: ${backendUrl}`);
  
  // Sử dụng fetch để gọi API backend
  fetch(backendUrl)
    .then(backendRes => backendRes.json())
    .then(data => {
      res.json(data);
    })
    .catch(error => {
      console.error('Lỗi khi chuyển tiếp yêu cầu:', error);
      res.status(500).json({ error: 'Lỗi khi kết nối đến backend server', details: error.message });
    });
});

// Chuyển hướng tất cả các yêu cầu khác đến index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'Mikrotik-Dashboard/backend/public/index.html'));
});

// Khởi động backend server
const { exec } = require('child_process');
const backendProcess = exec('cd Mikrotik-Dashboard/backend && PORT=3001 node server.js', (error, stdout, stderr) => {
  if (error) {
    console.error(`Lỗi khi khởi động backend: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Backend stderr: ${stderr}`);
    return;
  }
  console.log(`Backend stdout: ${stdout}`);
});

// Log khi backend có dữ liệu mới
backendProcess.stdout.on('data', (data) => {
  console.log(`Backend: ${data}`);
});

backendProcess.stderr.on('data', (data) => {
  console.error(`Backend error: ${data}`);
});

// Khởi động server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mikrotik Dashboard server đang chạy tại cổng ${PORT}`);
  console.log(`Truy cập: http://localhost:${PORT}/`);
});
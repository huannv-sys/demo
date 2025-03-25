const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const PORT = 5000;

// Khởi tạo ứng dụng Express
const app = express();

// Sử dụng middleware cors
app.use(cors());

// Đường dẫn đến file HTML gốc
const indexPath = path.join(__dirname, 'index.html');

// Kiểm tra file HTML tồn tại không
if (fs.existsSync(indexPath)) {
  console.log('Tìm thấy file index.html');
} else {
  console.log('CẢNH BÁO: Không tìm thấy file index.html tại:', indexPath);
  console.log('Danh sách files trong thư mục frontend:');
  try {
    const files = fs.readdirSync(__dirname);
    files.forEach(file => {
      console.log('- ' + file);
    });
  } catch (err) {
    console.error('Lỗi khi đọc thư mục:', err);
  }
}

// Phục vụ file tĩnh từ thư mục gốc
app.use(express.static(__dirname));

// Route mặc định
app.get('/', (req, res) => {
  console.log('Nhận yêu cầu đến trang chủ /');
  res.sendFile(indexPath);
});

// Fallback cho các route khác
app.get('*', (req, res) => {
  console.log(`Yêu cầu đến: ${req.url}`);
  res.sendFile(indexPath);
});

// Bắt lỗi 404 và 500
app.use((req, res, next) => {
  console.log('Lỗi 404:', req.url);
  res.status(404).send('Không tìm thấy trang');
});

app.use((err, req, res, next) => {
  console.error('Lỗi server:', err);
  res.status(500).send('Lỗi máy chủ nội bộ');
});

// Khởi động server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server đang chạy tại http://0.0.0.0:${PORT}`);
  console.log(`Truy cập: http://0.0.0.0:${PORT}/`);
});
#!/bin/bash

# Script cài đặt Mikrotik Dashboard trên Ubuntu
# Hướng dẫn sử dụng: 
# 1. Cấp quyền thực thi: chmod +x install_ubuntu.sh
# 2. Chạy script với quyền sudo: sudo ./install_ubuntu.sh

# Đảm bảo script chạy với quyền root
if [ "$EUID" -ne 0 ]
  then echo "Vui lòng chạy script với quyền sudo"
  exit
fi

echo "=== Bắt đầu cài đặt Mikrotik Dashboard ==="

# Cập nhật hệ thống
echo "Đang cập nhật hệ thống..."
apt-get update && apt-get upgrade -y

# Cài đặt các phụ thuộc
echo "Đang cài đặt các gói phụ thuộc..."
apt-get install -y curl git build-essential

# Cài đặt Node.js (phiên bản mới nhất)
echo "Đang cài đặt Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 
apt-get install -y nodejs

# Kiểm tra phiên bản Node.js & NPM
echo "Đã cài đặt Node.js $(node -v) và NPM $(npm -v)"

# Tạo thư mục cho ứng dụng
APP_DIR="/opt/mikrotik-dashboard"
echo "Tạo thư mục ứng dụng tại $APP_DIR..."
mkdir -p $APP_DIR

# Clone repository hoặc sao chép từ thư mục hiện tại
if [ -d "./Mikrotik-Dashboard" ]; then
  echo "Sao chép từ thư mục hiện tại..."
  cp -r ./Mikrotik-Dashboard $APP_DIR/
  cp ./server.js $APP_DIR/
else
  echo "Tải mã nguồn từ GitHub..."
  cd $APP_DIR
  git clone https://github.com/toke420/Mikrotik-Dashboard.git
  # Tạo tệp server.js cho proxy
  cat > $APP_DIR/server.js << 'EOF'
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

// Thêm route kiểm tra đặc biệt cho server
app.get('/health-check', (req, res) => {
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
  
  // Ghi log chuyển tiếp
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
EOF
fi

# Cài đặt các phụ thuộc
echo "Cài đặt các phụ thuộc Node.js cho root server..."
cd $APP_DIR
npm install cors dotenv express http-proxy-middleware node-routeros

echo "Cài đặt các phụ thuộc cho backend server..."
cd $APP_DIR/Mikrotik-Dashboard/backend
npm install

# Tạo file môi trường
if [ ! -f "$APP_DIR/Mikrotik-Dashboard/backend/.env" ]; then
  echo "Tạo file môi trường mẫu..."
  cat > $APP_DIR/Mikrotik-Dashboard/backend/.env << 'EOF'
PORT=5000

# Dinh nghia router tai site 1 (HCM)
ROUTER1_IP=192.168.88.1
ROUTER1_NAME=Router chinh HCM
ROUTER1_USER=admin
ROUTER1_PASSWORD=
ROUTER1_MODEL=hAP lite
ROUTER1_CLIENT=Office
ROUTER1_SITE_ID=hcm
ROUTER1_SITE_NAME=Chi nhanh Ho Chi Minh
ROUTER1_SITE_LOCATION=Quan 1, TP. Ho Chi Minh

# Router backup tai site 1 (HCM)
ROUTER2_IP=192.168.88.2
ROUTER2_NAME=Router backup HCM
ROUTER2_USER=admin
ROUTER2_PASSWORD=
ROUTER2_MODEL=hEX
ROUTER2_CLIENT=Office
ROUTER2_SITE_ID=hcm
ROUTER2_SITE_NAME=Chi nhanh Ho Chi Minh
ROUTER2_SITE_LOCATION=Quan 1, TP. Ho Chi Minh

# Dinh nghia router tai site 2 (Ha Noi)
ROUTER3_IP=192.168.89.1
ROUTER3_NAME=Router chinh Ha Noi
ROUTER3_USER=admin
ROUTER3_PASSWORD=
ROUTER3_MODEL=RB3011
ROUTER3_CLIENT=Office
ROUTER3_SITE_ID=hanoi
ROUTER3_SITE_NAME=Chi nhanh Ha Noi
ROUTER3_SITE_LOCATION=Quan Cau Giay, Ha Noi
EOF
fi

# Tạo service systemd
echo "Tạo service systemd để chạy ứng dụng..."
cat > /etc/systemd/system/mikrotik-dashboard.service << EOF
[Unit]
Description=Mikrotik Dashboard
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node $APP_DIR/server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Cấp quyền và khởi động service
echo "Cấp quyền và khởi động service..."
chmod 755 /etc/systemd/system/mikrotik-dashboard.service
systemctl daemon-reload
systemctl enable mikrotik-dashboard.service
systemctl start mikrotik-dashboard.service

# Hiển thị trạng thái
echo "Kiểm tra trạng thái service..."
systemctl status mikrotik-dashboard.service

echo ""
echo "=== Cài đặt hoàn tất ==="
echo "Ứng dụng Mikrotik Dashboard đã được cài đặt tại $APP_DIR"
echo "Bạn có thể truy cập ứng dụng tại: http://<IP_máy_chủ>:5000"
echo ""
echo "Để cấu hình các router, hãy sửa file .env tại $APP_DIR/Mikrotik-Dashboard/backend/.env"
echo "Để khởi động lại service: sudo systemctl restart mikrotik-dashboard"
echo "Để xem log: sudo journalctl -u mikrotik-dashboard -f"
echo ""
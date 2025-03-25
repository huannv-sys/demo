#!/bin/bash

# Script tạo bản phân phối cho Mikrotik Dashboard
# Sử dụng: ./create_release.sh

VERSION="1.0.0"
PACKAGE_NAME="mikrotik-dashboard-$VERSION"

echo "=== Tạo bản phân phối Mikrotik Dashboard v$VERSION ==="

# Tạo thư mục tạm để chứa các tệp cần thiết
echo "Đang tạo thư mục tạm..."
mkdir -p $PACKAGE_NAME

# Sao chép các tệp cần thiết
echo "Đang sao chép các tệp..."

# Tệp chính
cp server.js $PACKAGE_NAME/
cp install_ubuntu.sh $PACKAGE_NAME/
cp README.md $PACKAGE_NAME/
cp huong_dan_bao_mat_api.md $PACKAGE_NAME/
cp -r attached_assets $PACKAGE_NAME/

# Sao chép thư mục Mikrotik-Dashboard
mkdir -p $PACKAGE_NAME/Mikrotik-Dashboard/backend
cp -r Mikrotik-Dashboard/backend/public $PACKAGE_NAME/Mikrotik-Dashboard/backend/
cp -r Mikrotik-Dashboard/backend/server.js $PACKAGE_NAME/Mikrotik-Dashboard/backend/
cp -r Mikrotik-Dashboard/backend/routers.js $PACKAGE_NAME/Mikrotik-Dashboard/backend/
cp -r Mikrotik-Dashboard/backend/package.json $PACKAGE_NAME/Mikrotik-Dashboard/backend/
cp -r Mikrotik-Dashboard/backend/package-lock.json $PACKAGE_NAME/Mikrotik-Dashboard/backend/

# Tạo file .env mẫu (không chứa mật khẩu thật)
cat > $PACKAGE_NAME/Mikrotik-Dashboard/backend/.env << 'EOF'
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

# Tạo file package.json cho root
cat > $PACKAGE_NAME/package.json << EOF
{
  "name": "mikrotik-dashboard",
  "version": "$VERSION",
  "description": "Ứng dụng giám sát và quản lý thiết bị MikroTik RouterOS với hỗ trợ tiếng Việt",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "keywords": ["mikrotik", "routeros", "dashboard", "monitoring", "vietnam"],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "http-proxy-middleware": "^3.0.3",
    "node-routeros": "^1.6.8"
  },
  "engines": {
    "node": ">=14.0.0"
  }
}
EOF

# Tạo file hướng dẫn cài đặt nhanh
cat > $PACKAGE_NAME/INSTALL.txt << EOF
# HƯỚNG DẪN CÀI ĐẶT NHANH MIKROTIK DASHBOARD

## Cài đặt tự động trên Ubuntu/Debian:

1. Cấp quyền thực thi cho script cài đặt:
   chmod +x install_ubuntu.sh

2. Chạy script cài đặt với quyền root:
   sudo ./install_ubuntu.sh

3. Sau khi cài đặt, truy cập ứng dụng tại:
   http://<địa_chỉ_IP_máy_chủ>:5000

## Cài đặt thủ công:

1. Cài đặt Node.js và npm

2. Cài đặt các phụ thuộc:
   npm install

3. Cài đặt các phụ thuộc cho backend:
   cd Mikrotik-Dashboard/backend
   npm install
   cd ../..

4. Sửa file .env trong Mikrotik-Dashboard/backend/ để cấu hình thông tin router

5. Khởi động ứng dụng:
   node server.js

## Cấu hình router:

Xem chi tiết trong file README.md và huong_dan_bao_mat_api.md

## File log:

Nếu cài đặt bằng script:
- sudo journalctl -u mikrotik-dashboard -f

Nếu chạy thủ công:
- Xem trực tiếp trong cửa sổ dòng lệnh
EOF

# Tạo file LICENSE
cat > $PACKAGE_NAME/LICENSE << 'EOF'
ISC License

Copyright (c) 2024

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
EOF

# Nén tất cả vào file zip
echo "Đang tạo file nén..."
zip -r $PACKAGE_NAME.zip $PACKAGE_NAME

# Nén tất cả vào file tar.gz
echo "Đang tạo file tar.gz..."
tar -czf $PACKAGE_NAME.tar.gz $PACKAGE_NAME

# Xóa thư mục tạm
echo "Đang dọn dẹp..."
rm -rf $PACKAGE_NAME

echo "=== Hoàn tất ==="
echo "Đã tạo các file phân phối:"
echo "- $PACKAGE_NAME.zip"
echo "- $PACKAGE_NAME.tar.gz"
echo ""
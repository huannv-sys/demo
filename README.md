<<<<<<< HEAD
# Mikrotik Dashboard

Đây là ứng dụng giám sát và quản lý thiết bị Mikrotik RouterOS với giao diện tiếng Việt. Ứng dụng cho phép theo dõi trạng thái, cấu hình và hiệu suất của nhiều thiết bị RouterOS trên nhiều site khác nhau.

![Dashboard Screenshot](attached_assets/image_1742906976088.png)

## Tính năng chính

- **🌐 Hỗ trợ nhiều site và nhiều thiết bị**: Quản lý nhiều router trên nhiều chi nhánh/site khác nhau
- **📊 Giám sát tài nguyên hệ thống**: CPU, bộ nhớ, uptime, phiên bản RouterOS
- **🔌 Quản lý giao diện mạng**: Thông tin chi tiết các interface, địa chỉ IP, thống kê lưu lượng
- **📶 Quản lý mạng không dây**: Cấu hình WiFi, danh sách client kết nối 
- **🔥 Quản lý tường lửa và NAT**: Xem và quản lý các quy tắc tường lửa và NAT
- **🖧 Thông tin bảng định tuyến và ARP**: Xem bảng định tuyến và bảng ARP
- **📝 Xem nhật ký hệ thống**: Truy cập nhật ký hoạt động của thiết bị
- **👥 Quản lý người dùng**: Xem danh sách người dùng trên thiết bị
- **🔧 Hỗ trợ dịch vụ mạng**: Thông tin về DHCP, DNS, SNMP, NTP

## Cài đặt

### 1. Cài đặt trên Ubuntu

Sử dụng script cài đặt tự động:

```bash
# Clone repo 
git clone https://github.com/yourusername/mikrotik-dashboard.git
cd mikrotik-dashboard

# Cấp quyền thực thi cho script
chmod +x install_ubuntu.sh

# Chạy script cài đặt (yêu cầu quyền root)
sudo ./install_ubuntu.sh
```

Sau khi cài đặt, ứng dụng sẽ được cấu hình để tự động khởi động cùng hệ thống và chạy tại cổng 5000.

### 2. Cài đặt thủ công

Nếu bạn muốn cài đặt thủ công:

```bash
# Clone repo
git clone https://github.com/yourusername/mikrotik-dashboard.git
cd mikrotik-dashboard

# Cài đặt các phụ thuộc
npm install

# Cài đặt các phụ thuộc cho backend
cd Mikrotik-Dashboard/backend
npm install

# Quay lại thư mục gốc
cd ../..

# Khởi động ứng dụng
node server.js
```

## Cấu hình

Thông tin kết nối đến các router được cấu hình trong file `.env` trong thư mục `Mikrotik-Dashboard/backend/`. Bạn có thể thêm nhiều router bằng cách thêm các biến môi trường mới:

```
# Dinh nghia router tai site 1 (HCM)
ROUTER1_IP=192.168.88.1
ROUTER1_NAME=Router chinh HCM
ROUTER1_USER=admin  
ROUTER1_PASSWORD=password_cua_ban
ROUTER1_MODEL=hAP lite
ROUTER1_CLIENT=Office
ROUTER1_SITE_ID=hcm
ROUTER1_SITE_NAME=Chi nhanh Ho Chi Minh
ROUTER1_SITE_LOCATION=Quan 1, TP. Ho Chi Minh
```

Định dạng cho router thứ 2, 3, v.v. tương tự, chỉ cần thay đổi số trong tên biến (ROUTER2_*, ROUTER3_*, v.v.).

## Bảo mật

Lưu ý: Mật khẩu trong file `.env` được lưu dưới dạng plain text. Đảm bảo rằng file này chỉ có thể truy cập bởi người dùng được ủy quyền.

## Quản lý dịch vụ

Nếu sử dụng script cài đặt trên Ubuntu, bạn có thể:

- **Khởi động dịch vụ**: `sudo systemctl start mikrotik-dashboard`
- **Dừng dịch vụ**: `sudo systemctl stop mikrotik-dashboard`  
- **Khởi động lại dịch vụ**: `sudo systemctl restart mikrotik-dashboard`
- **Xem trạng thái**: `sudo systemctl status mikrotik-dashboard`
- **Xem log**: `sudo journalctl -u mikrotik-dashboard -f`

## Sử dụng

Sau khi cài đặt và khởi động, truy cập ứng dụng qua:
```
http://<IP_máy_chủ>:5000
```

## Yêu cầu hệ thống

- Node.js 14.0.0 trở lên
- Quyền truy cập API đến các thiết bị RouterOS
- Các thiết bị RouterOS hỗ trợ API

## Các vấn đề thường gặp

**Không thể kết nối đến router:**
- Đảm bảo IP, tên người dùng và mật khẩu chính xác
- Đảm bảo router có bật API (IP → Services → API)
- Kiểm tra firewall trên router không chặn kết nối API

## Giấy phép

ISC License
=======
# demo
>>>>>>> e0561e75b6ff563be81190096864d2570327f73b

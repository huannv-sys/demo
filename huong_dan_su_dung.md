# Hướng dẫn sử dụng Mikrotik Dashboard

## Mục lục

1. [Tổng quan](#tổng-quan)
2. [Đăng nhập](#đăng-nhập)
3. [Trang chủ](#trang-chủ)
4. [Quản lý Site](#quản-lý-site)
5. [Chi tiết Router](#chi-tiết-router)
   - [Thông tin hệ thống](#thông-tin-hệ-thống)
   - [Giao diện mạng](#giao-diện-mạng)
   - [Dịch vụ](#dịch-vụ)
   - [Tường lửa](#tường-lửa)
   - [Định tuyến](#định-tuyến)
   - [Nhật ký](#nhật-ký)
6. [Xử lý sự cố](#xử-lý-sự-cố)

## Tổng quan

Mikrotik Dashboard là ứng dụng giám sát và quản lý thiết bị Mikrotik RouterOS. Ứng dụng cho phép bạn theo dõi và quản lý nhiều thiết bị RouterOS trên nhiều địa điểm/site khác nhau.

## Đăng nhập

Ứng dụng hiện không yêu cầu đăng nhập vào giao diện web. Tuy nhiên, nó sử dụng thông tin đăng nhập RouterOS được cấu hình trong file `.env` để kết nối đến các thiết bị.

## Trang chủ

Trang chủ hiển thị tổng quan về tất cả các router và site trong hệ thống:

- **Tổng quan các site**: Hiển thị danh sách các site và số lượng router tại mỗi site
- **Trạng thái router**: Hiển thị router nào đang hoạt động/ngoại tuyến
- **Thông tin phiên bản và thời gian hoạt động**: Phiên bản RouterOS và thời gian hoạt động của mỗi thiết bị

Từ trang chủ, bạn có thể điều hướng đến:
- Danh sách Site
- Chi tiết về một Router cụ thể
- Trang cấu hình
- Trang trợ giúp

## Quản lý Site

Trang Site hiển thị tất cả các site và các router thuộc mỗi site:

- **Danh sách site**: Tên site, địa điểm và số lượng router
- **Danh sách router theo site**: Router tại mỗi site, bao gồm trạng thái và thông tin cơ bản

Khi nhấp vào một site, bạn sẽ thấy thông tin chi tiết về site đó và tất cả các router thuộc site.

## Chi tiết Router

Khi chọn một router cụ thể, bạn sẽ thấy một bảng điều khiển chi tiết với các thông tin sau:

### Thông tin hệ thống

- **Thông tin thiết bị**: Tên, mẫu, số seri
- **Phiên bản RouterOS**: Phiên bản hiện tại và thời gian build
- **Tài nguyên hệ thống**: CPU, bộ nhớ, không gian đĩa
- **Thông số sức khỏe**: Nhiệt độ, điện áp, thông tin cảm biến
- **Thời gian hoạt động**: Thời gian router đã chạy kể từ lần khởi động cuối

### Giao diện mạng

- **Danh sách giao diện**: Tất cả các giao diện mạng với trạng thái
- **Thống kê lưu lượng**: Lưu lượng TX/RX trên mỗi giao diện
- **Địa chỉ IP**: Tất cả các địa chỉ IP được cấu hình
- **Bảng ARP**: Ánh xạ địa chỉ IP sang MAC hiện tại

### Dịch vụ

- **DHCP**: Cấu hình máy chủ DHCP và danh sách thuê hiện tại
- **Mạng không dây**: Cấu hình WiFi và thông tin khách
- **DNS**: Cấu hình DNS
- **SNMP**: Trạng thái và cấu hình SNMP
- **NTP**: Cấu hình máy chủ thời gian

### Tường lửa

- **Quy tắc lọc**: Danh sách quy tắc lọc tường lửa
- **Quy tắc NAT**: Danh sách quy tắc NAT
- **Trạng thái kết nối**: Kết nối mạng hiện tại đi qua router

### Định tuyến

- **Bảng định tuyến**: Tất cả các tuyến đường cấu hình
- **Định tuyến động**: Thông tin OSPF, BGP (nếu được cấu hình)

### Nhật ký

- **Nhật ký hệ thống**: Nhật ký gần đây từ router
- **Người dùng**: Danh sách người dùng có quyền truy cập vào router

## Xử lý sự cố

### Không thể kết nối đến router:

1. **Kiểm tra thông tin kết nối trong file .env**:
   - Địa chỉ IP có chính xác không?
   - Tên người dùng và mật khẩu có chính xác không?

2. **Kiểm tra API RouterOS**:
   - Đảm bảo dịch vụ API được bật trên router
   - Thực hiện lệnh này trên Winbox Terminal: `/ip service print`
   - Dịch vụ API nên ở trạng thái không bị vô hiệu hóa

3. **Kiểm tra tường lửa RouterOS**:
   - Đảm bảo cổng API (8728) không bị chặn
   - Kiểm tra quy tắc tường lửa: `/ip firewall filter print`

4. **Kiểm tra kết nối mạng**:
   - Đảm bảo máy chủ có thể ping đến router
   - Kiểm tra kết nối cổng: `telnet <router_ip> 8728`

5. **Kiểm tra quyền của người dùng API**:
   - Người dùng cần ít nhất quyền đọc và API
   - Kiểm tra trong Winbox: System > Users

### Có router nhưng không hiển thị dữ liệu:

1. **Kiểm tra nhật ký ứng dụng** để biết lỗi
2. **Kiểm tra quyền người dùng API** - một số API có thể cần quyền bổ sung
3. **Kiểm tra phiên bản RouterOS** - một số API yêu cầu phiên bản RouterOS nhất định

### Lỗi lưu lượng không cập nhật:

1. **Kiểm tra/làm mới trang**
2. **Kiểm tra quyền đọc interface trên RouterOS**
3. **Kiểm tra nhật ký lỗi** trên console ứng dụng
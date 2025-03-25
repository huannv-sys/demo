# Hướng dẫn bảo mật API RouterOS

## Mục lục
1. [Tổng quan](#tổng-quan)
2. [Bật API dịch vụ](#bật-api-dịch-vụ)
3. [Thiết lập tài khoản API riêng biệt](#thiết-lập-tài-khoản-api-riêng-biệt)
4. [Giới hạn quyền truy cập API](#giới-hạn-quyền-truy-cập-api)
5. [Cấu hình tường lửa](#cấu-hình-tường-lửa)
6. [Sử dụng SSL](#sử-dụng-ssl)
7. [Giám sát truy cập API](#giám-sát-truy-cập-api)

## Tổng quan

API RouterOS là một giao diện mạnh mẽ cho phép quản lý thiết bị MikroTik từ xa. Tuy nhiên, không được bảo mật đúng cách, API có thể trở thành một điểm yếu bảo mật. Tài liệu này hướng dẫn cách bảo mật API RouterOS cho ứng dụng Mikrotik Dashboard.

## Bật API dịch vụ

Đầu tiên, bạn cần đảm bảo dịch vụ API đã được bật trên RouterOS:

1. Đăng nhập vào RouterOS thông qua Winbox hoặc WebFig
2. Đi đến **IP → Services**
3. Tìm dịch vụ "api" và nhấp đúp để chỉnh sửa
4. Đảm bảo rằng dịch vụ được bật (Enabled = Yes)
5. Cân nhắc thay đổi cổng mặc định (8728) sang một cổng khác
6. Giới hạn địa chỉ IP có thể truy cập API bằng cách nhập danh sách trong ô "Available From"

```
/ip service
set api disabled=no port=8728 address=10.0.0.0/24
```

## Thiết lập tài khoản API riêng biệt

Thay vì sử dụng tài khoản "admin" mặc định, hãy tạo một tài khoản riêng cho API:

1. Đi đến **System → Users**
2. Nhấp vào nút "+" để thêm người dùng mới
3. Đặt tên người dùng là "api-user" hoặc tương tự
4. Đặt mật khẩu mạnh, phức tạp (ít nhất 12 ký tự, kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt)
5. Trong tab "Groups", chọn một nhóm có quyền hạn phù hợp (xem phần tiếp theo) hoặc tạo nhóm mới

```
/user add name=api-user password=StrongPassword@123 group=read
```

## Giới hạn quyền truy cập API

Tạo nhóm người dùng riêng cho API với quyền hạn tối thiểu cần thiết:

1. Đi đến **System → Users → Groups**
2. Nhấp vào nút "+" để thêm nhóm mới
3. Đặt tên nhóm là "api-access"
4. Trong tab "Policies", chỉ bật những quyền cần thiết, ví dụ:
   - **read**: Đọc cấu hình và trạng thái
   - **api**: Truy cập API
   - **test**: Thực hiện các công cụ chẩn đoán

```
/user group add name=api-access policy=read,api,test,!local,!telnet,!ssh,!ftp,!reboot,!write,!policy,!password,!sniff,!sensitive,!romon
```

Sau đó, gán người dùng API vào nhóm này:

```
/user set api-user group=api-access
```

## Cấu hình tường lửa

Giới hạn truy cập vào cổng API bằng quy tắc tường lửa:

```
/ip firewall filter add chain=input protocol=tcp dst-port=8728 src-address=10.0.0.0/24 action=accept comment="Allow API from trusted network"
/ip firewall filter add chain=input protocol=tcp dst-port=8728 action=drop comment="Drop other API connections"
```

## Sử dụng SSL

Nếu có thể, hãy sử dụng API-SSL thay vì API thông thường để mã hóa giao tiếp:

1. Đi đến **IP → Services**
2. Tìm dịch vụ "api-ssl" và nhấp đúp để chỉnh sửa
3. Đảm bảo rằng dịch vụ được bật (Enabled = Yes)
4. Đặt cổng (mặc định là 8729)
5. Giới hạn địa chỉ IP có thể truy cập API-SSL

```
/ip service set api-ssl disabled=no port=8729 address=10.0.0.0/24
```

Để sử dụng API-SSL trong ứng dụng Mikrotik Dashboard, cần cấu hình trong file .env:

```
ROUTER1_USE_SSL=true
ROUTER1_SSL_PORT=8729
```

## Giám sát truy cập API

Bật ghi nhật ký cho các kết nối API để giám sát truy cập:

```
/system logging add topics=api action=disk
```

Kiểm tra các kết nối trực tiếp:

```
/system resource session print where user=api-user
```

## Kết luận

Bảo mật API RouterOS là rất quan trọng, đặc biệt khi sử dụng công cụ như Mikrotik Dashboard. Bằng cách tuân theo các khuyến nghị trên, bạn có thể giảm thiểu rủi ro bảo mật đồng thời vẫn tận dụng được sức mạnh của API RouterOS.
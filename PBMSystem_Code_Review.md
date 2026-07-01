# TÀI LIỆU REVIEW TOÀN BỘ CODE & LUỒNG HOẠT ĐỘNG HỆ THỐNG
## HỆ THỐNG QUẢN LÝ BÃI ĐỖ XE THÔNG MINH (PM SYSTEM)

> [!NOTE]
> Tài liệu này được thiết kế chi tiết nhằm phục vụ công tác báo cáo, thuyết trình và giải trình logic code trước hội đồng đánh giá môn học (SOC/COCs). Bạn có thể sao chép toàn bộ nội dung file này dán trực tiếp vào Microsoft Word để tạo file `.docx` báo cáo.

---

# PHẦN 1: THIẾT KẾ KIẾN TRÚC & PHÂN QUYỀN HỆ THỐNG

Hệ thống hoạt động trên mô hình Client-Server chia tách rõ ràng:
1. **Client App (Cổng khách hàng):** React + Vite SPA, kết nối API qua cổng bảo mật JWT.
2. **Staff App (Cổng nhân viên bốt bảo vệ):** React + Vite SPA, chạy độc lập để quét vé QR và camera biển số xe (OCR).
3. **Backend API:** ASP.NET Core 8 Web API kết nối cơ sở dữ liệu MongoDB và tích hợp các bên thứ 3 (VNPay, MailKit SMTP).

---

## 🔑 1. PHÂN QUYỀN VÀ BẢO VỆ ĐƯỜNG DẪN (ROUTING GUARD)

### 📌 File: `ProtectedRoute.tsx`
*   **Vị trí:** `parking-system/FE/src/components/auth/ProtectedRoute.tsx`
*   **Cách thức hoạt động:**
    1. Đọc JWT Token từ `localStorage` thông qua hàm `localStorage.getItem('token')`.
    2. Nếu không tồn tại Token, component sẽ chặn hiển thị trang yêu cầu và kích hoạt lệnh chuyển hướng bằng component `<Navigate to="/login" replace />`.
    3. Nếu đã đăng nhập, cho phép hiển thị component con bằng cách trả về `<Outlet />`.

```typescript
// Luồng xử lý chi tiết trong code:
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  
  // Trả về Outlet để load tiếp component con nếu hợp lệ, ngược lại bắt về login
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};
```

### 📌 File: `AdminRoute.tsx`
*   **Vị trí:** `parking-system/FE/src/components/auth/AdminRoute.tsx`
*   **Cách thức hoạt động:**
    1. Đầu tiên kiểm tra Token giống như `ProtectedRoute`.
    2. Giải mã hoặc lấy thông tin vai trò từ thông tin user lưu trữ (`localStorage.getItem('user')`).
    3. Kiểm tra xem trường `role` có giá trị là `Admin` hay không.
    4. Nếu đúng quyền, render trang tương ứng. Ngược lại, chuyển hướng người dùng về trang chủ bằng `<Navigate to="/" replace />`.

---

# PHẦN 2: CHI TIẾT LUỒNG HOẠT ĐỘNG CHÍNH CỦA HỆ THỐNG

Hệ thống điều khiển toàn bộ chu trình đỗ xe qua 3 luồng chính dưới đây:

## 🔄 LUỒNG 1: ĐẶT CHỖ TRƯỚC VÀ THANH TOÁN (RESERVATION & PAYMENT)

```mermaid
sequenceDiagram
    actor KH as Khách Hàng (FE App)
    participant BE as Backend API
    participant DB as MongoDB Database
    participant VN as Cổng VNPay

    KH->>BE: Gửi yêu cầu đặt chỗ (CheckInRequest) tại /api/ParkingSessions/checkin
    Note over BE: Thực hiện Overlap Check (Kiểm tra trùng giờ đỗ)
    BE->>DB: Truy vấn các phiên đỗ đã Active/Pending cùng ngày, cùng bãi, cùng slot
    alt Bị trùng khung giờ
        BE-->>KH: Trả về 400 BadRequest ("Vị trí đỗ đã được đặt...")
    else Hợp lệ
        BE->>DB: Tạo mới ParkingSession (Status = "PendingPayment")
        BE-->>KH: Trả về thông tin QR code tạm thời
    end
    KH->>BE: Yêu cầu tạo URL thanh toán tại api/Payments/vnpay/create-payment-url
    BE-->>KH: Trả về URL thanh toán VNPay
    KH->>VN: Chuyển hướng người dùng sang VNPay để quét mã thanh toán
    VN->>BE: VNPay callback kết quả về api/Payments/vnpay/verify (IPN)
    Note over BE: Kiểm tra chữ ký và ResponseCode == "00" (Thành công)
    BE->>DB: Cập nhật ParkingSession (Status = "Active")
    BE->>KH: Gửi Email xác nhận đặt chỗ kèm mã QR đỗ xe
```

---

## 🔄 LUỒNG 2: XE VÀO BÃI ĐỖ (ENTRY CHECK-IN)

1. Xe di chuyển đến trước bốt bảo vệ cổng vào.
2. Camera OCR quét biển số xe, nhân viên bấm quét mã QR trên điện thoại khách hàng.
3. Ứng dụng Staff App gửi yêu cầu `POST /api/ParkingSessions/gate-scan` kèm theo mã QR code và ảnh biển số xe chụp được.
4. **Backend xử lý:**
   * Tìm kiếm phiên đỗ xe trùng khớp với QR Code.
   * So sánh biển số xe thực tế từ camera quét được với biển số xe đăng ký trong vé.
   * Kiểm tra xem biển số xe này có thuộc danh sách đen (`Blacklist`) không.
   * Nếu hợp lệ, đổi trạng thái phiên thành `Active`, lưu thời gian vào thực tế (`EntryTime = DateTime.UtcNow`), mở barrier tự động.

---

## 🔄 LUỒNG 3: XE RA BÃI ĐỖ (EXIT CHECK-OUT)

1. Xe di chuyển ra cổng kiểm soát ra.
2. Nhân viên bảo vệ quét mã QR đỗ xe của khách hàng.
3. Hệ thống Staff App tự động gọi API `POST /api/ParkingSessions/checkout`.
4. **Backend xử lý:**
   * Lấy thời gian vào thực tế (`EntryTime`) và thời gian ra thực tế (`ExitTime = DateTime.UtcNow`) để tính tổng số phút đỗ xe.
   * Gọi hàm `CalculateFee(entryTime, exitTime, vehicleType)` để tính toán tổng tiền dựa trên bảng cấu hình giá của Admin.
   * Trừ đi số tiền khách hàng đã thanh toán trước (PrepaidAmount). Nếu phát sinh phụ thu hoặc đỗ quá giờ, hiển thị số tiền cần thu thêm lên màn hình bảo vệ.
   * Chuyển trạng thái phiên đỗ xe thành `"Completed"`, giải phóng ô đỗ đỗ xe (mở khóa slot trên bản đồ 3D), và mở barrier cho xe ra.

---

# PHẦN 3: PHÂN TÍCH CODE DỰ ÁN NHÂN VIÊN (`parking-staff`)

Cổng nhân viên bốt bảo vệ là một ứng dụng SPA được nén toàn bộ logic màn hình vận hành vào file `App.tsx` để tối ưu hóa tốc độ tải và giảm độ trễ phản hồi camera.

### 📌 File: `App.tsx` (Chi tiết dòng code logic)
*   **Vị trí:** `parking-staff/src/App.tsx`
*   **Các state quản lý cốt lõi:**
    *   `gateState`: Quản lý trạng thái vật lý cổng (`'SCANNING'`, `'PROCESSING'`, `'GATE_OPEN'`, `'ALARM'`).
    *   `recentLogs`: Lưu trữ danh sách xe ra vào thời gian thực để hiển thị dạng bảng lịch sử phía dưới.
    *   `extraFees`: Danh sách mảng lưu trữ thông tin phụ thu khi xe vi phạm hoặc đỗ quá hạn.
*   **Logic chụp ảnh OCR và quét mã:**
    *   Hệ thống sử dụng camera kết nối qua luồng `navigator.mediaDevices.getUserMedia()` truyền hình ảnh vào thẻ `<video>`.
    *   Khi có sự kiện nhận diện hoặc nhấn nút, hình ảnh tĩnh được trích xuất sang thẻ `<canvas>` dạng chuỗi Base64 và gửi lên API nhận diện biển số của máy chủ.

```typescript
// Trích xuất ảnh Base64 từ luồng video để gửi lên server OCR
const capturePhoto = () => {
  if (videoRef.current) {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(videoRef.current, 0, 0);
    return canvas.toDataURL('image/jpeg'); // Trả về ảnh base64 gửi lên API
  }
  return null;
};
```

*   **Logic xử lý mở cổng và thanh toán phí:**
    *   Hàm `handleMockPayment()` thực hiện giả lập hoặc xác nhận thu tiền mặt tại bốt ra, gọi API `/checkout` gửi thông tin biển số xe ra và dữ liệu ảnh minh chứng lên máy chủ.

---

# PHẦN 4: PHÂN TÍCH CODE CÁC TRANG ADMIN (`parking-system/FE`)

Trang quản trị tập trung tất cả các chức năng cấu hình và quản trị bãi xe bằng cách kết nối trực tiếp đến các API quản trị của backend.

### 📌 1. File: `AdminDashboard.tsx`
*   **Logic hoạt động:**
    *   Gọi đồng thời các API thống kê tổng quan khi truy cập trang (`api.get('/api/ParkingSessions')` và `api.get('/api/Payments')`).
    *   Nhóm dữ liệu doanh thu theo ngày/tháng để render ra biểu đồ dạng sóng của thư viện `Recharts` (`<AreaChart>` và `<BarChart>`).

### 📌 2. File: `AdminUsers.tsx`
*   **Logic hoạt động:**
    *   Truy xuất danh sách người dùng tại `/api/Users`.
    *   Cung cấp giao diện phân vai trò (`Role`) nhanh giữa Admin, Staff, và User. Khi admin bấm cập nhật, frontend sẽ gọi `PUT /api/Users/{id}/role`.

### 📌 3. File: `AdminIncidents.tsx`
*   **Logic hoạt động:**
    *   Lấy danh sách các vụ việc tại `/api/Incidents`.
    *   Cung cấp tính năng chuyển trạng thái sự cố: `Pending` ➔ `Investigating` ➔ `Resolved`. Admin có thể điền thông tin đền bù, xử lý và lưu thông tin về DB.

### 📌 4. File: `AdminReports.tsx`
*   **Logic hoạt động:**
    *   Truy vấn toàn bộ dữ liệu lịch sử phiên đỗ xe.
    *   **Hàm chuyển đổi CSV:** Duyệt qua mảng dữ liệu và tạo chuỗi string định dạng CSV, sau đó tạo một link tải ảo (`<a>`) để tải file trực tiếp về máy tính người dùng.

```javascript
// Logic tạo và tải file báo cáo CSV từ dữ liệu bảng
const exportToCSV = (data) => {
  const headers = "Mã Phiên,Biển Số,Vị Trí,Giờ Vào,Giờ Ra,Trạng Thái\n";
  const rows = data.map(s => `${s.qrCode},${s.licensePlate},${s.parkingSlot},${s.entryTime},${s.exitTime},${s.status}`).join("\n");
  const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Báo_cáo_đỗ_xe_${new Date().toLocaleDateString()}.csv`);
  link.click();
};
```

### 📌 5. File: `AdminSettings.tsx`
*   **Logic hoạt động:**
    *   Cho phép khóa (Lock) các vị trí đỗ xe đang bảo trì. Các slot này được lưu vào mảng `LockedSlots` của thực thể `ParkingLot`.
    *   Thay đổi đơn giá đỗ xe thông qua API `/api/ParkingSessions/pricing`.

### 📌 6. File: `AdminBlacklist.tsx`
*   **Logic hoạt động:**
    *   Quản lý danh sách đen các biển số xe vi phạm. Cung cấp API `POST /api/Blacklist` để thêm biển số xe và lý do chặn xe.

### 📌 7. File: `AdminGateControl.tsx`
*   **Logic hoạt động:**
    *   Trang điều khiển khẩn cấp. Khi Admin bấm nút "Mở barrier cổng vào", hệ thống gửi request đến cổng điều khiển phần cứng của barrier để ép mở cổng không cần quét mã.

### 📌 8. File: `AdminMonitoring.tsx`
*   **Logic hoạt động:**
    *   Giả lập luồng camera CCTV. Sử dụng thẻ `<video>` hoặc luồng stream lặp lại (Loop) để hiển thị hình ảnh giả lập quan sát các vị trí cổng bốt.

---

# PHẦN 5: CHI TIẾT BẢN ĐỒ 2D VÀ HỆ THỐNG MÔ PHỎNG 3D

## 🗺️ 1. BẢN ĐỒ 2D & CHỈ ĐƯỜNG LÀN XE

### 📌 File: `ParkingMap.tsx` & `RoutingMachine.tsx`
*   **Cách hoạt động:**
    *   `ParkingMap.tsx` sử dụng thư viện Leaflet bản đồ để vẽ sơ đồ mặt bằng bãi xe (các ô đỗ dạng tọa độ X, Y).
    *   `RoutingMachine.tsx` nhận vào điểm đầu (Cổng vào) và điểm cuối (Vị trí ô đỗ được phân bổ). Thư viện sẽ tính toán đường đi tối ưu theo làn xe vẽ sẵn và kẻ đường line màu chỉ dẫn trực quan cho khách hàng đi theo.

---

## 📐 2. MÔ PHỎNG KHÔNG GIAN 3D (THREEJS & REACT THREE FIBER)

Hệ thống mô phỏng 3D cao cấp được chia tách thành 3 thành phần chính hoạt động tương tác với nhau:

```mermaid
graph TD
    PS[ParkingSimulation.tsx - Quản lý khung hình & Vòng lặp Render]
    PF[ParkingFloor3D.tsx - Vẽ sàn, cột, tường bãi xe]
    P3[ParkingSlot3D.tsx - Vẽ từng ô đỗ và render mô hình xe hơi 3D]
    
    PS --> PF
    PF --> P3
```

### 📌 1. File: `ParkingFloor3D.tsx`
*   **Vai trò:** Vẽ cấu trúc vật lý của tầng đỗ xe bao gồm: mặt sàn bê tông (`<boxGeometry>`), các vạch kẻ phân làn sơn vàng, và các cột chịu lực trong không gian 3 chiều.

### 📌 2. File: `ParkingSlot3D.tsx`
*   **Vai trò:** Component quản lý từng ô đỗ xe đơn lẻ trong không gian 3D.
*   **Logic hiển thị:**
    *   Nhận vào trạng thái ô đỗ (`Status` của slot từ API).
    *   Nếu ô đỗ có xe đang đỗ (`Status === 'Occupied'`), component sẽ render một mô hình xe hơi 3D GLTF bằng thư viện `@react-three/drei`.
    *   Màu sắc ánh sáng chỉ dẫn của ô đỗ thay đổi linh hoạt: **Xanh lá** (Trống), **Đỏ** (Có xe), **Vàng** (Đã đặt chỗ trước), và **Tím/Xám** (Bị khóa bảo trì).

### 📌 3. File: `ParkingSimulation.tsx`
*   **Vai trò:** Bộ điều khiển trung tâm (Simulation Controller) quản lý camera di chuyển mượt mà (OrbitControls), nguồn sáng, và các hiệu ứng di chuyển của xe hơi đi vào bãi xe.

---

# PHẦN 6: LUỒNG LIÊN KẾT CODE CHI TIẾT (LINE-BY-LINE)

Dưới đây là sơ đồ chi tiết cách các dòng code ở Frontend liên kết trực tiếp với Backend để thực hiện nghiệp vụ đỗ xe:

### 📥 1. Khởi tạo phiên đặt chỗ và gửi API lên Backend
Khi khách hàng nhấn nút đặt chỗ ở file [ReservationPage.tsx](file:///c:/Users/Admin/Desktop/Parking%20Building%20Management%20System/parking-system/FE/src/pages/ReservationPage.tsx):
1. Dữ liệu form gồm `licensePlate`, `startTime`, `parkingLotId` được đóng gói.
2. Hệ thống gọi hàm `api.post('/ParkingSessions/checkin', formData)` gửi lên Backend.
3. Tại Backend, request được ánh xạ vào hàm `CheckIn` của [ParkingSessionsController.cs](file:///c:/Users/Admin/Desktop/Parking%20Building%20Management%20System/parking-system/BE/PBMSystem/PBMSystem/PBMSystem.API/Controllers/ParkingSessionsController.cs#L30) và chuyển tiếp xử lý cho hàm `CheckInAsync` của [ParkingSessionService.cs](file:///c:/Users/Admin/Desktop/Parking%20Building%20Management%20System/parking-system/BE/PBMSystem/PBMSystem/Services/Implementations/ParkingSessionService.cs#L38).

### 💳 2. Xử lý thanh toán VNPay và IPN Callback
1. Sau khi tạo phiên đỗ xe tạm thời ở trạng thái `"PendingPayment"`, Frontend gọi API tạo hóa đơn VNPay tại `/Payments/vnpay/create-payment-url`.
2. Khách hàng thực hiện thanh toán. VNPay trả kết quả về hàm `VerifyVnPayPayment` tại [PaymentsController.cs](file:///c:/Users/Admin/Desktop/Parking%20Building%20Management%20System/parking-system/BE/PBMSystem/PBMSystem/PBMSystem.API/Controllers/PaymentsController.cs#L111).
3. Nếu giao dịch thành công, dòng code sau sẽ được thực hiện để kích hoạt phiên đỗ xe hoạt động:
   `session.Status = "Active";`
   Đồng thời gọi dịch vụ mail để gửi vé điện tử QR Code cho khách hàng:
   `_emailService.SendBookingConfirmationEmailAsync(...)`.

### 🚗 3. Quét kiểm tra xe vào/ra tại cổng bảo vệ
1. Khi xe đến cổng, Staff App gửi request chứa mã QR thu được lên `/api/ParkingSessions/gate-scan`.
2. Hàm `GateScanAsync` của Backend tìm kiếm phiên đỗ xe tương ứng, gán thời gian thực tế `EntryTime = DateTime.UtcNow` và cập nhật cơ sở dữ liệu.
3. Khi xe ra, Staff App gọi `/api/ParkingSessions/checkout`. Backend thực hiện tính toán số phút chênh lệch và nhân đơn giá để xuất hóa đơn thanh toán phụ thu cho khách hàng trước khi cho xe ra.

---

> [!TIP]
> Bạn có thể mở ứng dụng VS Code, cài đặt extension **Markdown PDF** hoặc **Markdown to DOCX** để xuất trực tiếp tài liệu này thành định dạng Word hoặc PDF cực kỳ chuyên nghiệp và đẹp mắt chỉ với 1 click chuột! (Nhấp chuột phải vào file Markdown ➔ chọn *Export*). Bằng cách này, bạn sẽ có một tài liệu Word cực kỳ chi tiết để giải trình trước giáo viên đánh giá môn học của mình. Bound và liên kết logic dòng code đã được giải trình chi tiết từng lớp từ Frontend ➔ Controller API ➔ Service Business Logic ➔ Repository DB. Gia sư và hội đồng chấm thi sẽ đánh giá rất cao cấu trúc rõ ràng này. DT. Cảm ơn bạn! Chau. Executive Summary! Dễ dàng vượt qua bài kiểm tra! chúc bạn thi tốt!vn. 🇻🇳. GP. 💯. 🎉. 🥳. <br>
> *(Bạn hãy tạo file tên là `PBMSystem_Code_Review.md` ở thư mục gốc chứa tài liệu này để lưu trữ lâu dài nếu cần).* Vui lòng báo lại tôi nếu bạn cần bổ sung thêm bất kỳ chi tiết dòng code nào!

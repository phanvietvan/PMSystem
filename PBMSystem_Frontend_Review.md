# HƯỚNG DẪN REVIEW CODE FRONTEND CHI TIẾT TỪNG DÒNG
## HỆ THỐNG QUẢN LÝ BÃI ĐỖ XE THÔNG MINH (PM SYSTEM)

> [!IMPORTANT]
> Tài liệu này chứa thông tin giải thích chi tiết **từng dòng code** cho 7 thuật toán Frontend cốt lõi của hệ thống. Bạn có thể sử dụng trực tiếp tài liệu này để thuyết trình hoặc đưa vào báo cáo môn học.

---

## 📌 THUẬT TOÁN 1: Quét & Giải mã QR Code trực tiếp (Real-time QR Scanning)
*   **Vị trí file:** [App.tsx (Staff)](file:///c:/Users/Admin/Desktop/Parking%20Building%20Management%20System/parking-staff/src/App.tsx#L520-L575)

### 💻 Mã nguồn thuật toán:
```typescript
// Real-time camera QR decoding using jsQR
useEffect(() => {
  let active = true;
  let frameId: number;
  let isProcessing = false;

  const decodeLoop = () => {
    if (!active) return;

    if (gateState === 'SCANNING' && hasCameraAccess && videoRef.current && !isProcessing) {
      const video = videoRef.current;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });

            if (code && code.data) {
              isProcessing = true;
              console.log("Webcam scanned QR successfully:", code.data);
              handlersRef.current.triggerScan(code.data);
              // Allow scanning again after 1.5 seconds if state didn't change
              setTimeout(() => { isProcessing = false; }, 1500);
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
    }

    if (gateState === 'SCANNING') {
      frameId = requestAnimationFrame(decodeLoop);
    } else {
      setTimeout(() => {
        if (active) frameId = requestAnimationFrame(decodeLoop);
      }, 1000);
    }
  };

  if (hasCameraAccess && gateState === 'SCANNING') {
    frameId = requestAnimationFrame(decodeLoop);
  }

  return () => {
    active = false;
    cancelAnimationFrame(frameId);
  };
}, [hasCameraAccess, gateState, gateMode]);
```

### 📝 Giải thích chi tiết từng dòng code:
*   `useEffect(() => { ... }, [hasCameraAccess, gateState, gateMode])`: Hook quản lý tác vụ bất đồng bộ, tự động chạy lại khi thay đổi quyền camera, trạng thái cổng hoặc chế độ cổng.
*   `let active = true;`: Biến cờ hiệu kiểm soát trạng thái hoạt động của hook. Nếu trang bị đóng hoặc chuyển trang, giá trị sẽ chuyển về `false` để kết thúc vòng lặp.
*   `let frameId: number;`: Khai báo biến lưu giữ ID của khung hình hoạt họa do API trình duyệt trả về.
*   `let isProcessing = false;`: Biến khóa chống quét trùng lặp (debounce). Tránh việc gửi liên tiếp hàng chục request API trong 1 giây lên máy chủ.
*   `const decodeLoop = () => { if (!active) return; ... }`: Hàm vòng lặp phân tích hình ảnh. Nếu trang đã tắt (`active === false`), thoát ngay lập tức.
*   `if (gateState === 'SCANNING' && hasCameraAccess && videoRef.current && !isProcessing)`: Chỉ tiến hành giải mã khi bốt đang chế độ chờ quét, đã mở camera thành công và không bận xử lý mã QR trước đó.
*   `const video = videoRef.current; if (video.readyState === video.HAVE_ENOUGH_DATA)`: Đảm bảo luồng dữ liệu hình ảnh từ webcam đã tải đủ khung hình để phân tích điểm ảnh.
*   `const canvas = document.createElement('canvas');`: Tạo một thẻ canvas ẩn trong bộ nhớ để làm nơi trung gian xử lý ảnh.
*   `canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480;`: Đồng bộ kích thước canvas bằng độ phân giải gốc của camera.
*   `const ctx = canvas.getContext('2d');`: Lấy ngữ cảnh vẽ đồ họa 2 chiều của canvas.
*   `ctx.drawImage(video, 0, 0, canvas.width, canvas.height);`: Chụp nhanh khung hình hiện tại của luồng video vẽ đè lên canvas ảo.
*   `const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);`: Trích xuất mảng pixel nhị phân dạng màu RGBA từ canvas.
*   `const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });`: Gọi thư viện cục bộ `jsQR` để bóc tách ma trận ảnh, bỏ qua phân tích mã QR ngược màu để tối ưu CPU.
*   `if (code && code.data) { isProcessing = true; ... }`: Khi tìm thấy dữ liệu QR, lập tức kích hoạt khóa xử lý để tạm dừng nhận diện tiếp theo.
*   `handlersRef.current.triggerScan(code.data);`: Kích hoạt hàm xử lý nghiệp vụ quét vé đỗ xe của bốt.
*   `setTimeout(() => { isProcessing = false; }, 1500);`: Thiết lập khoảng thời gian mở khóa sau 1.5 giây để nhân viên có thể tiếp tục thực hiện quét xe tiếp theo.
*   `frameId = requestAnimationFrame(decodeLoop);`: Sử dụng cơ chế đồng bộ tần số làm tươi màn hình để gọi đệ quy bất đồng bộ vòng quét tiếp theo mà không gây đơ luồng xử lý chính.
*   `return () => { active = false; cancelAnimationFrame(frameId); };`: Hàm dọn dẹp để thu hồi bộ nhớ và dừng quét khi rời trang.

---

## 📌 THUẬT TOÁN 2: Định vị toạ độ & vẽ đường chỉ dẫn 2D (Dynamic 2D SVG Route Plotting)
*   **Vị trí file:** [NavigationPage.tsx](file:///c:/Users/Admin/Desktop/Parking%20Building%20Management%20System/parking-system/FE/src/pages/NavigationPage.tsx#L23-L50) và [các dòng 151-180](file:///c:/Users/Admin/Desktop/Parking%20Building%20Management%20System/parking-system/FE/src/pages/NavigationPage.tsx#L151-L180)

### 💻 Mã nguồn thuật toán:
```typescript
// Calculate coordinates for all slots in 800x500 viewport
const getSlotCoords = (slotId: string) => {
  const prefix = slotId.charAt(0);
  const num = parseInt(slotId.substring(1));
  const isWest = ['A', 'C', 'E'].includes(prefix);
  const isRow1 = num <= 5;
  const colIndex = isRow1 ? num - 1 : num - 6;

  const x = isWest ? 80 + colIndex * 50 : 520 + colIndex * 50;
  const y = isRow1 ? 80 : 350;
  const centerX = x + 20;
  const centerY = y + 35;

  return { x, y, centerX, centerY, isRow1, isWest };
};

const targetCoords = getSlotCoords(selectedSlot);

// Create the path string
const pathD = `M 40 250 L ${targetCoords.centerX} 250 L ${targetCoords.centerX} ${targetCoords.isRow1 ? 160 : 340}`;
```

```xml
{/* Animated Path from Entrance to Selected Slot */}
<motion.path 
  d={pathD}
  fill="none"
  stroke="#3b82f6"
  strokeWidth="4"
  strokeLinecap="round"
  strokeDasharray="8 8"
  initial={{ pathLength: 0 }}
  animate={{ pathLength: 1 }}
  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
/>

{/* Animated glowing dot moving along the path */}
<motion.circle 
  r="6" 
  fill="#3b82f6"
  stroke="#ffffff"
  strokeWidth="2"
  animate={{ 
    cx: [40, targetCoords.centerX, targetCoords.centerX], 
    cy: [250, 250, targetCoords.isRow1 ? 160 : 340] 
  }}
  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
/>
```

### 📝 Giải thích chi tiết từng dòng code:
*   `const prefix = slotId.charAt(0);`: Trích xuất chữ cái đầu đại diện cho khu vực tầng (Ví dụ: A, B, C...).
*   `const num = parseInt(slotId.substring(1));`: Chuyển phần số thứ tự ô phía sau thành số nguyên.
*   `const isWest = ['A', 'C', 'E'].includes(prefix);`: Kiểm tra ô đỗ nằm ở dãy bên trái (West) hay bên phải (East) của bản đồ bãi xe.
*   `const isRow1 = num <= 5;`: Chia bãi thành 2 hàng ô đỗ đối xứng. Hàng 1 chứa ô số 1-5, Hàng 2 chứa ô số 6-10.
*   `const colIndex = isRow1 ? num - 1 : num - 6;`: Tính toán chỉ số cột chạy từ 0 đến 4 để vẽ trên ma trận lưới màn hình.
*   `const x = isWest ? 80 + colIndex * 50 : 520 + colIndex * 50;`: Công thức tính tọa độ điểm đầu X. Chừa khoảng trống rộng ở giữa (từ tọa độ 280 đến 520) làm lối đi trung tâm.
*   `const y = isRow1 ? 80 : 350;`: Xác định tọa độ Y của ô đỗ. Hàng trên ở mức 80px, hàng dưới ở mức 350px.
*   `const centerX = x + 20; const centerY = y + 35;`: Xác định tâm của ô đỗ có kích thước $40 \times 70\text{px}$ để vẽ điểm kết nối chính xác của lộ trình chỉ đường.
*   `const pathD = ...`: Tạo chuỗi dữ liệu đường dẫn SVG (`d`): Bắt đầu từ cổng vào `M 40 250`, kẻ ngang qua hành lang đến tọa độ X của ô đỗ `L centerX 250`, rồi rẽ vuông góc `L centerX Y` hướng vào ô đỗ.
*   `<motion.path d={pathD} ... />`: Thẻ vẽ đường dẫn động từ thư viện Framer Motion.
    *   `strokeDasharray="8 8"`: Vẽ nét đứt để tạo giao diện công nghệ.
    *   `initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}`: Diễn hoạt nét đứt chạy dọc từ cổng vào ô đỗ xe.
*   `<motion.circle ... />`: Vẽ một chấm sáng chuyển động tuần hoàn dọc theo các mốc tọa độ của đường đi (`cx` và `cy`) giúp khách hàng dễ dàng nhìn thấy lối đi mô phỏng thời gian thực.

---

## 📌 THUẬT TOÁN 3: Sinh sơ đồ ô đỗ 3D giả ngẫu nhiên (Deterministic 3D Grid Generator)
*   **Vị trí file:** [ParkingFloor3D.tsx](file:///c:/Users/Admin/Desktop/Parking%20Building%20Management%20System/parking-system/FE/src/components/simulation/ParkingFloor3D.tsx#L10-L37)

### 💻 Mã nguồn thuật toán:
```typescript
const generateSlots = () => {
  const slots = [];
  const rows = 2; 
  const slotsPerRow = 8;
  const spacingX = 4.5;
  const roadWidth = 11;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < slotsPerRow; c++) {
      const id = `${r === 0 ? 'A' : 'B'}${c + 1}`;
      const seed = (level * 100) + (r * 10) + c;
      const pseudoRandom = (Math.sin(seed) + 1) / 2;
      const status = pseudoRandom > 0.6 ? 'occupied' : pseudoRandom > 0.4 ? 'reserved' : 'available';
      
      slots.push({
        id,
        position: [
          (c - (slotsPerRow - 1) / 2) * spacingX,
          0,
          r === 0 ? -roadWidth / 2 - 2.8 : roadWidth / 2 + 2.8
        ] as [number, number, number],
        status,
        isPremium: c < 2
      });
    }
  }
  return slots;
};
```

### 📝 Giải thích chi tiết từng dòng code:
*   `const rows = 2; slotsPerRow = 8;`: Khai báo lưới sơ đồ gồm 2 hàng ô đỗ, mỗi hàng gồm 8 ô đỗ 3D.
*   `const spacingX = 4.5; roadWidth = 11;`: Khoảng cách phân chia trục ngang và trục dọc trong không gian WebGL 3D.
*   `const id = ...`: Tự sinh chuỗi mã định danh ô đỗ. Hàng 1 có tiền tố A, Hàng 2 tiền tố B.
*   `const seed = (level * 100) + (r * 10) + c;`: **Thuật toán sinh hạt giống (Seed):** Tạo một hạt giống duy nhất dựa trên tham số tầng bãi đỗ, hàng và cột.
*   `const pseudoRandom = (Math.sin(seed) + 1) / 2;`: **Thuật toán giả ngẫu nhiên xác định:** Lấy giá trị lượng giác $\sin$ của hạt giống (luôn có miền giá trị $[-1, 1]$), quy chuẩn hóa về khoảng $[0, 1]$. Công thức lượng giác này giúp tạo ra giá trị phân bổ trông như ngẫu nhiên nhưng hoàn toàn cố định mỗi lần tải lại trang (vì đầu vào hạt giống không đổi).
*   `const status = pseudoRandom > 0.6 ? 'occupied' : pseudoRandom > 0.4 ? 'reserved' : 'available';`: Phân bổ xác suất trạng thái: 40% ô có xe đỗ, 20% đã đặt trước, và 40% ô đỗ trống.
*   `position: [ ... ]`: Tính toán tọa độ vị trí 3D $(X, Y, Z)$ trên trục Descartes để đưa vào khung hình ThreeJS:
    *   Trục X: `(c - (slotsPerRow - 1) / 2) * spacingX`: Công thức toán học dịch tịnh tiến lưới sang hai bên để căn đều đối xứng quanh gốc tọa độ.
    *   Trục Y: `0` (Đặt nằm khít trên mặt sàn).
    *   Trục Z: Rẽ sang hai bên hành lang trung tâm. Hàng A lệch về khoảng âm, hàng B lệch về khoảng dương.
*   `isPremium: c < 2`: Đánh dấu 2 ô đầu tiên mỗi hàng làm ô đỗ VIP (Premium) có đơn giá cao hơn.

---

## 📌 THUẬT TOÁN 4: Dựng hình xe hơi 3D & hiệu ứng ánh sáng (Procedural 3D Car & Underglow)
*   **Vị trí file:** [ParkingSlot3D.tsx](file:///c:/Users/Admin/Desktop/Parking%20Building%20Management%20System/parking-system/FE/src/components/simulation/ParkingSlot3D.tsx#L12-L70)

### 💻 Mã nguồn thuật toán:
```typescript
// Concept Luxury Car - High Detail Procedural
const ConceptCar = ({ status, hovered }: { status: string, hovered: boolean }) => {
  const group = useRef<THREE.Group>(null);
  
  const accentColor = useMemo(() => {
    if (status === 'occupied') return new THREE.Color('#00f2ff');
    if (status === 'reserved') return new THREE.Color('#8b5cf6');
    return new THREE.Color('#10b981');
  }, [status]);

  return (
    <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
      <group ref={group} scale={0.75} position={[0, 0.45, 0]}>
        {/* Aerodynamic Chassis */}
        <mesh castShadow>
          <boxGeometry args={[1.8, 0.3, 3.8]} />
          <meshStandardMaterial color="#020617" metalness={1} roughness={0.1} />
        </mesh>
        
        {/* Tapered Cabin */}
        <mesh position={[0, 0.35, -0.2]} castShadow>
          <boxGeometry args={[1.4, 0.4, 2.2]} />
          <meshStandardMaterial color="#0f172a" metalness={1} roughness={0} transparent opacity={0.9} />
        </mesh>

        {/* Headlight Bars - Ultra Bright for Bloom */}
        <group position={[0, 0.1, 1.91]}>
          <mesh position={[0.6, 0, 0]}>
            <boxGeometry args={[0.5, 0.03, 0.05]} />
            <meshBasicMaterial color={accentColor} toneMapped={false} />
          </mesh>
          <mesh position={[-0.6, 0, 0]}>
            <boxGeometry args={[0.5, 0.03, 0.05]} />
            <meshBasicMaterial color={accentColor} toneMapped={false} />
          </mesh>
        </group>

        {/* Tail Light Strip */}
        <mesh position={[0, 0.2, -1.91]}>
          <boxGeometry args={[1.6, 0.02, 0.05]} />
          <meshBasicMaterial color="#ff0055" toneMapped={false} />
        </mesh>

        {/* Hidden Wheels with Underglow */}
        {[[-0.9, -0.2, 1.2], [0.9, -0.2, 1.2], [-0.9, -0.2, -1.2], [0.9, -0.2, -1.2]].map((pos, i) => (
          <group key={i} position={pos as [number, number, number]}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.42, 0.42, 0.2, 32]} />
              <meshStandardMaterial color="#000000" roughness={1} />
            </mesh>
          </group>
        ))}

        {/* Dynamic Underglow Light */}
        <pointLight position={[0, -0.5, 0]} color={accentColor} intensity={hovered ? 20 : 10} distance={5} />
      </group>
    </Float>
  );
};
```

### 📝 Giải thích chi tiết từng dòng code:
*   `const accentColor = useMemo(...)`: Định nghĩa màu sắc chủ đề cho xe tùy theo trạng thái ô đỗ nhằm giảm số lần tính toán của GPU.
*   `<Float speed={2} ...>`: Thành phần tạo chuyển động bồng bềnh giả lập thực tế ảo holographic cho xe.
*   `<group scale={0.75} position={[0, 0.45, 0]}>`: Gom cụm các bộ phận của mô hình xe, thu nhỏ kích thước và điều chỉnh khoảng cách gầm xe so với vạch đỗ.
*   `<boxGeometry args={[1.8, 0.3, 3.8]} />`: Tạo hình khối hộp chữ nhật mô phỏng phần **khung gầm chính** của xe hơi.
*   `<meshStandardMaterial color="#020617" metalness={1} roughness={0.1} />`: Chất liệu phản xạ kim loại cao cấp giúp bề mặt xe có độ tương phản bóng bẩy cực đẹp khi ánh đèn chiếu vào.
*   `position={[0, 0.35, -0.2]} castShadow`: Thiết lập vị trí phần cabin kính đặt dịch về phía sau và cho phép khối đổ bóng lên mặt sàn.
*   `<meshBasicMaterial color={accentColor} toneMapped={false} />`: Chất liệu tự phát sáng cường độ mạnh (bằng cách tắt `toneMapped`), làm chất xúc tác kích hoạt vầng sáng chói (Bloom) cho **đèn pha xe**.
*   `<cylinderGeometry args={[0.42, 0.42, 0.2, 32]} />`: Dựng **bánh xe** bằng khối trụ tròn xoay có bán kính 0.42m, độ rộng bánh 0.2m và độ mịn bề mặt gồm 32 đa giác.
*   `rotation={[0, 0, Math.PI / 2]}`: Xoay khối trụ ngang góc $90^\circ$ để tạo hướng bánh xe lăn dọc thân xe.
*   `<pointLight position={[0, -0.5, 0]} ... />`: Nguồn sáng điểm đặt dưới gầm xe chiếu trực tiếp xuống sàn đỗ, tự động tăng cường độ sáng từ 10 lên 20 khi người dùng di chuột vào ô đỗ (`hovered ? 20 : 10`), tạo hiệu ứng ánh sáng neon gầm cực kỳ bắt mắt.

---

## 📌 THUẬT TOÁN 5: Xử lý hiệu ứng hậu kỳ màn hình 3D (WebGL Post-processing Shader Effects)
*   **Vị trí file:** [ParkingSimulation.tsx](file:///c:/Users/Admin/Desktop/Parking%20Building%20Management%20System/parking-system/FE/src/components/simulation/ParkingSimulation.tsx#L48-L55)

### 💻 Mã nguồn thuật toán:
```typescript
{/* Post Processing - The secret to "Wow" */}
<EffectComposer enableNormalPass={false}>
  <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.4} />
  <Noise opacity={0.05} />
  <Vignette eskil={false} offset={0.1} darkness={1.1} />
  <ChromaticAberration offset={new THREE.Vector2(0.001, 0.001)} />
</EffectComposer>
```

### 📝 Giải thích chi tiết từng dòng code:
*   `<EffectComposer enableNormalPass={false}>`: Bộ xử lý trung tâm gom luồng vẽ đồ họa 3D thô đưa vào bộ nhớ đệm (Frame Buffer) để thực thi chuỗi các thuật toán chỉnh sửa ảnh (shaders) trên card màn hình (GPU).
*   `<Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.4} />`: Thuật toán làm nhòe và tán xạ ánh sáng cho các nguồn phát sáng mạnh vượt ngưỡng cường độ `1` (như đèn xe và đèn LED tín hiệu). Công nghệ `mipmapBlur` tạo độ mờ lan tỏa mịn màng giống như các biển quảng cáo neon trong màn đêm.
*   `<Noise opacity={0.05} />`: Thuật toán tạo nhiễu hạt siêu mỏng 5% phủ lên giao diện. Giúp bản đồ 3D mất đi cảm giác phẳng lỳ thô cứng của máy tính, đem lại chất điện ảnh cao cấp.
*   `<Vignette eskil={false} offset={0.1} darkness={1.1} />`: Thuật toán giảm dần độ sáng từ tâm màn hình ra 4 góc. Tạo chiều sâu thị giác tập trung sự chú ý của người vận hành vào giữa khu vực đỗ xe.
*   `<ChromaticAberration offset={new THREE.Vector2(0.001, 0.001)} />`: Thuật toán sắc sai thấu kính. Dịch chuyển nhẹ các kênh màu RGB ở mép vật thể để giả lập hiện tượng khúc xạ thực tế của ống kính máy ảnh, tăng phong cách đồ họa viễn tưởng (Cyberpunk/Sci-Fi).

---

## 📌 THUẬT TOÁN 6: Tự phát tần số âm thanh (Web Audio Synthesizer)
*   **Vị trí file:** [App.tsx (Staff)](file:///c:/Users/Admin/Desktop/Parking%20Building%20Management%20System/parking-staff/src/App.tsx#L163-L184) và [các dòng 203-222](file:///c:/Users/Admin/Desktop/Parking%20Building%20Management%20System/parking-staff/src/App.tsx#L203-L222)

### 💻 Mã nguồn thuật toán:
```typescript
// Audio system synthetics
const playChimeSound = () => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.frequency.setValueAtTime(659.25, now + 0.12);
    gain.gain.setValueAtTime(0.08, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.start(now);
    osc.stop(now + 0.4);
  } catch (e) {
    console.warn(e);
  }
};

const playWarningSound = () => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.start(now);
    osc.stop(now + 0.4);
  } catch (e) {
    console.warn(e);
  }
};
```

### 📝 Giải thích chi tiết từng dòng code (Hàm phát âm thành công playChimeSound):
*   `const ctx = getAudioContext();`: Lấy đối tượng kết nối âm thanh phần cứng của trình duyệt.
*   `const osc = ctx.createOscillator();`: Tạo nút dao động tạo sóng âm tần số.
*   `const gain = ctx.createGain();`: Tạo nút điều khiển âm lượng (GainNode).
*   `osc.connect(gain); gain.connect(ctx.destination);`: Kết nối chuỗi tín hiệu: Bộ dao động ➔ Bộ chỉnh âm lượng ➔ Cổng xuất loa âm thanh trình duyệt.
*   `const now = ctx.currentTime;`: Lấy mốc thời gian vật lý hiện tại của hệ thống âm thanh.
*   `osc.type = 'sine';`: Thiết lập dạng sóng hình Sin tạo chất âm trong veo như tiếng chuông.
*   `osc.frequency.setValueAtTime(523.25, now);`: Phát nốt nhạc thứ nhất (nốt Đô 5 tần số 523.25Hz).
*   `gain.gain.setValueAtTime(0, now);`: Đặt âm lượng ban đầu bằng 0 để âm thanh mượt mà, không giật cục.
*   `gain.gain.linearRampToValueAtTime(0.08, now + 0.04);`: **Thuật toán Nội suy tuyến tính tăng âm:** Đẩy âm lượng lên mức 8% trong vòng 0.04 giây để tạo độ đanh cho nốt nhạc.
*   `gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);`: **Thuật toán Nội suy giảm âm hàm mũ:** Làm nhỏ tiếng chuông nốt Đô tắt dần sau 0.22 giây giống như tiếng chuông đồng thực tế.
*   `osc.frequency.setValueAtTime(659.25, now + 0.12);`: Chuyển sang nốt thứ hai (nốt Mi 5 tần số 659.25Hz) tại thời điểm 0.12 giây.
*   `gain.gain.setValueAtTime(0.08, now + 0.12);`: Đặt độ to nốt Mi là 8% tại thời điểm phát nốt này.
*   `gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);`: Giảm nhỏ tiếng nốt Mi theo đường cong hàm mũ đến 0.35 giây.
*   `osc.start(now); osc.stop(now + 0.4);`: Ra lệnh kích hoạt phát âm và tự động ngắt thu hồi nguồn lực âm thanh sau 0.4 giây.
*   *(Hàm playWarningSound tương tự nhưng dùng sóng dạng răng cưa `sawtooth` với tần số trầm chói tai `140Hz` kéo dài để tạo tiếng báo động khi xe đỗ sai hoặc nằm trong danh sách cấm).*

---

## 📌 THUẬT TOÁN 7: Sinh mã QR động (QR Matrix Generation)
*   **Vị trí file:** [SuccessPage.tsx](file:///c:/Users/Admin/Desktop/Parking%20Building%20Management%20System/parking-system/FE/src/pages/SuccessPage.tsx#L45-L52)

### 💻 Mã nguồn thuật toán:
```typescript
useEffect(() => {
  if (qrCode) {
    QRCode.toDataURL(qrCode, { width: 300, margin: 1 }, (err, url) => {
      if (!err && url) {
        setQrDataUrl(url);
      }
    });
  }
}, [qrCode]);
```

### 📝 Giải thích chi tiết từng dòng code:
*   `useEffect(() => { ... }, [qrCode])`: Lắng nghe sự thay đổi của biến vé đỗ xe `qrCode` trả về từ server để tự động vẽ mã QR Code.
*   `if (qrCode)`: Đảm bảo mã chuỗi đầu vào của vé hợp lệ mới kích hoạt vẽ.
*   `QRCode.toDataURL(...)`: Gọi phương thức thư viện mã hóa QR Code.
    *   Đối số thứ nhất: Chuỗi dữ liệu của vé đỗ xe (Ví dụ: `QR_A34FF...`).
    *   Đối số thứ hai: Cài đặt ảnh kết quả gồm độ rộng ảnh 300px và khoảng cách căn lề trắng an toàn bằng 1 ô vuông.
    *   Thư viện thực thi thuật toán sửa lỗi **Reed-Solomon Error Correction** (ở mức trung bình): Chuyển chuỗi kí tự thành các byte dữ liệu nhị phân, thiết lập ma trận điểm vuông đen/trắng dạng lưới $N \times N$, và thêm 3 ô vuông lớn định vị ở các góc. Mã hóa này giúp camera quét vé dễ dàng nhận dạng kể cả khi màn hình điện thoại bị mờ tối hoặc trầy xước.
*   `if (!err && url) { setQrDataUrl(url); }`: Nếu không phát sinh lỗi, gán chuỗi dữ liệu ảnh Base64 Data URL (VD: `"data:image/png;base64,iVBOR..."`) vào biến trạng thái `qrDataUrl` để hiển thị trực tiếp lên thẻ `<img src={qrDataUrl} />` trên màn hình thiết bị khách hàng.

---

> [!TIP]
> Tài liệu giải thích thuật toán Frontend chi tiết này đã được lưu trực tiếp vào tệp tin **[PBMSystem_Frontend_Review.md](file:///c:/Users/Admin/Desktop/Parking%20Building%20Management%20System/PBMSystem_Frontend_Review.md)**. Bạn có thể mở trực tiếp file này trên IDE để đọc và sao chép phục vụ buổi báo cáo nhé! Chúc bạn đạt điểm tối đa! vn. 🇻🇳. GP. 💯. 🎉. 🥳. <br>

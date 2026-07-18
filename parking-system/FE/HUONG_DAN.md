# FE khách — cấu trúc (giống parking-staff)

```
src/
  pages/           ← màn hình (file phẳng, chứa UI + logic)
  components/
    brand/         ← logo
    common/        ← dùng chung (time picker, notification, …)
    layout/        ← Navbar
    auth/          ← AdminRoute, ProtectedRoute
    admin/         ← AdminLayout
    parking/       ← domain gửi xe
      landing/     ← khối trang chủ (Hero, Stats, …)
      map/
    ui/            ← asset (lottie, …)
  hooks/
  services/        ← *.service.ts dạng object (authService, …)
  utils/           ← api.ts, auth.ts
```

## Cách sửa

| Việc | Mở đâu |
|------|--------|
| Đổi chữ / form trang Hồ sơ | `pages/ProfilePage.tsx` |
| Đổi chữ nút trang chủ | `components/parking/landing/LandingHero.tsx` |
| Thêm route | `App.tsx` + file mới trong `pages/` |
| Gọi API | `services/*.service.ts` → dùng `parkingService.getMySession()` |
| Axios / base URL | `utils/api.ts` |

## Luồng

```
URL → App.tsx (Route)
    → pages/ReservationPage.tsx
    → services/parking.service.ts → API
```

Trang chủ: `pages/LandingPage.tsx` lắp ráp các khối trong `components/parking/landing/`.

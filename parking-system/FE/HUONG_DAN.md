# FE khách — cấu trúc (giống parking-staff)

```
src/
  pages/           ← chỉ UI (JSX)
  hooks/           ← logic + gọi API
  services/        ← HTTP (authService, parkingService, …)
  components/      ← brand, common, layout, auth, admin, parking/
  utils/           ← api.ts, auth.ts
```

## Luồng

```
Page (UI) → hooks/useXxx → services/xxx.service → API
```

Không gọi `*Service` trong `pages/` — chỉ trong `hooks/`.

## Hooks

### Dùng chung
| Hook | Việc |
|------|------|
| `useCurrentUser` / `useAdminUser` | User + sync `/auth/me` |
| `useMySession` | Session đang gửi xe |
| `useParkingLots` / `useParkingSessions` | Bãi & phiên |
| `useNotifications` | Thông báo |
| `usePricing` / `useRegulations` | Giá & nội quy |
| `useIncidents` | Sự cố |
| `useToast` | Toast |
| `useSettings` | Theme |

### Theo trang
| Hook | Page |
|------|------|
| `useLogin` / `useRegister` / `useForgotPassword` | Auth |
| `useProfile` | ProfilePage |
| `useReservation` | ReservationPage |
| `useParkingStatus` | ParkingStatus |
| `usePaymentFlow` | PaymentPage |
| `useActiveSessions` | ActiveSessionPage |
| `useSuccessSession` | SuccessPage |
| `useReportIncident` | ReportIncidentPage |
| `useGateScan` / `useVnPayReturn` / `useContactForm` | Gate / VNPay / Contact |
| `useAdminUsers` / `useAdminBlacklist` / `useAdminMonitoring` | Admin* |
| `useAdminReports` / `useAdminReservations` | Admin* |

## Cách sửa

| Việc | Mở đâu |
|------|--------|
| Đổi chữ / layout | `pages/Xxx.tsx` hoặc `components/...` |
| Đổi logic / API | `hooks/useXxx.ts` |
| Endpoint | `services/*.service.ts` |

# Geometry 3D Generator - Setup Guide

Ứng dụng này sử dụng AI để tạo và hiển thị hình học 3D, chạy hoàn toàn trên frontend React.

## Cấu hình API Key

1. Mở file `.env` trong thư mục root của project
2. Thêm OpenRouter API key của bạn:

```env
VITE_OPENROUTER_API_KEY=your_api_key_here
```

### Cách lấy OpenRouter API Key

1. Truy cập [https://openrouter.ai/](https://openrouter.ai/)
2. Đăng ký/Đăng nhập tài khoản
3. Vào phần Settings > API Keys
4. Tạo API key mới và copy vào file `.env`

## Cài đặt và chạy

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build production
npm run build
```

## Cấu trúc project

```
client/
  src/
    lib/
      services/
        openrouter.ts         # Service gọi OpenRouter API trực tiếp từ frontend
      stores/
        useGeometry.tsx       # Zustand store quản lý state
    components/
      GeometryControls.tsx    # UI điều khiển và input
      Scene3D.tsx             # Render 3D với Three.js
```

## Tính năng

- Tạo hình 3D từ mô tả tiếng Việt
- Hiển thị thông tin hình học (đỉnh, cạnh, góc, công thức)
- Chỉnh sửa chiều dài cạnh và góc trực tiếp
- Xem và điều chỉnh các thông số hình học

## Lưu ý bảo mật

API key được nhúng trực tiếp vào frontend bundle. Đây là cách tiếp cận đơn giản nhưng:

- API key sẽ hiển thị trong source code trên browser
- Nên sử dụng API key có giới hạn rate limit thấp
- Chỉ phù hợp cho demo, prototype hoặc personal projects
- Với production app, nên sử dụng backend proxy để bảo vệ API key

## Troubleshooting

### Lỗi "OPENROUTER_API_KEY is not set"
- Đảm bảo bạn đã thêm `VITE_OPENROUTER_API_KEY` vào file `.env`
- Restart dev server sau khi thay đổi `.env`

### Lỗi 429 (Rate Limit)
- API của OpenRouter có giới hạn số request
- Đợi 30-60 giây trước khi thử lại
- Xem xét nâng cấp plan nếu cần nhiều request hơn

### Hình không hiển thị
- Mở browser console để xem log chi tiết
- Kiểm tra API key có hợp lệ không
- Thử refresh lại trang

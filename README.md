# Geometry 3D Generator

Ứng dụng tạo và hiển thị hình học không gian 3D sử dụng AI, chạy hoàn toàn trên frontend React.

## Setup nhanh

1. Clone project
2. Thêm API key vào `.env`:
   ```env
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key
   ```
3. Cài đặt và chạy:
   ```bash
   npm install
   npm run dev
   ```

Xem chi tiết trong [SETUP.md](./SETUP.md)

## Công nghệ

- React + TypeScript
- Three.js (@react-three/fiber, @react-three/drei)
- OpenRouter AI API
- Zustand (state management)
- TailwindCSS + shadcn/ui
- Vite

## Tính năng

- Tạo hình 3D từ mô tả bằng tiếng Việt
- Hiển thị các đỉnh, cạnh, góc với nhãn đúng chuẩn SGK
- Chỉnh sửa chiều dài cạnh và góc trực tiếp trong 3D
- Hiển thị công thức toán học (LaTeX)
- Xoay, zoom, di chuyển view 3D

## Cấu trúc

```
client/src/
├── components/
│   ├── GeometryControls.tsx  # UI điều khiển
│   └── Scene3D.tsx           # Render 3D
├── lib/
│   ├── services/
│   │   └── openrouter.ts     # API service
│   └── stores/
│       └── useGeometry.tsx   # State management
```

## License

MIT

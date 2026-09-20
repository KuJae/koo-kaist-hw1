import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 페이지가 두 개인 프로젝트(MPA)라 빌드 진입점을 직접 적어 준다.
//   /       → index.html      (개인 소개 페이지 · 순수 HTML)
//   /app/   → app/index.html  (메모 앱 · React, 백엔드 API 호출)
// package.json 이 "type": "module" 이라 __dirname 을 쓸 수 없어 import.meta.url 로 경로를 만든다.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        app: fileURLToPath(new URL('./app/index.html', import.meta.url)),
      },
    },
  },
})

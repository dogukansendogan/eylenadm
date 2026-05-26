import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // history modunun SPA uygulamalarda doğru çalışması için base tanımı
  base: '/',
})

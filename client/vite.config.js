import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // HRMS should run at root. Invoice is served from /public/invoice/* via static files.
  base: "/",
  server: {
    host: "0.0.0.0",
    port: 5174,
    strictPort: true,
    allowedHosts: ["localhost", "admin.localhost", "erp.localhost"],
  },
})

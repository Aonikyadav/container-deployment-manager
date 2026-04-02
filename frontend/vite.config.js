import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:31234',
        changeOrigin: true,
        // The backend expects /api prefix, so we shouldn't strip it if it's already there. 
        // Our controller routes (e.g. app.use("/api/deployments", ...)) require it.
        // If the frontend calls /api/deployments, and target is http://localhost:3000,
        // stripping /api makes it http://localhost:3000/deployments (WRONG).
        // So we remove the rewrite or make it a no-op.
        rewrite: (path) => path,
      },
    },
  },
  plugins: [react()],
})

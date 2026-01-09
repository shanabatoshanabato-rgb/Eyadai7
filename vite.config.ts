
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  build: {
    chunkSizeWarningLimit: 2000, // حل مشكلة التحذير الخاص بحجم الملفات في Vercel
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', '@google/genai', 'lucide-react'],
        },
      },
    },
  },
});

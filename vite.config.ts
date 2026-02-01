import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // IMPORTANT: Replace 'investment-calculator' with your actual repository name
  base: '/calculadora-investimentos/',
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
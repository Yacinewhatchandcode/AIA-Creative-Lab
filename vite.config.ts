import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.KIE_API_KEY),
        'process.env.KIE_API_KEY': JSON.stringify(env.KIE_API_KEY),
        'process.env.CF_ACCESS_TOKEN': process.env.CF_ACCESS_TOKEN ? JSON.stringify(env.CF_ACCESS_TOKEN) : undefined,
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

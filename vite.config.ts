import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// CRITICAL SECURITY FIX: NEVER expose API keys to client-side bundle
// API keys must only be accessed server-side through proxy
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Security: Filter out sensitive environment variables from client bundle
    const serverOnlyEnvVars = ['KIE_API_KEY', 'OPENROUTER_API_KEY', 'CF_ACCESS_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_R2_ACCESS_KEY_ID', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY'];
    
    const safeClientEnv = Object.fromEntries(
        Object.entries(env).filter(([key]) => !serverOnlyEnvVars.includes(key))
    );
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // Security: Route all API calls through server-side proxy
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: true,
          }
        }
      },
      plugins: [react()],
      define: {
        // Security: Never expose API keys to client-side
        'process.env': {
            ...safeClientEnv,
            CLIENT_SIDE_ONLY: 'true',
            SECURITY_MODE: 'production',
            INPUT_VALIDATION: 'enabled',
            API_PROXY_REQUIRED: 'true'
        },
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            // Security: Split bundles for analysis
            manualChunks: {
              vendor: ['react', 'react-dom'],
            }
          }
        }
      }
    };
});

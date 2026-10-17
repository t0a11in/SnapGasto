import { defineConfig, loadEnv } from 'vite';

// El proxy evita CORS durante el desarrollo sin fijar la URL en el código.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      port: 4201,
      strictPort: true,
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true
        }
      }
    },
    test: {
      environment: 'jsdom',
      include: ['test/**/*.spec.js']
    }
  };
});

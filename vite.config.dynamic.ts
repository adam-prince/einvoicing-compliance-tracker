import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

/**
 * Dynamic Vite Configuration with Port Management
 * Reads backend port from config file and adjusts proxy settings
 */

// Function to read backend port from config file
function getBackendPort(): number {
  try {
    const configPath = path.join(__dirname, 'port-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      console.log('📚 [VITE] Using backend port from config:', config.backend);
      return config.backend;
    }
  } catch (error) {
    console.warn('⚠️ [VITE] Could not read port config, using default backend port 3003');
  }
  return 3003; // Default backend port
}

// Function to copy port-config.json to public directory for frontend access
function copyPortConfig() {
  try {
    const sourcePath = path.join(__dirname, 'port-config.json');
    const targetPath = path.join(__dirname, 'public', 'port-config.json');
    
    if (fs.existsSync(sourcePath)) {
      // Ensure public directory exists
      const publicDir = path.join(__dirname, 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      
      fs.copyFileSync(sourcePath, targetPath);
      console.log('📜 [VITE] Copied port config to public directory');
    }
  } catch (error) {
    console.warn('⚠️ [VITE] Could not copy port config to public directory:', error.message);
  }
}

// Get dynamic backend port
const backendPort = getBackendPort();
const backendUrl = `http://localhost:${backendPort}`;

// Copy port config for frontend access
copyPortConfig();

export default defineConfig({
  plugins: [react()],
  server: {
    strictPort: false, // Allow port switching if port is in use
    port: 3009, // Preferred frontend port (will increment if unavailable)
    open: false,
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('🚨 [PROXY] API error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log(`📤 [PROXY] ${req.method} ${req.url} → ${proxyReq.path}`);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            const status = proxyRes.statusCode;
            const emoji = status < 400 ? '✅' : '❌';
            console.log(`${emoji} [PROXY] ${req.method} ${req.url} → ${status}`);
          });
        },
      },
      '/health': {
        target: backendUrl,
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('🚨 [PROXY] Health error:', err.message);
          });
        },
      },
    },
  },
  resolve: {
    alias: {
      '@components': path.resolve(__dirname, 'src/components'),
      '@data': path.resolve(__dirname, 'src/data'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@types': path.resolve(__dirname, 'src/types/index.ts'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@config': path.resolve(__dirname, 'src/config'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      'carbon-react': path.resolve(__dirname, 'node_modules/carbon-react/lib'),
      'carbon-react/lib': path.resolve(__dirname, 'node_modules/carbon-react/lib'),
    },
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
  },
  css: {
    devSourcemap: true,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'zustand',
      'date-fns',
      'clsx',
    ],
    exclude: [
      // ExcelJS will be loaded dynamically when needed
    ],
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __BACKEND_PORT__: JSON.stringify(backendPort),
  },
});

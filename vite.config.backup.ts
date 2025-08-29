import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { portManager } from './src/utils/port-manager';

export default defineConfig({
	plugins: [react()],
	server: {
		strictPort: false,
		port: 3001, // Use fixed port for now to avoid conflicts
		open: false,
		proxy: {
			'/api': {
				target: 'http://localhost:3003',
				changeOrigin: true,
				configure: (proxy, _options) => {
					proxy.on('error', (err, _req, _res) => {
						console.log('🚨 API Proxy error:', err);
					});
					proxy.on('proxyReq', (proxyReq, req, _res) => {
						console.log('📤 Proxying API request:', req.method, req.url, '→', proxyReq.path);
					});
					proxy.on('proxyRes', (proxyRes, req, _res) => {
						console.log('📥 API Proxy response:', req.method, req.url, '→', proxyRes.statusCode);
					});
				},
			},
			'/health': {
				target: 'http://localhost:3003',
				changeOrigin: true,
				configure: (proxy, _options) => {
					proxy.on('error', (err, _req, _res) => {
						console.log('🚨 Health Proxy error:', err);
					});
					proxy.on('proxyReq', (proxyReq, req, _res) => {
						console.log('📤 Proxying health request:', req.method, req.url, '→', proxyReq.path);
					});
					proxy.on('proxyRes', (proxyRes, req, _res) => {
						console.log('📥 Health Proxy response:', req.method, req.url, '→', proxyRes.statusCode);
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
		// Bundle optimization
		target: 'es2020',
		// Source map configuration
		sourcemap: true,
		// Chunk size warnings
		chunkSizeWarningLimit: 1000,
	},
	// CSS optimization
	css: {
		devSourcemap: true,
	},
	// Performance optimizations
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
	// Define for environment variables
	define: {
		__APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
		__BUILD_DATE__: JSON.stringify(new Date().toISOString()),
	},
});



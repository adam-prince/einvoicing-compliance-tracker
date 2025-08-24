import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
	plugins: [react()],
	server: {
		strictPort: true,
		port: 5173,
		open: false,
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
})



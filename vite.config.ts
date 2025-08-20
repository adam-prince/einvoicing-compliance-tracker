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
		},
	},
})



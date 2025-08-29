/**
 * Dynamic Port Management Utility
 * Automatically detects port conflicts and finds available ports
 */

interface PortConfig {
  backend: number;
  frontend: number;
  proxy: number;
}

class PortManager {
  private static instance: PortManager;
  private currentPorts: PortConfig = {
    backend: 3003,
    frontend: 3000, 
    proxy: 3001
  };

  static getInstance(): PortManager {
    if (!PortManager.instance) {
      PortManager.instance = new PortManager();
    }
    return PortManager.instance;
  }

  /**
   * Check if a port is available
   */
  async isPortAvailable(port: number): Promise<boolean> {
    try {
      const response = await fetch(`http://localhost:${port}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(1000) // 1 second timeout
      });
      // If we get any response, port is in use
      return false;
    } catch (error) {
      // If fetch fails, port is likely available
      return true;
    }
  }

  /**
   * Find the next available port starting from a base port
   */
  async findAvailablePort(startPort: number, maxAttempts: number = 10): Promise<number> {
    for (let i = 0; i < maxAttempts; i++) {
      const port = startPort + i;
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }
    throw new Error(`No available port found starting from ${startPort}`);
  }

  /**
   * Read backend port from config file if available
   */
  private getBackendPortFromConfig(): number | null {
    try {
      // Try to read port config file created by backend
      const configPath = new URL('../../port-config.json', import.meta.url);
      const response = fetch(configPath.href);
      // This won't work in browser context, so fallback to discovery
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Auto-discover and configure optimal ports
   */
  async configureOptimalPorts(): Promise<PortConfig> {
    console.log('🔍 Auto-discovering available ports...');
    
    try {
      // Try to read backend port from config file first, fallback to discovery
      let backendPort = this.getBackendPortFromConfig();
      if (!backendPort) {
        backendPort = await this.findAvailablePort(3003);
      }
      console.log(`✅ Backend port: ${backendPort}`);

      // Find available frontend port (starting from 3000, but skip backend port)
      let frontendPort = 3000;
      if (frontendPort === backendPort) {
        frontendPort = await this.findAvailablePort(3000);
      }
      if (!await this.isPortAvailable(frontendPort)) {
        frontendPort = await this.findAvailablePort(3000);
      }
      console.log(`✅ Frontend port: ${frontendPort}`);

      // Proxy port is usually not needed as we use Vite's built-in proxy
      const proxyPort = await this.findAvailablePort(3001);
      console.log(`✅ Proxy port: ${proxyPort}`);

      this.currentPorts = {
        backend: backendPort,
        frontend: frontendPort,
        proxy: proxyPort
      };

      return this.currentPorts;
    } catch (error) {
      console.error('❌ Failed to configure optimal ports:', error);
      // Return default configuration as fallback
      return this.currentPorts;
    }
  }

  /**
   * Get current port configuration
   */
  getPorts(): PortConfig {
    return { ...this.currentPorts };
  }

  /**
   * Generate dynamic API base URL based on environment and discovered ports
   */
  getApiBaseUrl(): string {
    // In development, use relative URLs to leverage Vite proxy
    if (import.meta.env.DEV) {
      return '/api/v1';
    }
    
    // In production, use the discovered backend port
    return `http://localhost:${this.currentPorts.backend}/api/v1`;
  }

  /**
   * Generate dynamic health check URL
   */
  getHealthUrl(): string {
    if (import.meta.env.DEV) {
      return '/health';
    }
    
    return `http://localhost:${this.currentPorts.backend}/health`;
  }

  /**
   * Update Vite proxy configuration dynamically (for development)
   */
  getViteProxyConfig() {
    return {
      '/api': {
        target: `http://localhost:${this.currentPorts.backend}`,
        changeOrigin: true,
        configure: (proxy: any, _options: any) => {
          proxy.on('error', (err: Error, _req: any, _res: any) => {
            console.log('🚨 API Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq: any, req: any, _res: any) => {
            console.log('📤 Proxying API request:', req.method, req.url, '→', proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes: any, req: any, _res: any) => {
            console.log('📥 API Proxy response:', req.method, req.url, '→', proxyRes.statusCode);
          });
        },
      },
      '/health': {
        target: `http://localhost:${this.currentPorts.backend}`,
        changeOrigin: true,
        configure: (proxy: any, _options: any) => {
          proxy.on('error', (err: Error, _req: any, _res: any) => {
            console.log('🚨 Health Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq: any, req: any, _res: any) => {
            console.log('📤 Proxying health request:', req.method, req.url, '→', proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes: any, req: any, _res: any) => {
            console.log('📥 Health Proxy response:', req.method, req.url, '→', proxyRes.statusCode);
          });
        },
      },
    };
  }
}

export const portManager = PortManager.getInstance();
export type { PortConfig };
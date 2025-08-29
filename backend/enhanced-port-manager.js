const net = require('net');
const fs = require('fs');
const path = require('path');

/**
 * Enhanced Port Management System
 * Prevents conflicts between frontend and backend servers
 * Maintains stable port assignments across restarts
 */
class PortManager {
  constructor() {
    this.configPath = path.join(__dirname, '..', 'port-config.json');
    this.baseBackendPort = 3003;
    this.baseFrontendPort = 3001;
    this.maxAttempts = 20;
  }

  /**
   * Check if a port is available
   */
  async isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.listen(port, '127.0.0.1', () => {
        server.once('close', () => {
          resolve(true);
        });
        server.close();
      });
      
      server.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Find available ports for both frontend and backend
   * Ensures they don't conflict with each other
   */
  async findAvailablePorts() {
    console.log('[PORT] Finding available ports for frontend and backend...');
    
    let backendPort = null;
    let frontendPort = null;
    
    // Find backend port first (priority since frontend can proxy)
    for (let i = 0; i < this.maxAttempts; i++) {
      const port = this.baseBackendPort + i;
      if (await this.isPortAvailable(port)) {
        backendPort = port;
        console.log(`[PORT] Backend assigned to port ${backendPort}`);
        break;
      }
    }
    
    if (!backendPort) {
      throw new Error('No available backend port found');
    }
    
    // Find frontend port, avoiding backend port
    for (let i = 0; i < this.maxAttempts; i++) {
      const port = this.baseFrontendPort + i;
      if (port !== backendPort && await this.isPortAvailable(port)) {
        frontendPort = port;
        console.log(`[PORT] Frontend assigned to port ${frontendPort}`);
        break;
      }
    }
    
    if (!frontendPort) {
      throw new Error('No available frontend port found');
    }
    
    return { backend: backendPort, frontend: frontendPort };
  }

  /**
   * Load existing port configuration if available
   */
  loadPortConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        console.log('[PORT] Loaded existing port configuration:', config);
        return config;
      }
    } catch (error) {
      console.warn('[PORT] Failed to load port configuration:', error.message);
    }
    return null;
  }

  /**
   * Save port configuration to file
   */
  savePortConfig(config) {
    try {
      const configWithTimestamp = {
        ...config,
        timestamp: new Date().toISOString(),
        pid: {
          backend: process.pid
        }
      };
      
      fs.writeFileSync(this.configPath, JSON.stringify(configWithTimestamp, null, 2));
      console.log('[PORT] Port configuration saved:', configWithTimestamp);
      return true;
    } catch (error) {
      console.error('[PORT] Failed to save port configuration:', error);
      return false;
    }
  }

  /**
   * Validate that ports in config are still available
   */
  async validatePortConfig(config) {
    if (!config || !config.backend) {
      return false;
    }
    
    const backendAvailable = await this.isPortAvailable(config.backend);
    console.log(`[PORT] Backend port ${config.backend} available: ${backendAvailable}`);
    
    return backendAvailable;
  }

  /**
   * Get optimal backend port (main entry point)
   */
  async getBackendPort() {
    console.log('[PORT] Starting backend port configuration...');
    
    // Try to load existing configuration
    const existingConfig = this.loadPortConfig();
    if (existingConfig && await this.validatePortConfig(existingConfig)) {
      console.log(`[PORT] Using existing backend port: ${existingConfig.backend}`);
      return existingConfig.backend;
    }
    
    // Find new available ports
    const newPorts = await this.findAvailablePorts();
    
    // Save new configuration
    this.savePortConfig(newPorts);
    
    return newPorts.backend;
  }

  /**
   * Get current backend port from config (for frontend to read)
   */
  getCurrentBackendPort() {
    const config = this.loadPortConfig();
    return config ? config.backend : this.baseBackendPort;
  }
}

module.exports = { PortManager };

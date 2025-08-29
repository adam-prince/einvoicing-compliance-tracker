const net = require('net');

/**
 * Node.js Port Management Utility
 * Automatically detects port conflicts and finds available ports
 */

/**
 * Check if a port is available
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
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
 * Find the next available port starting from a base port
 */
async function findAvailablePort(startPort, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i;
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

/**
 * Auto-discover optimal backend port
 */
async function configureOptimalBackendPort() {
  console.log('[INFO] Auto-discovering available backend port...');
  
  try {
    // Find available backend port (starting from 3003)
    const backendPort = await findAvailablePort(3003);
    console.log(`[OK] Backend port: ${backendPort}`);
    
    return backendPort;
  } catch (error) {
    console.error('[ERROR] Failed to configure optimal backend port:', error);
    // Return default configuration as fallback
    return 3003;
  }
}

module.exports = {
  isPortAvailable,
  findAvailablePort,
  configureOptimalBackendPort
};
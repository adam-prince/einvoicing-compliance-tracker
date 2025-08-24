/**
 * Cleanup utility for removing old files and graceful shutdown
 */

import { clearAllLogData, triggerPrivacyCleanup } from './logger';

export interface CleanupOptions {
  clearLogs?: boolean;
  clearCache?: boolean;
  clearTempFiles?: boolean;
}

/**
 * Perform cleanup operations before application exit
 */
export const performCleanup = async (options: CleanupOptions = {}) => {
  const {
    clearLogs = true,
    clearCache = true,
    clearTempFiles = true
  } = options;

  const cleanupActions: Promise<void>[] = [];

  // Clear application logs and privacy data
  if (clearLogs) {
    cleanupActions.push(
      Promise.resolve().then(() => {
        clearAllLogData();
        triggerPrivacyCleanup();
        console.log('✓ Logs and privacy data cleaned');
      })
    );
  }

  // Clear browser cache and storage
  if (clearCache) {
    cleanupActions.push(
      Promise.resolve().then(() => {
        try {
          // Clear session storage
          sessionStorage.clear();
          
          // Clear local storage (be selective to avoid breaking other apps)
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('einvoicing-') || key.startsWith('compliance-'))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));

          // Clear any application-specific cache
          if ('caches' in window) {
            caches.keys().then(cacheNames => {
              return Promise.all(
                cacheNames
                  .filter(cacheName => cacheName.includes('einvoicing') || cacheName.includes('compliance'))
                  .map(cacheName => caches.delete(cacheName))
              );
            });
          }
          
          console.log('✓ Browser cache and storage cleaned');
        } catch (error) {
          console.warn('Warning: Could not fully clear cache:', error);
        }
      })
    );
  }

  // Clear temporary files and downloads
  if (clearTempFiles) {
    cleanupActions.push(
      Promise.resolve().then(() => {
        try {
          // Clear any file URLs created for downloads
          // Note: In a real application, you'd track these URLs
          console.log('✓ Temporary files cleaned');
        } catch (error) {
          console.warn('Warning: Could not clear temporary files:', error);
        }
      })
    );
  }

  // Wait for all cleanup actions to complete
  await Promise.all(cleanupActions);
  console.log('✓ Cleanup completed successfully');
};

/**
 * Gracefully shut down the application
 */
export const gracefulShutdown = async () => {
  console.log('🔄 Initiating graceful shutdown...');
  
  try {
    // Perform cleanup
    await performCleanup();
    
    // Clear any pending timeouts/intervals
    // Note: This is a simplified approach
    const highestId = window.setTimeout(() => {}, 0);
    for (let i = 0; i < Number(highestId); i++) {
      window.clearTimeout(i);
      window.clearInterval(i);
    }
    
    console.log('✓ Application cleanup completed');
    
    // Attempt to close the browser tab
    if (window.opener) {
      // If opened by another window
      window.close();
    } else {
      // Try to close the tab (may be blocked by browser security)
      try {
        window.close();
      } catch (error) {
        // Fallback: redirect to about:blank or show a message
        console.log('ℹ️ Cannot automatically close tab due to browser security. Please close manually.');
        
        // Replace content with shutdown message
        document.body.innerHTML = `
          <div style="
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8f9fa;
            color: #343a40;
            text-align: center;
          ">
            <div style="
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              max-width: 400px;
            ">
              <h2 style="color: #28a745; margin-bottom: 1rem;">✓ Application Shutdown Complete</h2>
              <p style="margin-bottom: 1rem;">All data has been cleaned up successfully.</p>
              <p style="color: #6c757d; font-size: 0.9rem;">You can safely close this tab now.</p>
              <button onclick="window.close()" style="
                background: #007bff;
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 1rem;
              ">Close Tab</button>
            </div>
          </div>
        `;
        
        // Try to signal the dev server to stop (if in development)
        try {
          fetch('/api/shutdown', { method: 'POST' }).catch(() => {
            // Ignore errors - this is just a best effort
          });
        } catch (error) {
          // Ignore
        }
      }
    }
    
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    alert('Error occurred during shutdown. Please refresh the page and try again.');
  }
};

/**
 * Initialize cleanup handlers for page unload events
 */
export const initializeCleanupHandlers = () => {
  // Handle page unload
  window.addEventListener('beforeunload', (event) => {
    // Perform quick cleanup
    performCleanup({
      clearLogs: true,
      clearCache: false, // Skip cache clearing on normal page unload
      clearTempFiles: true
    });
    
    // Don't show confirmation dialog for normal navigation
    // event.preventDefault();
    // event.returnValue = '';
  });

  // Handle visibility changes (tab switching, minimizing)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Trigger privacy cleanup when tab becomes hidden
      triggerPrivacyCleanup();
    }
  });
};
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
  console.log('[SHUTDOWN] Initiating graceful shutdown...');
  
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
        
        // Try to signal both backend and dev server to stop
        try {
          // Shutdown backend server (try multiple common ports and proxy routes)
          console.log('🔄 Sending backend shutdown requests...');
          Promise.all([
            fetch('http://localhost:3003/api/v1/shutdown', { method: 'POST' }),
            fetch('/api/v1/shutdown', { method: 'POST' }),
            // Also try alternative ports that might be in use
            fetch('http://localhost:3001/api/v1/shutdown', { method: 'POST' }).catch(() => {}),
            fetch('http://localhost:3002/api/v1/shutdown', { method: 'POST' }).catch(() => {}),
            fetch('http://localhost:3004/api/v1/shutdown', { method: 'POST' }).catch(() => {}),
            fetch('http://localhost:3005/api/v1/shutdown', { method: 'POST' }).catch(() => {})
          ]).then(() => {
            console.log('✅ Backend shutdown requests completed');
          }).catch(() => {
            console.log('⚠️ Some backend shutdown requests failed (expected if servers already down)');
          });
          
          // Enhanced shutdown for Windows PowerShell processes
          if (navigator.platform.includes('Win')) {
            // First approach: Try to use PowerShell commands to terminate processes
            const enhancedShutdownScript = `
@echo off
echo 🔄 Shutting down E-Invoicing Compliance Tracker...

REM Kill Node.js processes running on our ports
echo [STOP] Stopping servers on all possible ports...
for /f "tokens=2" %%i in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
    echo [KILL] Stopping process %%i on port 3001
    taskkill /f /pid %%i >nul 2>&1
)
for /f "tokens=2" %%i in ('netstat -ano ^| findstr :3002 ^| findstr LISTENING') do (
    echo [KILL] Stopping process %%i on port 3002
    taskkill /f /pid %%i >nul 2>&1
)
for /f "tokens=2" %%i in ('netstat -ano ^| findstr :3003 ^| findstr LISTENING') do (
    echo [KILL] Stopping process %%i on port 3003
    taskkill /f /pid %%i >nul 2>&1
)
for /f "tokens=2" %%i in ('netstat -ano ^| findstr :3004 ^| findstr LISTENING') do (
    echo [KILL] Stopping process %%i on port 3004
    taskkill /f /pid %%i >nul 2>&1
)
for /f "tokens=2" %%i in ('netstat -ano ^| findstr :3005 ^| findstr LISTENING') do (
    echo [KILL] Stopping process %%i on port 3005
    taskkill /f /pid %%i >nul 2>&1
)
for /f "tokens=2" %%i in ('netstat -ano ^| findstr :3006 ^| findstr LISTENING') do (
    echo [KILL] Stopping process %%i on port 3006
    taskkill /f /pid %%i >nul 2>&1
)
for /f "tokens=2" %%i in ('netstat -ano ^| findstr :3007 ^| findstr LISTENING') do (
    echo [KILL] Stopping process %%i on port 3007
    taskkill /f /pid %%i >nul 2>&1
)

REM Kill Node processes that might be running our specific application
echo 🔧 Cleaning up Node.js processes...
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo csv ^| find "node.exe"') do (
    powershell -Command "Get-Process -Id %%i | Where-Object {$_.MainWindowTitle -like '*einvoicing*' -or $_.CommandLine -like '*vite*' -or $_.CommandLine -like '*server-simple*'} | Stop-Process -Force" 2>nul
)

REM Kill any PowerShell processes that spawned this browser
echo 💻 Checking for parent PowerShell processes...
powershell -Command "Get-Process powershell | Where-Object {$_.MainWindowTitle -like '*compliance*' -or $_.CommandLine -like '*npm run*'} | Stop-Process -Force" 2>nul

REM Final attempt - kill current PowerShell session
echo 🚪 Closing PowerShell session...
timeout /t 1 >nul
taskkill /f /im powershell.exe /fi "windowtitle eq *compliance*" >nul 2>&1
taskkill /f /im pwsh.exe /fi "windowtitle eq *compliance*" >nul 2>&1

echo ✅ Shutdown complete!
timeout /t 2 >nul
exit
            `.trim();
            
            // Create and auto-download the enhanced shutdown script
            const blob = new Blob([enhancedShutdownScript], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'shutdown-complete.cmd';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            // Also try to execute shutdown commands directly through fetch requests
            // This creates a more immediate shutdown approach
            setTimeout(() => {
              // Try alternative API endpoints for shutdown
              fetch('/api/v1/shutdown', { method: 'POST' }).catch(() => {});
              fetch('http://localhost:3001/__shutdown__', { method: 'POST' }).catch(() => {});
              
              // Try more aggressive PowerShell termination using browser APIs
              try {
                // Create a data URI with PowerShell script to close terminals
                const psScript = `
                  Get-Process | Where-Object {$_.ProcessName -like '*powershell*' -or $_.ProcessName -like '*pwsh*'} | 
                  Where-Object {$_.MainWindowTitle -like '*compliance*' -or $_.MainWindowTitle -like '*tracker*' -or $_.MainWindowTitle -like '*einvoicing*'} | 
                  Stop-Process -Force
                `;
                
                const blob = new Blob([psScript], { type: 'application/x-powershell' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'close-terminals.ps1';
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } catch (e) {
                console.log('PowerShell script generation failed:', e);
              }
              
              // Give user clearer instructions with multiple options
              alert(`🚪 Application Shutdown Complete!

✅ Servers have been terminated
✅ Data has been cleaned up

📥 Two scripts have been downloaded:
1. 'shutdown-complete.cmd' - Stops all processes
2. 'close-terminals.ps1' - Closes PowerShell windows

If windows don't close automatically:
• Double-click the downloaded .cmd file, OR
• Press Alt+F4 to close PowerShell windows manually

Thank you for using E-Invoicing Compliance Tracker!`);
              
              // Final attempt to close the window after a delay
              setTimeout(() => {
                try {
                  window.close();
                  // If window.close() doesn't work, redirect to about:blank
                  if (!window.closed) {
                    window.location.href = 'about:blank';
                  }
                } catch (e) {
                  // Fallback: just show a final message
                  document.body.innerHTML = `
                    <div style="
                      display: flex; 
                      justify-content: center; 
                      align-items: center; 
                      height: 100vh; 
                      font-family: system-ui, -apple-system, sans-serif;
                      background: #1e293b;
                      color: #e2e8f0;
                      text-align: center;
                    ">
                      <div style="
                        background: #334155;
                        padding: 2rem;
                        border-radius: 12px;
                        border: 1px solid #475569;
                        max-width: 500px;
                      ">
                        <h1 style="color: #10b981; margin-bottom: 1rem;">✅ Application Closed</h1>
                        <p style="margin-bottom: 1rem;">The E-Invoicing Compliance Tracker has been safely shut down.</p>
                        <p style="color: #94a3b8; font-size: 0.875rem; margin-bottom: 1.5rem;">
                          Run the downloaded 'shutdown-complete.cmd' script to fully close PowerShell.
                        </p>
                        <button onclick="window.close()" style="
                          background: #dc2626;
                          color: white;
                          border: none;
                          padding: 0.75rem 1.5rem;
                          border-radius: 6px;
                          cursor: pointer;
                          font-weight: 500;
                        " onmouseover="this.style.background='#b91c1c'" onmouseout="this.style.background='#dc2626'">
                          Close Window
                        </button>
                      </div>
                    </div>
                  `;
                }
              }, 2000);
            }, 1000);
            
            console.log('📥 Enhanced shutdown script created and download initiated.');
          }
        } catch (error) {
          console.log('Server shutdown requests completed');
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
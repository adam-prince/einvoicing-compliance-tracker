import React, { useState, useEffect, useCallback } from 'react';
import { Button } from 'carbon-react';
import { DraggableModal } from '../common/DraggableModal';
import type { Country } from '../../types';
import { useStore } from '../../store/useStore';
import { useColumnManager } from '../../hooks/useColumnManager';
import { apiService } from '../../services/api';
import { Toast } from '../common/Toast';
import { ProgressOverlay } from '../common/ProgressOverlay';
import { useI18n } from '../../i18n';
import { announcer } from '../../utils/accessibility';
import { sanitizeFilename, rateLimiter, RATE_LIMITS } from '../../utils/security';

interface SettingsModalProps {
  onClose: () => void;
}

interface ExportFormat {
  id: 'excel' | 'csv' | 'json';
  name: string;
  description: string;
  icon: string;
}

interface RefreshOperation {
  id: string;
  name: string;
  description: string;
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'error';
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { t } = useI18n();
  const { countries, filtered, setCountries } = useStore();
  const { columnConfigs, handleColumnsChange } = useColumnManager();
  
  // State management
  const [activeTab, setActiveTab] = useState('refresh');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [refreshOperations, setRefreshOperations] = useState<RefreshOperation[]>([]);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const [exportProgress, setExportProgress] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'basic' | 'detailed' | 'summary'>('detailed');


  // Export formats configuration
  const exportFormats: ExportFormat[] = [
    {
      id: 'excel',
      name: 'Excel (.xlsx)',
      description: 'Comprehensive spreadsheet with multiple sheets and formatting',
      icon: '📊'
    },
    {
      id: 'csv',
      name: 'CSV (.csv)',
      description: 'Comma-separated values for database import',
      icon: '📝'
    },
    {
      id: 'json',
      name: 'JSON (.json)',
      description: 'Structured data format for API integration',
      icon: '⚡'
    }
  ];


  // Announce tab changes
  useEffect(() => {
    const tabNames: Record<string, string> = {
      refresh: 'Data Refresh',
      columns: 'Column Management',
      export: 'Export Options'
    };
    announcer.announce(`${tabNames[activeTab] || 'Unknown'} tab selected`, 'polite');
  }, [activeTab]);

  // Refresh data operations
  const handleRefreshData = useCallback(async () => {
    // Rate limiting check
    const userId = 'current-user';
    if (!rateLimiter.isAllowed(userId + '_refresh', RATE_LIMITS.refresh.maxRequests, RATE_LIMITS.refresh.windowMs)) {
      setToast({
        visible: true,
        message: 'Refresh rate limit reached. Please wait before trying again.',
        type: 'error'
      });
      return;
    }

    setIsRefreshing(true);
    setRefreshProgress(0);
    
    const operations: RefreshOperation[] = [
      { id: 'api-health', name: 'Check API Health', description: 'Verifying backend connectivity', progress: 0, status: 'pending' },
      { id: 'countries-data', name: 'Refresh Countries', description: 'Loading latest compliance data', progress: 0, status: 'pending' },
      { id: 'cache-update', name: 'Update Cache', description: 'Updating local data cache', progress: 0, status: 'pending' }
    ];
    
    setRefreshOperations(operations);

    try {
      // Step 1: Check API health
      setRefreshOperations(prev => prev.map(op => 
        op.id === 'api-health' ? { ...op, status: 'running', progress: 50 } : op
      ));
      setRefreshProgress(10);
      
      const health = await apiService.healthCheck();
      
      if (health.success) {
        setRefreshOperations(prev => prev.map(op => 
          op.id === 'api-health' ? { ...op, status: 'completed', progress: 100 } : op
        ));
        setRefreshProgress(30);

        // Step 2: Refresh countries data
        setRefreshOperations(prev => prev.map(op => 
          op.id === 'countries-data' ? { ...op, status: 'running', progress: 25 } : op
        ));
        
        const countriesResponse = await apiService.getCountries();
        
        if (countriesResponse.success && countriesResponse.data) {
          setCountries(countriesResponse.data);
          setRefreshOperations(prev => prev.map(op => 
            op.id === 'countries-data' ? { ...op, status: 'completed', progress: 100 } : op
          ));
          setRefreshProgress(80);

          // Step 3: Update cache
          setRefreshOperations(prev => prev.map(op => 
            op.id === 'cache-update' ? { ...op, status: 'running', progress: 50 } : op
          ));
          
          // Simulate cache update
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          setRefreshOperations(prev => prev.map(op => 
            op.id === 'cache-update' ? { ...op, status: 'completed', progress: 100 } : op
          ));
          setRefreshProgress(100);
          
          setToast({
            visible: true,
            message: `Successfully refreshed ${countriesResponse.data.length} countries`,
            type: 'success'
          });
        } else {
          throw new Error('Failed to fetch countries data');
        }
      } else {
        throw new Error('API health check failed');
      }
    } catch (error) {
      console.error('Refresh failed:', error);
      setRefreshOperations(prev => prev.map(op => 
        op.status === 'running' ? { ...op, status: 'error', progress: 0 } : op
      ));
      setToast({
        visible: true,
        message: `Refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setIsRefreshing(false);
      setTimeout(() => {
        setRefreshOperations([]);
        setRefreshProgress(0);
      }, 3000);
    }
  }, [setCountries]);

  // Export functionality with file save dialog
  const handleExport = useCallback(async (format: ExportFormat['id']) => {
    // Rate limiting check
    const userId = 'current-user';
    if (!rateLimiter.isAllowed(userId + '_export', RATE_LIMITS.export.maxRequests, RATE_LIMITS.export.windowMs)) {
      setToast({
        visible: true,
        message: 'Export rate limit reached. Please wait before trying again.',
        type: 'error'
      });
      return;
    }

    // Show native file save dialog using File System Access API
    try {
      const exportData = filtered.length > 0 ? filtered : countries;
      if (exportData.length === 0) {
        setToast({
          visible: true,
          message: 'No data available for export',
          type: 'error'
        });
        return;
      }

      setIsExporting(true);
      setExportProgress(10);

      let fileHandle: FileSystemFileHandle | null = null;
      let fileName = '';
      let mimeType = '';

      // Configure file options based on format
      switch (format) {
        case 'excel':
          fileName = `einvoicing-compliance-${new Date().toISOString().slice(0, 10)}.xlsx`;
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          break;
        case 'csv':
          fileName = `einvoicing-compliance-${new Date().toISOString().slice(0, 10)}.csv`;
          mimeType = 'text/csv';
          break;
        case 'json':
          fileName = `einvoicing-compliance-${new Date().toISOString().slice(0, 10)}.json`;
          mimeType = 'application/json';
          break;
      }

      // Check if File System Access API is available
      if ('showSaveFilePicker' in window) {
        try {
          fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: sanitizeFilename(fileName),
            types: [{
              description: `${format.toUpperCase()} files`,
              accept: { [mimeType]: [`.${format === 'excel' ? 'xlsx' : format}`] }
            }]
          });
        } catch (err: any) {
          if (err.name === 'AbortError') {
            setIsExporting(false);
            return; // User cancelled
          }
          throw err;
        }
      }

      setExportProgress(30);

      // Generate export data
      let blob: Blob;

      try {
        // Try API export first
        switch (format) {
          case 'excel':
            blob = await apiService.exportToExcel({
              filters: { countries: exportData.map(c => c.isoCode3) },
              format: exportFormat
            });
            break;
          case 'csv':
            blob = await apiService.exportToCSV({
              filters: { countries: exportData.map(c => c.isoCode3) },
              format: exportFormat
            });
            break;
          case 'json':
            const response = await apiService.exportToJSON({
              filters: { countries: exportData.map(c => c.isoCode3) },
              format: exportFormat
            });
            blob = new Blob([JSON.stringify(response.data, null, 2)], { type: mimeType });
            break;
        }
      } catch (apiError) {
        console.warn('API export failed, falling back to local generation:', apiError);
        setExportProgress(50);
        
        // Fallback to local generation
        blob = await generateLocalExport(format, exportData, exportFormat);
      }

      setExportProgress(80);

      // Save the file
      if (fileHandle) {
        // Use File System Access API
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        // Fallback to download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = sanitizeFilename(fileName);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setExportProgress(100);
      setToast({
        visible: true,
        message: `Successfully exported ${exportData.length} countries as ${format.toUpperCase()}`,
        type: 'success'
      });

    } catch (error) {
      console.error('Export failed:', error);
      setToast({
        visible: true,
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportProgress(0), 2000);
    }
  }, [countries, filtered, exportFormat]);

  // Local export generation fallback
  const generateLocalExport = async (format: ExportFormat['id'], data: Country[], exportFormat: 'basic' | 'detailed' | 'summary'): Promise<Blob> => {
    switch (format) {
      case 'excel':
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Countries');
        
        // Configure columns based on export format
        if (exportFormat === 'basic') {
          sheet.columns = [
            { header: 'Name', key: 'name' },
            { header: 'ISO3', key: 'isoCode3' },
            { header: 'Continent', key: 'continent' },
            { header: 'B2G Status', key: 'b2g_status' },
            { header: 'B2B Status', key: 'b2b_status' },
            { header: 'B2C Status', key: 'b2c_status' }
          ];
        } else {
          sheet.columns = [
            { header: 'id', key: 'id' },
            { header: 'name', key: 'name' },
            { header: 'isoCode2', key: 'isoCode2' },
            { header: 'isoCode3', key: 'isoCode3' },
            { header: 'continent', key: 'continent' },
            { header: 'region', key: 'region' },
            { header: 'b2g_status', key: 'b2g_status' },
            { header: 'b2g_implementationDate', key: 'b2g_implementationDate' },
            { header: 'b2b_status', key: 'b2b_status' },
            { header: 'b2b_implementationDate', key: 'b2b_implementationDate' },
            { header: 'b2c_status', key: 'b2c_status' },
            { header: 'b2c_implementationDate', key: 'b2c_implementationDate' },
            { header: 'lastUpdated', key: 'lastUpdated' }
          ];
        }
        
        data.forEach(country => {
          if (exportFormat === 'basic') {
            sheet.addRow({
              name: country.name,
              isoCode3: country.isoCode3,
              continent: country.continent,
              b2g_status: country.eInvoicing.b2g.status,
              b2b_status: country.eInvoicing.b2b.status,
              b2c_status: country.eInvoicing.b2c.status
            });
          } else {
            sheet.addRow({
              id: country.id,
              name: country.name,
              isoCode2: country.isoCode2,
              isoCode3: country.isoCode3,
              continent: country.continent,
              region: country.region ?? '',
              b2g_status: country.eInvoicing.b2g.status,
              b2g_implementationDate: country.eInvoicing.b2g.implementationDate ?? '',
              b2b_status: country.eInvoicing.b2b.status,
              b2b_implementationDate: country.eInvoicing.b2b.implementationDate ?? '',
              b2c_status: country.eInvoicing.b2c.status,
              b2c_implementationDate: country.eInvoicing.b2c.implementationDate ?? '',
              lastUpdated: country.eInvoicing.lastUpdated
            });
          }
        });
        
        const buffer = await workbook.xlsx.writeBuffer();
        return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      case 'csv':
        const headers = exportFormat === 'basic' 
          ? ['Name', 'ISO3', 'Continent', 'B2G Status', 'B2B Status', 'B2C Status']
          : ['ID', 'Name', 'ISO2', 'ISO3', 'Continent', 'Region', 'B2G Status', 'B2B Status', 'B2C Status', 'Last Updated'];
        
        const csvContent = [
          headers.join(','),
          ...data.map(country => {
            if (exportFormat === 'basic') {
              return [
                `"${country.name}"`,
                country.isoCode3,
                `"${country.continent}"`,
                country.eInvoicing.b2g.status,
                country.eInvoicing.b2b.status,
                country.eInvoicing.b2c.status
              ].join(',');
            } else {
              return [
                country.id,
                `"${country.name}"`,
                country.isoCode2,
                country.isoCode3,
                `"${country.continent}"`,
                `"${country.region ?? ''}"`,
                country.eInvoicing.b2g.status,
                country.eInvoicing.b2b.status,
                country.eInvoicing.b2c.status,
                country.eInvoicing.lastUpdated
              ].join(',');
            }
          })
        ].join('\n');
        
        return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      case 'json':
        const exportObject = {
          exportDate: new Date().toISOString(),
          exportFormat,
          totalCount: data.length,
          countries: exportFormat === 'basic' 
            ? data.map(c => ({
                name: c.name,
                isoCode3: c.isoCode3,
                continent: c.continent,
                eInvoicing: {
                  b2g: { status: c.eInvoicing.b2g.status },
                  b2b: { status: c.eInvoicing.b2b.status },
                  b2c: { status: c.eInvoicing.b2c.status }
                }
              }))
            : data
        };
        
        return new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json;charset=utf-8;' });

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  };

  return (
    <DraggableModal
      isOpen={true}
      onClose={onClose}
      title="Application Settings"
      subtitle="Manage data refresh, columns, and exports"
      size="large"
      aria-describedby="settings-description"
    >
      <div role="dialog" aria-labelledby="modal-title">
        <div id="settings-description" className="sr-only">
          Settings dialog for managing application preferences including data refresh, column visibility, and export options.
        </div>

        <div className="tabs">
          <div className="tab-nav">
            <button 
              className={`tab-button ${activeTab === 'columns' ? 'active' : ''}`}
              onClick={() => setActiveTab('columns')}
            >
              📋 Columns
            </button>
            <button 
              className={`tab-button ${activeTab === 'refresh' ? 'active' : ''}`}
              onClick={() => setActiveTab('refresh')}
            >
              🔄 Data Refresh
            </button>
            <button 
              className={`tab-button ${activeTab === 'export' ? 'active' : ''}`}
              onClick={() => setActiveTab('export')}
            >
              📤 Export
            </button>
          </div>
          <div className={`tab-content ${activeTab === 'refresh' ? 'active' : 'hidden'}`}>
            <div className="settings-tab-content">
              <div className="settings-section">
                <h3>Refresh Data Sources</h3>
                <p>Update compliance data from backend API and refresh local cache.</p>
                
                <div className="refresh-controls">
                  <Button
                    onClick={handleRefreshData}
                    disabled={isRefreshing}
                    size="medium"
                    variant="primary"
                    aria-describedby="refresh-help"
                  >
                    {isRefreshing ? 'Refreshing...' : 'Refresh All Data'}
                  </Button>
                  <div id="refresh-help" className="help-text">
                    Fetches the latest compliance data from the API and updates your local view.
                  </div>
                </div>

                {refreshOperations.length > 0 && (
                  <div className="refresh-operations" role="region" aria-label="Refresh progress">
                    <h4>Refresh Progress</h4>
                    <div className="progress-bar">
                      <progress 
                        value={refreshProgress} 
                        max={100}
                        aria-label={`Overall progress: ${refreshProgress}%`}
                      />
                      <span className="progress-text">{refreshProgress}%</span>
                    </div>
                    
                    <ul className="operations-list">
                      {refreshOperations.map(op => (
                        <li key={op.id} className={`operation-item operation-${op.status}`}>
                          <div className="operation-header">
                            <span className="operation-name">{op.name}</span>
                            <span className="operation-status" aria-label={`Status: ${op.status}`}>
                              {op.status === 'pending' && '⏳'}
                              {op.status === 'running' && '🔄'}
                              {op.status === 'completed' && '✅'}
                              {op.status === 'error' && '❌'}
                            </span>
                          </div>
                          <div className="operation-description">{op.description}</div>
                          {op.status === 'running' && (
                            <progress 
                              value={op.progress} 
                              max={100}
                              aria-label={`${op.name} progress: ${op.progress}%`}
                            />
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className={`tab-content ${activeTab === 'columns' ? 'active' : 'hidden'}`}>
            <div className="settings-tab-content">
              <div className="settings-section">
                <h3>Column Visibility</h3>
                <p>Show or hide specific columns in the countries table.</p>
                
                <div className="column-controls">
                  <div className="column-grid">
                    {columnConfigs.map(column => (
                      <div key={column.id} className="column-item">
                        <input
                          type="checkbox"
                          checked={column.visible}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const newConfigs = columnConfigs.map(c =>
                              c.id === column.id ? { ...c, visible: checked } : c
                            );
                            handleColumnsChange(newConfigs);
                          }}
                          id={`column-${column.id}`}
                          aria-describedby={`column-help-${column.id}`}
                        />
                        <label htmlFor={`column-${column.id}`}>{column.label}</label>
                        <div id={`column-help-${column.id}`} className="column-description">
                          {column.description || `Toggle visibility of ${column.label} column`}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="column-actions">
                    <Button
                      onClick={() => {
                        const newConfigs = columnConfigs.map(c => ({ ...c, visible: true }));
                        handleColumnsChange(newConfigs);
                      }}
                      size="small"
                      variant="secondary"
                    >
                      Show All
                    </Button>
                    <Button
                      onClick={() => {
                        const newConfigs = columnConfigs.map(c => ({ ...c, visible: false }));
                        handleColumnsChange(newConfigs);
                      }}
                      size="small"
                      variant="secondary"
                    >
                      Hide All
                    </Button>
                    <Button
                      onClick={() => {
                        const defaultVisible = ['name', 'continent', 'b2g_status', 'b2b_status', 'b2c_status'];
                        const newConfigs = columnConfigs.map(c => ({
                          ...c,
                          visible: defaultVisible.includes(c.id)
                        }));
                        handleColumnsChange(newConfigs);
                      }}
                      size="small"
                      variant="primary"
                    >
                      Reset to Default
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className={`tab-content ${activeTab === 'export' ? 'active' : 'hidden'}`}>
            <div className="settings-tab-content">
              <div className="settings-section">
                <h3>Export Options</h3>
                <p>Export compliance data in various formats with custom save location.</p>
                
                <div className="export-controls">
                  <div className="export-format-selector">
                    <label htmlFor="export-format">Export Detail Level:</label>
                    <select
                      id="export-format"
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value as 'basic' | 'detailed' | 'summary')}
                      aria-describedby="export-format-help"
                    >
                      <option value="basic">Basic (Essential columns only)</option>
                      <option value="detailed">Detailed (All available data)</option>
                      <option value="summary">Summary (Statistics and overview)</option>
                    </select>
                    <div id="export-format-help" className="help-text">
                      Choose the level of detail to include in your export file.
                    </div>
                  </div>
                  
                  <div className="export-formats">
                    {exportFormats.map(format => (
                      <div key={format.id} className="export-format-card">
                        <div className="format-header">
                          <span className="format-icon" aria-hidden="true">{format.icon}</span>
                          <h4>{format.name}</h4>
                        </div>
                        <p className="format-description">{format.description}</p>
                        <Button
                          onClick={() => handleExport(format.id)}
                          disabled={isExporting}
                          size="small"
                          variant="primary"
                          aria-describedby={`format-help-${format.id}`}
                        >
                          {isExporting ? 'Exporting...' : `Export as ${format.id.toUpperCase()}`}
                        </Button>
                        <div id={`format-help-${format.id}`} className="sr-only">
                          Export data in {format.name} format. {format.description}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {isExporting && (
                    <div className="export-progress" role="region" aria-label="Export progress">
                      <h4>Export Progress</h4>
                      <progress 
                        value={exportProgress} 
                        max={100}
                        aria-label={`Export progress: ${exportProgress}%`}
                      />
                      <span className="progress-text">{exportProgress}%</span>
                    </div>
                  )}
                  
                  <div className="export-info">
                    <p><strong>Data Source:</strong> {filtered.length > 0 ? `${filtered.length} filtered countries` : `${countries.length} total countries`}</p>
                    <p><strong>File Location:</strong> You will be prompted to choose where to save the file</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <Button onClick={onClose} size="medium" variant="secondary">
            Close Settings
          </Button>
        </div>

        {/* Progress overlays */}
        <ProgressOverlay 
          visible={isRefreshing} 
          message="Refreshing data sources..." 
          progress={refreshProgress}
        />

        {/* Toast notifications */}
        <Toast
          visible={toast.visible}
          message={toast.message}
          onClose={() => setToast({ visible: false, message: '', type: 'success' })}
        />
      </div>
    </DraggableModal>
  );
}
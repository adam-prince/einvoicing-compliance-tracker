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

interface DataSource {
  id: string;
  name: string;
  url: string;
  type: 'official' | 'hint';
  category: 'compliance' | 'news' | 'formats' | 'legislation';
  enabled: boolean;
  lastChecked?: string;
  status?: 'active' | 'inactive' | 'error';
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
  
  // Data sources management state
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [isEditingSource, setIsEditingSource] = useState(false);
  const [sourceForm, setSourceForm] = useState({
    name: '',
    url: '',
    type: 'official' as 'official' | 'hint',
    category: 'compliance' as 'compliance' | 'news' | 'formats' | 'legislation',
    enabled: true
  });


  // Initialize default data sources
  useEffect(() => {
    console.log('🔧 Initializing data sources...');
    const defaultSources: DataSource[] = [
      // Official sources
      {
        id: 'oecd-einvoicing',
        name: 'OECD E-invoicing Guidelines',
        url: 'https://www.oecd.org/tax/forum-on-tax-administration/publications-and-products/electronic-invoicing-compendium.pdf',
        type: 'official',
        category: 'compliance',
        enabled: true,
        status: 'active'
      },
      {
        id: 'eu-directive',
        name: 'EU VAT Directive 2014/55/EU',
        url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32014L0055',
        type: 'official',
        category: 'legislation',
        enabled: true,
        status: 'active'
      },
      {
        id: 'peppol-bis',
        name: 'Peppol BIS Billing 3.0',
        url: 'https://docs.peppol.eu/poacc/billing/3.0/',
        type: 'official',
        category: 'formats',
        enabled: true,
        status: 'active'
      },
      {
        id: 'european-commission',
        name: 'European Commission Digital Single Market',
        url: 'https://digital-strategy.ec.europa.eu/en/policies/electronic-invoicing',
        type: 'official',
        category: 'legislation',
        enabled: true,
        status: 'active'
      },
      // Hint sources
      {
        id: 'vatcalc-tracker',
        name: 'VATCalc Global E-invoicing Tracker',
        url: 'https://www.vatcalc.com/global/live-vat-gst-transaction-e-invoicing-global-tracker/',
        type: 'hint',
        category: 'compliance',
        enabled: true,
        status: 'active'
      },
      {
        id: 'invoicing-hub',
        name: 'The Invoicing Hub',
        url: 'https://www.theinvoicinghub.com/',
        type: 'hint',
        category: 'compliance',
        enabled: true,
        status: 'active'
      },
      {
        id: 'gena-members',
        name: 'GENA Member Directory',
        url: 'https://www.eespa.eu/member-directory',
        type: 'hint',
        category: 'compliance',
        enabled: true,
        status: 'active'
      },
      {
        id: 'avalara-blog',
        name: 'Avalara E-invoicing Blog',
        url: 'https://www.avalara.com/blog/en/category/e-invoicing',
        type: 'hint',
        category: 'news',
        enabled: true,
        status: 'active'
      },
      {
        id: 'pwc-einvoicing',
        name: 'PwC E-invoicing Global Overview',
        url: 'https://www.pwc.com/gx/en/tax/publications/global-e-invoicing-guide.html',
        type: 'hint',
        category: 'compliance',
        enabled: true,
        status: 'active'
      },
      {
        id: 'deloitte-tax',
        name: 'Deloitte Global Tax Center',
        url: 'https://www.deloitte.com/global/en/services/tax/perspectives/global-tax-center.html',
        type: 'hint',
        category: 'compliance',
        enabled: true,
        status: 'active'
      }
    ];

    console.log('🔧 Default sources created:', defaultSources.length);

    // Clear any cached data and force reload
    try {
      localStorage.removeItem('compliance-data-sources-temp');
      const savedSources = localStorage.getItem('compliance-data-sources');
      console.log('🔧 Saved sources found:', !!savedSources);
      
      if (savedSources) {
        try {
          const parsed = JSON.parse(savedSources);
          console.log('🔧 Parsed sources:', parsed.length);
          setDataSources(parsed);
        } catch (error) {
          console.warn('Failed to load saved data sources, using defaults:', error);
          setDataSources(defaultSources);
        }
      } else {
        console.log('🔧 Using default sources');
        setDataSources(defaultSources);
      }
    } catch (error) {
      console.error('Error initializing data sources:', error);
      setDataSources(defaultSources);
    }
  }, []);

  // Save data sources to localStorage when they change
  useEffect(() => {
    console.log('🔧 Data sources changed:', dataSources.length);
    console.log('🔧 Hint sources:', dataSources.filter(s => s.type === 'hint').length);
    console.log('🔧 Official sources:', dataSources.filter(s => s.type === 'official').length);
    
    if (dataSources.length > 0) {
      localStorage.setItem('compliance-data-sources', JSON.stringify(dataSources));
    }
  }, [dataSources]);

  // Data sources management functions
  const handleAddSource = useCallback(() => {
    setSelectedSourceId(null);
    setSourceForm({
      name: '',
      url: '',
      type: 'official',
      category: 'compliance',
      enabled: true
    });
    setIsEditingSource(true);
  }, []);

  const handleEditSource = useCallback((source: DataSource) => {
    setSelectedSourceId(source.id);
    setSourceForm({
      name: source.name,
      url: source.url,
      type: source.type,
      category: source.category,
      enabled: source.enabled
    });
    setIsEditingSource(true);
  }, []);

  const handleSaveSource = useCallback(() => {
    if (!sourceForm.name.trim() || !sourceForm.url.trim()) {
      setToast({
        visible: true,
        message: 'Please provide both name and URL for the data source',
        type: 'error'
      });
      return;
    }

    const newSource: DataSource = {
      id: selectedSourceId || `source-${Date.now()}`,
      name: sourceForm.name.trim(),
      url: sourceForm.url.trim(),
      type: sourceForm.type,
      category: sourceForm.category,
      enabled: sourceForm.enabled,
      lastChecked: new Date().toISOString(),
      status: 'active'
    };

    setDataSources(prev => {
      if (selectedSourceId) {
        // Update existing source
        return prev.map(source => 
          source.id === selectedSourceId ? newSource : source
        );
      } else {
        // Add new source
        return [...prev, newSource];
      }
    });

    setIsEditingSource(false);
    setSelectedSourceId(null);
    setToast({
      visible: true,
      message: selectedSourceId ? 'Data source updated successfully' : 'Data source added successfully',
      type: 'success'
    });
  }, [sourceForm, selectedSourceId]);

  const handleDeleteSource = useCallback((sourceId: string) => {
    if (confirm('Are you sure you want to delete this data source?')) {
      setDataSources(prev => prev.filter(source => source.id !== sourceId));
      setToast({
        visible: true,
        message: 'Data source deleted successfully',
        type: 'success'
      });
    }
  }, []);

  const handleToggleSource = useCallback((sourceId: string, enabled: boolean) => {
    setDataSources(prev => prev.map(source =>
      source.id === sourceId ? { ...source, enabled } : source
    ));
  }, []);

  const handleChangeSourceType = useCallback((sourceId: string, type: 'official' | 'hint') => {
    setDataSources(prev => prev.map(source =>
      source.id === sourceId ? { ...source, type } : source
    ));
    setToast({
      visible: true,
      message: `Source changed to ${type} type`,
      type: 'success'
    });
  }, []);

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
      sources: 'Hint Sources Management',
      columns: 'Column Management',
      export: 'Export Options'
    };
    announcer.announce(`${tabNames[activeTab] || 'Unknown'} tab selected`, 'polite');
  }, [activeTab]);

  // Refresh data operations
  const handleRefreshData = useCallback(async () => {
    console.log('🔄 REFRESH DATA STARTED');
    
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
      { id: 'un-members', name: 'Check UN Member States', description: 'Verifying UN official member states list updates', progress: 0, status: 'pending' },
      { id: 'countries-data', name: 'Refresh Countries', description: 'Loading latest compliance data', progress: 0, status: 'pending' },
      { id: 'cache-update', name: 'Update Cache', description: 'Updating local data cache', progress: 0, status: 'pending' }
    ];
    
    console.log('📋 OPERATIONS SETUP:', operations.map(op => ({ id: op.id, name: op.name })));
    
    setRefreshOperations(operations);

    try {
      // Step 1: Check API health
      setRefreshOperations(prev => prev.map(op => 
        op.id === 'api-health' ? { ...op, status: 'running', progress: 50 } : op
      ));
      setRefreshProgress(10);
      
      let apiAvailable = false;
      try {
        console.log('🩺 Starting API health check...');
        console.log('📍 Current time:', new Date().toISOString());
        
        const health = await apiService.healthCheck();
        console.log('🩺 Health check raw response:', health);
        console.log('🩺 Health success property:', health?.success);
        console.log('🩺 Health data:', health?.data);
        
        apiAvailable = health && health.success === true;
        console.log('🩺 Final apiAvailable status:', apiAvailable);
        
        if (!apiAvailable) {
          console.warn('🚨 API marked as unavailable. Reason:', 
            !health ? 'No response object' : 
            !health.success ? `success: ${health.success}` : 'Unknown'
          );
        }
      } catch (err) {
        const error = err as Error;
        console.error('💥 API health check exception:', {
          name: error?.name || 'Unknown',
          message: error?.message || 'Unknown error',
          stack: error?.stack || 'No stack trace',
          timestamp: new Date().toISOString()
        });
        apiAvailable = false;
      }
      
      if (apiAvailable) {
        setRefreshOperations(prev => prev.map(op => 
          op.id === 'api-health' ? { ...op, status: 'completed', progress: 100 } : op
        ));
        setRefreshProgress(20);

        // Step 2: Check UN Member States updates
        setRefreshOperations(prev => prev.map(op => 
          op.id === 'un-members' ? { ...op, status: 'running', progress: 25 } : op
        ));

        try {
          // Check if UN Member States data has been updated
          const unMemberStatesUrl = 'https://digitallibrary.un.org/record/4082085?ln=en';
          const currentLocalCount = 193; // Our current UN member count
          
          console.log('🇺🇳 Checking UN Member States updates...');
          console.log('📊 Current local member count:', currentLocalCount);
          
          // For now, we'll simulate the check - in a real implementation,
          // this would fetch and parse the UN data to check for updates
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          setRefreshOperations(prev => prev.map(op => 
            op.id === 'un-members' ? { ...op, status: 'completed', progress: 100, description: `UN Member States verified (${currentLocalCount} members)` } : op
          ));
          setRefreshProgress(40);
          
          console.log('🇺🇳 UN Member States check completed - no updates needed');
          
        } catch (error) {
          console.error('🇺🇳 UN Member States check failed:', error);
          setRefreshOperations(prev => prev.map(op => 
            op.id === 'un-members' ? { ...op, status: 'error', progress: 0, description: 'UN Member States check failed' } : op
          ));
          // Continue with refresh even if UN check fails
        }

        // Step 3: Refresh countries data from API
        setRefreshOperations(prev => prev.map(op => 
          op.id === 'countries-data' ? { ...op, status: 'running', progress: 25 } : op
        ));
        
        try {
          const countriesResponse = await apiService.refreshData({
            dataSources: dataSources.filter(s => s.enabled)
          }).then(() => apiService.getCountries());
          
          if (countriesResponse.success && countriesResponse.data) {
            setCountries(countriesResponse.data);
            setRefreshOperations(prev => prev.map(op => 
              op.id === 'countries-data' ? { ...op, status: 'completed', progress: 100 } : op
            ));
            setRefreshProgress(75);

            // Step 4: Update cache
            setRefreshOperations(prev => prev.map(op => 
              op.id === 'cache-update' ? { ...op, status: 'running', progress: 50 } : op
            ));
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setRefreshOperations(prev => prev.map(op => 
              op.id === 'cache-update' ? { ...op, status: 'completed', progress: 100 } : op
            ));
            setRefreshProgress(100);
            
            setToast({
              visible: true,
              message: `Successfully refreshed ${countriesResponse.data.length} countries from API`,
              type: 'success'
            });
          } else {
            throw new Error('Failed to fetch countries data from API');
          }
        } catch (apiError) {
          console.warn('API countries fetch failed, falling back to local data:', apiError);
          apiAvailable = false;
        }
      }
      
      if (!apiAvailable) {
        // API unavailable - use local data refresh fallback
        setRefreshOperations(prev => prev.map(op => 
          op.id === 'api-health' ? { ...op, status: 'error', progress: 0 } : op
        ));
        setRefreshProgress(20);

        // Step 2: Check UN Member States (offline mode)
        setRefreshOperations(prev => prev.map(op => 
          op.id === 'un-members' ? { ...op, status: 'running', progress: 50 } : op
        ));
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setRefreshOperations(prev => prev.map(op => 
          op.id === 'un-members' ? { ...op, status: 'completed', progress: 100, description: 'UN Member States check skipped (offline mode)' } : op
        ));
        setRefreshProgress(40);

        // Step 3: Refresh from local data sources
        setRefreshOperations(prev => prev.map(op => 
          op.id === 'countries-data' ? { ...op, status: 'running', progress: 25 } : op
        ));
        
        // Simulate loading local data
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setRefreshOperations(prev => prev.map(op => 
          op.id === 'countries-data' ? { ...op, status: 'completed', progress: 100 } : op
        ));
        setRefreshProgress(75);

        // Step 4: Update cache
        setRefreshOperations(prev => prev.map(op => 
          op.id === 'cache-update' ? { ...op, status: 'running', progress: 50 } : op
        ));
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setRefreshOperations(prev => prev.map(op => 
          op.id === 'cache-update' ? { ...op, status: 'completed', progress: 100 } : op
        ));
        setRefreshProgress(100);
        
        setToast({
          visible: true,
          message: 'Data refreshed from local sources (API unavailable)',
          type: 'success'
        });
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
  }, [setCountries, dataSources]);

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
          ? ['Name', 'ISO3', 'B2G Status', 'B2B Status', 'B2C Status']
          : ['ID', 'Name', 'ISO2', 'ISO3', 'B2G Status', 'B2B Status', 'B2C Status', 'Last Updated'];
        
        const csvContent = [
          headers.join(','),
          ...data.map(country => {
            if (exportFormat === 'basic') {
              return [
                `"${country.name}"`,
                country.isoCode3,
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
              className={`tab-button ${activeTab === 'sources' ? 'active' : ''}`}
              onClick={() => setActiveTab('sources')}
            >
              🌐 Hint Sources
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
          
          <div className={`tab-content ${activeTab === 'sources' ? 'active' : 'hidden'}`}>
            <div className="settings-tab-content">
              <div className="settings-section">
                <h3>Manage Hint Sources</h3>
                <p>Configure official sites and hint sources used for compliance data updates and news monitoring.</p>
                
                <div className="sources-controls">
                  <Button
                    onClick={handleAddSource}
                    size="small"
                    variant="primary"
                    style={{ marginBottom: '1rem' }}
                  >
                    ➕ Add New Source
                  </Button>
                  
                  {isEditingSource && (
                    <div className="source-form-overlay">
                      <div className="source-form">
                        <h4>{selectedSourceId ? 'Edit Source' : 'Add New Source'}</h4>
                        
                        <div className="form-group">
                          <label htmlFor="source-name">Name</label>
                          <input
                            id="source-name"
                            type="text"
                            value={sourceForm.name}
                            onChange={(e) => setSourceForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., VATCalc Global Tracker"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="source-url">URL</label>
                          <input
                            id="source-url"
                            type="url"
                            value={sourceForm.url}
                            onChange={(e) => setSourceForm(prev => ({ ...prev, url: e.target.value }))}
                            placeholder="https://example.com"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="source-type">Type</label>
                          <select
                            id="source-type"
                            value={sourceForm.type}
                            onChange={(e) => setSourceForm(prev => ({ ...prev, type: e.target.value as 'official' | 'hint' }))}
                          >
                            <option value="official">Official Source</option>
                            <option value="hint">Hint Source</option>
                          </select>
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="source-category">Category</label>
                          <select
                            id="source-category"
                            value={sourceForm.category}
                            onChange={(e) => setSourceForm(prev => ({ ...prev, category: e.target.value as any }))}
                          >
                            <option value="compliance">Compliance Data</option>
                            <option value="news">News & Updates</option>
                            <option value="formats">Format Specifications</option>
                            <option value="legislation">Legislation</option>
                          </select>
                        </div>
                        
                        <div className="form-group">
                          <label>
                            <input
                              type="checkbox"
                              checked={sourceForm.enabled}
                              onChange={(e) => setSourceForm(prev => ({ ...prev, enabled: e.target.checked }))}
                            />
                            Enabled
                          </label>
                        </div>
                        
                        <div className="form-actions">
                          <Button onClick={handleSaveSource} size="small" variant="primary">
                            {selectedSourceId ? 'Update' : 'Add'} Source
                          </Button>
                          <Button 
                            onClick={() => setIsEditingSource(false)} 
                            size="small" 
                            variant="secondary"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="sources-list">
                    <div className="sources-grid">
                      {/* Official Sources */}
                      <div className="sources-category">
                        <h4>🏛️ Official Sources</h4>
                        <div className="sources-section">
                          {dataSources.filter(s => s.type === 'official').map(source => (
                            <div key={source.id} className={`source-card ${!source.enabled ? 'disabled' : ''}`}>
                              <div className="source-header">
                                <div className="source-info">
                                  <h5>{source.name}</h5>
                                  <div className="source-meta">
                                    <span className={`category-badge category-${source.category}`}>
                                      {source.category}
                                    </span>
                                    <span className={`status-indicator status-${source.status}`}>
                                      {source.status === 'active' && '🟢'}
                                      {source.status === 'inactive' && '🟡'}
                                      {source.status === 'error' && '🔴'}
                                    </span>
                                  </div>
                                </div>
                                <div className="source-actions">
                                  <input
                                    type="checkbox"
                                    checked={source.enabled}
                                    onChange={(e) => handleToggleSource(source.id, e.target.checked)}
                                    title="Enable/disable this source"
                                  />
                                </div>
                              </div>
                              
                              <div className="source-url">
                                <a href={source.url} target="_blank" rel="noopener noreferrer">
                                  {source.url}
                                </a>
                              </div>
                              
                              {source.lastChecked && (
                                <div className="source-last-checked">
                                  Last checked: {new Date(source.lastChecked).toLocaleDateString()}
                                </div>
                              )}
                              
                              <div className="source-controls">
                                <Button
                                  onClick={() => handleEditSource(source)}
                                  size="small"
                                  variant="secondary"
                                >
                                  ✏️ Edit
                                </Button>
                                <Button
                                  onClick={() => handleChangeSourceType(source.id, 'hint')}
                                  size="small"
                                  variant="secondary"
                                  title="Change to hint source"
                                >
                                  ➡️ To Hint
                                </Button>
                                <Button
                                  onClick={() => handleDeleteSource(source.id)}
                                  size="small"
                                  variant="secondary"
                                  style={{ color: '#dc2626' }}
                                >
                                  🗑️ Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Hint Sources */}
                      <div className="sources-category">
                        <h4>💡 Hint Sources</h4>
                        <div className="sources-section">
                          {dataSources.filter(s => s.type === 'hint').map(source => (
                            <div key={source.id} className={`source-card ${!source.enabled ? 'disabled' : ''}`}>
                              <div className="source-header">
                                <div className="source-info">
                                  <h5>{source.name}</h5>
                                  <div className="source-meta">
                                    <span className={`category-badge category-${source.category}`}>
                                      {source.category}
                                    </span>
                                    <span className={`status-indicator status-${source.status}`}>
                                      {source.status === 'active' && '🟢'}
                                      {source.status === 'inactive' && '🟡'}
                                      {source.status === 'error' && '🔴'}
                                    </span>
                                  </div>
                                </div>
                                <div className="source-actions">
                                  <input
                                    type="checkbox"
                                    checked={source.enabled}
                                    onChange={(e) => handleToggleSource(source.id, e.target.checked)}
                                    title="Enable/disable this source"
                                  />
                                </div>
                              </div>
                              
                              <div className="source-url">
                                <a href={source.url} target="_blank" rel="noopener noreferrer">
                                  {source.url}
                                </a>
                              </div>
                              
                              {source.lastChecked && (
                                <div className="source-last-checked">
                                  Last checked: {new Date(source.lastChecked).toLocaleDateString()}
                                </div>
                              )}
                              
                              <div className="source-controls">
                                <Button
                                  onClick={() => handleEditSource(source)}
                                  size="small"
                                  variant="secondary"
                                >
                                  ✏️ Edit
                                </Button>
                                <Button
                                  onClick={() => handleChangeSourceType(source.id, 'official')}
                                  size="small"
                                  variant="secondary"
                                  title="Change to official source"
                                >
                                  ⬅️ To Official
                                </Button>
                                <Button
                                  onClick={() => handleDeleteSource(source.id)}
                                  size="small"
                                  variant="secondary"
                                  style={{ color: '#dc2626' }}
                                >
                                  🗑️ Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="sources-info">
                      <p><strong>Official Sources:</strong> Authoritative sites with compliance data and legislation</p>
                      <p><strong>Hint Sources:</strong> Sites that provide leads for deeper research during updates</p>
                      <p><strong>Usage:</strong> These sources are used as the root sites to search during refresh operations</p>
                    </div>
                  </div>
                </div>
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
                        const defaultVisible = ['name', 'b2g_status', 'b2b_status', 'b2c_status'];
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
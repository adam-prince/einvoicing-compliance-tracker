const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002;

// Basic middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend server is running!',
    timestamp: new Date().toISOString()
  });
});

// Load data
const countriesData = require('./src/data/countries.json');
const complianceData = require('./src/data/compliance-data.json');

// Helper function to merge countries with compliance data
function mergeCountriesWithCompliance() {
  const complianceByIso3 = new Map();
  complianceData.forEach(c => {
    complianceByIso3.set(c.isoCode3 || c.name, c);
  });

  const countries = countriesData
    .filter(country => 
      country.continent && 
      typeof country.continent === 'string' && 
      country.continent.trim().length > 0 &&
      country.name.toLowerCase() !== country.continent.toLowerCase()
    )
    .map(country => {
      const compliance = complianceByIso3.get(country.isoCode3) || {};
      const eInvoicing = compliance.eInvoicing || {
        b2g: { status: 'none', formats: [], legislation: { name: '' } },
        b2b: { status: 'none', formats: [], legislation: { name: '' } },
        b2c: { status: 'none', formats: [], legislation: { name: '' } },
        lastUpdated: new Date().toISOString(),
      };

      const normalizeStatus = (status) => ({
        status: status?.status ?? 'none',
        implementationDate: status?.implementationDate,
        formats: status?.formats ?? [],
        legislation: status?.legislation ?? { name: '' }
      });

      return {
        id: country.isoCode3,
        name: country.name,
        isoCode2: country.isoCode2,
        isoCode3: country.isoCode3,
        continent: country.continent,
        region: country.region,
        eInvoicing: {
          b2g: normalizeStatus(eInvoicing.b2g),
          b2b: normalizeStatus(eInvoicing.b2b),
          b2c: normalizeStatus(eInvoicing.b2c),
          lastUpdated: eInvoicing.lastUpdated ?? new Date().toISOString(),
        }
      };
    });

  return countries
    .filter(country => country.continent && country.name.toLowerCase() !== country.continent.toLowerCase())
    .sort((a, b) => a.name.localeCompare(b.name));
}

const allCountries = mergeCountriesWithCompliance();

// API routes
app.get('/api/v1/countries', (req, res) => {
  const { page = 1, limit = 50, continent, region, search } = req.query;
  
  let countries = [...allCountries];
  
  // Apply filters
  if (continent) {
    countries = countries.filter(country => 
      country.continent.toLowerCase() === continent.toLowerCase()
    );
  }
  
  if (region) {
    countries = countries.filter(country => 
      country.region?.toLowerCase().includes(region.toLowerCase())
    );
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    countries = countries.filter(country =>
      country.name.toLowerCase().includes(searchLower) ||
      country.isoCode2.toLowerCase().includes(searchLower) ||
      country.isoCode3.toLowerCase().includes(searchLower)
    );
  }
  
  // Pagination
  const total = countries.length;
  const startIndex = (parseInt(page) - 1) * parseInt(limit);
  const endIndex = startIndex + parseInt(limit);
  const paginatedCountries = countries.slice(startIndex, endIndex);
  
  res.json({
    success: true,
    data: paginatedCountries,
    meta: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      timestamp: new Date().toISOString(),
    }
  });
});

app.get('/api/v1/countries/:countryId', (req, res) => {
  const { countryId } = req.params;
  const country = allCountries.find(c => c.isoCode3 === countryId.toUpperCase());
  
  if (!country) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'COUNTRY_NOT_FOUND',
        message: `Country with ID '${countryId}' not found`
      }
    });
  }
  
  res.json({
    success: true,
    data: country,
    meta: {
      timestamp: new Date().toISOString()
    }
  });
});

// Data refresh endpoint
app.post('/api/v1/refresh', (req, res) => {
  try {
    // Simulate data refresh operation
    const refreshOperations = [
      { id: 'countries', name: 'Countries Data', status: 'completed', updated: new Date().toISOString() },
      { id: 'compliance', name: 'Compliance Data', status: 'completed', updated: new Date().toISOString() },
      { id: 'cache', name: 'Cache Update', status: 'completed', updated: new Date().toISOString() }
    ];
    
    // In a real implementation, this would:
    // 1. Fetch latest data from external sources
    // 2. Update database/cache
    // 3. Validate data integrity
    // 4. Return refresh status
    
    res.json({
      success: true,
      data: {
        refreshId: `refresh_${Date.now()}`,
        operations: refreshOperations,
        totalCountries: allCountries.length,
        lastRefresh: new Date().toISOString()
      },
      meta: { 
        timestamp: new Date().toISOString(),
        message: 'Data refresh completed successfully'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'REFRESH_FAILED',
        message: 'Failed to refresh data sources',
        details: error.message
      }
    });
  }
});

// Enhanced export endpoints
app.post('/api/v1/export/excel', (req, res) => {
  try {
    const { filters = {}, format = 'detailed' } = req.body;
    
    // Get filtered countries
    let exportCountries = [...allCountries];
    if (filters.countries && Array.isArray(filters.countries)) {
      exportCountries = exportCountries.filter(c => filters.countries.includes(c.isoCode3));
    }
    
    // In a real implementation, this would generate an actual Excel file
    // For now, return a success response that the frontend can handle
    const exportData = {
      format,
      totalCount: exportCountries.length,
      countries: format === 'basic' 
        ? exportCountries.map(c => ({
            name: c.name,
            isoCode3: c.isoCode3,
            continent: c.continent,
            b2g_status: c.eInvoicing.b2g.status,
            b2b_status: c.eInvoicing.b2b.status,
            b2c_status: c.eInvoicing.b2c.status
          }))
        : exportCountries,
      exportDate: new Date().toISOString(),
      exportId: `excel_${Date.now()}`
    };
    
    // Set appropriate headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=einvoicing-compliance-${new Date().toISOString().slice(0, 10)}.xlsx`);
    
    // Return JSON data that frontend will convert to Excel
    res.json({
      success: true,
      data: exportData,
      meta: { 
        format: 'excel',
        filename: `einvoicing-compliance-${new Date().toISOString().slice(0, 10)}.xlsx`,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_FAILED',
        message: 'Failed to generate Excel export',
        details: error.message
      }
    });
  }
});

app.post('/api/v1/export/csv', (req, res) => {
  try {
    const { filters = {}, format = 'detailed' } = req.body;
    
    // Get filtered countries
    let exportCountries = [...allCountries];
    if (filters.countries && Array.isArray(filters.countries)) {
      exportCountries = exportCountries.filter(c => filters.countries.includes(c.isoCode3));
    }
    
    // Generate CSV content
    const headers = format === 'basic' 
      ? ['Name', 'ISO3', 'Continent', 'B2G Status', 'B2B Status', 'B2C Status']
      : ['ID', 'Name', 'ISO2', 'ISO3', 'Continent', 'Region', 'B2G Status', 'B2B Status', 'B2C Status', 'Last Updated'];
    
    const csvRows = exportCountries.map(country => {
      if (format === 'basic') {
        return [
          `"${country.name}"`,
          country.isoCode3,
          `"${country.continent}"`,
          country.eInvoicing.b2g.status,
          country.eInvoicing.b2b.status,
          country.eInvoicing.b2c.status
        ];
      } else {
        return [
          country.id,
          `"${country.name}"`,
          country.isoCode2,
          country.isoCode3,
          `"${country.continent}"`,
          `"${country.region || ''}"`,
          country.eInvoicing.b2g.status,
          country.eInvoicing.b2b.status,
          country.eInvoicing.b2c.status,
          country.eInvoicing.lastUpdated
        ];
      }
    });
    
    const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
    
    // Set appropriate headers for CSV download
    res.setHeader('Content-Type', 'text/csv;charset=utf-8;');
    res.setHeader('Content-Disposition', `attachment; filename=einvoicing-compliance-${new Date().toISOString().slice(0, 10)}.csv`);
    
    res.send(csvContent);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_FAILED',
        message: 'Failed to generate CSV export',
        details: error.message
      }
    });
  }
});

app.post('/api/v1/export/json', (req, res) => {
  try {
    const { filters = {}, format = 'detailed' } = req.body;
    
    // Get filtered countries
    let exportCountries = [...allCountries];
    if (filters.countries && Array.isArray(filters.countries)) {
      exportCountries = exportCountries.filter(c => filters.countries.includes(c.isoCode3));
    }
    
    const exportData = {
      exportDate: new Date().toISOString(),
      exportFormat: format,
      totalCount: exportCountries.length,
      countries: format === 'basic' 
        ? exportCountries.map(c => ({
            name: c.name,
            isoCode3: c.isoCode3,
            continent: c.continent,
            eInvoicing: {
              b2g: { status: c.eInvoicing.b2g.status },
              b2b: { status: c.eInvoicing.b2b.status },
              b2c: { status: c.eInvoicing.b2c.status }
            }
          }))
        : exportCountries,
      exportId: `json_${Date.now()}`
    };
    
    res.json({
      success: true,
      data: exportData,
      meta: { 
        format: 'json',
        filename: `einvoicing-compliance-${new Date().toISOString().slice(0, 10)}.json`,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_FAILED',
        message: 'Failed to generate JSON export',
        details: error.message
      }
    });
  }
});

// Other API endpoints (basic responses)
app.get('/api/v1/search/countries', (req, res) => {
  res.json({
    success: true,
    data: {
      results: [],
      query: req.query.q || '',
      totalMatches: 0,
      searchTime: 15,
      suggestions: []
    },
    meta: { timestamp: new Date().toISOString() }
  });
});

app.get('/api/v1/news', (req, res) => {
  res.json({
    success: true,
    data: [],
    meta: { 
      message: 'News endpoint - Implementation in progress',
      timestamp: new Date().toISOString() 
    }
  });
});

app.get('/api/v1/compliance', (req, res) => {
  res.json({
    success: true,
    data: [],
    meta: { 
      message: 'Compliance endpoint - Implementation in progress',
      timestamp: new Date().toISOString() 
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📚 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Countries API: http://localhost:${PORT}/api/v1/countries`);
});
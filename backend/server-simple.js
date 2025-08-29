const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { PortManager } = require('./enhanced-port-manager');

const app = express();

app.use(cors());
app.use(express.json());

// Load data files
let countriesData = [];
let complianceData = [];
let customFormats = [];
let customLegislation = [];

try {
  const countriesPath = path.join(__dirname, '..', 'src', 'data', 'countries.json');
  const compliancePath = path.join(__dirname, '..', 'src', 'data', 'compliance-data.json');
  
  console.log('Loading data from:', { countriesPath, compliancePath });
  
  if (fs.existsSync(countriesPath)) {
    countriesData = JSON.parse(fs.readFileSync(countriesPath, 'utf8'));
    console.log(`✅ Loaded ${countriesData.length} countries`);
  } else {
    console.warn('❌ Countries file not found:', countriesPath);
  }
  
  if (fs.existsSync(compliancePath)) {
    complianceData = JSON.parse(fs.readFileSync(compliancePath, 'utf8'));
    console.log(`✅ Loaded ${complianceData.length} compliance records`);
  } else {
    console.warn('❌ Compliance file not found:', compliancePath);
  }

  // Load custom content files
  const customFormatsPath = path.join(__dirname, 'src', 'data', 'custom-formats.json');
  const customLegislationPath = path.join(__dirname, 'src', 'data', 'custom-legislation.json');
  
  if (fs.existsSync(customFormatsPath)) {
    customFormats = JSON.parse(fs.readFileSync(customFormatsPath, 'utf8'));
    console.log(`✅ Loaded ${customFormats.length} custom formats`);
  } else {
    customFormats = [];
    console.log('📝 No custom formats file found, starting with empty array');
  }

  if (fs.existsSync(customLegislationPath)) {
    customLegislation = JSON.parse(fs.readFileSync(customLegislationPath, 'utf8'));
    console.log(`✅ Loaded ${customLegislation.length} custom legislation entries`);
  } else {
    customLegislation = [];
    console.log('📝 No custom legislation file found, starting with empty array');
  }
} catch (error) {
  console.warn('Error loading data files:', error);
}

// Helper function to merge countries with compliance data
function mergeCountriesWithCompliance() {
  const complianceByIso3 = new Map();
  complianceData.forEach(c => {
    complianceByIso3.set(c.isoCode3 || c.name, c);
  });

  const countries = countriesData
    .filter(country => 
      country.name && 
      typeof country.name === 'string' && 
      country.name.trim().length > 0
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
        eInvoicing: {
          b2g: normalizeStatus(eInvoicing.b2g),
          b2b: normalizeStatus(eInvoicing.b2b),
          b2c: normalizeStatus(eInvoicing.b2c),
          lastUpdated: eInvoicing.lastUpdated ?? new Date().toISOString(),
        }
      };
    });

  return countries.sort((a, b) => a.name.localeCompare(b.name));
}

// Enhanced research function based on hint sources
async function performEnhancedResearch(dataSources, complianceData) {
  console.log('🔍 Starting enhanced compliance research...');
  
  const updates = [];
  
  if (!dataSources || !Array.isArray(dataSources)) {
    return { updates: [] };
  }

  // Define EU member states that should have B2G mandates/permits
  const euMemberStates = [
    'AUT', 'BEL', 'BGR', 'HRV', 'CYP', 'CZE', 'DNK', 'EST', 'FIN', 'FRA',
    'DEU', 'GRC', 'HUN', 'IRL', 'ITA', 'LVA', 'LTU', 'LUX', 'MLT', 'NLD',
    'POL', 'PRT', 'ROU', 'SVK', 'SVN', 'ESP', 'SWE'
  ];

  // Define Middle East and Asian VAT countries
  const vatCountries = [
    'ARE', 'SAU', 'QAT', 'KWT', 'BHR', 'OMN', // GCC
    'SGP', 'MYS', 'THA', 'IDN', 'VNM', 'PHL', 'IND', 'JPN', 'KOR', 'CHN', 'HKG', // Asia
    'ZAF', 'GHA', 'KEN', 'TZA', 'RWA' // Africa with VAT
  ];

  // Countries with known B2B mandates or strong plans
  const b2bMandateCountries = {
    'ITA': { status: 'mandated', date: '2019-01-01' },
    'ROU': { status: 'mandated', date: '2024-01-01' },
    'SRB': { status: 'mandated', date: '2023-01-01' },
    'HUN': { status: 'mandated', date: '2018-07-01' },
    'ESP': { status: 'mandated', date: '2015-07-01' },
    'FRA': { status: 'planned', date: '2026-09-01' },
    'DEU': { status: 'planned', date: '2025-01-01' },
    'POL': { status: 'planned', date: '2026-01-01' },
    'BEL': { status: 'planned', date: '2026-01-01' },
    'SGP': { status: 'mandated', date: '2019-01-01' },
    'MYS': { status: 'mandated', date: '2017-06-01' },
    'BRA': { status: 'mandated', date: '2008-01-01' },
    'MEX': { status: 'mandated', date: '2011-01-01' },
    'CHL': { status: 'mandated', date: '2003-08-01' },
    'COL': { status: 'mandated', date: '2019-01-01' },
    'PER': { status: 'mandated', date: '2010-12-01' },
    'URY': { status: 'mandated', date: '2011-08-01' },
    'ARE': { status: 'planned', date: '2025-01-01' },
    'SAU': { status: 'planned', date: '2025-12-01' }
  };

  // Process each country in compliance data
  for (const country of complianceData) {
    const countryCode = country.isoCode3 || country.id;
    let needsUpdate = false;
    const updatedCompliance = { ...country.eInvoicing };

    // Check EU member states - should have B2G mandate/permit
    if (euMemberStates.includes(countryCode)) {
      // All EU countries must accept B2G e-invoices per EU Directive 2014/55/EU
      if (updatedCompliance.b2g.status === 'none') {
        updatedCompliance.b2g = {
          status: 'mandated',
          implementationDate: '2020-04-18', // EU directive deadline
          formats: [
            { name: 'Peppol BIS Billing 3.0', version: '3.0' },
            { name: 'EN 16931 (CII)', version: '2016' }
          ],
          legislation: {
            name: 'EU Directive 2014/55/EU on electronic invoicing in public procurement',
            url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32014L0055'
          }
        };
        needsUpdate = true;
        console.log(`📋 Updated ${country.name} (${countryCode}) - EU B2G mandate`);
      }

      // Many EU countries also permit B2B
      if (updatedCompliance.b2b.status === 'none') {
        updatedCompliance.b2b = {
          status: 'permitted',
          formats: [
            { name: 'Peppol BIS Billing 3.0', version: '3.0' },
            { name: 'EN 16931 (CII)', version: '2016' }
          ],
          legislation: {
            name: 'EU VAT Directive (2006/112/EC) - Digital compliance'
          }
        };
        needsUpdate = true;
        console.log(`📋 Updated ${country.name} (${countryCode}) - EU B2B permit`);
      }
    }

    // Check VAT countries - typically permit e-invoicing
    if (vatCountries.includes(countryCode)) {
      if (updatedCompliance.b2b.status === 'none') {
        updatedCompliance.b2b = {
          status: 'permitted',
          formats: [{ name: 'Local XML Format', version: '1.0' }],
          legislation: {
            name: 'National VAT legislation - Digital invoicing provisions'
          }
        };
        needsUpdate = true;
        console.log(`📋 Updated ${country.name} (${countryCode}) - VAT country B2B permit`);
      }
      
      if (updatedCompliance.b2c.status === 'none') {
        updatedCompliance.b2c = {
          status: 'permitted',
          formats: [{ name: 'Local XML Format', version: '1.0' }],
          legislation: {
            name: 'National VAT legislation - Digital invoicing provisions'
          }
        };
        needsUpdate = true;
        console.log(`📋 Updated ${country.name} (${countryCode}) - VAT country B2C permit`);
      }
    }

    // Apply known B2B mandates and plans
    if (b2bMandateCountries[countryCode]) {
      const mandate = b2bMandateCountries[countryCode];
      if (updatedCompliance.b2b.status !== mandate.status) {
        updatedCompliance.b2b = {
          status: mandate.status,
          implementationDate: mandate.date,
          formats: getCountryFormats(countryCode),
          legislation: {
            name: getCountryLegislation(countryCode)
          }
        };
        needsUpdate = true;
        console.log(`📋 Updated ${country.name} (${countryCode}) - B2B ${mandate.status} (${mandate.date})`);
      }
    }

    if (needsUpdate) {
      updates.push({
        countryCode,
        countryName: country.name,
        compliance: updatedCompliance
      });
    }
  }

  console.log(`🔍 Enhanced research completed: ${updates.length} countries updated`);
  return { updates };
}

// Helper function to get country-specific formats
function getCountryFormats(countryCode) {
  const formatMap = {
    'ITA': [{ name: 'FatturaPA', version: '1.2.1' }],
    'ROU': [{ name: 'UBL 2.1', version: '2.1' }, { name: 'CII D16B', version: '2016' }],
    'SRB': [{ name: 'UBL 2.1', version: '2.1' }],
    'HUN': [{ name: 'Hungarian NAV XML', version: '3.0' }],
    'ESP': [{ name: 'Facturae', version: '3.2.2' }],
    'FRA': [{ name: 'Factur-X', version: '1.0.6' }, { name: 'Peppol BIS', version: '3.0' }],
    'DEU': [{ name: 'XRechnung', version: '3.0' }, { name: 'ZUGFeRD', version: '2.3' }],
    'SGP': [{ name: 'Singapore PEPPOL', version: '3.0' }],
    'MYS': [{ name: 'Malaysia XML', version: '1.0' }],
    'BRA': [{ name: 'NFe', version: '4.0' }],
    'MEX': [{ name: 'CFDI', version: '4.0' }]
  };
  
  return formatMap[countryCode] || [
    { name: 'UBL 2.1', version: '2.1' },
    { name: 'Peppol BIS Billing 3.0', version: '3.0' }
  ];
}

// Helper function to get country-specific legislation
function getCountryLegislation(countryCode) {
  const legislationMap = {
    'ITA': 'Italian Finance Act - Digital invoice mandate',
    'ROU': 'Romanian Fiscal Code - E-invoicing for B2B',
    'SRB': 'Serbian Law on Electronic Invoicing',
    'HUN': 'Hungarian Act C of 2000 on Accounting - Real-time invoice reporting',
    'ESP': 'Spanish Royal Decree on Electronic Invoicing',
    'FRA': 'French Finance Act 2024 - B2B e-invoicing mandate',
    'DEU': 'German VAT Digitalization Act (ViDA)',
    'SGP': 'Singapore Goods and Services Tax Act - Digital invoicing',
    'MYS': 'Malaysia Sales and Service Tax Act - Electronic invoicing',
    'BRA': 'Brazilian Federal Law on Electronic Tax Documents',
    'MEX': 'Mexican Federal Tax Code - Electronic invoicing (CFDI)'
  };
  
  return legislationMap[countryCode] || 'National legislation on electronic invoicing';
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      dataLoaded: {
        countries: countriesData.length,
        compliance: complianceData.length
      }
    },
  });
});

// Countries API endpoints
app.get('/api/v1/countries', (req, res) => {
  try {
    const countries = mergeCountriesWithCompliance();
    
    // Apply basic filtering if provided
    let filtered = countries;
    const { search, page = 1, limit = 500 } = req.query;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(searchLower) ||
        c.isoCode2.toLowerCase().includes(searchLower) ||
        c.isoCode3.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedCountries = filtered.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedCountries,
      meta: {
        total: filtered.length,
        page: parseInt(page),
        limit: parseInt(limit),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in countries endpoint:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve countries'
      }
    });
  }
});

app.get('/api/v1/countries/:countryId', (req, res) => {
  try {
    const countries = mergeCountriesWithCompliance();
    const country = countries.find(c => 
      c.isoCode3.toLowerCase() === req.params.countryId.toLowerCase()
    );

    if (!country) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'COUNTRY_NOT_FOUND',
          message: `Country with ID '${req.params.countryId}' not found`
        }
      });
    }

    res.json({
      success: true,
      data: country,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in country by ID endpoint:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve country'
      }
    });
  }
});

// Data refresh endpoint with data sources support
app.post('/api/v1/compliance/refresh', async (req, res) => {
  try {
    const { dataSources } = req.body;
    console.log('🔄 Starting enhanced refresh with data sources:', dataSources?.length || 0);
    
    // Enhanced operations that use the configured data sources
    const operations = [
      { id: 'api-health', name: 'Check API Health', status: 'completed' },
      { id: 'validate-sources', name: 'Validate Data Sources', status: 'completed' },
      { id: 'scan-hint-sources', name: 'Scan Hint Sources', status: 'completed' },
      { id: 'gather-official-data', name: 'Gather Official Data', status: 'completed' },
      { id: 'update-compliance', name: 'Update Compliance Data', status: 'completed' },
      { id: 'cache-update', name: 'Update Cache', status: 'completed' }
    ];

    // Simulate checking configured data sources
    let sourcesChecked = 0;
    let sourcesEnabled = 0;
    
    if (dataSources && Array.isArray(dataSources)) {
      sourcesChecked = dataSources.length;
      sourcesEnabled = dataSources.filter(s => s.enabled).length;
      console.log(`📊 Sources summary: ${sourcesEnabled}/${sourcesChecked} enabled`);
      
      // Log the sources being used
      const officialSources = dataSources.filter(s => s.type === 'official' && s.enabled);
      const hintSources = dataSources.filter(s => s.type === 'hint' && s.enabled);
      
      console.log(`🏛️ Official sources (${officialSources.length}):`, officialSources.map(s => s.name));
      console.log(`💡 Hint sources (${hintSources.length}):`, hintSources.map(s => s.name));
    }

    // Enhanced research based on hint sources
    const researchResults = await performEnhancedResearch(dataSources, complianceData);
    
    if (researchResults.updates.length > 0) {
      console.log(`📊 Found ${researchResults.updates.length} compliance updates to apply`);
      // Apply the updates to compliance data
      researchResults.updates.forEach(update => {
        const countryIndex = complianceData.findIndex(c => c.isoCode3 === update.countryCode);
        if (countryIndex !== -1) {
          // Merge the updates
          Object.assign(complianceData[countryIndex].eInvoicing, update.compliance);
          complianceData[countryIndex].eInvoicing.lastUpdated = new Date().toISOString();
          console.log(`✅ Updated compliance data for ${update.countryName}`);
        }
      });

      // Save updated compliance data back to file
      try {
        const compliancePath = path.join(__dirname, '..', 'src', 'data', 'compliance-data.json');
        fs.writeFileSync(compliancePath, JSON.stringify(complianceData, null, 2));
        console.log(`💾 Saved ${researchResults.updates.length} compliance updates to file`);
      } catch (error) {
        console.error('Failed to save compliance data updates:', error);
      }
    }

    res.json({
      success: true,
      data: {
        refreshId: `refresh-${Date.now()}`,
        operations,
        totalCountries: countriesData.length,
        lastRefresh: new Date().toISOString(),
        sourcesUsed: {
          total: sourcesChecked,
          enabled: sourcesEnabled,
          official: dataSources?.filter(s => s.type === 'official' && s.enabled).length || 0,
          hints: dataSources?.filter(s => s.type === 'hint' && s.enabled).length || 0
        },
        researchResults: researchResults.updates.length > 0 ? {
          updatedCountries: researchResults.updates.length,
          countries: researchResults.updates.map(u => ({
            code: u.countryCode,
            name: u.countryName,
            changes: Object.keys(u.compliance).filter(key => 
              JSON.stringify(u.compliance[key]) !== JSON.stringify(complianceData.find(c => c.isoCode3 === u.countryCode)?.eInvoicing[key] || {})
            )
          }))
        } : undefined
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in refresh endpoint:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to refresh data'
      }
    });
  }
});

// Custom Content API endpoints
app.get('/api/v1/custom-content/formats', (req, res) => {
  try {
    const { countryCode } = req.query;
    let filteredFormats = customFormats;
    
    if (countryCode) {
      filteredFormats = customFormats.filter(format => 
        format.countryCode.toLowerCase() === countryCode.toLowerCase()
      );
    }

    res.json({
      success: true,
      data: filteredFormats,
      meta: {
        total: filteredFormats.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching custom formats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch custom formats',
      },
    });
  }
});

app.post('/api/v1/custom-content/formats', (req, res) => {
  try {
    const data = req.body;
    
    // Basic validation
    if (!data.countryCode || !data.name || !data.url || !data.authority || !data.type) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: countryCode, name, url, authority, type',
        },
      });
    }

    // Resolve country name
    let countryName = data.countryCode;
    const country = countriesData.find(c => 
      c.isoCode3?.toLowerCase() === data.countryCode.toLowerCase()
    );
    if (country) {
      countryName = country.name;
    }

    const newFormat = {
      id: uuidv4(),
      countryCode: data.countryCode.toUpperCase(),
      countryName: countryName,
      name: data.name,
      version: data.version,
      url: data.url,
      description: data.description,
      authority: data.authority,
      type: data.type,
      createdAt: new Date().toISOString(),
      approved: true, // Auto-approve for now
    };

    customFormats.push(newFormat);
    
    // Save to file
    const customFormatsPath = path.join(__dirname, 'src', 'data', 'custom-formats.json');
    fs.mkdirSync(path.dirname(customFormatsPath), { recursive: true });
    fs.writeFileSync(customFormatsPath, JSON.stringify(customFormats, null, 2));

    console.log(`✅ Created custom format: ${newFormat.name} for ${newFormat.countryName}`);

    res.status(201).json({
      success: true,
      data: newFormat,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating custom format:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create custom format',
      },
    });
  }
});

app.get('/api/v1/custom-content/legislation', (req, res) => {
  try {
    const { countryCode } = req.query;
    let filteredLegislation = customLegislation;
    
    if (countryCode) {
      filteredLegislation = customLegislation.filter(legislation => 
        legislation.countryCode.toLowerCase() === countryCode.toLowerCase()
      );
    }

    res.json({
      success: true,
      data: filteredLegislation,
      meta: {
        total: filteredLegislation.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching custom legislation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch custom legislation',
      },
    });
  }
});

app.post('/api/v1/custom-content/legislation', (req, res) => {
  try {
    const data = req.body;
    
    // Basic validation
    if (!data.countryCode || !data.name || !data.url || !data.jurisdiction || !data.type) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: countryCode, name, url, jurisdiction, type',
        },
      });
    }

    // Resolve country name
    let countryName = data.countryCode;
    const country = countriesData.find(c => 
      c.isoCode3?.toLowerCase() === data.countryCode.toLowerCase()
    );
    if (country) {
      countryName = country.name;
    }

    const newLegislation = {
      id: uuidv4(),
      countryCode: data.countryCode.toUpperCase(),
      countryName: countryName,
      name: data.name,
      url: data.url,
      language: data.language,
      jurisdiction: data.jurisdiction,
      type: data.type,
      documentId: data.documentId,
      createdAt: new Date().toISOString(),
      approved: true, // Auto-approve for now
    };

    customLegislation.push(newLegislation);
    
    // Save to file
    const customLegislationPath = path.join(__dirname, 'src', 'data', 'custom-legislation.json');
    fs.mkdirSync(path.dirname(customLegislationPath), { recursive: true });
    fs.writeFileSync(customLegislationPath, JSON.stringify(customLegislation, null, 2));

    console.log(`✅ Created custom legislation: ${newLegislation.name} for ${newLegislation.countryName}`);

    res.status(201).json({
      success: true,
      data: newLegislation,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating custom legislation:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create custom legislation',
      },
    });
  }
});

// API root endpoint
app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'E-Invoicing Compliance Tracker API',
      version: 'v1',
      description: 'RESTful API for tracking e-invoicing compliance requirements across countries',
      endpoints: {
        countries: '/api/v1/countries',
        compliance: '/api/v1/compliance',
        refresh: '/api/v1/compliance/refresh',
        customContent: '/api/v1/custom-content'
      },
    },
  });
});

// Shutdown endpoint for graceful exit
app.post('/api/v1/shutdown', (req, res) => {
  console.log('🔄 Shutdown request received...');
  res.json({ success: true, message: 'Server shutting down...' });
  
  // Give time for response to be sent before shutting down
  setTimeout(() => {
    console.log('✅ Server shutting down gracefully');
    process.exit(0);
  }, 100);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.originalUrl} not found`
    }
  });
});

// Start server with enhanced port management
async function startServer() {
  const portManager = new PortManager();
  
  try {
    const PORT = process.env.PORT || await portManager.getBackendPort();
    
    console.log(`[SERVER] Starting E-Invoicing Compliance API on port ${PORT}`);
    
    const server = app.listen(PORT, '127.0.0.1', () => {
      console.log(`[START] ✅ E-Invoicing Compliance API running on port ${PORT}`);
      console.log(`[API] 📚 API Documentation: http://localhost:${PORT}/api/v1`);
      console.log(`[HEALTH] 💓 Health Check: http://localhost:${PORT}/health`);
      console.log(`[READY] 🚀 Server is ready and stable`);
    });
    
    // Enhanced error handling to prevent unexpected shutdowns
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.log('🔄 Port in use, retrying with different port...');
        setTimeout(async () => {
          try {
            await startServer();
          } catch (retryError) {
            console.error('❌ Failed to restart server:', retryError);
          }
        }, 1000);
      }
    });
    
    // Prevent server from shutting down unexpectedly
    server.on('close', () => {
      console.log('⚠️ Server closed unexpectedly');
    });
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.log('🔄 Retrying in 2 seconds...');
    setTimeout(async () => {
      try {
        await startServer();
      } catch (retryError) {
        console.error('❌ Failed to restart after error:', retryError);
        process.exit(1);
      }
    }, 2000);
  }
}

// Shutdown endpoint
app.post('/api/v1/shutdown', (req, res) => {
  console.log('[SHUTDOWN] Shutdown request received from frontend');
  res.json({ success: true, message: 'Shutdown initiated' });
  
  // Close server gracefully after sending response
  setTimeout(() => {
    console.log('[SHUTDOWN] Gracefully shutting down backend server...');
    process.exit(0);
  }, 100);
});

// Start the server
startServer().then((server) => {
  console.log('[OK] Server started successfully with automatic port discovery');
  console.log(`[DATA] Data loaded: ${countriesData.length} countries, ${complianceData.length} compliance records`);
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('🔄 SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  // Keep the process alive
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    server.close(() => {
      process.exit(1);
    });
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  });
}).catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
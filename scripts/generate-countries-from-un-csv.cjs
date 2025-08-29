const fs = require('fs');
const path = require('path');

/**
 * Generate countries.json from UN Member States CSV
 * Removes continent/region references and uses official UN data
 */

function csvToCountries() {
  const csvPath = 'C:/Users/Adam.Prince/Downloads/member_state_auths_2025-03-14.csv';
  const outputPath = path.join(__dirname, '..', 'src', 'data', 'countries.json');
  
  console.log('[INFO] Reading UN Member States CSV...');
  
  if (!fs.existsSync(csvPath)) {
    console.error('[ERROR] CSV file not found at:', csvPath);
    console.error('[INFO] Please ensure the member_state_auths_2025-03-14.csv file is in your Downloads folder');
    process.exit(1);
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  // Skip header line
  const dataLines = lines.slice(1);
  
  const countries = [];
  
  console.log(`[INFO] Processing ${dataLines.length} UN member states...`);
  
  for (const line of dataLines) {
    if (!line.trim()) continue;
    
    // Parse CSV line (accounting for quoted fields with commas)
    const fields = parseCSVLine(line);
    
    if (fields.length < 3) {
      console.warn('[WARN] Skipping malformed line:', line.substring(0, 50) + '...');
      continue;
    }
    
    const [memberState, m49Code, isoCode3] = fields;
    
    // Skip if missing essential data
    if (!memberState || !isoCode3 || isoCode3.length !== 3) {
      console.warn('[WARN] Skipping entry with missing data:', memberState);
      continue;
    }
    
    // Generate ISO2 code from ISO3 (simplified mapping)
    const isoCode2 = generateISO2FromISO3(isoCode3);
    
    const country = {
      id: isoCode3,
      name: memberState.trim(),
      isoCode2: isoCode2,
      isoCode3: isoCode3.trim()
    };
    
    countries.push(country);
    console.log(`[OK] Added: ${country.name} (${country.isoCode3})`);
  }
  
  // Sort countries alphabetically by name
  countries.sort((a, b) => a.name.localeCompare(b.name));
  
  console.log(`[OK] Generated ${countries.length} countries from UN data`);
  
  // Write to countries.json
  fs.writeFileSync(outputPath, JSON.stringify(countries, null, 2), 'utf-8');
  console.log(`[OK] Countries data written to: ${outputPath}`);
  
  // Display summary
  console.log('\n[SUMMARY] Country generation complete:');
  console.log(`- Total countries: ${countries.length}`);
  console.log(`- Source: UN Member States as of March 2025`);
  console.log(`- No continent/region data (removed as requested)`);
  console.log(`- Sorted alphabetically by country name`);
  
  return countries;
}

/**
 * Parse CSV line handling quoted fields with commas
 */
function parseCSVLine(line) {
  const fields = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"' && (i === 0 || line[i-1] === ',')) {
      inQuotes = true;
    } else if (char === '"' && inQuotes && (i === line.length - 1 || line[i+1] === ',')) {
      inQuotes = false;
    } else if (char === ',' && !inQuotes) {
      fields.push(currentField.trim());
      currentField = '';
      i++;
      continue;
    } else {
      currentField += char;
    }
    i++;
  }
  
  // Add the last field
  if (currentField) {
    fields.push(currentField.trim());
  }
  
  return fields;
}

/**
 * Generate ISO2 code from ISO3 code using common mappings
 */
function generateISO2FromISO3(iso3) {
  // Common ISO3 to ISO2 mappings
  const iso3ToIso2 = {
    'AFG': 'AF', 'ALB': 'AL', 'DZA': 'DZ', 'AND': 'AD', 'AGO': 'AO',
    'ATG': 'AG', 'ARG': 'AR', 'ARM': 'AM', 'AUS': 'AU', 'AUT': 'AT',
    'AZE': 'AZ', 'BHS': 'BS', 'BHR': 'BH', 'BGD': 'BD', 'BRB': 'BB',
    'BLR': 'BY', 'BEL': 'BE', 'BLZ': 'BZ', 'BEN': 'BJ', 'BTN': 'BT',
    'BOL': 'BO', 'BIH': 'BA', 'BWA': 'BW', 'BRA': 'BR', 'BRN': 'BN',
    'BGR': 'BG', 'BFA': 'BF', 'BDI': 'BI', 'CPV': 'CV', 'KHM': 'KH',
    'CMR': 'CM', 'CAN': 'CA', 'CAF': 'CF', 'TCD': 'TD', 'CHL': 'CL',
    'CHN': 'CN', 'COL': 'CO', 'COM': 'KM', 'COG': 'CG', 'CRI': 'CR',
    'CIV': 'CI', 'HRV': 'HR', 'CUB': 'CU', 'CYP': 'CY', 'CZE': 'CZ',
    'PRK': 'KP', 'COD': 'CD', 'DNK': 'DK', 'DJI': 'DJ', 'DMA': 'DM',
    'DOM': 'DO', 'ECU': 'EC', 'EGY': 'EG', 'SLV': 'SV', 'GNQ': 'GQ',
    'ERI': 'ER', 'EST': 'EE', 'SWZ': 'SZ', 'ETH': 'ET', 'FJI': 'FJ',
    'FIN': 'FI', 'FRA': 'FR', 'GAB': 'GA', 'GMB': 'GM', 'GEO': 'GE',
    'DEU': 'DE', 'GHA': 'GH', 'GRC': 'GR', 'GRD': 'GD', 'GTM': 'GT',
    'GIN': 'GN', 'GNB': 'GW', 'GUY': 'GY', 'HTI': 'HT', 'HND': 'HN',
    'HUN': 'HU', 'ISL': 'IS', 'IND': 'IN', 'IDN': 'ID', 'IRN': 'IR',
    'IRQ': 'IQ', 'IRL': 'IE', 'ISR': 'IL', 'ITA': 'IT', 'JAM': 'JM',
    'JPN': 'JP', 'JOR': 'JO', 'KAZ': 'KZ', 'KEN': 'KE', 'KIR': 'KI',
    'KWT': 'KW', 'KGZ': 'KG', 'LAO': 'LA', 'LVA': 'LV', 'LBN': 'LB',
    'LSO': 'LS', 'LBR': 'LR', 'LBY': 'LY', 'LIE': 'LI', 'LTU': 'LT',
    'LUX': 'LU', 'MDG': 'MG', 'MWI': 'MW', 'MYS': 'MY', 'MDV': 'MV',
    'MLI': 'ML', 'MLT': 'MT', 'MHL': 'MH', 'MRT': 'MR', 'MUS': 'MU',
    'MEX': 'MX', 'FSM': 'FM', 'MDA': 'MD', 'MCO': 'MC', 'MNG': 'MN',
    'MNE': 'ME', 'MAR': 'MA', 'MOZ': 'MZ', 'MMR': 'MM', 'NAM': 'NA',
    'NRU': 'NR', 'NPL': 'NP', 'NLD': 'NL', 'NZL': 'NZ', 'NIC': 'NI',
    'NER': 'NE', 'NGA': 'NG', 'MKD': 'MK', 'NOR': 'NO', 'OMN': 'OM',
    'PAK': 'PK', 'PLW': 'PW', 'PAN': 'PA', 'PNG': 'PG', 'PRY': 'PY',
    'PER': 'PE', 'PHL': 'PH', 'POL': 'PL', 'PRT': 'PT', 'QAT': 'QA',
    'KOR': 'KR', 'ROU': 'RO', 'RUS': 'RU', 'RWA': 'RW', 'KNA': 'KN',
    'LCA': 'LC', 'VCT': 'VC', 'WSM': 'WS', 'SMR': 'SM', 'STP': 'ST',
    'SAU': 'SA', 'SEN': 'SN', 'SRB': 'RS', 'SYC': 'SC', 'SLE': 'SL',
    'SGP': 'SG', 'SVK': 'SK', 'SVN': 'SI', 'SLB': 'SB', 'SOM': 'SO',
    'ZAF': 'ZA', 'SSD': 'SS', 'ESP': 'ES', 'LKA': 'LK', 'SDN': 'SD',
    'SUR': 'SR', 'SWE': 'SE', 'CHE': 'CH', 'SYR': 'SY', 'TJK': 'TJ',
    'THA': 'TH', 'TLS': 'TL', 'TGO': 'TG', 'TON': 'TO', 'TTO': 'TT',
    'TUN': 'TN', 'TUR': 'TR', 'TKM': 'TM', 'TUV': 'TV', 'UGA': 'UG',
    'UKR': 'UA', 'ARE': 'AE', 'GBR': 'GB', 'USA': 'US', 'URY': 'UY',
    'UZB': 'UZ', 'VUT': 'VU', 'VEN': 'VE', 'VNM': 'VN', 'YEM': 'YE',
    'ZMB': 'ZM', 'ZWE': 'ZW', 'TZA': 'TZ'
  };
  
  return iso3ToIso2[iso3] || iso3.substring(0, 2); // Fallback to first 2 chars
}

// Run the conversion
if (require.main === module) {
  csvToCountries();
}

module.exports = { csvToCountries };
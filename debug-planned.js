// Debug script to test planned filter
import fs from 'fs';
import path from 'path';

// Read the data files
const countriesData = JSON.parse(fs.readFileSync('./src/data/countries.json', 'utf8'));
const complianceData = JSON.parse(fs.readFileSync('./src/data/compliance-data.json', 'utf8'));

// Merge countries with compliance data
const countries = countriesData.map(country => {
  const compliance = complianceData.find(c => c.id === country.isoCode3);
  if (compliance) {
    return { ...country, eInvoicing: compliance.eInvoicing };
  }
  return country;
});

console.log('Total countries:', countries.length);

// Filter for planned status
const plannedCountries = countries.filter(country => {
  if (!country.eInvoicing) return false;
  
  const hasPlannedStatus = 
    country.eInvoicing.b2g?.status === 'planned' ||
    country.eInvoicing.b2b?.status === 'planned' ||
    country.eInvoicing.b2c?.status === 'planned';
    
  return hasPlannedStatus;
});

console.log('Countries with planned status:', plannedCountries.length);
console.log('Planned countries:');
plannedCountries.forEach(country => {
  console.log(`- ${country.name} (${country.isoCode3})`);
  if (country.eInvoicing.b2g?.status === 'planned') {
    console.log(`  B2G: planned (${country.eInvoicing.b2g.implementationDate || 'no date'})`);
  }
  if (country.eInvoicing.b2b?.status === 'planned') {
    console.log(`  B2B: planned (${country.eInvoicing.b2b.implementationDate || 'no date'})`);
  }
  if (country.eInvoicing.b2c?.status === 'planned') {
    console.log(`  B2C: planned (${country.eInvoicing.b2c.implementationDate || 'no date'})`);
  }
});
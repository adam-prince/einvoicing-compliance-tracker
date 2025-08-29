const fs = require('fs');
const path = require('path');

// Path to the compliance data file
const complianceDataPath = path.join(__dirname, '..', 'src', 'data', 'compliance-data.json');

console.log('🧹 Cleaning compliance-data.json to remove continent references...');

try {
  // Read the compliance data
  const complianceData = JSON.parse(fs.readFileSync(complianceDataPath, 'utf8'));
  
  console.log(`📊 Found ${complianceData.length} compliance records`);
  
  // Clean each record by removing continent and region fields
  const cleanedData = complianceData.map(record => {
    const cleaned = { ...record };
    
    // Remove continent and region fields
    delete cleaned.continent;
    delete cleaned.region;
    
    return cleaned;
  });
  
  // Write the cleaned data back
  fs.writeFileSync(complianceDataPath, JSON.stringify(cleanedData, null, 2));
  
  console.log('✅ Successfully cleaned compliance-data.json');
  console.log(`📝 Processed ${cleanedData.length} records`);
  
} catch (error) {
  console.error('❌ Error cleaning compliance data:', error);
  process.exit(1);
}
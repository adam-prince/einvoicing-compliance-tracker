// Simple API test script
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000';

async function testEndpoint(url, description) {
  try {
    console.log(`Testing ${description}: ${url}`);
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ SUCCESS:', response.status, data.success ? 'API Response OK' : 'API Response Invalid');
    } else {
      console.log('❌ FAILED:', response.status, data.error?.message || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Testing API Endpoints...\n');
  
  // Health check
  await testEndpoint(`${API_BASE}/health`, 'Health Check');
  
  // API root
  await testEndpoint(`${API_BASE}/api/v1`, 'API Root');
  
  // Countries endpoints
  await testEndpoint(`${API_BASE}/api/v1/countries?limit=5`, 'Countries List');
  await testEndpoint(`${API_BASE}/api/v1/countries/USA`, 'Country Detail (USA)');
  
  // Search endpoints
  await testEndpoint(`${API_BASE}/api/v1/search/countries?q=germany&limit=3`, 'Search Countries');
  await testEndpoint(`${API_BASE}/api/v1/search/legislation?q=VAT&limit=3`, 'Search Legislation');
  await testEndpoint(`${API_BASE}/api/v1/search/formats?q=UBL&limit=3`, 'Search Formats');
  
  // News endpoint
  await testEndpoint(`${API_BASE}/api/v1/news?limit=5`, 'News');
  
  // Compliance endpoint
  await testEndpoint(`${API_BASE}/api/v1/compliance?status=mandatory&limit=5`, 'Compliance Data');
  
  // Export endpoints (these will return placeholder responses for now)
  console.log('\n📊 Testing Export Endpoints (POST requests)...');
  
  try {
    const exportResponse = await fetch(`${API_BASE}/api/v1/export/json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format: 'summary', filters: { countries: ['USA', 'DEU'] } })
    });
    const exportData = await exportResponse.json();
    console.log('✅ Export JSON:', exportResponse.status, exportData.success ? 'OK' : 'Failed');
  } catch (error) {
    console.log('❌ Export JSON Error:', error.message);
  }
  
  console.log('\n🏁 API Test Complete!');
  console.log('\nNote: Since the backend is not fully running, these tests demonstrate the API structure.');
  console.log('The frontend will gracefully fall back to local data when the API is unavailable.');
}

runTests();
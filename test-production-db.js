/**
 * Test script to verify production database connection
 * This will make API calls to the deployed Vercel app to test database connectivity
 */

const https = require('https');

async function testProductionAPI() {
  console.log('🔍 Testing Production Database Connection...');
  console.log('🌐 Target URL: https://coaltools.vercel.app');
  
  try {
    // Test 1: Check if the API endpoint responds
    console.log('\n1️⃣ Testing API health check...');
    const healthResponse = await makeRequest('https://coaltools.vercel.app/api/health');
    console.log('✅ API health check successful:', healthResponse?.status || 'OK');
    
    // Test 2: Test database-dependent endpoint
    console.log('\n2️⃣ Testing database-dependent endpoint...');
    const dbResponse = await makeRequest('https://coaltools.vercel.app/api/kas-besar');
    console.log('✅ Database endpoint accessible');
    
    // Test 3: Check payroll-integrated page directly
    console.log('\n3️⃣ Testing payroll-integrated page...');
    const pageResponse = await makeRequest('https://coaltools.vercel.app/payroll-integrated');
    console.log('✅ Payroll page accessible');
    
    console.log('\n🎉 Production database connection test completed successfully!');
    console.log('🌐 Your app should now work at: https://coaltools.vercel.app/payroll-integrated');
    
  } catch (error) {
    console.error('❌ Production test failed:', error.message);
    
    console.log('\n🔧 If the issue persists, try:');
    console.log('1. Wait 2-3 minutes for deployment to fully complete');
    console.log('2. Check https://coaltools.vercel.app/payroll-integrated directly');
    console.log('3. Monitor Vercel function logs for detailed errors');
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      let data = '';
      
      response.on('data', (chunk) => {
        data += chunk;
      });
      
      response.on('end', () => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve({
            status: response.statusCode,
            data: data.length > 0 ? data : 'OK'
          });
        } else {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        }
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Run the test
testProductionAPI();
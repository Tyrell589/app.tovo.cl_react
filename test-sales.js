/**
 * @fileoverview Simple test script to verify sales service
 */

const axios = require('axios');

const SALES_SERVICE_URL = 'http://localhost:3004';

async function testSalesService() {
  console.log('🧪 Testing Sales & Financial Management Service...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${SALES_SERVICE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);
    console.log('   Socket connections:', healthResponse.data.socketConnections);
    console.log('');

    // Test 2: Test sales endpoint without auth (should fail)
    console.log('2. Testing sales endpoint without authentication...');
    try {
      await axios.get(`${SALES_SERVICE_URL}/api/sales`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Sales endpoint correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 3: Test payments endpoint without auth (should fail)
    console.log('3. Testing payments endpoint without authentication...');
    try {
      await axios.get(`${SALES_SERVICE_URL}/api/payments/methods`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Payments endpoint correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 4: Test cash endpoint without auth (should fail)
    console.log('4. Testing cash endpoint without authentication...');
    try {
      await axios.get(`${SALES_SERVICE_URL}/api/cash/registers`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Cash endpoint correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 5: Test reports endpoint without auth (should fail)
    console.log('5. Testing reports endpoint without authentication...');
    try {
      await axios.get(`${SALES_SERVICE_URL}/api/reports/sales`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Reports endpoint correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 6: Test coupons endpoint without auth (should fail)
    console.log('6. Testing coupons endpoint without authentication...');
    try {
      await axios.get(`${SALES_SERVICE_URL}/api/coupons`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Coupons endpoint correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    console.log('🎉 Sales service tests completed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Set up your database connection in .env');
    console.log('2. Run database migrations: npm run db:migrate');
    console.log('3. Start the sales service: cd apps/sales-service && npm run dev');
    console.log('4. Test with authentication tokens from the auth service');
    console.log('5. Test Socket.IO real-time features for sales updates');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('');
      console.log('💡 Make sure the sales service is running:');
      console.log('   cd apps/sales-service && npm run dev');
    }
  }
}

// Run the test
testSalesService();

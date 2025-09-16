/**
 * @fileoverview Simple test script to verify restaurant service
 */

const axios = require('axios');

const RESTAURANT_SERVICE_URL = 'http://localhost:3003';

async function testRestaurantService() {
  console.log('🧪 Testing Restaurant Operations Service...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${RESTAURANT_SERVICE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);
    console.log('   Socket connections:', healthResponse.data.socketConnections);
    console.log('');

    // Test 2: Test tables endpoint without auth (should fail)
    console.log('2. Testing tables endpoint without authentication...');
    try {
      await axios.get(`${RESTAURANT_SERVICE_URL}/api/tables`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Tables endpoint correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 3: Test orders endpoint without auth (should fail)
    console.log('3. Testing orders endpoint without authentication...');
    try {
      await axios.get(`${RESTAURANT_SERVICE_URL}/api/orders`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Orders endpoint correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 4: Test kitchen endpoint without auth (should fail)
    console.log('4. Testing kitchen endpoint without authentication...');
    try {
      await axios.get(`${RESTAURANT_SERVICE_URL}/api/kitchen/display`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Kitchen endpoint correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 5: Test turns endpoint without auth (should fail)
    console.log('5. Testing turns endpoint without authentication...');
    try {
      await axios.get(`${RESTAURANT_SERVICE_URL}/api/turns`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Turns endpoint correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    console.log('🎉 Restaurant service tests completed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Set up your database connection in .env');
    console.log('2. Run database migrations: npm run db:migrate');
    console.log('3. Start the restaurant service: cd apps/restaurant-service && npm run dev');
    console.log('4. Test with authentication tokens from the auth service');
    console.log('5. Test Socket.IO real-time features');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('');
      console.log('💡 Make sure the restaurant service is running:');
      console.log('   cd apps/restaurant-service && npm run dev');
    }
  }
}

// Run the test
testRestaurantService();

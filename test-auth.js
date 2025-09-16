/**
 * @fileoverview Simple test script to verify authentication service
 */

const axios = require('axios');

const AUTH_SERVICE_URL = 'http://localhost:3001';

async function testAuthService() {
  console.log('🧪 Testing Authentication Service...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${AUTH_SERVICE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);
    console.log('');

    // Test 2: Test login with invalid credentials
    console.log('2. Testing login with invalid credentials...');
    try {
      await axios.post(`${AUTH_SERVICE_URL}/api/auth/login`, {
        email: 'test@example.com',
        password: 'wrongpassword'
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Invalid login correctly rejected');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 3: Test login with valid credentials (if you have test data)
    console.log('3. Testing login with valid credentials...');
    console.log('ℹ️  Note: This requires a valid user in the database');
    console.log('   You can create a test user using the Prisma Studio or API');
    console.log('');

    // Test 4: Test protected endpoint without token
    console.log('4. Testing protected endpoint without token...');
    try {
      await axios.get(`${AUTH_SERVICE_URL}/api/users`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Protected endpoint correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    console.log('🎉 Authentication service tests completed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Set up your database connection in .env');
    console.log('2. Run database migrations: npm run db:migrate');
    console.log('3. Create a test user in the database');
    console.log('4. Test the full authentication flow');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('');
      console.log('💡 Make sure the authentication service is running:');
      console.log('   cd apps/auth-service && npm run dev');
    }
  }
}

// Run the test
testAuthService();

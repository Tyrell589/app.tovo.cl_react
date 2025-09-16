/**
 * @fileoverview Simple test script to verify product service
 */

const axios = require('axios');

const PRODUCT_SERVICE_URL = 'http://localhost:3002';

async function testProductService() {
  console.log('🧪 Testing Product Service...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${PRODUCT_SERVICE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);
    console.log('');

    // Test 2: Test products endpoint without auth (should fail)
    console.log('2. Testing products endpoint without authentication...');
    try {
      await axios.get(`${PRODUCT_SERVICE_URL}/api/products`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Products endpoint correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 3: Test categories endpoint without auth (should fail)
    console.log('3. Testing categories endpoint without authentication...');
    try {
      await axios.get(`${PRODUCT_SERVICE_URL}/api/categories`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Categories endpoint correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 4: Test ingredients endpoint without auth (should fail)
    console.log('4. Testing ingredients endpoint without authentication...');
    try {
      await axios.get(`${PRODUCT_SERVICE_URL}/api/ingredients`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Ingredients endpoint correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 5: Test stock endpoint without auth (should fail)
    console.log('5. Testing stock endpoint without authentication...');
    try {
      await axios.get(`${PRODUCT_SERVICE_URL}/api/stock`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Stock endpoint correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    console.log('🎉 Product service tests completed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Set up your database connection in .env');
    console.log('2. Run database migrations: npm run db:migrate');
    console.log('3. Start the product service: cd apps/product-service && npm run dev');
    console.log('4. Test with authentication tokens from the auth service');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('');
      console.log('💡 Make sure the product service is running:');
      console.log('   cd apps/product-service && npm run dev');
    }
  }
}

// Run the test
testProductService();

/**
 * @fileoverview Simple test script to verify customer service
 */

const axios = require('axios');

const CUSTOMER_SERVICE_URL = 'http://localhost:3005';

async function testCustomerService() {
  console.log('🧪 Testing Customer Management Service...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${CUSTOMER_SERVICE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);
    console.log('   Socket connections:', healthResponse.data.socketConnections);
    console.log('');

    // Test 2: Test customer registration (should work without auth)
    console.log('2. Testing customer registration...');
    try {
      const registerResponse = await axios.post(`${CUSTOMER_SERVICE_URL}/api/customers/register`, {
        cli_nombre: 'Test',
        cli_apellidopat: 'Customer',
        cli_email: `testcustomer${Date.now()}@example.com`,
        cli_telefono: '1234567890',
        cli_password: 'password123',
        cli_direccion: 'Test Address 123',
        cli_ciudad: 'Test City'
      });
      console.log('✅ Customer registration successful');
      console.log('   Customer ID:', registerResponse.data.data.customer.cli_codigo);
      console.log('   Token received:', !!registerResponse.data.data.token);
    } catch (error) {
      console.log('❌ Customer registration failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 3: Test customer login (should work without auth)
    console.log('3. Testing customer login...');
    try {
      const loginResponse = await axios.post(`${CUSTOMER_SERVICE_URL}/api/customers/login`, {
        cli_email: 'testcustomer@example.com',
        cli_password: 'password123'
      });
      console.log('✅ Customer login successful');
      console.log('   Customer ID:', loginResponse.data.data.customer.cli_codigo);
    } catch (error) {
      console.log('❌ Customer login failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 4: Test order history endpoint without auth (should fail)
    console.log('4. Testing order history endpoint without authentication...');
    try {
      await axios.get(`${CUSTOMER_SERVICE_URL}/api/order-history`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Order history endpoint correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 5: Test delivery endpoint without auth (should fail)
    console.log('5. Testing delivery endpoint without authentication...');
    try {
      await axios.get(`${CUSTOMER_SERVICE_URL}/api/delivery/requests`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Delivery endpoint correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    console.log('');

    // Test 6: Test delivery fee calculation (should work without auth)
    console.log('6. Testing delivery fee calculation...');
    try {
      const feeResponse = await axios.post(`${CUSTOMER_SERVICE_URL}/api/delivery/calculate-fee`, {
        latitud: -33.4489,
        longitud: -70.6693,
        monto_orden: 15000
      });
      console.log('✅ Delivery fee calculation successful');
      console.log('   Available:', feeResponse.data.data.available);
      console.log('   Distance:', feeResponse.data.data.distance_km, 'km');
      console.log('   Fee:', feeResponse.data.data.delivery_fee);
    } catch (error) {
      console.log('❌ Delivery fee calculation failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    console.log('🎉 Customer service tests completed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Set up your database connection in .env');
    console.log('2. Run database migrations: npm run db:migrate');
    console.log('3. Start the customer service: cd apps/customer-service && npm run dev');
    console.log('4. Test with authentication tokens from the auth service');
    console.log('5. Test Socket.IO real-time features for customer updates');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('');
      console.log('💡 Make sure the customer service is running:');
      console.log('   cd apps/customer-service && npm run dev');
    }
  }
}

// Run the test
testCustomerService();

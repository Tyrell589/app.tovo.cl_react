/**
 * @fileoverview Simple test script to verify online ordering service
 */

const axios = require('axios');

const ONLINE_ORDERING_SERVICE_URL = 'http://localhost:3006';

async function testOnlineOrderingService() {
  console.log('🧪 Testing Online Ordering Management Service...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${ONLINE_ORDERING_SERVICE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);
    console.log('   Socket connections:', healthResponse.data.socketConnections);
    console.log('');

    // Test 2: Get menu categories
    console.log('2. Testing menu categories...');
    try {
      const categoriesResponse = await axios.get(`${ONLINE_ORDERING_SERVICE_URL}/api/menu/categories`);
      console.log('✅ Menu categories retrieved successfully');
      console.log('   Platos categories:', categoriesResponse.data.data.platos.length);
      console.log('   Bebidas categories:', categoriesResponse.data.data.bebidas.length);
    } catch (error) {
      console.log('❌ Menu categories failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 3: Get menu products
    console.log('3. Testing menu products...');
    try {
      const productsResponse = await axios.get(`${ONLINE_ORDERING_SERVICE_URL}/api/menu/products?limit=5`);
      console.log('✅ Menu products retrieved successfully');
      console.log('   Products found:', productsResponse.data.data.data.length);
      console.log('   Total products:', productsResponse.data.data.total);
    } catch (error) {
      console.log('❌ Menu products failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 4: Search products
    console.log('4. Testing product search...');
    try {
      const searchResponse = await axios.get(`${ONLINE_ORDERING_SERVICE_URL}/api/menu/search?q=test&limit=5`);
      console.log('✅ Product search successful');
      console.log('   Search results:', searchResponse.data.data.length);
    } catch (error) {
      console.log('❌ Product search failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 5: Get featured products
    console.log('5. Testing featured products...');
    try {
      const featuredResponse = await axios.get(`${ONLINE_ORDERING_SERVICE_URL}/api/menu/featured?limit=5`);
      console.log('✅ Featured products retrieved successfully');
      console.log('   Featured products:', featuredResponse.data.data.length);
    } catch (error) {
      console.log('❌ Featured products failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 6: Test cart operations
    console.log('6. Testing cart operations...');
    try {
      const cartId = 'test-cart-123';
      
      // Get cart
      const cartResponse = await axios.get(`${ONLINE_ORDERING_SERVICE_URL}/api/cart/${cartId}`);
      console.log('✅ Cart retrieved successfully');
      
      // Add item to cart
      const addItemResponse = await axios.post(`${ONLINE_ORDERING_SERVICE_URL}/api/cart/${cartId}/add`, {
        product_id: 1,
        type: 'plato',
        quantity: 2,
        special_instructions: 'No onions'
      });
      console.log('✅ Item added to cart successfully');
      
      // Get cart summary
      const summaryResponse = await axios.get(`${ONLINE_ORDERING_SERVICE_URL}/api/cart/${cartId}/summary`);
      console.log('✅ Cart summary retrieved successfully');
    } catch (error) {
      console.log('❌ Cart operations failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 7: Test order creation
    console.log('7. Testing order creation...');
    try {
      const orderResponse = await axios.post(`${ONLINE_ORDERING_SERVICE_URL}/api/orders`, {
        cart_id: 'test-cart-123',
        customer_info: {
          nombre: 'Test Customer',
          telefono: '1234567890',
          email: 'test@example.com'
        },
        delivery_info: {
          direccion: 'Test Address 123',
          ciudad: 'Santiago',
          instrucciones: 'Ring doorbell twice'
        },
        payment_method: 'efectivo',
        special_instructions: 'Please be careful with the order'
      });
      console.log('✅ Order created successfully');
      console.log('   Order ID:', orderResponse.data.data.order_id);
      console.log('   Tracking Code:', orderResponse.data.data.tracking_code);
    } catch (error) {
      console.log('❌ Order creation failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 8: Test delivery fee calculation
    console.log('8. Testing delivery fee calculation...');
    try {
      const deliveryFeeResponse = await axios.post(`${ONLINE_ORDERING_SERVICE_URL}/api/delivery/calculate-fee`, {
        latitud: -33.4489,
        longitud: -70.6693,
        monto_orden: 15000
      });
      console.log('✅ Delivery fee calculated successfully');
      console.log('   Available:', deliveryFeeResponse.data.data.available);
      console.log('   Distance:', deliveryFeeResponse.data.data.distance_km, 'km');
      console.log('   Fee:', deliveryFeeResponse.data.data.delivery_fee);
    } catch (error) {
      console.log('❌ Delivery fee calculation failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 9: Test delivery estimates
    console.log('9. Testing delivery estimates...');
    try {
      const estimatesResponse = await axios.get(`${ONLINE_ORDERING_SERVICE_URL}/api/delivery/estimates?latitud=-33.4489&longitud=-70.6693`);
      console.log('✅ Delivery estimates retrieved successfully');
      console.log('   Available:', estimatesResponse.data.data.available);
      console.log('   Estimated time:', estimatesResponse.data.data.estimated_time_minutes, 'minutes');
    } catch (error) {
      console.log('❌ Delivery estimates failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    console.log('🎉 Online ordering service tests completed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Set up your database connection in .env');
    console.log('2. Run database migrations: npm run db:migrate');
    console.log('3. Start the online ordering service: cd apps/online-ordering-service && npm run dev');
    console.log('4. Test with real products from your database');
    console.log('5. Test Socket.IO real-time features for cart and order updates');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('');
      console.log('💡 Make sure the online ordering service is running:');
      console.log('   cd apps/online-ordering-service && npm run dev');
    }
  }
}

// Run the test
testOnlineOrderingService();

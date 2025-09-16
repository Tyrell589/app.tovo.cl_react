/**
 * @fileoverview Simple test script to verify KDS service
 */

const axios = require('axios');

const KDS_SERVICE_URL = 'http://localhost:3007';

async function testKDSService() {
  console.log('🧪 Testing Kitchen Display System (KDS) Service...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${KDS_SERVICE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);
    console.log('   Socket connections:', healthResponse.data.socketConnections);
    console.log('   Printer status:', healthResponse.data.printer.status);
    console.log('');

    // Test 2: Get kitchen display
    console.log('2. Testing kitchen display...');
    try {
      const displayResponse = await axios.get(`${KDS_SERVICE_URL}/api/kds/display`);
      console.log('✅ Kitchen display retrieved successfully');
      console.log('   Total orders:', displayResponse.data.data.total_orders);
      console.log('   Station:', displayResponse.data.data.station);
    } catch (error) {
      console.log('❌ Kitchen display failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 3: Get active orders
    console.log('3. Testing active orders...');
    try {
      const ordersResponse = await axios.get(`${KDS_SERVICE_URL}/api/kds/orders?limit=10`);
      console.log('✅ Active orders retrieved successfully');
      console.log('   Orders found:', ordersResponse.data.data.orders.length);
    } catch (error) {
      console.log('❌ Active orders failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 4: Get kitchen stations
    console.log('4. Testing kitchen stations...');
    try {
      const stationsResponse = await axios.get(`${KDS_SERVICE_URL}/api/kds/stations`);
      console.log('✅ Kitchen stations retrieved successfully');
      console.log('   Stations found:', stationsResponse.data.data.length);
      stationsResponse.data.data.forEach(station => {
        console.log(`   - ${station.name} (${station.id})`);
      });
    } catch (error) {
      console.log('❌ Kitchen stations failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 5: Get workflow stations
    console.log('5. Testing workflow stations...');
    try {
      const workflowResponse = await axios.get(`${KDS_SERVICE_URL}/api/workflow/stations`);
      console.log('✅ Workflow stations retrieved successfully');
      console.log('   Workflow stations:', workflowResponse.data.data.length);
    } catch (error) {
      console.log('❌ Workflow stations failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 6: Get workflow queue
    console.log('6. Testing workflow queue...');
    try {
      const queueResponse = await axios.get(`${KDS_SERVICE_URL}/api/workflow/queue?station=grill`);
      console.log('✅ Workflow queue retrieved successfully');
      console.log('   Queue orders:', queueResponse.data.data.total_orders);
    } catch (error) {
      console.log('❌ Workflow queue failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 7: Test printer connection
    console.log('7. Testing printer connection...');
    try {
      const printerResponse = await axios.post(`${KDS_SERVICE_URL}/api/printer/test`);
      console.log('✅ Printer test successful');
      console.log('   Connected:', printerResponse.data.data.connected);
      console.log('   Type:', printerResponse.data.data.printer_type);
    } catch (error) {
      console.log('❌ Printer test failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 8: Get printer status
    console.log('8. Testing printer status...');
    try {
      const statusResponse = await axios.get(`${KDS_SERVICE_URL}/api/printer/status`);
      console.log('✅ Printer status retrieved successfully');
      console.log('   Status:', statusResponse.data.data.status);
      console.log('   Enabled:', statusResponse.data.data.enabled);
    } catch (error) {
      console.log('❌ Printer status failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 9: Get kitchen statistics
    console.log('9. Testing kitchen statistics...');
    try {
      const statsResponse = await axios.get(`${KDS_SERVICE_URL}/api/kds/stats?period=day`);
      console.log('✅ Kitchen statistics retrieved successfully');
      console.log('   Total orders:', statsResponse.data.data.total_orders);
      console.log('   Completed orders:', statsResponse.data.data.completed_orders);
      console.log('   Completion rate:', statsResponse.data.data.completion_rate.toFixed(2) + '%');
    } catch (error) {
      console.log('❌ Kitchen statistics failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 10: Get workflow statistics
    console.log('10. Testing workflow statistics...');
    try {
      const workflowStatsResponse = await axios.get(`${KDS_SERVICE_URL}/api/workflow/stats?period=day`);
      console.log('✅ Workflow statistics retrieved successfully');
      console.log('   Total orders:', workflowStatsResponse.data.data.total_orders);
      console.log('   Station efficiency:', workflowStatsResponse.data.data.station_efficiency.length, 'stations');
    } catch (error) {
      console.log('❌ Workflow statistics failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    console.log('🎉 KDS service tests completed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Set up your database connection in .env');
    console.log('2. Run database migrations: npm run db:migrate');
    console.log('3. Start the KDS service: cd apps/kds-service && npm run dev');
    console.log('4. Test with real orders from your database');
    console.log('5. Test Socket.IO real-time features for kitchen updates');
    console.log('6. Configure printer settings for actual printing');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('');
      console.log('💡 Make sure the KDS service is running:');
      console.log('   cd apps/kds-service && npm run dev');
    }
  }
}

// Run the test
testKDSService();

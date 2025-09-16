/**
 * @fileoverview Simple test script to verify reporting service
 */

const axios = require('axios');

const REPORTING_SERVICE_URL = 'http://localhost:3008';

async function testReportingService() {
  console.log('🧪 Testing Reporting & Analytics Service...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${REPORTING_SERVICE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);
    console.log('   Socket connections:', healthResponse.data.socketConnections);
    console.log('   Scheduler status:', healthResponse.data.scheduler.running);
    console.log('');

    // Test 2: Get sales summary
    console.log('2. Testing sales summary...');
    try {
      const summaryResponse = await axios.get(`${REPORTING_SERVICE_URL}/api/sales/summary?period=day`);
      console.log('✅ Sales summary retrieved successfully');
      console.log('   Total orders:', summaryResponse.data.data.total_orders);
      console.log('   Total revenue:', summaryResponse.data.data.total_revenue);
      console.log('   Completion rate:', summaryResponse.data.data.completion_rate.toFixed(2) + '%');
    } catch (error) {
      console.log('❌ Sales summary failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 3: Get daily sales report
    console.log('3. Testing daily sales report...');
    try {
      const dailyResponse = await axios.get(`${REPORTING_SERVICE_URL}/api/sales/daily`);
      console.log('✅ Daily sales report retrieved successfully');
      console.log('   Date:', dailyResponse.data.data.date);
      console.log('   Orders:', dailyResponse.data.data.total_orders);
      console.log('   Revenue:', dailyResponse.data.data.total_revenue);
    } catch (error) {
      console.log('❌ Daily sales report failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 4: Get weekly sales report
    console.log('4. Testing weekly sales report...');
    try {
      const weeklyResponse = await axios.get(`${REPORTING_SERVICE_URL}/api/sales/weekly`);
      console.log('✅ Weekly sales report retrieved successfully');
      console.log('   Week start:', weeklyResponse.data.data.week_start);
      console.log('   Total revenue:', weeklyResponse.data.data.total_revenue);
    } catch (error) {
      console.log('❌ Weekly sales report failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 5: Get monthly sales report
    console.log('5. Testing monthly sales report...');
    try {
      const monthlyResponse = await axios.get(`${REPORTING_SERVICE_URL}/api/sales/monthly`);
      console.log('✅ Monthly sales report retrieved successfully');
      console.log('   Month:', monthlyResponse.data.data.month);
      console.log('   Total orders:', monthlyResponse.data.data.total_orders);
      console.log('   Total revenue:', monthlyResponse.data.data.total_revenue);
    } catch (error) {
      console.log('❌ Monthly sales report failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 6: Get product sales report
    console.log('6. Testing product sales report...');
    try {
      const productsResponse = await axios.get(`${REPORTING_SERVICE_URL}/api/sales/products?limit=10`);
      console.log('✅ Product sales report retrieved successfully');
      console.log('   Products found:', productsResponse.data.data.products.length);
      console.log('   Total products:', productsResponse.data.data.total_products);
    } catch (error) {
      console.log('❌ Product sales report failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 7: Get sales trends
    console.log('7. Testing sales trends...');
    try {
      const trendsResponse = await axios.get(`${REPORTING_SERVICE_URL}/api/sales/trends?period=day&days=7`);
      console.log('✅ Sales trends retrieved successfully');
      console.log('   Period:', trendsResponse.data.data.period);
      console.log('   Days:', trendsResponse.data.data.days);
      console.log('   Trend points:', trendsResponse.data.data.trends.length);
    } catch (error) {
      console.log('❌ Sales trends failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    console.log('🎉 Reporting service tests completed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Set up your database connection in .env');
    console.log('2. Run database migrations: npm run db:migrate');
    console.log('3. Start the reporting service: cd apps/reporting-service && npm run dev');
    console.log('4. Test with real data from your database');
    console.log('5. Test Socket.IO real-time features for dashboard updates');
    console.log('6. Test data export functionality (Excel, PDF, CSV)');
    console.log('7. Test scheduled report generation');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('');
      console.log('💡 Make sure the reporting service is running:');
      console.log('   cd apps/reporting-service && npm run dev');
    }
  }
}

// Run the test
testReportingService();

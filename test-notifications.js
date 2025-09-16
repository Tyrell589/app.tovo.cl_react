/**
 * @fileoverview Simple test script to verify notification service
 */

const axios = require('axios');

const NOTIFICATION_SERVICE_URL = 'http://localhost:3009';

async function testNotificationService() {
  console.log('🧪 Testing Notification Service...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await axios.get(`${NOTIFICATION_SERVICE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);
    console.log('   Socket connections:', healthResponse.data.socketConnections);
    console.log('   Email status:', healthResponse.data.email.enabled ? 'enabled' : 'disabled');
    console.log('   SMS status:', healthResponse.data.sms.enabled ? 'enabled' : 'disabled');
    console.log('   Push status:', healthResponse.data.push.enabled ? 'enabled' : 'disabled');
    console.log('');

    // Test 2: Send test notification
    console.log('2. Testing notification sending...');
    try {
      const notificationResponse = await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/send`, {
        type: 'realtime',
        recipients: ['test@example.com'],
        title: 'Test Notification',
        message: 'This is a test notification from TovoCL',
        data: { test: true }
      });
      console.log('✅ Notification sent successfully');
      console.log('   Notification ID:', notificationResponse.data.data.notification_id);
      console.log('   Type:', notificationResponse.data.data.type);
      console.log('   Status:', notificationResponse.data.data.status);
    } catch (error) {
      console.log('❌ Notification sending failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 3: Test email notification
    console.log('3. Testing email notification...');
    try {
      const emailResponse = await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/test`, {
        type: 'email',
        recipient: 'test@example.com'
      });
      console.log('✅ Email test successful');
      console.log('   Type:', emailResponse.data.data.type);
      console.log('   Status:', emailResponse.data.data.result.status || 'sent');
    } catch (error) {
      console.log('❌ Email test failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 4: Test SMS notification
    console.log('4. Testing SMS notification...');
    try {
      const smsResponse = await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/test`, {
        type: 'sms',
        recipient: '+1234567890'
      });
      console.log('✅ SMS test successful');
      console.log('   Type:', smsResponse.data.data.type);
      console.log('   Status:', smsResponse.data.data.result.status || 'sent');
    } catch (error) {
      console.log('❌ SMS test failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 5: Test push notification
    console.log('5. Testing push notification...');
    try {
      const pushResponse = await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/test`, {
        type: 'push',
        recipient: 'test_push_token'
      });
      console.log('✅ Push test successful');
      console.log('   Type:', pushResponse.data.data.type);
      console.log('   Status:', pushResponse.data.data.result.status || 'sent');
    } catch (error) {
      console.log('❌ Push test failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 6: Get notification history
    console.log('6. Testing notification history...');
    try {
      const historyResponse = await axios.get(`${NOTIFICATION_SERVICE_URL}/api/notifications/history?limit=5`);
      console.log('✅ Notification history retrieved successfully');
      console.log('   Notifications found:', historyResponse.data.data.notifications.length);
      console.log('   Total pages:', historyResponse.data.data.pagination.total_pages);
    } catch (error) {
      console.log('❌ Notification history failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 7: Get notification statistics
    console.log('7. Testing notification statistics...');
    try {
      const statsResponse = await axios.get(`${NOTIFICATION_SERVICE_URL}/api/notifications/stats?period=day`);
      console.log('✅ Notification statistics retrieved successfully');
      console.log('   Total notifications:', statsResponse.data.data.total_notifications);
      console.log('   Success rate:', statsResponse.data.data.success_rate + '%');
      console.log('   Email notifications:', statsResponse.data.data.email_notifications);
      console.log('   SMS notifications:', statsResponse.data.data.sms_notifications);
      console.log('   Push notifications:', statsResponse.data.data.push_notifications);
    } catch (error) {
      console.log('❌ Notification statistics failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 8: Test email service status
    console.log('8. Testing email service status...');
    try {
      const emailStatusResponse = await axios.get(`${NOTIFICATION_SERVICE_URL}/api/email/status`);
      console.log('✅ Email service status retrieved successfully');
      console.log('   Enabled:', emailStatusResponse.data.data.enabled);
      console.log('   Initialized:', emailStatusResponse.data.data.initialized);
    } catch (error) {
      console.log('❌ Email service status failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 9: Test SMS service status
    console.log('9. Testing SMS service status...');
    try {
      const smsStatusResponse = await axios.get(`${NOTIFICATION_SERVICE_URL}/api/sms/status`);
      console.log('✅ SMS service status retrieved successfully');
      console.log('   Enabled:', smsStatusResponse.data.data.enabled);
      console.log('   Initialized:', smsStatusResponse.data.data.initialized);
    } catch (error) {
      console.log('❌ SMS service status failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 10: Test push service status
    console.log('10. Testing push service status...');
    try {
      const pushStatusResponse = await axios.get(`${NOTIFICATION_SERVICE_URL}/api/push/status`);
      console.log('✅ Push service status retrieved successfully');
      console.log('   Enabled:', pushStatusResponse.data.data.enabled);
      console.log('   Initialized:', pushStatusResponse.data.data.initialized);
    } catch (error) {
      console.log('❌ Push service status failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 11: Test email templates
    console.log('11. Testing email templates...');
    try {
      const templatesResponse = await axios.get(`${NOTIFICATION_SERVICE_URL}/api/templates`);
      console.log('✅ Email templates retrieved successfully');
      console.log('   Templates found:', templatesResponse.data.data.length);
      templatesResponse.data.data.forEach(template => {
        console.log(`   - ${template.name}: ${template.title}`);
      });
    } catch (error) {
      console.log('❌ Email templates failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    // Test 12: Test specific template
    console.log('12. Testing specific template...');
    try {
      const templateResponse = await axios.get(`${NOTIFICATION_SERVICE_URL}/api/templates/order-confirmation?preview=true`);
      console.log('✅ Template retrieved successfully');
      console.log('   Template name:', templateResponse.data.data.name);
      console.log('   Template type:', templateResponse.data.data.type);
      console.log('   Variables:', templateResponse.data.data.variables.join(', '));
    } catch (error) {
      console.log('❌ Template retrieval failed:', error.response?.data?.error || error.message);
    }
    console.log('');

    console.log('🎉 Notification service tests completed!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Set up your database connection in .env');
    console.log('2. Run database migrations: npm run db:migrate');
    console.log('3. Start the notification service: cd apps/notification-service && npm run dev');
    console.log('4. Configure email settings (SMTP) for email notifications');
    console.log('5. Configure Twilio settings for SMS notifications');
    console.log('6. Configure VAPID keys for push notifications');
    console.log('7. Configure Firebase for mobile push notifications');
    console.log('8. Test with real notification providers');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('');
      console.log('💡 Make sure the notification service is running:');
      console.log('   cd apps/notification-service && npm run dev');
    }
  }
}

// Run the test
testNotificationService();

/**
 * @fileoverview Environment variable validation utility for notification service
 */

export function validateEnv(): void {
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET'
  ];

  const missingVars: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters long for security reasons'
    );
  }

  // Validate email configuration
  if (process.env.EMAIL_ENABLED === 'true') {
    if (!process.env.EMAIL_HOST) {
      throw new Error('EMAIL_HOST is required when EMAIL_ENABLED is true');
    }

    if (!process.env.EMAIL_USER) {
      throw new Error('EMAIL_USER is required when EMAIL_ENABLED is true');
    }

    if (!process.env.EMAIL_PASS) {
      throw new Error('EMAIL_PASS is required when EMAIL_ENABLED is true');
    }

    if (process.env.EMAIL_PORT) {
      const port = parseInt(process.env.EMAIL_PORT);
      if (isNaN(port) || port < 1 || port > 65535) {
        throw new Error('EMAIL_PORT must be a valid port number (1-65535)');
      }
    }
  }

  // Validate SMS configuration
  if (process.env.SMS_ENABLED === 'true') {
    if (!process.env.TWILIO_ACCOUNT_SID) {
      throw new Error('TWILIO_ACCOUNT_SID is required when SMS_ENABLED is true');
    }

    if (!process.env.TWILIO_AUTH_TOKEN) {
      throw new Error('TWILIO_AUTH_TOKEN is required when SMS_ENABLED is true');
    }

    if (!process.env.TWILIO_PHONE_NUMBER) {
      throw new Error('TWILIO_PHONE_NUMBER is required when SMS_ENABLED is true');
    }
  }

  // Validate push notification configuration
  if (process.env.PUSH_NOTIFICATIONS_ENABLED === 'true') {
    if (!process.env.VAPID_PUBLIC_KEY) {
      throw new Error('VAPID_PUBLIC_KEY is required when PUSH_NOTIFICATIONS_ENABLED is true');
    }

    if (!process.env.VAPID_PRIVATE_KEY) {
      throw new Error('VAPID_PRIVATE_KEY is required when PUSH_NOTIFICATIONS_ENABLED is true');
    }

    if (!process.env.VAPID_SUBJECT) {
      throw new Error('VAPID_SUBJECT is required when PUSH_NOTIFICATIONS_ENABLED is true');
    }
  }

  // Validate Firebase configuration
  if (process.env.FIREBASE_ENABLED === 'true') {
    const firebaseVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_CLIENT_ID'
    ];

    const missingFirebaseVars = firebaseVars.filter(varName => !process.env[varName]);
    if (missingFirebaseVars.length > 0) {
      throw new Error(
        `Missing Firebase configuration: ${missingFirebaseVars.join(', ')}`
      );
    }
  }

  // Validate Redis configuration
  if (process.env.REDIS_ENABLED === 'true') {
    if (!process.env.REDIS_HOST) {
      throw new Error('REDIS_HOST is required when REDIS_ENABLED is true');
    }

    if (process.env.REDIS_PORT) {
      const port = parseInt(process.env.REDIS_PORT);
      if (isNaN(port) || port < 1 || port > 65535) {
        throw new Error('REDIS_PORT must be a valid port number (1-65535)');
      }
    }

    if (process.env.REDIS_DB) {
      const db = parseInt(process.env.REDIS_DB);
      if (isNaN(db) || db < 0 || db > 15) {
        throw new Error('REDIS_DB must be between 0 and 15');
      }
    }
  }

  // Validate notification settings
  if (process.env.NOTIFICATION_RETRY_ATTEMPTS) {
    const retryAttempts = parseInt(process.env.NOTIFICATION_RETRY_ATTEMPTS);
    if (isNaN(retryAttempts) || retryAttempts < 1 || retryAttempts > 10) {
      throw new Error('NOTIFICATION_RETRY_ATTEMPTS must be between 1 and 10');
    }
  }

  if (process.env.NOTIFICATION_RETRY_DELAY) {
    const retryDelay = parseInt(process.env.NOTIFICATION_RETRY_DELAY);
    if (isNaN(retryDelay) || retryDelay < 1000 || retryDelay > 60000) {
      throw new Error('NOTIFICATION_RETRY_DELAY must be between 1000 and 60000 milliseconds');
    }
  }

  if (process.env.NOTIFICATION_BATCH_SIZE) {
    const batchSize = parseInt(process.env.NOTIFICATION_BATCH_SIZE);
    if (isNaN(batchSize) || batchSize < 1 || batchSize > 1000) {
      throw new Error('NOTIFICATION_BATCH_SIZE must be between 1 and 1000');
    }
  }

  if (process.env.NOTIFICATION_QUEUE_CONCURRENCY) {
    const concurrency = parseInt(process.env.NOTIFICATION_QUEUE_CONCURRENCY);
    if (isNaN(concurrency) || concurrency < 1 || concurrency > 20) {
      throw new Error('NOTIFICATION_QUEUE_CONCURRENCY must be between 1 and 20');
    }
  }

  // Validate notification types
  if (process.env.ENABLED_NOTIFICATION_TYPES) {
    const types = process.env.ENABLED_NOTIFICATION_TYPES.split(',');
    const validTypes = ['email', 'sms', 'push', 'realtime'];
    const invalidTypes = types.filter(type => !validTypes.includes(type.trim()));
    
    if (invalidTypes.length > 0) {
      throw new Error(
        `Invalid notification types: ${invalidTypes.join(', ')}. Valid types are: ${validTypes.join(', ')}`
      );
    }
  }

  if (process.env.DEFAULT_NOTIFICATION_PREFERENCES) {
    const preferences = process.env.DEFAULT_NOTIFICATION_PREFERENCES.split(',');
    const validPreferences = ['email', 'sms', 'push', 'realtime'];
    const invalidPreferences = preferences.filter(pref => !validPreferences.includes(pref.trim()));
    
    if (invalidPreferences.length > 0) {
      throw new Error(
        `Invalid notification preferences: ${invalidPreferences.join(', ')}. Valid preferences are: ${validPreferences.join(', ')}`
      );
    }
  }

  console.log('✅ Notification Service environment variables validated successfully');
}

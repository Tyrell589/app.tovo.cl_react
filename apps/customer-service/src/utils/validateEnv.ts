/**
 * @fileoverview Environment variable validation utility for customer service
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

  // Validate customer configuration
  if (process.env.CUSTOMER_VERIFICATION_EXPIRY_HOURS) {
    const expiryHours = parseInt(process.env.CUSTOMER_VERIFICATION_EXPIRY_HOURS);
    if (isNaN(expiryHours) || expiryHours < 1 || expiryHours > 168) {
      throw new Error(
        'CUSTOMER_VERIFICATION_EXPIRY_HOURS must be between 1 and 168 (1 week)'
      );
    }
  }

  if (process.env.CUSTOMER_PASSWORD_MIN_LENGTH) {
    const minLength = parseInt(process.env.CUSTOMER_PASSWORD_MIN_LENGTH);
    if (isNaN(minLength) || minLength < 6 || minLength > 50) {
      throw new Error(
        'CUSTOMER_PASSWORD_MIN_LENGTH must be between 6 and 50'
      );
    }
  }

  // Validate delivery configuration
  if (process.env.DELIVERY_RADIUS_KM) {
    const radius = parseInt(process.env.DELIVERY_RADIUS_KM);
    if (isNaN(radius) || radius < 1 || radius > 100) {
      throw new Error(
        'DELIVERY_RADIUS_KM must be between 1 and 100'
      );
    }
  }

  if (process.env.DELIVERY_FEE_BASE) {
    const baseFee = parseInt(process.env.DELIVERY_FEE_BASE);
    if (isNaN(baseFee) || baseFee < 0) {
      throw new Error(
        'DELIVERY_FEE_BASE must be a positive number'
      );
    }
  }

  if (process.env.DELIVERY_FEE_PER_KM) {
    const perKmFee = parseInt(process.env.DELIVERY_FEE_PER_KM);
    if (isNaN(perKmFee) || perKmFee < 0) {
      throw new Error(
        'DELIVERY_FEE_PER_KM must be a positive number'
      );
    }
  }

  if (process.env.DELIVERY_ESTIMATED_TIME_MINUTES) {
    const estimatedTime = parseInt(process.env.DELIVERY_ESTIMATED_TIME_MINUTES);
    if (isNaN(estimatedTime) || estimatedTime < 5 || estimatedTime > 180) {
      throw new Error(
        'DELIVERY_ESTIMATED_TIME_MINUTES must be between 5 and 180'
      );
    }
  }

  if (process.env.DELIVERY_FREE_THRESHOLD) {
    const freeThreshold = parseInt(process.env.DELIVERY_FREE_THRESHOLD);
    if (isNaN(freeThreshold) || freeThreshold < 0) {
      throw new Error(
        'DELIVERY_FREE_THRESHOLD must be a positive number'
      );
    }
  }

  console.log('✅ Customer Service environment variables validated successfully');
}

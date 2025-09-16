/**
 * @fileoverview Environment variable validation utility for restaurant service
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

  // Validate order timeout
  if (process.env.ORDER_TIMEOUT_MINUTES) {
    const timeout = parseInt(process.env.ORDER_TIMEOUT_MINUTES);
    if (isNaN(timeout) || timeout < 1 || timeout > 1440) {
      throw new Error(
        'ORDER_TIMEOUT_MINUTES must be a number between 1 and 1440 (24 hours)'
      );
    }
  }

  // Validate kitchen display refresh
  if (process.env.KITCHEN_DISPLAY_REFRESH_SECONDS) {
    const refresh = parseInt(process.env.KITCHEN_DISPLAY_REFRESH_SECONDS);
    if (isNaN(refresh) || refresh < 1 || refresh > 60) {
      throw new Error(
        'KITCHEN_DISPLAY_REFRESH_SECONDS must be a number between 1 and 60'
      );
    }
  }

  console.log('✅ Restaurant Service environment variables validated successfully');
}

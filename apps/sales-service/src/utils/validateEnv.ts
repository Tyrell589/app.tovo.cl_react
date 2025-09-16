/**
 * @fileoverview Environment variable validation utility for sales service
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

  // Validate tax rate
  if (process.env.TAX_RATE) {
    const taxRate = parseFloat(process.env.TAX_RATE);
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 1) {
      throw new Error(
        'TAX_RATE must be a number between 0 and 1 (e.g., 0.19 for 19%)'
      );
    }
  }

  // Validate service charge rate
  if (process.env.SERVICE_CHARGE_RATE) {
    const serviceChargeRate = parseFloat(process.env.SERVICE_CHARGE_RATE);
    if (isNaN(serviceChargeRate) || serviceChargeRate < 0 || serviceChargeRate > 1) {
      throw new Error(
        'SERVICE_CHARGE_RATE must be a number between 0 and 1 (e.g., 0.10 for 10%)'
      );
    }
  }

  // Validate payment timeout
  if (process.env.PAYMENT_TIMEOUT_MINUTES) {
    const timeout = parseInt(process.env.PAYMENT_TIMEOUT_MINUTES);
    if (isNaN(timeout) || timeout < 1 || timeout > 1440) {
      throw new Error(
        'PAYMENT_TIMEOUT_MINUTES must be a number between 1 and 1440 (24 hours)'
      );
    }
  }

  // Validate refund days limit
  if (process.env.REFUND_DAYS_LIMIT) {
    const refundDays = parseInt(process.env.REFUND_DAYS_LIMIT);
    if (isNaN(refundDays) || refundDays < 1 || refundDays > 365) {
      throw new Error(
        'REFUND_DAYS_LIMIT must be a number between 1 and 365'
      );
    }
  }

  // Validate cash register amounts
  if (process.env.CASH_REGISTER_START_AMOUNT) {
    const startAmount = parseFloat(process.env.CASH_REGISTER_START_AMOUNT);
    if (isNaN(startAmount) || startAmount < 0) {
      throw new Error(
        'CASH_REGISTER_START_AMOUNT must be a positive number'
      );
    }
  }

  if (process.env.CASH_REGISTER_MAX_AMOUNT) {
    const maxAmount = parseFloat(process.env.CASH_REGISTER_MAX_AMOUNT);
    if (isNaN(maxAmount) || maxAmount < 0) {
      throw new Error(
        'CASH_REGISTER_MAX_AMOUNT must be a positive number'
      );
    }
  }

  console.log('✅ Sales Service environment variables validated successfully');
}

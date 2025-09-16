/**
 * @fileoverview Environment variable validation utility for online ordering service
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

  // Validate cart configuration
  if (process.env.CART_EXPIRY_HOURS) {
    const expiryHours = parseInt(process.env.CART_EXPIRY_HOURS);
    if (isNaN(expiryHours) || expiryHours < 1 || expiryHours > 168) {
      throw new Error(
        'CART_EXPIRY_HOURS must be between 1 and 168 (1 week)'
      );
    }
  }

  if (process.env.CART_MAX_ITEMS) {
    const maxItems = parseInt(process.env.CART_MAX_ITEMS);
    if (isNaN(maxItems) || maxItems < 1 || maxItems > 100) {
      throw new Error(
        'CART_MAX_ITEMS must be between 1 and 100'
      );
    }
  }

  if (process.env.CART_MAX_QUANTITY_PER_ITEM) {
    const maxQuantity = parseInt(process.env.CART_MAX_QUANTITY_PER_ITEM);
    if (isNaN(maxQuantity) || maxQuantity < 1 || maxQuantity > 50) {
      throw new Error(
        'CART_MAX_QUANTITY_PER_ITEM must be between 1 and 50'
      );
    }
  }

  // Validate order configuration
  if (process.env.ORDER_TIMEOUT_MINUTES) {
    const timeoutMinutes = parseInt(process.env.ORDER_TIMEOUT_MINUTES);
    if (isNaN(timeoutMinutes) || timeoutMinutes < 5 || timeoutMinutes > 120) {
      throw new Error(
        'ORDER_TIMEOUT_MINUTES must be between 5 and 120'
      );
    }
  }

  if (process.env.ORDER_PREPARATION_TIME_MINUTES) {
    const prepTime = parseInt(process.env.ORDER_PREPARATION_TIME_MINUTES);
    if (isNaN(prepTime) || prepTime < 5 || prepTime > 180) {
      throw new Error(
        'ORDER_PREPARATION_TIME_MINUTES must be between 5 and 180'
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

  // Validate payment configuration
  if (process.env.PAYMENT_METHODS) {
    const methods = process.env.PAYMENT_METHODS.split(',');
    const validMethods = ['efectivo', 'tarjeta', 'transferencia'];
    const invalidMethods = methods.filter(method => !validMethods.includes(method.trim()));
    
    if (invalidMethods.length > 0) {
      throw new Error(
        `Invalid payment methods: ${invalidMethods.join(', ')}. Valid methods are: ${validMethods.join(', ')}`
      );
    }
  }

  if (process.env.PAYMENT_TIMEOUT_MINUTES) {
    const timeoutMinutes = parseInt(process.env.PAYMENT_TIMEOUT_MINUTES);
    if (isNaN(timeoutMinutes) || timeoutMinutes < 5 || timeoutMinutes > 60) {
      throw new Error(
        'PAYMENT_TIMEOUT_MINUTES must be between 5 and 60'
      );
    }
  }

  // Validate menu configuration
  if (process.env.MENU_CACHE_TTL) {
    const cacheTTL = parseInt(process.env.MENU_CACHE_TTL);
    if (isNaN(cacheTTL) || cacheTTL < 60 || cacheTTL > 3600) {
      throw new Error(
        'MENU_CACHE_TTL must be between 60 and 3600 seconds'
      );
    }
  }

  if (process.env.MENU_ITEMS_PER_PAGE) {
    const itemsPerPage = parseInt(process.env.MENU_ITEMS_PER_PAGE);
    if (isNaN(itemsPerPage) || itemsPerPage < 1 || itemsPerPage > 100) {
      throw new Error(
        'MENU_ITEMS_PER_PAGE must be between 1 and 100'
      );
    }
  }

  if (process.env.MENU_SEARCH_RESULTS_LIMIT) {
    const searchLimit = parseInt(process.env.MENU_SEARCH_RESULTS_LIMIT);
    if (isNaN(searchLimit) || searchLimit < 1 || searchLimit > 100) {
      throw new Error(
        'MENU_SEARCH_RESULTS_LIMIT must be between 1 and 100'
      );
    }
  }

  console.log('✅ Online Ordering Service environment variables validated successfully');
}

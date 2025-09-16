/**
 * @fileoverview Environment variable validation utility for KDS service
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

  // Validate KDS configuration
  if (process.env.KDS_AUTO_REFRESH_SECONDS) {
    const refreshSeconds = parseInt(process.env.KDS_AUTO_REFRESH_SECONDS);
    if (isNaN(refreshSeconds) || refreshSeconds < 5 || refreshSeconds > 300) {
      throw new Error(
        'KDS_AUTO_REFRESH_SECONDS must be between 5 and 300'
      );
    }
  }

  if (process.env.KDS_ORDER_TIMEOUT_MINUTES) {
    const timeoutMinutes = parseInt(process.env.KDS_ORDER_TIMEOUT_MINUTES);
    if (isNaN(timeoutMinutes) || timeoutMinutes < 5 || timeoutMinutes > 120) {
      throw new Error(
        'KDS_ORDER_TIMEOUT_MINUTES must be between 5 and 120'
      );
    }
  }

  if (process.env.KDS_PREPARATION_TIME_MINUTES) {
    const prepTime = parseInt(process.env.KDS_PREPARATION_TIME_MINUTES);
    if (isNaN(prepTime) || prepTime < 5 || prepTime > 180) {
      throw new Error(
        'KDS_PREPARATION_TIME_MINUTES must be between 5 and 180'
      );
    }
  }

  if (process.env.KDS_MAX_CONCURRENT_ORDERS) {
    const maxOrders = parseInt(process.env.KDS_MAX_CONCURRENT_ORDERS);
    if (isNaN(maxOrders) || maxOrders < 1 || maxOrders > 200) {
      throw new Error(
        'KDS_MAX_CONCURRENT_ORDERS must be between 1 and 200'
      );
    }
  }

  // Validate printer configuration
  if (process.env.PRINTER_ENABLED === 'true') {
    if (!process.env.PRINTER_IP) {
      throw new Error(
        'PRINTER_IP is required when PRINTER_ENABLED is true'
      );
    }

    if (process.env.PRINTER_PORT) {
      const port = parseInt(process.env.PRINTER_PORT);
      if (isNaN(port) || port < 1 || port > 65535) {
        throw new Error(
          'PRINTER_PORT must be a valid port number (1-65535)'
        );
      }
    }

    if (process.env.PRINTER_TIMEOUT) {
      const timeout = parseInt(process.env.PRINTER_TIMEOUT);
      if (isNaN(timeout) || timeout < 1000 || timeout > 30000) {
        throw new Error(
          'PRINTER_TIMEOUT must be between 1000 and 30000 milliseconds'
        );
      }
    }
  }

  // Validate kitchen stations
  if (process.env.KITCHEN_STATIONS) {
    const stations = process.env.KITCHEN_STATIONS.split(',');
    const validStations = ['grill', 'salad', 'pizza', 'dessert', 'beverage'];
    const invalidStations = stations.filter(station => 
      !validStations.includes(station.trim())
    );
    
    if (invalidStations.length > 0) {
      throw new Error(
        `Invalid kitchen stations: ${invalidStations.join(', ')}. Valid stations are: ${validStations.join(', ')}`
      );
    }
  }

  if (process.env.KITCHEN_STATION_CAPACITY) {
    const capacity = parseInt(process.env.KITCHEN_STATION_CAPACITY);
    if (isNaN(capacity) || capacity < 1 || capacity > 100) {
      throw new Error(
        'KITCHEN_STATION_CAPACITY must be between 1 and 100'
      );
    }
  }

  // Validate order display configuration
  if (process.env.ORDER_DISPLAY_ROWS) {
    const rows = parseInt(process.env.ORDER_DISPLAY_ROWS);
    if (isNaN(rows) || rows < 1 || rows > 50) {
      throw new Error(
        'ORDER_DISPLAY_ROWS must be between 1 and 50'
      );
    }
  }

  if (process.env.ORDER_DISPLAY_COLUMNS) {
    const columns = parseInt(process.env.ORDER_DISPLAY_COLUMNS);
    if (isNaN(columns) || columns < 1 || columns > 10) {
      throw new Error(
        'ORDER_DISPLAY_COLUMNS must be between 1 and 10'
      );
    }
  }

  if (process.env.ORDER_UPDATE_INTERVAL) {
    const interval = parseInt(process.env.ORDER_UPDATE_INTERVAL);
    if (isNaN(interval) || interval < 1000 || interval > 60000) {
      throw new Error(
        'ORDER_UPDATE_INTERVAL must be between 1000 and 60000 milliseconds'
      );
    }
  }

  // Validate sound configuration
  if (process.env.SOUND_ENABLED === 'true') {
    const soundOptions = [
      'SOUND_NEW_ORDER',
      'SOUND_ORDER_READY',
      'SOUND_ORDER_CANCELLED'
    ];

    soundOptions.forEach(option => {
      if (process.env[option] && process.env[option] !== 'true' && process.env[option] !== 'false') {
        throw new Error(
          `${option} must be 'true' or 'false'`
        );
      }
    });
  }

  console.log('✅ KDS Service environment variables validated successfully');
}

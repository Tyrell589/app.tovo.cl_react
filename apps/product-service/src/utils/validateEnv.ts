/**
 * @fileoverview Environment variable validation utility for product service
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

  // Validate upload path
  if (process.env.UPLOAD_PATH) {
    const fs = require('fs');
    const path = require('path');
    const uploadPath = path.resolve(process.env.UPLOAD_PATH);
    
    if (!fs.existsSync(uploadPath)) {
      try {
        fs.mkdirSync(uploadPath, { recursive: true });
        console.log(`✅ Created upload directory: ${uploadPath}`);
      } catch (error) {
        throw new Error(`Failed to create upload directory: ${uploadPath}`);
      }
    }
  }

  console.log('✅ Product Service environment variables validated successfully');
}

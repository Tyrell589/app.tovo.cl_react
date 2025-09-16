/**
 * @fileoverview Next.js configuration for web app
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		appDir: true
	},
	images: {
		unoptimized: true
	},
	env: {
		AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
		RESTAURANT_SERVICE_URL: process.env.RESTAURANT_SERVICE_URL || 'http://localhost:3003',
		KDS_SERVICE_URL: process.env.KDS_SERVICE_URL || 'http://localhost:3007',
		REPORTING_SERVICE_URL: process.env.REPORTING_SERVICE_URL || 'http://localhost:3008',
		NOTIFICATION_SERVICE_URL: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3009'
	}
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  transpilePackages: ['@tovocl/types'],
  env: {
    AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    API_GATEWAY_URL: process.env.API_GATEWAY_URL || 'http://localhost:3000',
  },
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: `${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}/api/auth/:path*`,
      },
      {
        source: '/api/users/:path*',
        destination: `${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}/api/users/:path*`,
      },
      {
        source: '/api/roles/:path*',
        destination: `${process.env.AUTH_SERVICE_URL || 'http://localhost:3001'}/api/roles/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

# TovoCL Modern - Restaurant Management System

A modern, scalable restaurant management system built with React + Node.js microservices architecture, migrated from the existing PHP system.

## 🏗️ Architecture

This project follows a microservices architecture with the following structure:

### Frontend
- **Web App**: React 18 + Next.js 14 + TypeScript + Tailwind CSS + Shadcn/UI

### Backend Services
- **Authentication Service**: User management and JWT tokens (Port 3001)
- **Product Service**: Product and inventory management (Port 3002)
- **Restaurant Service**: Table and order management (Port 3003)
- **Sales Service**: Payment and financial operations (Port 3004)
- **Customer Service**: Customer management and profiles (Port 3005)
- **Online Ordering Service**: Online menu and ordering (Port 3006)
- **Kitchen Service**: Kitchen display system (Port 3007)
- **Notification Service**: Real-time notifications (Port 3008)

### Shared Packages
- **Database**: Prisma ORM with MySQL
- **Types**: Shared TypeScript types
- **Utils**: Common utilities and helpers

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm 8+
- MySQL database
- Git

### Installation

1. **Clone and setup the project:**
```bash
cd react_node
npm install
```

2. **Set up environment variables:**
```bash
cp env.example .env
# Edit .env with your database credentials and other settings
```

3. **Set up the database:**
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Open Prisma Studio to view your data
npm run db:studio
```

4. **Start development servers:**
```bash
# Start all services
npm run dev

# Or start individual services:
# Frontend only
cd apps/web && npm run dev

# Authentication service only
cd apps/auth-service && npm run dev
```

## 📁 Project Structure

```
tovocl-modern/
├── apps/
│   ├── web/                 # React frontend (Next.js)
│   ├── auth-service/        # Authentication microservice
│   ├── product-service/     # Product management (planned)
│   ├── restaurant-service/  # Restaurant operations (planned)
│   ├── sales-service/       # Sales & financial (planned)
│   ├── customer-service/    # Customer management (planned)
│   ├── online-service/      # Online ordering (planned)
│   ├── kitchen-service/     # Kitchen display system (planned)
│   └── notification-service/ # Notifications (planned)
├── packages/
│   ├── database/            # Prisma database layer
│   └── types/               # Shared TypeScript types
└── infrastructure/
    ├── docker/              # Docker configurations (planned)
    └── k8s/                 # Kubernetes manifests (planned)
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start all development servers
- `npm run build` - Build all applications
- `npm run lint` - Lint all packages
- `npm run test` - Run all tests
- `npm run type-check` - Type check all packages
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Individual Service Development

Each service can be run independently:

```bash
# Frontend
cd apps/web && npm run dev

# Authentication Service
cd apps/auth-service && npm run dev
```

## 🗄️ Database

The system uses MySQL with Prisma ORM. The database schema is maintained in the `packages/database` package and is based on the existing PHP system's database structure.

### Database Migration

```bash
cd packages/database
npx prisma migrate dev
npx prisma generate
```

## 🔧 Configuration

Each service has its own configuration file. Environment variables are managed through `.env` files.

### Key Environment Variables

- `DATABASE_URL`: MySQL connection string
- `JWT_SECRET`: Secret key for JWT tokens (must be at least 32 characters)
- `AUTH_SERVICE_URL`: Authentication service URL
- `CORS_ORIGIN`: Allowed CORS origins

## 📝 API Documentation

### Authentication Service (Port 3001)

#### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

#### User Management Endpoints
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user (Admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)

#### Role Management Endpoints
- `GET /api/roles` - Get all roles (Admin only)
- `GET /api/roles/:id` - Get role by ID (Admin only)
- `POST /api/roles` - Create new role (Admin only)
- `PUT /api/roles/:id` - Update role (Admin only)
- `DELETE /api/roles/:id` - Delete role (Admin only)

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests for specific service
cd apps/auth-service && npm run test
```

## 🚀 Deployment

The application is designed to be containerized and can be deployed using Docker or Kubernetes.

### Docker (Development)

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d
```

### Production Deployment

1. Set up production environment variables
2. Configure reverse proxy (nginx)
3. Set up SSL certificates
4. Configure monitoring and logging
5. Deploy using your preferred method (Docker, Kubernetes, etc.)

## 🔄 Migration from PHP System

This system is designed to replace the existing PHP-based TovoCL restaurant management system while maintaining compatibility with the existing MySQL database.

### Migration Benefits

- **Modern Architecture**: Microservices-based, scalable design
- **Better Performance**: React frontend with optimized rendering
- **Improved Security**: JWT-based authentication, input validation
- **Enhanced UX**: Modern, responsive interface
- **Better Maintainability**: TypeScript, modular code structure
- **Real-time Features**: WebSocket support for live updates

### Migration Strategy

1. **Phase 1**: Authentication Service ✅
2. **Phase 2**: Product Management Service
3. **Phase 3**: Restaurant Operations Service
4. **Phase 4**: Sales & Financial Service
5. **Phase 5**: Customer Management Service
6. **Phase 6**: Online Ordering Service
7. **Phase 7**: Kitchen Display System
8. **Phase 8**: Advanced Features & Optimization

## 📄 License

This project is proprietary software for TovoCL restaurant management system.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please contact the development team.

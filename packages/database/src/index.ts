/**
 * @fileoverview Database client and utilities for TovoCL system
 * Provides Prisma client instance and database helper functions
 */

import { PrismaClient } from '@prisma/client';
import { User, Role, AuthRequest, CreateUserRequest, UpdateUserRequest } from '@tovocl/types';

// Prisma client instance
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Database connection helper
export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Graceful shutdown
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Database disconnection failed:', error);
    throw error;
  }
}

// ===== USER & AUTHENTICATION HELPERS =====

/**
 * Find user by email
 */
export async function findUserByEmail(email: string) {
  return await prisma.usuario.findUnique({
    where: { usu_email: email },
    include: { rol: true }
  });
}

/**
 * Find user by ID
 */
export async function findUserById(id: number) {
  return await prisma.usuario.findUnique({
    where: { usu_codigo: id },
    include: { rol: true }
  });
}

/**
 * Create new user
 */
export async function createUser(userData: CreateUserRequest & { usu_password: string }) {
  return await prisma.usuario.create({
    data: {
      usu_nombre: userData.usu_nombre,
      usu_apellidopat: userData.usu_apellidopat,
      usu_apellidomat: userData.usu_apellidomat,
      usu_email: userData.usu_email,
      usu_password: userData.usu_password,
      rol_codigo: userData.rol_codigo,
      usu_estado: 1,
      flg_del: 1
    },
    include: { rol: true }
  });
}

/**
 * Update user
 */
export async function updateUser(id: number, userData: UpdateUserRequest) {
  return await prisma.usuario.update({
    where: { usu_codigo: id },
    data: {
      ...userData,
      usu_fechamodificacion: new Date()
    },
    include: { rol: true }
  });
}

/**
 * Delete user (soft delete)
 */
export async function deleteUser(id: number) {
  return await prisma.usuario.update({
    where: { usu_codigo: id },
    data: { flg_del: 0 }
  });
}

/**
 * Get all users with pagination
 */
export async function getUsers(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;
  
  const [users, total] = await Promise.all([
    prisma.usuario.findMany({
      where: { flg_del: 1 },
      include: { rol: true },
      skip,
      take: limit,
      orderBy: { usu_fechacre: 'desc' }
    }),
    prisma.usuario.count({
      where: { flg_del: 1 }
    })
  ]);

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Get all roles
 */
export async function getRoles() {
  return await prisma.rol.findMany({
    where: { flg_del: 1 },
    orderBy: { rol_nombre: 'asc' }
  });
}

/**
 * Find role by ID
 */
export async function findRoleById(id: number) {
  return await prisma.rol.findUnique({
    where: { rol_codigo: id }
  });
}

// ===== RESTAURANT OPERATIONS HELPERS =====

/**
 * Get all tables
 */
export async function getTables() {
  return await prisma.mesa.findMany({
    where: { flg_del: 1 },
    include: { 
      categoria: true,
      usuario: {
        select: {
          usu_codigo: true,
          usu_nombre: true,
          usu_apellidopat: true
        }
      }
    },
    orderBy: { mes_numero: 'asc' }
  });
}

/**
 * Get table by ID
 */
export async function getTableById(id: number) {
  return await prisma.mesa.findUnique({
    where: { mes_codigo: id },
    include: { 
      categoria: true,
      usuario: {
        select: {
          usu_codigo: true,
          usu_nombre: true,
          usu_apellidopat: true
        }
      }
    }
  });
}

/**
 * Update table status
 */
export async function updateTableStatus(id: number, status: number, userId?: number) {
  return await prisma.mesa.update({
    where: { mes_codigo: id },
    data: {
      mes_estado: status,
      usu_codigo: userId,
      mes_fechamodificacion: new Date()
    }
  });
}

// ===== PRODUCT MANAGEMENT HELPERS =====

/**
 * Get all plates with categories
 */
export async function getPlates() {
  return await prisma.plato.findMany({
    where: { flg_del: 1 },
    include: { 
      categoria: true,
      cocina: true
    },
    orderBy: { pla_nombre: 'asc' }
  });
}

/**
 * Get all beverages with categories
 */
export async function getBeverages() {
  return await prisma.bebida.findMany({
    where: { flg_del: 1 },
    include: { 
      categoria: true,
      cocina: true
    },
    orderBy: { beb_nombre: 'asc' }
  });
}

/**
 * Get plate categories
 */
export async function getPlateCategories() {
  return await prisma.categoriaPlato.findMany({
    where: { flg_del: 1 },
    orderBy: { cat_nombre: 'asc' }
  });
}

/**
 * Get beverage categories
 */
export async function getBeverageCategories() {
  return await prisma.categoriaBebida.findMany({
    where: { flg_del: 1 },
    orderBy: { cbe_nombre: 'asc' }
  });
}

// ===== CUSTOMER MANAGEMENT HELPERS =====

/**
 * Get all customers
 */
export async function getCustomers(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit;
  
  const [customers, total] = await Promise.all([
    prisma.cliente.findMany({
      where: { flg_del: 1 },
      skip,
      take: limit,
      orderBy: { cli_fechacre: 'desc' }
    }),
    prisma.cliente.count({
      where: { flg_del: 1 }
    })
  ]);

  return {
    customers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Find customer by email
 */
export async function findCustomerByEmail(email: string) {
  return await prisma.cliente.findUnique({
    where: { cli_email: email }
  });
}

/**
 * Create new customer
 */
export async function createCustomer(customerData: {
  cli_nombre: string;
  cli_apellidopat?: string;
  cli_apellidomat?: string;
  cli_email?: string;
  cli_telefono?: string;
  cli_direccion?: string;
  cli_delivery?: number;
  cli_mostrador?: number;
  cli_online?: number;
}) {
  return await prisma.cliente.create({
    data: {
      ...customerData,
      cli_estado: 1,
      flg_del: 1
    }
  });
}

// ===== SYSTEM CONFIGURATION HELPERS =====

/**
 * Get system variables
 */
export async function getSystemVariables() {
  return await prisma.variable.findFirst({
    where: { flg_del: 1 }
  });
}

/**
 * Update system variables
 */
export async function updateSystemVariables(variables: Partial<{
  var_igv: number;
  var_nombre: string;
  var_nombreonline: string;
  var_moneda: string;
  var_costoenviomenu: number;
  var_enviodomicilio: number;
  var_montominimo: number;
  var_estadomonmin: number;
}>) {
  return await prisma.variable.updateMany({
    where: { flg_del: 1 },
    data: variables
  });
}

// ===== HEALTH CHECK =====

/**
 * Database health check
 */
export async function healthCheck() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
  }
}

// Export Prisma client as default
export default prisma;

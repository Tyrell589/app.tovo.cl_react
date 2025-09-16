/**
 * @fileoverview Customer controller for customer management
 */

import { 
  prisma
} from '@tovocl/database';
import { 
  ApiResponse, 
  PaginatedResponse 
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

export class CustomerController {
  /**
   * Register new customer
   */
  async registerCustomer(customerData: {
    cli_nombre: string;
    cli_apellidopat: string;
    cli_apellidomat?: string;
    cli_email: string;
    cli_telefono: string;
    cli_password: string;
    cli_direccion?: string;
    cli_ciudad?: string;
  }): Promise<ApiResponse> {
    try {
      const { 
        cli_nombre, 
        cli_apellidopat, 
        cli_apellidomat, 
        cli_email, 
        cli_telefono, 
        cli_password, 
        cli_direccion, 
        cli_ciudad 
      } = customerData;

      // Check if customer already exists
      const existingCustomer = await prisma.cliente.findFirst({
        where: { 
          cli_email: cli_email,
          flg_del: 1
        }
      });

      if (existingCustomer) {
        throw new CustomError('Customer with this email already exists', 400);
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(cli_password, saltRounds);

      // Generate verification code
      const verificationCode = uuidv4().substring(0, 8).toUpperCase();
      const verificationExpiry = moment().add(
        parseInt(process.env.CUSTOMER_VERIFICATION_EXPIRY_HOURS || '24'), 
        'hours'
      ).toDate();

      // Create customer
      const customer = await prisma.cliente.create({
        data: {
          cli_nombre,
          cli_apellidopat,
          cli_apellidomat: cli_apellidomat || '',
          cli_email,
          cli_telefono,
          cli_password: hashedPassword,
          cli_direccion: cli_direccion || '',
          cli_ciudad: cli_ciudad || '',
          cli_verificado: 0,
          cli_verificacion_codigo: verificationCode,
          cli_verificacion_expiracion: verificationExpiry,
          cli_estado: 1,
          cli_fecha_registro: new Date(),
          flg_del: 1
        }
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: customer.cli_codigo, 
          email: customer.cli_email,
          type: 'customer'
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      return {
        success: true,
        data: {
          customer: {
            cli_codigo: customer.cli_codigo,
            cli_nombre: customer.cli_nombre,
            cli_apellidopat: customer.cli_apellidopat,
            cli_apellidomat: customer.cli_apellidomat,
            cli_email: customer.cli_email,
            cli_telefono: customer.cli_telefono,
            cli_direccion: customer.cli_direccion,
            cli_ciudad: customer.cli_ciudad,
            cli_verificado: customer.cli_verificado,
            cli_estado: customer.cli_estado,
            cli_fecha_registro: customer.cli_fecha_registro
          },
          token
        },
        message: 'Customer registered successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to register customer', 500);
    }
  }

  /**
   * Customer login
   */
  async loginCustomer(loginData: {
    cli_email: string;
    cli_password: string;
  }): Promise<ApiResponse> {
    try {
      const { cli_email, cli_password } = loginData;

      // Find customer
      const customer = await prisma.cliente.findFirst({
        where: { 
          cli_email: cli_email,
          flg_del: 1
        }
      });

      if (!customer) {
        throw new CustomError('Invalid email or password', 401);
      }

      // Check if customer is active
      if (customer.cli_estado !== 1) {
        throw new CustomError('Customer account is inactive', 401);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(cli_password, customer.cli_password);
      if (!isPasswordValid) {
        throw new CustomError('Invalid email or password', 401);
      }

      // Update last login
      await prisma.cliente.update({
        where: { cli_codigo: customer.cli_codigo },
        data: { cli_ultimo_acceso: new Date() }
      });

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: customer.cli_codigo, 
          email: customer.cli_email,
          type: 'customer'
        },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
      );

      return {
        success: true,
        data: {
          customer: {
            cli_codigo: customer.cli_codigo,
            cli_nombre: customer.cli_nombre,
            cli_apellidopat: customer.cli_apellidopat,
            cli_apellidomat: customer.cli_apellidomat,
            cli_email: customer.cli_email,
            cli_telefono: customer.cli_telefono,
            cli_direccion: customer.cli_direccion,
            cli_ciudad: customer.cli_ciudad,
            cli_verificado: customer.cli_verificado,
            cli_estado: customer.cli_estado,
            cli_fecha_registro: customer.cli_fecha_registro,
            cli_ultimo_acceso: customer.cli_ultimo_acceso
          },
          token
        },
        message: 'Login successful'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to login customer', 500);
    }
  }

  /**
   * Get customer profile
   */
  async getCustomerProfile(customerId: number): Promise<ApiResponse> {
    try {
      const customer = await prisma.cliente.findUnique({
        where: { cli_codigo: customerId }
      });

      if (!customer || customer.flg_del !== 1) {
        throw new CustomError('Customer not found', 404);
      }

      return {
        success: true,
        data: {
          cli_codigo: customer.cli_codigo,
          cli_nombre: customer.cli_nombre,
          cli_apellidopat: customer.cli_apellidopat,
          cli_apellidomat: customer.cli_apellidomat,
          cli_email: customer.cli_email,
          cli_telefono: customer.cli_telefono,
          cli_direccion: customer.cli_direccion,
          cli_ciudad: customer.cli_ciudad,
          cli_verificado: customer.cli_verificado,
          cli_estado: customer.cli_estado,
          cli_fecha_registro: customer.cli_fecha_registro,
          cli_ultimo_acceso: customer.cli_ultimo_acceso
        },
        message: 'Customer profile retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve customer profile', 500);
    }
  }

  /**
   * Update customer profile
   */
  async updateCustomerProfile(customerId: number, updateData: any): Promise<ApiResponse> {
    try {
      const existingCustomer = await prisma.cliente.findUnique({
        where: { cli_codigo: customerId }
      });

      if (!existingCustomer) {
        throw new CustomError('Customer not found', 404);
      }

      // Check if email is being changed and if it's already taken
      if (updateData.cli_email && updateData.cli_email !== existingCustomer.cli_email) {
        const emailExists = await prisma.cliente.findFirst({
          where: { 
            cli_email: updateData.cli_email,
            cli_codigo: { not: customerId },
            flg_del: 1
          }
        });

        if (emailExists) {
          throw new CustomError('Email already exists', 400);
        }
      }

      const customer = await prisma.cliente.update({
        where: { cli_codigo: customerId },
        data: updateData
      });

      return {
        success: true,
        data: {
          cli_codigo: customer.cli_codigo,
          cli_nombre: customer.cli_nombre,
          cli_apellidopat: customer.cli_apellidopat,
          cli_apellidomat: customer.cli_apellidomat,
          cli_email: customer.cli_email,
          cli_telefono: customer.cli_telefono,
          cli_direccion: customer.cli_direccion,
          cli_ciudad: customer.cli_ciudad,
          cli_verificado: customer.cli_verificado,
          cli_estado: customer.cli_estado
        },
        message: 'Customer profile updated successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update customer profile', 500);
    }
  }

  /**
   * Get all customers with pagination and filters
   */
  async getCustomers(
    page: number = 1, 
    limit: number = 10, 
    search?: string
  ): Promise<ApiResponse<PaginatedResponse>> {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = { flg_del: 1 };
      
      if (search) {
        whereClause.OR = [
          { cli_nombre: { contains: search } },
          { cli_apellidopat: { contains: search } },
          { cli_email: { contains: search } },
          { cli_telefono: { contains: search } }
        ];
      }

      const [customers, total] = await Promise.all([
        prisma.cliente.findMany({
          where: whereClause,
          select: {
            cli_codigo: true,
            cli_nombre: true,
            cli_apellidopat: true,
            cli_apellidomat: true,
            cli_email: true,
            cli_telefono: true,
            cli_direccion: true,
            cli_ciudad: true,
            cli_verificado: true,
            cli_estado: true,
            cli_fecha_registro: true,
            cli_ultimo_acceso: true
          },
          skip,
          take: limit,
          orderBy: { cli_fecha_registro: 'desc' }
        }),
        prisma.cliente.count({
          where: whereClause
        })
      ]);

      return {
        success: true,
        data: {
          data: customers,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
        message: 'Customers retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve customers', 500);
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(customerId: number): Promise<ApiResponse> {
    try {
      const customer = await prisma.cliente.findUnique({
        where: { cli_codigo: customerId }
      });

      if (!customer || customer.flg_del !== 1) {
        throw new CustomError('Customer not found', 404);
      }

      return {
        success: true,
        data: {
          cli_codigo: customer.cli_codigo,
          cli_nombre: customer.cli_nombre,
          cli_apellidopat: customer.cli_apellidopat,
          cli_apellidomat: customer.cli_apellidomat,
          cli_email: customer.cli_email,
          cli_telefono: customer.cli_telefono,
          cli_direccion: customer.cli_direccion,
          cli_ciudad: customer.cli_ciudad,
          cli_verificado: customer.cli_verificado,
          cli_estado: customer.cli_estado,
          cli_fecha_registro: customer.cli_fecha_registro,
          cli_ultimo_acceso: customer.cli_ultimo_acceso
        },
        message: 'Customer retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve customer', 500);
    }
  }

  /**
   * Update customer
   */
  async updateCustomer(customerId: number, updateData: any): Promise<ApiResponse> {
    try {
      const existingCustomer = await prisma.cliente.findUnique({
        where: { cli_codigo: customerId }
      });

      if (!existingCustomer) {
        throw new CustomError('Customer not found', 404);
      }

      const customer = await prisma.cliente.update({
        where: { cli_codigo: customerId },
        data: updateData
      });

      return {
        success: true,
        data: {
          cli_codigo: customer.cli_codigo,
          cli_nombre: customer.cli_nombre,
          cli_apellidopat: customer.cli_apellidopat,
          cli_apellidomat: customer.cli_apellidomat,
          cli_email: customer.cli_email,
          cli_telefono: customer.cli_telefono,
          cli_direccion: customer.cli_direccion,
          cli_ciudad: customer.cli_ciudad,
          cli_verificado: customer.cli_verificado,
          cli_estado: customer.cli_estado
        },
        message: 'Customer updated successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update customer', 500);
    }
  }

  /**
   * Delete customer
   */
  async deleteCustomer(customerId: number): Promise<ApiResponse> {
    try {
      const existingCustomer = await prisma.cliente.findUnique({
        where: { cli_codigo: customerId }
      });

      if (!existingCustomer) {
        throw new CustomError('Customer not found', 404);
      }

      await prisma.cliente.update({
        where: { cli_codigo: customerId },
        data: { flg_del: 0 }
      });

      return {
        success: true,
        message: 'Customer deleted successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete customer', 500);
    }
  }
}

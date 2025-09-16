/**
 * @fileoverview User management controller for CRUD operations
 */

import bcrypt from 'bcryptjs';
import { 
  findUserById, 
  findUserByEmail, 
  createUser, 
  updateUser, 
  deleteUser, 
  getUsers,
  getRoles 
} from '@tovocl/database';
import { 
  CreateUserRequest, 
  UpdateUserRequest, 
  ApiResponse, 
  PaginatedResponse 
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';

export class UserController {
  /**
   * Get all users with pagination
   */
  async getUsers(page: number = 1, limit: number = 10): Promise<ApiResponse<PaginatedResponse>> {
    try {
      const result = await getUsers(page, limit);
      
      return {
        success: true,
        data: {
          data: result.users,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        },
        message: 'Users retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve users', 500);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<ApiResponse> {
    try {
      const user = await findUserById(id);
      if (!user) {
        throw new CustomError('User not found', 404);
      }

      return {
        success: true,
        data: {
          usu_codigo: user.usu_codigo,
          usu_nombre: user.usu_nombre,
          usu_apellidopat: user.usu_apellidopat,
          usu_apellidomat: user.usu_apellidomat,
          usu_fechacre: user.usu_fechacre,
          usu_estado: user.usu_estado,
          usu_email: user.usu_email,
          rol_codigo: user.rol_codigo,
          rol: user.rol,
          flg_del: user.flg_del
        },
        message: 'User retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve user', 500);
    }
  }

  /**
   * Create new user
   */
  async createUser(userData: CreateUserRequest): Promise<ApiResponse> {
    try {
      // Check if email already exists
      const existingUser = await findUserByEmail(userData.usu_email);
      if (existingUser) {
        throw new CustomError('Email already exists', 400);
      }

      // Validate role exists
      const roles = await getRoles();
      const roleExists = roles.some(role => role.rol_codigo === userData.rol_codigo);
      if (!roleExists) {
        throw new CustomError('Invalid role', 400);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.usu_password, 12);

      // Create user
      const newUser = await createUser({
        ...userData,
        usu_password: hashedPassword
      });

      return {
        success: true,
        data: {
          usu_codigo: newUser.usu_codigo,
          usu_nombre: newUser.usu_nombre,
          usu_apellidopat: newUser.usu_apellidopat,
          usu_apellidomat: newUser.usu_apellidomat,
          usu_fechacre: newUser.usu_fechacre,
          usu_estado: newUser.usu_estado,
          usu_email: newUser.usu_email,
          rol_codigo: newUser.rol_codigo,
          rol: newUser.rol,
          flg_del: newUser.flg_del
        },
        message: 'User created successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to create user', 500);
    }
  }

  /**
   * Update user
   */
  async updateUser(id: number, userData: UpdateUserRequest): Promise<ApiResponse> {
    try {
      // Check if user exists
      const existingUser = await findUserById(id);
      if (!existingUser) {
        throw new CustomError('User not found', 404);
      }

      // Check if email is being changed and if it already exists
      if (userData.usu_email && userData.usu_email !== existingUser.usu_email) {
        const emailExists = await findUserByEmail(userData.usu_email);
        if (emailExists) {
          throw new CustomError('Email already exists', 400);
        }
      }

      // Validate role if being changed
      if (userData.rol_codigo) {
        const roles = await getRoles();
        const roleExists = roles.some(role => role.rol_codigo === userData.rol_codigo);
        if (!roleExists) {
          throw new CustomError('Invalid role', 400);
        }
      }

      // Hash password if being updated
      if (userData.usu_password) {
        userData.usu_password = await bcrypt.hash(userData.usu_password, 12);
      }

      // Update user
      const updatedUser = await updateUser(id, userData);

      return {
        success: true,
        data: {
          usu_codigo: updatedUser.usu_codigo,
          usu_nombre: updatedUser.usu_nombre,
          usu_apellidopat: updatedUser.usu_apellidopat,
          usu_apellidomat: updatedUser.usu_apellidomat,
          usu_fechacre: updatedUser.usu_fechacre,
          usu_estado: updatedUser.usu_estado,
          usu_email: updatedUser.usu_email,
          rol_codigo: updatedUser.rol_codigo,
          rol: updatedUser.rol,
          flg_del: updatedUser.flg_del
        },
        message: 'User updated successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update user', 500);
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(id: number): Promise<ApiResponse> {
    try {
      // Check if user exists
      const existingUser = await findUserById(id);
      if (!existingUser) {
        throw new CustomError('User not found', 404);
      }

      // Soft delete user
      await deleteUser(id);

      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete user', 500);
    }
  }

  /**
   * Activate user account
   */
  async activateUser(id: number): Promise<ApiResponse> {
    try {
      // Check if user exists
      const existingUser = await findUserById(id);
      if (!existingUser) {
        throw new CustomError('User not found', 404);
      }

      // Activate user
      await updateUser(id, { usu_estado: 1 });

      return {
        success: true,
        message: 'User activated successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to activate user', 500);
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(id: number): Promise<ApiResponse> {
    try {
      // Check if user exists
      const existingUser = await findUserById(id);
      if (!existingUser) {
        throw new CustomError('User not found', 404);
      }

      // Deactivate user
      await updateUser(id, { usu_estado: 0 });

      return {
        success: true,
        message: 'User deactivated successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to deactivate user', 500);
    }
  }
}

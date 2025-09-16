/**
 * @fileoverview Authentication controller handling login, logout, and token management
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
  findUserByEmail, 
  findUserById, 
  updateUser 
} from '@tovocl/database';
import { 
  AuthRequest, 
  AuthResponse, 
  ApiResponse, 
  JWTPayload,
  CreateUserRequest 
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';

export class AuthController {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN: string;
  private readonly JWT_REFRESH_EXPIRES_IN: string;

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET!;
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
    this.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
    try {
      // Find user by email
      const user = await findUserByEmail(email);
      if (!user) {
        throw new CustomError('Invalid email or password', 401);
      }

      // Check if user is active
      if (user.usu_estado !== 1 || user.flg_del !== 1) {
        throw new CustomError('Account is inactive or deleted', 401);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.usu_password);
      if (!isPasswordValid) {
        throw new CustomError('Invalid email or password', 401);
      }

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Update last login (you might want to add this field to your schema)
      // await updateUser(user.usu_codigo, { lastLogin: new Date() });

      const response: AuthResponse = {
        user: {
          usu_codigo: user.usu_codigo,
          usu_nombre: user.usu_nombre,
          usu_apellidopat: user.usu_apellidopat,
          usu_apellidomat: user.usu_apellidomat,
          usu_fechacre: user.usu_fechacre,
          usu_estado: user.usu_estado,
          usu_email: user.usu_email,
          rol_codigo: user.rol_codigo,
          flg_del: user.flg_del
        },
        token: accessToken,
        refreshToken: refreshToken
      };

      return {
        success: true,
        data: response,
        message: 'Login successful'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Login failed', 500);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<ApiResponse<{ token: string; refreshToken: string }>> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.JWT_SECRET) as JWTPayload;
      
      // Get user from database
      const user = await findUserById(decoded.userId);
      if (!user || user.flg_del !== 1) {
        throw new CustomError('Invalid refresh token', 401);
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      return {
        success: true,
        data: {
          token: newAccessToken,
          refreshToken: newRefreshToken
        },
        message: 'Token refreshed successfully'
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new CustomError('Invalid refresh token', 401);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new CustomError('Refresh token expired', 401);
      }
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Token refresh failed', 500);
    }
  }

  /**
   * Logout user (invalidate tokens)
   */
  async logout(userId: number): Promise<ApiResponse> {
    try {
      // In a real implementation, you might want to:
      // 1. Add tokens to a blacklist
      // 2. Update user's last logout time
      // 3. Clear any server-side sessions

      return {
        success: true,
        message: 'Logout successful'
      };
    } catch (error) {
      throw new CustomError('Logout failed', 500);
    }
  }

  /**
   * Get current user information
   */
  async getCurrentUser(userId: number): Promise<ApiResponse> {
    try {
      const user = await findUserById(userId);
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
        message: 'User information retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to get user information', 500);
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<ApiResponse> {
    try {
      // Get user
      const user = await findUserById(userId);
      if (!user) {
        throw new CustomError('User not found', 404);
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.usu_password);
      if (!isCurrentPasswordValid) {
        throw new CustomError('Current password is incorrect', 400);
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await updateUser(userId, { usu_password: hashedNewPassword });

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Password change failed', 500);
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<ApiResponse> {
    try {
      const user = await findUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not
        return {
          success: true,
          message: 'If the email exists, a password reset link has been sent'
        };
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user.usu_codigo, type: 'password_reset' },
        this.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // In a real implementation, you would:
      // 1. Save the reset token to database with expiration
      // 2. Send email with reset link
      // 3. Log the reset request

      console.log(`Password reset token for ${email}: ${resetToken}`);

      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      };
    } catch (error) {
      throw new CustomError('Password reset request failed', 500);
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
    try {
      // Verify reset token
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      
      if (decoded.type !== 'password_reset') {
        throw new CustomError('Invalid reset token', 400);
      }

      // Get user
      const user = await findUserById(decoded.userId);
      if (!user) {
        throw new CustomError('User not found', 404);
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await updateUser(user.usu_codigo, { usu_password: hashedPassword });

      return {
        success: true,
        message: 'Password reset successfully'
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new CustomError('Invalid or expired reset token', 400);
      }
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Password reset failed', 500);
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<ApiResponse> {
    try {
      // Verify email token
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      
      if (decoded.type !== 'email_verification') {
        throw new CustomError('Invalid verification token', 400);
      }

      // Get user
      const user = await findUserById(decoded.userId);
      if (!user) {
        throw new CustomError('User not found', 404);
      }

      // Update user verification status
      // You might want to add email_verified field to your schema
      // await updateUser(user.usu_codigo, { email_verified: true });

      return {
        success: true,
        message: 'Email verified successfully'
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new CustomError('Invalid or expired verification token', 400);
      }
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Email verification failed', 500);
    }
  }

  /**
   * Generate access token
   */
  private generateAccessToken(user: any): string {
    const payload: JWTPayload = {
      userId: user.usu_codigo,
      email: user.usu_email,
      roleId: user.rol_codigo,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.JWT_EXPIRES_IN });
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(user: any): string {
    const payload = {
      userId: user.usu_codigo,
      email: user.usu_email,
      type: 'refresh'
    };

    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: this.JWT_REFRESH_EXPIRES_IN });
  }
}

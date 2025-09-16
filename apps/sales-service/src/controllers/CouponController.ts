/**
 * @fileoverview Coupon controller for coupon management
 */

import { 
  prisma
} from '@tovocl/database';
import { 
  ApiResponse, 
  PaginatedResponse 
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';
import moment from 'moment';

export class CouponController {
  /**
   * Get all coupons with pagination and filters
   */
  async getCoupons(
    page: number = 1, 
    limit: number = 10, 
    estado?: string, 
    tipo?: string, 
    search?: string
  ): Promise<ApiResponse<PaginatedResponse>> {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = { flg_del: 1 };
      
      if (estado) {
        if (estado === 'activo') {
          whereClause.cup_activo = 1;
          whereClause.cup_fechainicio = { lte: new Date() };
          whereClause.cup_fechafin = { gte: new Date() };
        } else if (estado === 'inactivo') {
          whereClause.cup_activo = 0;
        } else if (estado === 'expirado') {
          whereClause.cup_fechafin = { lt: new Date() };
        }
      }
      
      if (tipo) {
        whereClause.cup_tipo = tipo;
      }
      
      if (search) {
        whereClause.OR = [
          { cup_codigo: { contains: search } },
          { cup_descripcion: { contains: search } }
        ];
      }

      const [coupons, total] = await Promise.all([
        prisma.cupon.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { cup_fechacreacion: 'desc' }
        }),
        prisma.cupon.count({
          where: whereClause
        })
      ]);

      // Add status calculation
      const couponsWithStatus = coupons.map(coupon => ({
        ...coupon,
        estado: this.calculateCouponStatus(coupon)
      }));

      return {
        success: true,
        data: {
          data: couponsWithStatus,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
        message: 'Coupons retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve coupons', 500);
    }
  }

  /**
   * Get coupon by ID
   */
  async getCouponById(id: number): Promise<ApiResponse> {
    try {
      const coupon = await prisma.cupon.findUnique({
        where: { cup_codigo: id }
      });

      if (!coupon || coupon.flg_del !== 1) {
        throw new CustomError('Coupon not found', 404);
      }

      const couponWithStatus = {
        ...coupon,
        estado: this.calculateCouponStatus(coupon)
      };

      return {
        success: true,
        data: couponWithStatus,
        message: 'Coupon retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve coupon', 500);
    }
  }

  /**
   * Create new coupon
   */
  async createCoupon(couponData: {
    cup_codigo: string;
    cup_descripcion: string;
    cup_tipo: 'porcentaje' | 'monto_fijo';
    cup_valor: number;
    cup_fechainicio: string;
    cup_fechafin: string;
    cup_usosmaximos?: number;
    cup_montominimo?: number;
  }): Promise<ApiResponse> {
    try {
      const { 
        cup_codigo, 
        cup_descripcion, 
        cup_tipo, 
        cup_valor, 
        cup_fechainicio, 
        cup_fechafin, 
        cup_usosmaximos, 
        cup_montominimo 
      } = couponData;

      // Check if coupon code already exists
      const existingCoupon = await prisma.cupon.findFirst({
        where: { 
          cup_codigo: cup_codigo,
          flg_del: 1
        }
      });

      if (existingCoupon) {
        throw new CustomError('Coupon code already exists', 400);
      }

      // Validate dates
      const startDate = new Date(cup_fechainicio);
      const endDate = new Date(cup_fechafin);

      if (startDate >= endDate) {
        throw new CustomError('End date must be after start date', 400);
      }

      // Validate value based on type
      if (cup_tipo === 'porcentaje' && cup_valor > 100) {
        throw new CustomError('Percentage value cannot exceed 100', 400);
      }

      const coupon = await prisma.cupon.create({
        data: {
          cup_codigo,
          cup_descripcion,
          cup_tipo,
          cup_valor,
          cup_fechainicio: startDate,
          cup_fechafin: endDate,
          cup_usosmaximos: cup_usosmaximos || 0,
          cup_montominimo: cup_montominimo || 0,
          cup_usosactuales: 0,
          cup_activo: 1,
          cup_fechacreacion: new Date(),
          flg_del: 1
        }
      });

      return {
        success: true,
        data: coupon,
        message: 'Coupon created successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to create coupon', 500);
    }
  }

  /**
   * Update coupon
   */
  async updateCoupon(id: number, couponData: any): Promise<ApiResponse> {
    try {
      const existingCoupon = await prisma.cupon.findUnique({
        where: { cup_codigo: id }
      });

      if (!existingCoupon) {
        throw new CustomError('Coupon not found', 404);
      }

      // Validate dates if provided
      if (couponData.cup_fechainicio && couponData.cup_fechafin) {
        const startDate = new Date(couponData.cup_fechainicio);
        const endDate = new Date(couponData.cup_fechafin);

        if (startDate >= endDate) {
          throw new CustomError('End date must be after start date', 400);
        }
      }

      // Validate value based on type
      if (couponData.cup_tipo === 'porcentaje' && couponData.cup_valor > 100) {
        throw new CustomError('Percentage value cannot exceed 100', 400);
      }

      const coupon = await prisma.cupon.update({
        where: { cup_codigo: id },
        data: couponData
      });

      return {
        success: true,
        data: coupon,
        message: 'Coupon updated successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update coupon', 500);
    }
  }

  /**
   * Delete coupon
   */
  async deleteCoupon(id: number): Promise<ApiResponse> {
    try {
      const existingCoupon = await prisma.cupon.findUnique({
        where: { cup_codigo: id }
      });

      if (!existingCoupon) {
        throw new CustomError('Coupon not found', 404);
      }

      await prisma.cupon.update({
        where: { cup_codigo: id },
        data: { flg_del: 0 }
      });

      return {
        success: true,
        message: 'Coupon deleted successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete coupon', 500);
    }
  }

  /**
   * Apply coupon to order
   */
  async applyCoupon(applyData: {
    cup_codigo: string;
    orden_codigo: number;
  }): Promise<ApiResponse> {
    try {
      const { cup_codigo, orden_codigo } = applyData;

      // Verify order exists
      const order = await prisma.orden.findUnique({
        where: { ord_codigo: orden_codigo }
      });

      if (!order || order.flg_del !== 1) {
        throw new CustomError('Order not found', 404);
      }

      // Verify coupon exists and is valid
      const coupon = await prisma.cupon.findFirst({
        where: { 
          cup_codigo: cup_codigo,
          flg_del: 1
        }
      });

      if (!coupon) {
        throw new CustomError('Coupon not found', 404);
      }

      // Validate coupon
      const validation = this.validateCouponForOrder(coupon, order.ord_total || 0);
      if (!validation.valid) {
        throw new CustomError(validation.message, 400);
      }

      // Calculate discount
      const discount = this.calculateDiscount(coupon, order.ord_total || 0);

      // Update order with coupon
      const updatedOrder = await prisma.orden.update({
        where: { ord_codigo: orden_codigo },
        data: {
          cup_codigo: coupon.cup_codigo,
          ord_descuento: discount,
          ord_total: (order.ord_total || 0) - discount
        }
      });

      // Update coupon usage
      await prisma.cupon.update({
        where: { cup_codigo: cup_codigo },
        data: {
          cup_usosactuales: coupon.cup_usosactuales + 1
        }
      });

      return {
        success: true,
        data: {
          order: updatedOrder,
          coupon: coupon,
          discount: discount
        },
        message: 'Coupon applied successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to apply coupon', 500);
    }
  }

  /**
   * Validate coupon code
   */
  async validateCoupon(cupCodigo: string, montoOrden?: number): Promise<ApiResponse> {
    try {
      const coupon = await prisma.cupon.findFirst({
        where: { 
          cup_codigo: cup_codigo,
          flg_del: 1
        }
      });

      if (!coupon) {
        return {
          success: false,
          data: { valid: false, message: 'Coupon not found' },
          message: 'Coupon validation failed'
        };
      }

      const validation = this.validateCouponForOrder(coupon, montoOrden || 0);
      const discount = montoOrden ? this.calculateDiscount(coupon, montoOrden) : 0;

      return {
        success: true,
        data: {
          valid: validation.valid,
          message: validation.message,
          coupon: coupon,
          discount: discount
        },
        message: 'Coupon validation completed'
      };
    } catch (error) {
      throw new CustomError('Failed to validate coupon', 500);
    }
  }

  /**
   * Get coupon usage statistics
   */
  async getCouponUsage(couponId: number): Promise<ApiResponse> {
    try {
      const coupon = await prisma.cupon.findUnique({
        where: { cup_codigo: couponId }
      });

      if (!coupon) {
        throw new CustomError('Coupon not found', 404);
      }

      // Get orders that used this coupon
      const orders = await prisma.orden.findMany({
        where: {
          cup_codigo: couponId,
          flg_del: 1
        },
        select: {
          ord_codigo: true,
          ord_fecha: true,
          ord_total: true,
          ord_descuento: true
        },
        orderBy: { ord_fecha: 'desc' }
      });

      const totalDiscount = orders.reduce((sum, order) => sum + (order.ord_descuento || 0), 0);
      const totalOrders = orders.length;

      const usage = {
        coupon: coupon,
        total_uses: totalOrders,
        total_discount: totalDiscount,
        usage_rate: coupon.cup_usosmaximos > 0 ? (totalOrders / coupon.cup_usosmaximos) * 100 : 0,
        recent_orders: orders.slice(0, 10)
      };

      return {
        success: true,
        data: usage,
        message: 'Coupon usage statistics retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve coupon usage', 500);
    }
  }

  /**
   * Toggle coupon active status
   */
  async toggleCouponStatus(couponId: number): Promise<ApiResponse> {
    try {
      const existingCoupon = await prisma.cupon.findUnique({
        where: { cup_codigo: couponId }
      });

      if (!existingCoupon) {
        throw new CustomError('Coupon not found', 404);
      }

      const coupon = await prisma.cupon.update({
        where: { cup_codigo: couponId },
        data: { 
          cup_activo: existingCoupon.cup_activo === 1 ? 0 : 1 
        }
      });

      return {
        success: true,
        data: coupon,
        message: 'Coupon status updated successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update coupon status', 500);
    }
  }

  /**
   * Calculate coupon status
   */
  private calculateCouponStatus(coupon: any): string {
    const now = new Date();
    const startDate = new Date(coupon.cup_fechainicio);
    const endDate = new Date(coupon.cup_fechafin);

    if (coupon.cup_activo === 0) {
      return 'inactivo';
    }

    if (now < startDate) {
      return 'pendiente';
    }

    if (now > endDate) {
      return 'expirado';
    }

    if (coupon.cup_usosmaximos > 0 && coupon.cup_usosactuales >= coupon.cup_usosmaximos) {
      return 'agotado';
    }

    return 'activo';
  }

  /**
   * Validate coupon for order
   */
  private validateCouponForOrder(coupon: any, orderTotal: number): { valid: boolean; message: string } {
    const now = new Date();
    const startDate = new Date(coupon.cup_fechainicio);
    const endDate = new Date(coupon.cup_fechafin);

    if (coupon.cup_activo === 0) {
      return { valid: false, message: 'Coupon is inactive' };
    }

    if (now < startDate) {
      return { valid: false, message: 'Coupon is not yet active' };
    }

    if (now > endDate) {
      return { valid: false, message: 'Coupon has expired' };
    }

    if (coupon.cup_usosmaximos > 0 && coupon.cup_usosactuales >= coupon.cup_usosmaximos) {
      return { valid: false, message: 'Coupon usage limit reached' };
    }

    if (coupon.cup_montominimo > 0 && orderTotal < coupon.cup_montominimo) {
      return { valid: false, message: `Minimum order amount of ${coupon.cup_montominimo} required` };
    }

    return { valid: true, message: 'Coupon is valid' };
  }

  /**
   * Calculate discount amount
   */
  private calculateDiscount(coupon: any, orderTotal: number): number {
    if (coupon.cup_tipo === 'porcentaje') {
      return (orderTotal * coupon.cup_valor) / 100;
    } else {
      return Math.min(coupon.cup_valor, orderTotal);
    }
  }
}

/**
 * @fileoverview Payment controller for payment handling and processing
 */

import { 
  prisma
} from '@tovocl/database';
import { 
  ApiResponse, 
  PaginatedResponse 
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';

export class PaymentController {
  /**
   * Get all payment methods
   */
  async getPaymentMethods(): Promise<ApiResponse> {
    try {
      const paymentMethods = await prisma.tipoPago.findMany({
        where: { flg_del: 1 },
        orderBy: { tpa_nombre: 'asc' }
      });

      return {
        success: true,
        data: paymentMethods,
        message: 'Payment methods retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve payment methods', 500);
    }
  }

  /**
   * Get payment method by ID
   */
  async getPaymentMethodById(id: number): Promise<ApiResponse> {
    try {
      const paymentMethod = await prisma.tipoPago.findUnique({
        where: { tpa_codigo: id }
      });

      if (!paymentMethod || paymentMethod.flg_del !== 1) {
        throw new CustomError('Payment method not found', 404);
      }

      return {
        success: true,
        data: paymentMethod,
        message: 'Payment method retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve payment method', 500);
    }
  }

  /**
   * Create new payment method
   */
  async createPaymentMethod(paymentMethodData: {
    nombre: string;
    activo?: boolean;
  }): Promise<ApiResponse> {
    try {
      const { nombre, activo = true } = paymentMethodData;

      const paymentMethod = await prisma.tipoPago.create({
        data: {
          tpa_nombre: nombre,
          tpa_activo: activo ? 1 : 0,
          flg_del: 1
        }
      });

      return {
        success: true,
        data: paymentMethod,
        message: 'Payment method created successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to create payment method', 500);
    }
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(id: number, paymentMethodData: any): Promise<ApiResponse> {
    try {
      const existingPaymentMethod = await prisma.tipoPago.findUnique({
        where: { tpa_codigo: id }
      });

      if (!existingPaymentMethod) {
        throw new CustomError('Payment method not found', 404);
      }

      const paymentMethod = await prisma.tipoPago.update({
        where: { tpa_codigo: id },
        data: paymentMethodData
      });

      return {
        success: true,
        data: paymentMethod,
        message: 'Payment method updated successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update payment method', 500);
    }
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(id: number): Promise<ApiResponse> {
    try {
      const existingPaymentMethod = await prisma.tipoPago.findUnique({
        where: { tpa_codigo: id }
      });

      if (!existingPaymentMethod) {
        throw new CustomError('Payment method not found', 404);
      }

      await prisma.tipoPago.update({
        where: { tpa_codigo: id },
        data: { flg_del: 0 }
      });

      return {
        success: true,
        message: 'Payment method deleted successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete payment method', 500);
    }
  }

  /**
   * Process payment
   */
  async processPayment(
    paymentData: {
      orden_codigo: number;
      metodo_pago_id: number;
      monto: number;
      referencia?: string;
    }, 
    userId: number
  ): Promise<ApiResponse> {
    try {
      const { orden_codigo, metodo_pago_id, monto, referencia } = paymentData;

      // Verify order exists
      const order = await prisma.orden.findUnique({
        where: { ord_codigo: orden_codigo }
      });

      if (!order || order.flg_del !== 1) {
        throw new CustomError('Order not found', 404);
      }

      // Verify payment method exists
      const paymentMethod = await prisma.tipoPago.findUnique({
        where: { tpa_codigo: metodo_pago_id }
      });

      if (!paymentMethod || paymentMethod.flg_del !== 1) {
        throw new CustomError('Payment method not found', 404);
      }

      // Create payment record
      const payment = await prisma.movimientoDinero.create({
        data: {
          mov_tipo: 1, // 1 = payment
          mov_monto: monto,
          mov_descripcion: `Payment for order ${orden_codigo}`,
          mov_fecha: new Date(),
          ord_codigo: orden_codigo,
          tpa_codigo: metodo_pago_id,
          usu_codigo: userId,
          mov_referencia: referencia || '',
          flg_del: 1
        },
        include: {
          tipoPago: true,
          orden: {
            include: {
              mesa: true
            }
          }
        }
      });

      return {
        success: true,
        data: payment,
        message: 'Payment processed successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to process payment', 500);
    }
  }

  /**
   * Get all payments with pagination and filters
   */
  async getPayments(
    page: number = 1, 
    limit: number = 10, 
    fechaInicio?: string, 
    fechaFin?: string, 
    metodoPagoId?: number, 
    ordenCodigo?: number
  ): Promise<ApiResponse<PaginatedResponse>> {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = { flg_del: 1 };
      
      if (fechaInicio && fechaFin) {
        whereClause.mov_fecha = {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
        };
      }
      
      if (metodoPagoId) {
        whereClause.tpa_codigo = metodoPagoId;
      }
      
      if (ordenCodigo) {
        whereClause.ord_codigo = ordenCodigo;
      }

      const [payments, total] = await Promise.all([
        prisma.movimientoDinero.findMany({
          where: whereClause,
          include: {
            tipoPago: true,
            orden: {
              include: {
                mesa: true,
                cliente: true
              }
            },
            usuario: {
              select: {
                usu_codigo: true,
                usu_nombre: true,
                usu_apellidopat: true,
                usu_apellidomat: true
              }
            }
          },
          skip,
          take: limit,
          orderBy: { mov_fecha: 'desc' }
        }),
        prisma.movimientoDinero.count({
          where: whereClause
        })
      ]);

      return {
        success: true,
        data: {
          data: payments,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
        message: 'Payments retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve payments', 500);
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id: number): Promise<ApiResponse> {
    try {
      const payment = await prisma.movimientoDinero.findUnique({
        where: { mov_codigo: id },
        include: {
          tipoPago: true,
          orden: {
            include: {
              mesa: true,
              cliente: true,
              ordenproducto: {
                include: {
                  plato: true,
                  bebida: true
                }
              }
            }
          },
          usuario: {
            select: {
              usu_codigo: true,
              usu_nombre: true,
              usu_apellidopat: true,
              usu_apellidomat: true
            }
          }
        }
      });

      if (!payment || payment.flg_del !== 1) {
        throw new CustomError('Payment not found', 404);
      }

      return {
        success: true,
        data: payment,
        message: 'Payment retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve payment', 500);
    }
  }

  /**
   * Process payment refund
   */
  async processRefund(
    paymentId: number, 
    monto: number, 
    motivo: string, 
    userId: number
  ): Promise<ApiResponse> {
    try {
      // Verify payment exists
      const payment = await prisma.movimientoDinero.findUnique({
        where: { mov_codigo: paymentId }
      });

      if (!payment || payment.flg_del !== 1) {
        throw new CustomError('Payment not found', 404);
      }

      if (payment.mov_tipo !== 1) {
        throw new CustomError('Only payments can be refunded', 400);
      }

      // Validate refund amount
      if (monto > payment.mov_monto) {
        throw new CustomError('Refund amount cannot exceed payment amount', 400);
      }

      // Create refund record
      const refund = await prisma.movimientoDinero.create({
        data: {
          mov_tipo: 2, // 2 = refund
          mov_monto: monto,
          mov_descripcion: `Refund for payment ${paymentId}: ${motivo}`,
          mov_fecha: new Date(),
          ord_codigo: payment.ord_codigo,
          tpa_codigo: payment.tpa_codigo,
          usu_codigo: userId,
          flg_del: 1
        },
        include: {
          tipoPago: true,
          orden: {
            include: {
              mesa: true
            }
          }
        }
      });

      return {
        success: true,
        data: refund,
        message: 'Refund processed successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to process refund', 500);
    }
  }

  /**
   * Get payment summary
   */
  async getPaymentSummary(fechaInicio?: string, fechaFin?: string): Promise<ApiResponse> {
    try {
      const whereClause: any = { 
        flg_del: 1,
        mov_tipo: 1 // Only payments, not refunds
      };

      if (fechaInicio && fechaFin) {
        whereClause.mov_fecha = {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
        };
      }

      const [
        totalPayments,
        totalAmount,
        paymentMethods,
        refunds
      ] = await Promise.all([
        // Total payments count
        prisma.movimientoDinero.count({
          where: whereClause
        }),
        // Total amount
        prisma.movimientoDinero.aggregate({
          where: whereClause,
          _sum: {
            mov_monto: true
          }
        }),
        // Payment methods breakdown
        prisma.movimientoDinero.groupBy({
          by: ['tpa_codigo'],
          where: whereClause,
          _sum: {
            mov_monto: true
          },
          _count: {
            mov_codigo: true
          }
        }),
        // Refunds
        prisma.movimientoDinero.aggregate({
          where: {
            ...whereClause,
            mov_tipo: 2 // Refunds
          },
          _sum: {
            mov_monto: true
          },
          _count: {
            mov_codigo: true
          }
        })
      ]);

      // Get payment method details
      const paymentMethodDetails = await Promise.all(
        paymentMethods.map(async (pm) => {
          const method = await prisma.tipoPago.findUnique({
            where: { tpa_codigo: pm.tpa_codigo }
          });

          return {
            method_id: pm.tpa_codigo,
            method_name: method?.tpa_nombre || 'Unknown',
            total_amount: pm._sum.mov_monto || 0,
            count: pm._count.mov_codigo
          };
        })
      );

      const summary = {
        total_payments: totalPayments,
        total_amount: totalAmount._sum.mov_monto || 0,
        total_refunds: refunds._count.mov_codigo || 0,
        refund_amount: refunds._sum.mov_monto || 0,
        net_amount: (totalAmount._sum.mov_monto || 0) - (refunds._sum.mov_monto || 0),
        payment_methods: paymentMethodDetails
      };

      return {
        success: true,
        data: summary,
        message: 'Payment summary retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve payment summary', 500);
    }
  }
}

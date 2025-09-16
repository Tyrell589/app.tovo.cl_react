/**
 * @fileoverview Cash controller for cash management and cash register operations
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

export class CashController {
  /**
   * Get all cash registers with pagination and filters
   */
  async getCashRegisters(
    page: number = 1, 
    limit: number = 10, 
    estado?: string
  ): Promise<ApiResponse<PaginatedResponse>> {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = { flg_del: 1 };
      
      if (estado) {
        whereClause.arq_estado = estado === 'abierto' ? 1 : 0;
      }

      const [registers, total] = await Promise.all([
        prisma.arqueoDinero.findMany({
          where: whereClause,
          include: {
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
          orderBy: { arq_fechaapertura: 'desc' }
        }),
        prisma.arqueoDinero.count({
          where: whereClause
        })
      ]);

      return {
        success: true,
        data: {
          data: registers,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
        message: 'Cash registers retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve cash registers', 500);
    }
  }

  /**
   * Get cash register by ID
   */
  async getCashRegisterById(id: number): Promise<ApiResponse> {
    try {
      const register = await prisma.arqueoDinero.findUnique({
        where: { arq_codigo: id },
        include: {
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

      if (!register || register.flg_del !== 1) {
        throw new CustomError('Cash register not found', 404);
      }

      return {
        success: true,
        data: register,
        message: 'Cash register retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve cash register', 500);
    }
  }

  /**
   * Open cash register
   */
  async openCashRegister(
    registerData: {
      monto_inicial: number;
      comentarios?: string;
    }, 
    userId: number
  ): Promise<ApiResponse> {
    try {
      const { monto_inicial, comentarios } = registerData;

      // Check if there's already an open register
      const existingRegister = await prisma.arqueoDinero.findFirst({
        where: {
          arq_estado: 1,
          flg_del: 1
        }
      });

      if (existingRegister) {
        throw new CustomError('There is already an open cash register', 400);
      }

      const register = await prisma.arqueoDinero.create({
        data: {
          arq_fechaapertura: new Date(),
          arq_montoinicial: monto_inicial,
          arq_monto: monto_inicial,
          arq_comentario: comentarios || '',
          arq_estado: 1,
          usu_codigo: userId,
          flg_del: 1
        },
        include: {
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

      return {
        success: true,
        data: register,
        message: 'Cash register opened successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to open cash register', 500);
    }
  }

  /**
   * Close cash register
   */
  async closeCashRegister(
    registerId: number, 
    montoFinal: number, 
    comentarios: string, 
    userId: number
  ): Promise<ApiResponse> {
    try {
      const existingRegister = await prisma.arqueoDinero.findUnique({
        where: { arq_codigo: registerId }
      });

      if (!existingRegister) {
        throw new CustomError('Cash register not found', 404);
      }

      if (existingRegister.arq_estado !== 1) {
        throw new CustomError('Cash register is not open', 400);
      }

      // Calculate difference
      const diferencia = montoFinal - existingRegister.arq_monto;

      const register = await prisma.arqueoDinero.update({
        where: { arq_codigo: registerId },
        data: {
          arq_fechacierre: new Date(),
          arq_real: montoFinal,
          arq_diferencia: diferencia,
          arq_comentario: comentarios || existingRegister.arq_comentario,
          arq_estado: 0,
          usu_cierre: userId
        },
        include: {
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

      return {
        success: true,
        data: register,
        message: 'Cash register closed successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to close cash register', 500);
    }
  }

  /**
   * Get current open cash register
   */
  async getCurrentCashRegister(): Promise<ApiResponse> {
    try {
      const currentRegister = await prisma.arqueoDinero.findFirst({
        where: {
          arq_estado: 1,
          flg_del: 1
        },
        include: {
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

      if (!currentRegister) {
        return {
          success: true,
          data: null,
          message: 'No open cash register found'
        };
      }

      return {
        success: true,
        data: currentRegister,
        message: 'Current cash register retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve current cash register', 500);
    }
  }

  /**
   * Record cash movement
   */
  async recordCashMovement(
    movementData: {
      tipo: 'entrada' | 'salida';
      monto: number;
      descripcion: string;
      comentarios?: string;
    }, 
    userId: number
  ): Promise<ApiResponse> {
    try {
      const { tipo, monto, descripcion, comentarios } = movementData;

      // Check if there's an open cash register
      const currentRegister = await prisma.arqueoDinero.findFirst({
        where: {
          arq_estado: 1,
          flg_del: 1
        }
      });

      if (!currentRegister) {
        throw new CustomError('No open cash register found', 400);
      }

      // Create cash movement
      const movement = await prisma.movimientoDinero.create({
        data: {
          mov_tipo: tipo === 'entrada' ? 1 : 2,
          mov_monto: monto,
          mov_descripcion: descripcion,
          mov_fecha: new Date(),
          usu_codigo: userId,
          mov_comentarios: comentarios || '',
          flg_del: 1
        }
      });

      // Update cash register amount
      const newAmount = tipo === 'entrada' 
        ? currentRegister.arq_monto + monto 
        : currentRegister.arq_monto - monto;

      await prisma.arqueoDinero.update({
        where: { arq_codigo: currentRegister.arq_codigo },
        data: { arq_monto: newAmount }
      });

      return {
        success: true,
        data: {
          movement,
          newAmount
        },
        message: 'Cash movement recorded successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to record cash movement', 500);
    }
  }

  /**
   * Get cash movements
   */
  async getCashMovements(
    page: number = 1, 
    limit: number = 10, 
    fechaInicio?: string, 
    fechaFin?: string, 
    tipo?: string
  ): Promise<ApiResponse<PaginatedResponse>> {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = { 
        flg_del: 1,
        arq_codigo: null // Only cash movements, not order payments
      };
      
      if (fechaInicio && fechaFin) {
        whereClause.mov_fecha = {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
        };
      }
      
      if (tipo) {
        whereClause.mov_tipo = tipo === 'entrada' ? 1 : 2;
      }

      const [movements, total] = await Promise.all([
        prisma.movimientoDinero.findMany({
          where: whereClause,
          include: {
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
          data: movements,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
        message: 'Cash movements retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve cash movements', 500);
    }
  }

  /**
   * Get cash summary
   */
  async getCashSummary(fecha?: string): Promise<ApiResponse> {
    try {
      const targetDate = fecha ? moment(fecha) : moment();
      const startOfDay = targetDate.startOf('day').toDate();
      const endOfDay = targetDate.endOf('day').toDate();

      const [
        totalIncome,
        totalExpenses,
        cashPayments,
        movements
      ] = await Promise.all([
        // Total income from cash movements
        prisma.movimientoDinero.aggregate({
          where: {
            mov_tipo: 1, // Income
            arq_codigo: null,
            mov_fecha: {
              gte: startOfDay,
              lte: endOfDay
            },
            flg_del: 1
          },
          _sum: {
            mov_monto: true
          }
        }),
        // Total expenses from cash movements
        prisma.movimientoDinero.aggregate({
          where: {
            mov_tipo: 2, // Expenses
            arq_codigo: null,
            mov_fecha: {
              gte: startOfDay,
              lte: endOfDay
            },
            flg_del: 1
          },
          _sum: {
            mov_monto: true
          }
        }),
        // Cash payments from orders
        prisma.orden.aggregate({
          where: {
            ord_metodopago: 'efectivo',
            ord_fecha: {
              gte: startOfDay,
              lte: endOfDay
            },
            ord_estado: 'entregado',
            flg_del: 1
          },
          _sum: {
            ord_total: true
          }
        }),
        // All movements for the day
        prisma.movimientoDinero.findMany({
          where: {
            arq_codigo: null,
            mov_fecha: {
              gte: startOfDay,
              lte: endOfDay
            },
            flg_del: 1
          },
          include: {
            usuario: {
              select: {
                usu_nombre: true,
                usu_apellidopat: true
              }
            }
          },
          orderBy: { mov_fecha: 'desc' }
        })
      ]);

      const summary = {
        date: targetDate.format('YYYY-MM-DD'),
        total_income: totalIncome._sum.mov_monto || 0,
        total_expenses: totalExpenses._sum.mov_monto || 0,
        cash_payments: cashPayments._sum.ord_total || 0,
        net_cash: (totalIncome._sum.mov_monto || 0) - (totalExpenses._sum.mov_monto || 0),
        movements: movements.map(m => ({
          id: m.mov_codigo,
          tipo: m.mov_tipo === 1 ? 'entrada' : 'salida',
          monto: m.mov_monto,
          descripcion: m.mov_descripcion,
          fecha: m.mov_fecha,
          usuario: m.usuario ? `${m.usuario.usu_nombre} ${m.usuario.usu_apellidopat}` : 'Unknown'
        }))
      };

      return {
        success: true,
        data: summary,
        message: 'Cash summary retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve cash summary', 500);
    }
  }

  /**
   * Get daily cash report
   */
  async getDailyCashReport(fecha?: string): Promise<ApiResponse> {
    try {
      const targetDate = fecha ? moment(fecha) : moment();
      const startOfDay = targetDate.startOf('day').toDate();
      const endOfDay = targetDate.endOf('day').toDate();

      const [
        cashRegisters,
        totalSales,
        totalMovements
      ] = await Promise.all([
        // Cash registers for the day
        prisma.arqueoDinero.findMany({
          where: {
            arq_fechaapertura: {
              gte: startOfDay,
              lte: endOfDay
            },
            flg_del: 1
          },
          include: {
            usuario: {
              select: {
                usu_nombre: true,
                usu_apellidopat: true
              }
            }
          }
        }),
        // Total sales for the day
        prisma.orden.aggregate({
          where: {
            ord_fecha: {
              gte: startOfDay,
              lte: endOfDay
            },
            ord_estado: 'entregado',
            flg_del: 1
          },
          _sum: {
            ord_total: true
          },
          _count: {
            ord_codigo: true
          }
        }),
        // Total cash movements
        prisma.movimientoDinero.aggregate({
          where: {
            arq_codigo: null,
            mov_fecha: {
              gte: startOfDay,
              lte: endOfDay
            },
            flg_del: 1
          },
          _sum: {
            mov_monto: true
          }
        })
      ]);

      const report = {
        date: targetDate.format('YYYY-MM-DD'),
        cash_registers: cashRegisters.map(cr => ({
          id: cr.arq_codigo,
          monto_inicial: cr.arq_montoinicial,
          monto_final: cr.arq_monto,
          diferencia: cr.arq_diferencia,
          estado: cr.arq_estado === 1 ? 'abierto' : 'cerrado',
          apertura: cr.arq_fechaapertura,
          cierre: cr.arq_fechacierre,
          usuario: cr.usuario ? `${cr.usuario.usu_nombre} ${cr.usuario.usu_apellidopat}` : 'Unknown'
        })),
        total_sales: totalSales._sum.ord_total || 0,
        total_orders: totalSales._count.ord_codigo || 0,
        total_movements: totalMovements._sum.mov_monto || 0,
        summary: {
          total_cash_flow: (totalSales._sum.ord_total || 0) + (totalMovements._sum.mov_monto || 0),
          open_registers: cashRegisters.filter(cr => cr.arq_estado === 1).length,
          closed_registers: cashRegisters.filter(cr => cr.arq_estado === 0).length
        }
      };

      return {
        success: true,
        data: report,
        message: 'Daily cash report retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve daily cash report', 500);
    }
  }
}

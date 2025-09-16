/**
 * @fileoverview Turn controller for managing restaurant shifts and turns
 */

import { 
  prisma
} from '@tovocl/database';
import { 
  ApiResponse, 
  PaginatedResponse 
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';

export class TurnController {
  /**
   * Get all turns with pagination and filters
   */
  async getTurns(
    page: number = 1, 
    limit: number = 10, 
    search?: string
  ): Promise<ApiResponse<PaginatedResponse>> {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = { flg_del: 1 };
      
      if (search) {
        whereClause.tur_nombre = { contains: search };
      }

      const [turns, total] = await Promise.all([
        prisma.turno.findMany({
          where: whereClause,
          orderBy: { tur_nombre: 'asc' },
          skip,
          take: limit
        }),
        prisma.turno.count({
          where: whereClause
        })
      ]);

      return {
        success: true,
        data: {
          data: turns,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
        message: 'Turns retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve turns', 500);
    }
  }

  /**
   * Get turn by ID
   */
  async getTurnById(id: number): Promise<ApiResponse> {
    try {
      const turn = await prisma.turno.findUnique({
        where: { tur_codigo: id }
      });

      if (!turn || turn.flg_del !== 1) {
        throw new CustomError('Turn not found', 404);
      }

      return {
        success: true,
        data: turn,
        message: 'Turn retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve turn', 500);
    }
  }

  /**
   * Create new turn
   */
  async createTurn(turnData: {
    tur_nombre: string;
    tur_hora_inicio: string;
    tur_hora_fin: string;
  }): Promise<ApiResponse> {
    try {
      const { tur_nombre, tur_hora_inicio, tur_hora_fin } = turnData;

      const turn = await prisma.turno.create({
        data: {
          tur_nombre,
          tur_hora_inicio,
          tur_hora_fin,
          flg_del: 1
        }
      });

      return {
        success: true,
        data: turn,
        message: 'Turn created successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to create turn', 500);
    }
  }

  /**
   * Update turn
   */
  async updateTurn(id: number, turnData: any): Promise<ApiResponse> {
    try {
      const existingTurn = await prisma.turno.findUnique({
        where: { tur_codigo: id }
      });

      if (!existingTurn) {
        throw new CustomError('Turn not found', 404);
      }

      const turn = await prisma.turno.update({
        where: { tur_codigo: id },
        data: turnData
      });

      return {
        success: true,
        data: turn,
        message: 'Turn updated successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update turn', 500);
    }
  }

  /**
   * Delete turn (soft delete)
   */
  async deleteTurn(id: number): Promise<ApiResponse> {
    try {
      const existingTurn = await prisma.turno.findUnique({
        where: { tur_codigo: id }
      });

      if (!existingTurn) {
        throw new CustomError('Turn not found', 404);
      }

      await prisma.turno.update({
        where: { tur_codigo: id },
        data: { flg_del: 0 }
      });

      return {
        success: true,
        message: 'Turn deleted successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete turn', 500);
    }
  }

  /**
   * Start turn
   */
  async startTurn(turnId: number, userId: number): Promise<ApiResponse> {
    try {
      const turn = await prisma.turno.findUnique({
        where: { tur_codigo: turnId }
      });

      if (!turn) {
        throw new CustomError('Turn not found', 404);
      }

      // Check if there's already an active turn
      const activeTurn = await prisma.turno.findFirst({
        where: {
          tur_activo: 1,
          flg_del: 1
        }
      });

      if (activeTurn) {
        throw new CustomError('There is already an active turn', 400);
      }

      const updatedTurn = await prisma.turno.update({
        where: { tur_codigo: turnId },
        data: {
          tur_activo: 1,
          tur_fecha_inicio: new Date(),
          usu_codigo_inicio: userId
        }
      });

      return {
        success: true,
        data: updatedTurn,
        message: 'Turn started successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to start turn', 500);
    }
  }

  /**
   * End turn
   */
  async endTurn(turnId: number, userId: number): Promise<ApiResponse> {
    try {
      const turn = await prisma.turno.findUnique({
        where: { tur_codigo: turnId }
      });

      if (!turn) {
        throw new CustomError('Turn not found', 404);
      }

      if (!turn.tur_activo) {
        throw new CustomError('Turn is not active', 400);
      }

      const updatedTurn = await prisma.turno.update({
        where: { tur_codigo: turnId },
        data: {
          tur_activo: 0,
          tur_fecha_fin: new Date(),
          usu_codigo_fin: userId
        }
      });

      return {
        success: true,
        data: updatedTurn,
        message: 'Turn ended successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to end turn', 500);
    }
  }

  /**
   * Get current active turn
   */
  async getCurrentTurn(): Promise<ApiResponse> {
    try {
      const currentTurn = await prisma.turno.findFirst({
        where: {
          tur_activo: 1,
          flg_del: 1
        }
      });

      if (!currentTurn) {
        return {
          success: true,
          data: null,
          message: 'No active turn found'
        };
      }

      return {
        success: true,
        data: currentTurn,
        message: 'Current turn retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve current turn', 500);
    }
  }

  /**
   * Get turn statistics
   */
  async getTurnStats(turnId: number): Promise<ApiResponse> {
    try {
      const turn = await prisma.turno.findUnique({
        where: { tur_codigo: turnId }
      });

      if (!turn) {
        throw new CustomError('Turn not found', 404);
      }

      // Get orders for this turn
      const orders = await prisma.orden.findMany({
        where: {
          tur_codigo: turnId,
          flg_del: 1
        },
        include: {
          ordenproducto: {
            where: { flg_del: 1 }
          }
        }
      });

      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.ord_total || 0), 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Get order status breakdown
      const statusBreakdown = orders.reduce((acc, order) => {
        acc[order.ord_estado] = (acc[order.ord_estado] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get product sales
      const productSales = orders.flatMap(order => 
        order.ordenproducto.map(op => ({
          producto_id: op.pla_codigo || op.beb_codigo,
          tipo: op.pla_codigo ? 'plato' : 'bebida',
          cantidad: op.orp_cantidad,
          subtotal: op.orp_subtotal
        }))
      );

      const productStats = productSales.reduce((acc, product) => {
        const key = `${product.tipo}_${product.producto_id}`;
        if (!acc[key]) {
          acc[key] = {
            producto_id: product.producto_id,
            tipo: product.tipo,
            cantidad: 0,
            subtotal: 0
          };
        }
        acc[key].cantidad += product.cantidad;
        acc[key].subtotal += product.subtotal;
        return acc;
      }, {} as Record<string, any>);

      const stats = {
        turn: turn,
        totalOrders,
        totalRevenue,
        averageOrderValue,
        statusBreakdown,
        productStats: Object.values(productStats),
        duration: turn.tur_fecha_inicio && turn.tur_fecha_fin 
          ? Math.round((turn.tur_fecha_fin.getTime() - turn.tur_fecha_inicio.getTime()) / (1000 * 60)) // minutes
          : null
      };

      return {
        success: true,
        data: stats,
        message: 'Turn statistics retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve turn statistics', 500);
    }
  }
}

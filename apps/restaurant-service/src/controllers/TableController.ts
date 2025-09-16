/**
 * @fileoverview Table controller for managing restaurant tables
 */

import { 
  prisma
} from '@tovocl/database';
import { 
  ApiResponse, 
  PaginatedResponse 
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';

export class TableController {
  /**
   * Get all tables with pagination and filters
   */
  async getTables(
    page: number = 1, 
    limit: number = 10, 
    status?: string, 
    categoria?: number, 
    search?: string
  ): Promise<ApiResponse<PaginatedResponse>> {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = { flg_del: 1 };
      
      if (status) {
        whereClause.mesa_estado = status;
      }
      
      if (categoria) {
        whereClause.cat_codigo = categoria;
      }
      
      if (search) {
        whereClause.OR = [
          { mesa_nombre: { contains: search } },
          { mesa_ubicacion: { contains: search } }
        ];
      }

      const [tables, total] = await Promise.all([
        prisma.mesa.findMany({
          where: whereClause,
          include: {
            categoria: true,
            usuario: {
              select: {
                usu_codigo: true,
                usu_nombre: true,
                usu_apellidopat: true,
                usu_apellidomat: true
              }
            },
            ordenes: {
              where: { flg_del: 1 },
              select: {
                ord_codigo: true,
                ord_estado: true,
                ord_fecha: true,
                ord_total: true
              },
              orderBy: { ord_fecha: 'desc' },
              take: 5
            }
          },
          skip,
          take: limit,
          orderBy: { mesa_nombre: 'asc' }
        }),
        prisma.mesa.count({
          where: whereClause
        })
      ]);

      return {
        success: true,
        data: {
          data: tables,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
        message: 'Tables retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve tables', 500);
    }
  }

  /**
   * Get table by ID
   */
  async getTableById(id: number): Promise<ApiResponse> {
    try {
      const table = await prisma.mesa.findUnique({
        where: { mesa_codigo: id },
        include: {
          categoria: true,
          usuario: {
            select: {
              usu_codigo: true,
              usu_nombre: true,
              usu_apellidopat: true,
              usu_apellidomat: true
            }
          },
          ordenes: {
            where: { flg_del: 1 },
            include: {
              ordenproducto: {
                include: {
                  plato: true,
                  bebida: true
                }
              }
            },
            orderBy: { ord_fecha: 'desc' }
          }
        }
      });

      if (!table || table.flg_del !== 1) {
        throw new CustomError('Table not found', 404);
      }

      return {
        success: true,
        data: table,
        message: 'Table retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve table', 500);
    }
  }

  /**
   * Create new table
   */
  async createTable(tableData: {
    mesa_nombre: string;
    mesa_capacidad: number;
    cat_codigo: number;
    mesa_ubicacion?: string;
  }): Promise<ApiResponse> {
    try {
      const { mesa_nombre, mesa_capacidad, cat_codigo, mesa_ubicacion } = tableData;

      // Verify category exists
      const category = await prisma.categoriaMesa.findUnique({
        where: { cat_codigo: cat_codigo }
      });

      if (!category) {
        throw new CustomError('Table category not found', 404);
      }

      const table = await prisma.mesa.create({
        data: {
          mesa_nombre,
          mesa_capacidad,
          cat_codigo,
          mesa_ubicacion: mesa_ubicacion || '',
          mesa_estado: 'disponible',
          flg_del: 1
        },
        include: {
          categoria: true
        }
      });

      return {
        success: true,
        data: table,
        message: 'Table created successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to create table', 500);
    }
  }

  /**
   * Update table
   */
  async updateTable(id: number, tableData: any): Promise<ApiResponse> {
    try {
      const existingTable = await prisma.mesa.findUnique({
        where: { mesa_codigo: id }
      });

      if (!existingTable) {
        throw new CustomError('Table not found', 404);
      }

      // Verify category exists if being updated
      if (tableData.cat_codigo) {
        const category = await prisma.categoriaMesa.findUnique({
          where: { cat_codigo: tableData.cat_codigo }
        });

        if (!category) {
          throw new CustomError('Table category not found', 404);
        }
      }

      const table = await prisma.mesa.update({
        where: { mesa_codigo: id },
        data: tableData,
        include: {
          categoria: true,
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
        data: table,
        message: 'Table updated successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update table', 500);
    }
  }

  /**
   * Delete table (soft delete)
   */
  async deleteTable(id: number): Promise<ApiResponse> {
    try {
      const existingTable = await prisma.mesa.findUnique({
        where: { mesa_codigo: id }
      });

      if (!existingTable) {
        throw new CustomError('Table not found', 404);
      }

      await prisma.mesa.update({
        where: { mesa_codigo: id },
        data: { flg_del: 0 }
      });

      return {
        success: true,
        message: 'Table deleted successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete table', 500);
    }
  }

  /**
   * Assign table to waiter
   */
  async assignTable(tableId: number, waiterId: number): Promise<ApiResponse> {
    try {
      // Verify table exists
      const table = await prisma.mesa.findUnique({
        where: { mesa_codigo: tableId }
      });

      if (!table) {
        throw new CustomError('Table not found', 404);
      }

      // Verify waiter exists
      const waiter = await prisma.usuario.findUnique({
        where: { usu_codigo: waiterId }
      });

      if (!waiter) {
        throw new CustomError('Waiter not found', 404);
      }

      const updatedTable = await prisma.mesa.update({
        where: { mesa_codigo: tableId },
        data: { usu_codigo: waiterId },
        include: {
          categoria: true,
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
        data: updatedTable,
        message: 'Table assigned to waiter successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to assign table', 500);
    }
  }

  /**
   * Update table status
   */
  async updateTableStatus(tableId: number, status: string): Promise<ApiResponse> {
    try {
      const validStatuses = ['disponible', 'ocupada', 'reservada', 'mantenimiento'];
      
      if (!validStatuses.includes(status)) {
        throw new CustomError('Invalid table status', 400);
      }

      const table = await prisma.mesa.findUnique({
        where: { mesa_codigo: tableId }
      });

      if (!table) {
        throw new CustomError('Table not found', 404);
      }

      const updatedTable = await prisma.mesa.update({
        where: { mesa_codigo: tableId },
        data: { mesa_estado: status },
        include: {
          categoria: true,
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
        data: updatedTable,
        message: 'Table status updated successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update table status', 500);
    }
  }

  /**
   * Get table orders
   */
  async getTableOrders(
    tableId: number, 
    status?: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<ApiResponse<PaginatedResponse>> {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = {
        mesa_codigo: tableId,
        flg_del: 1
      };
      
      if (status) {
        whereClause.ord_estado = status;
      }

      const [orders, total] = await Promise.all([
        prisma.orden.findMany({
          where: whereClause,
          include: {
            ordenproducto: {
              include: {
                plato: true,
                bebida: true
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
          orderBy: { ord_fecha: 'desc' }
        }),
        prisma.orden.count({
          where: whereClause
        })
      ]);

      return {
        success: true,
        data: {
          data: orders,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
        message: 'Table orders retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve table orders', 500);
    }
  }

  /**
   * Get table categories
   */
  async getTableCategories(): Promise<ApiResponse> {
    try {
      const categories = await prisma.categoriaMesa.findMany({
        where: { flg_del: 1 },
        orderBy: { cat_nombre: 'asc' }
      });

      return {
        success: true,
        data: categories,
        message: 'Table categories retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve table categories', 500);
    }
  }
}

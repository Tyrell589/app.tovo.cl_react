/**
 * @fileoverview Stock controller for managing inventory and stock movements
 */

import { 
  prisma
} from '@tovocl/database';
import { 
  ApiResponse, 
  PaginatedResponse 
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';

export class StockController {
  /**
   * Get stock levels for all products
   */
  async getStockLevels(
    page: number = 1, 
    limit: number = 10, 
    tipo?: string, 
    lowStock?: boolean
  ): Promise<ApiResponse<PaginatedResponse>> {
    try {
      const skip = (page - 1) * limit;
      let products: any[] = [];
      let total = 0;

      if (tipo === 'plato') {
        const [plates, plateCount] = await Promise.all([
          prisma.plato.findMany({
            where: {
              flg_del: 1,
              pla_control: 1,
              ...(lowStock && {
                OR: [
                  { pla_stocktotal: { lte: prisma.plato.fields.pla_stockminimo } },
                  { pla_stocktotal: null }
                ]
              })
            },
            include: { 
              categoria: true,
              cocina: true
            },
            skip,
            take: limit,
            orderBy: { pla_nombre: 'asc' }
          }),
          prisma.plato.count({
            where: {
              flg_del: 1,
              pla_control: 1,
              ...(lowStock && {
                OR: [
                  { pla_stocktotal: { lte: prisma.plato.fields.pla_stockminimo } },
                  { pla_stocktotal: null }
                ]
              })
            }
          })
        ]);
        products = plates;
        total = plateCount;
      } else if (tipo === 'bebida') {
        const [beverages, beverageCount] = await Promise.all([
          prisma.bebida.findMany({
            where: {
              flg_del: 1,
              beb_control: 1,
              ...(lowStock && {
                OR: [
                  { beb_stocktotal: { lte: prisma.bebida.fields.beb_stockminimo } },
                  { beb_stocktotal: null }
                ]
              })
            },
            include: { 
              categoria: true,
              cocina: true
            },
            skip,
            take: limit,
            orderBy: { beb_nombre: 'asc' }
          }),
          prisma.bebida.count({
            where: {
              flg_del: 1,
              beb_control: 1,
              ...(lowStock && {
                OR: [
                  { beb_stocktotal: { lte: prisma.bebida.fields.beb_stockminimo } },
                  { beb_stocktotal: null }
                ]
              })
            }
          })
        ]);
        products = beverages;
        total = beverageCount;
      } else if (tipo === 'ingrediente') {
        const [ingredients, ingredientCount] = await Promise.all([
          prisma.ingrediente.findMany({
            where: {
              flg_del: 1
            },
            include: {
              categoriaIngrediente: true,
              unidad: true
            },
            skip,
            take: limit,
            orderBy: { ing_nombre: 'asc' }
          }),
          prisma.ingrediente.count({
            where: { flg_del: 1 }
          })
        ]);
        products = ingredients;
        total = ingredientCount;
      } else {
        // Get all products with stock control
        const [plates, beverages, plateCount, beverageCount] = await Promise.all([
          prisma.plato.findMany({
            where: {
              flg_del: 1,
              pla_control: 1,
              ...(lowStock && {
                OR: [
                  { pla_stocktotal: { lte: prisma.plato.fields.pla_stockminimo } },
                  { pla_stocktotal: null }
                ]
              })
            },
            include: { 
              categoria: true,
              cocina: true
            },
            skip: Math.floor(skip / 2),
            take: Math.floor(limit / 2),
            orderBy: { pla_nombre: 'asc' }
          }),
          prisma.bebida.findMany({
            where: {
              flg_del: 1,
              beb_control: 1,
              ...(lowStock && {
                OR: [
                  { beb_stocktotal: { lte: prisma.bebida.fields.beb_stockminimo } },
                  { beb_stocktotal: null }
                ]
              })
            },
            include: { 
              categoria: true,
              cocina: true
            },
            skip: Math.ceil(skip / 2),
            take: Math.ceil(limit / 2),
            orderBy: { beb_nombre: 'asc' }
          }),
          prisma.plato.count({
            where: {
              flg_del: 1,
              pla_control: 1,
              ...(lowStock && {
                OR: [
                  { pla_stocktotal: { lte: prisma.plato.fields.pla_stockminimo } },
                  { pla_stocktotal: null }
                ]
              })
            }
          }),
          prisma.bebida.count({
            where: {
              flg_del: 1,
              beb_control: 1,
              ...(lowStock && {
                OR: [
                  { beb_stocktotal: { lte: prisma.bebida.fields.beb_stockminimo } },
                  { beb_stocktotal: null }
                ]
              })
            }
          })
        ]);
        products = [...plates, ...beverages];
        total = plateCount + beverageCount;
      }

      return {
        success: true,
        data: {
          data: products,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
        message: 'Stock levels retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve stock levels', 500);
    }
  }

  /**
   * Get stock level for specific product
   */
  async getProductStock(productId: number): Promise<ApiResponse> {
    try {
      // Try to find as plate first
      let product = await prisma.plato.findUnique({
        where: { pla_codigo: productId },
        include: { 
          categoria: true,
          cocina: true
        }
      });

      if (!product) {
        // Try to find as beverage
        product = await prisma.bebida.findUnique({
          where: { beb_codigo: productId },
          include: { 
            categoria: true,
            cocina: true
          }
        });
      }

      if (!product || product.flg_del !== 1) {
        throw new CustomError('Product not found', 404);
      }

      // Get recent stock movements
      const movements = await prisma.movimientoStock.findMany({
        where: {
          OR: [
            { pla_codigo: productId },
            { beb_codigo: productId }
          ],
          flg_del: 1
        },
        orderBy: { mos_fecha: 'desc' },
        take: 10
      });

      return {
        success: true,
        data: {
          product,
          movements
        },
        message: 'Product stock retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve product stock', 500);
    }
  }

  /**
   * Record stock movement
   */
  async recordStockMovement(movementData: {
    tipo: number;
    cantidad: number;
    comentario?: string;
    product_id?: number;
    ingredient_id?: number;
  }): Promise<ApiResponse> {
    try {
      const { tipo, cantidad, comentario, product_id, ingredient_id } = movementData;

      if (!product_id && !ingredient_id) {
        throw new CustomError('Product ID or Ingredient ID is required', 400);
      }

      let stockMovement;
      
      if (product_id) {
        // Record movement for product
        const product = await prisma.plato.findUnique({
          where: { pla_codigo: product_id }
        }) || await prisma.bebida.findUnique({
          where: { beb_codigo: product_id }
        });

        if (!product) {
          throw new CustomError('Product not found', 404);
        }

        // Update stock
        if (product.pla_codigo) {
          const currentStock = product.pla_stocktotal || 0;
          const newStock = tipo === 1 ? currentStock + cantidad : currentStock - cantidad;
          
          await prisma.plato.update({
            where: { pla_codigo: product_id },
            data: { pla_stocktotal: Math.max(0, newStock) }
          });
        } else if (product.beb_codigo) {
          const currentStock = product.beb_stocktotal || 0;
          const newStock = tipo === 1 ? currentStock + cantidad : currentStock - cantidad;
          
          await prisma.bebida.update({
            where: { beb_codigo: product_id },
            data: { beb_stocktotal: Math.max(0, newStock) }
          });
        }

        // Record movement
        stockMovement = await prisma.movimientoStock.create({
          data: {
            mos_tipo: tipo,
            mos_cantidad: cantidad,
            mos_comentario: comentario,
            pla_codigo: product.pla_codigo || null,
            beb_codigo: product.beb_codigo || null,
            flg_del: 1
          }
        });
      } else if (ingredient_id) {
        // Record movement for ingredient
        const ingredient = await prisma.ingrediente.findUnique({
          where: { ing_codigo: ingredient_id }
        });

        if (!ingredient) {
          throw new CustomError('Ingredient not found', 404);
        }

        // Record movement (ingredients don't have stock tracking in current schema)
        stockMovement = await prisma.movimientoStock.create({
          data: {
            mos_tipo: tipo,
            mos_cantidad: cantidad,
            mos_comentario: comentario,
            ing_codigo: ingredient_id,
            flg_del: 1
          }
        });
      }

      return {
        success: true,
        data: stockMovement,
        message: 'Stock movement recorded successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to record stock movement', 500);
    }
  }

  /**
   * Get stock movement history
   */
  async getStockMovements(
    page: number = 1,
    limit: number = 10,
    productId?: number,
    tipo?: number,
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<ApiResponse<PaginatedResponse>> {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = { flg_del: 1 };
      
      if (productId) {
        whereClause.OR = [
          { pla_codigo: productId },
          { beb_codigo: productId }
        ];
      }
      
      if (tipo) {
        whereClause.mos_tipo = tipo;
      }
      
      if (fechaInicio && fechaFin) {
        whereClause.mos_fecha = {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
        };
      }

      const [movements, total] = await Promise.all([
        prisma.movimientoStock.findMany({
          where: whereClause,
          include: {
            plato: {
              include: { categoria: true }
            },
            bebida: {
              include: { categoria: true }
            },
            ingrediente: {
              include: { categoriaIngrediente: true, unidad: true }
            }
          },
          skip,
          take: limit,
          orderBy: { mos_fecha: 'desc' }
        }),
        prisma.movimientoStock.count({
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
        message: 'Stock movements retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve stock movements', 500);
    }
  }

  /**
   * Adjust stock level
   */
  async adjustStock(adjustmentData: {
    product_id?: number;
    ingredient_id?: number;
    cantidad_actual: number;
    comentario?: string;
  }): Promise<ApiResponse> {
    try {
      const { product_id, ingredient_id, cantidad_actual, comentario } = adjustmentData;

      if (!product_id && !ingredient_id) {
        throw new CustomError('Product ID or Ingredient ID is required', 400);
      }

      let stockMovement;
      
      if (product_id) {
        // Adjust stock for product
        const product = await prisma.plato.findUnique({
          where: { pla_codigo: product_id }
        }) || await prisma.bebida.findUnique({
          where: { beb_codigo: product_id }
        });

        if (!product) {
          throw new CustomError('Product not found', 404);
        }

        const currentStock = product.pla_stocktotal || product.beb_stocktotal || 0;
        const difference = cantidad_actual - currentStock;
        const tipo = difference > 0 ? 1 : 2; // 1 = in, 2 = out

        // Update stock
        if (product.pla_codigo) {
          await prisma.plato.update({
            where: { pla_codigo: product_id },
            data: { pla_stocktotal: cantidad_actual }
          });
        } else if (product.beb_codigo) {
          await prisma.bebida.update({
            where: { beb_codigo: product_id },
            data: { beb_stocktotal: cantidad_actual }
          });
        }

        // Record adjustment movement
        stockMovement = await prisma.movimientoStock.create({
          data: {
            mos_tipo: tipo,
            mos_cantidad: Math.abs(difference),
            mos_comentario: comentario || 'Stock adjustment',
            pla_codigo: product.pla_codigo || null,
            beb_codigo: product.beb_codigo || null,
            flg_del: 1
          }
        });
      } else if (ingredient_id) {
        // Record adjustment for ingredient
        const ingredient = await prisma.ingrediente.findUnique({
          where: { ing_codigo: ingredient_id }
        });

        if (!ingredient) {
          throw new CustomError('Ingredient not found', 404);
        }

        // Record adjustment movement
        stockMovement = await prisma.movimientoStock.create({
          data: {
            mos_tipo: 1, // Adjustment is always considered as "in"
            mos_cantidad: cantidad_actual,
            mos_comentario: comentario || 'Stock adjustment',
            ing_codigo: ingredient_id,
            flg_del: 1
          }
        });
      }

      return {
        success: true,
        data: stockMovement,
        message: 'Stock adjusted successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to adjust stock', 500);
    }
  }

  /**
   * Get low stock report
   */
  async getLowStockReport(): Promise<ApiResponse> {
    try {
      const [lowStockPlates, lowStockBeverages] = await Promise.all([
        prisma.plato.findMany({
          where: {
            flg_del: 1,
            pla_control: 1,
            OR: [
              { pla_stocktotal: { lte: prisma.plato.fields.pla_stockminimo } },
              { pla_stocktotal: null }
            ]
          },
          include: { 
            categoria: true,
            cocina: true
          },
          orderBy: { pla_nombre: 'asc' }
        }),
        prisma.bebida.findMany({
          where: {
            flg_del: 1,
            beb_control: 1,
            OR: [
              { beb_stocktotal: { lte: prisma.bebida.fields.beb_stockminimo } },
              { beb_stocktotal: null }
            ]
          },
          include: { 
            categoria: true,
            cocina: true
          },
          orderBy: { beb_nombre: 'asc' }
        })
      ]);

      const lowStockProducts = [...lowStockPlates, ...lowStockBeverages];

      return {
        success: true,
        data: {
          products: lowStockProducts,
          total: lowStockProducts.length,
          plates: lowStockPlates.length,
          beverages: lowStockBeverages.length
        },
        message: 'Low stock report generated successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to generate low stock report', 500);
    }
  }

  /**
   * Get stock value report
   */
  async getStockValueReport(): Promise<ApiResponse> {
    try {
      const [plates, beverages] = await Promise.all([
        prisma.plato.findMany({
          where: {
            flg_del: 1,
            pla_control: 1
          },
          select: {
            pla_codigo: true,
            pla_nombre: true,
            pla_stocktotal: true,
            pla_costo: true
          }
        }),
        prisma.bebida.findMany({
          where: {
            flg_del: 1,
            beb_control: 1
          },
          select: {
            beb_codigo: true,
            beb_nombre: true,
            beb_stocktotal: true,
            beb_costo: true
          }
        })
      ]);

      let totalValue = 0;
      const products = [];

      // Calculate value for plates
      for (const plate of plates) {
        const stock = plate.pla_stocktotal || 0;
        const cost = plate.pla_costo || 0;
        const value = stock * cost;
        totalValue += value;
        
        products.push({
          id: plate.pla_codigo,
          nombre: plate.pla_nombre,
          stock: stock,
          costo: cost,
          valor: value,
          tipo: 'plato'
        });
      }

      // Calculate value for beverages
      for (const beverage of beverages) {
        const stock = beverage.beb_stocktotal || 0;
        const cost = beverage.beb_costo || 0;
        const value = stock * cost;
        totalValue += value;
        
        products.push({
          id: beverage.beb_codigo,
          nombre: beverage.beb_nombre,
          stock: stock,
          costo: cost,
          valor: value,
          tipo: 'bebida'
        });
      }

      return {
        success: true,
        data: {
          products,
          totalValue,
          totalProducts: products.length,
          plates: plates.length,
          beverages: beverages.length
        },
        message: 'Stock value report generated successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to generate stock value report', 500);
    }
  }
}

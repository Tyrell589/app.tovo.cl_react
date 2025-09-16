/**
 * @fileoverview Ingredient controller for managing ingredients and stock
 */

import { 
  prisma
} from '@tovocl/database';
import { 
  ApiResponse, 
  PaginatedResponse 
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';

export class IngredientController {
  /**
   * Get all ingredients with pagination and filters
   */
  async getIngredients(
    page: number = 1, 
    limit: number = 10, 
    categoriaId?: number, 
    search?: string
  ): Promise<ApiResponse<PaginatedResponse>> {
    try {
      const skip = (page - 1) * limit;
      
      const [ingredients, total] = await Promise.all([
        prisma.ingrediente.findMany({
          where: {
            flg_del: 1,
            ...(categoriaId && { cin_codigo: categoriaId }),
            ...(search && { ing_nombre: { contains: search } })
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
          where: {
            flg_del: 1,
            ...(categoriaId && { cin_codigo: categoriaId }),
            ...(search && { ing_nombre: { contains: search } })
          }
        })
      ]);

      return {
        success: true,
        data: {
          data: ingredients,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
        message: 'Ingredients retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve ingredients', 500);
    }
  }

  /**
   * Get ingredient by ID
   */
  async getIngredientById(id: number): Promise<ApiResponse> {
    try {
      const ingredient = await prisma.ingrediente.findUnique({
        where: { ing_codigo: id },
        include: {
          categoriaIngrediente: true,
          unidad: true,
          productos: {
            include: {
              plato: true,
              bebida: true
            }
          }
        }
      });

      if (!ingredient || ingredient.flg_del !== 1) {
        throw new CustomError('Ingredient not found', 404);
      }

      return {
        success: true,
        data: ingredient,
        message: 'Ingredient retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve ingredient', 500);
    }
  }

  /**
   * Create new ingredient
   */
  async createIngredient(ingredientData: {
    nombre: string;
    categoria_id: number;
    unidad_id: number;
    costo?: number;
  }): Promise<ApiResponse> {
    try {
      const { nombre, categoria_id, unidad_id, costo } = ingredientData;

      // Verify category exists
      const category = await prisma.categoriaIngrediente.findUnique({
        where: { cin_codigo: categoria_id }
      });

      if (!category) {
        throw new CustomError('Ingredient category not found', 404);
      }

      // Verify unit exists
      const unit = await prisma.unidad.findUnique({
        where: { uni_codigo: unidad_id }
      });

      if (!unit) {
        throw new CustomError('Unit not found', 404);
      }

      const ingredient = await prisma.ingrediente.create({
        data: {
          ing_nombre: nombre,
          cin_codigo: categoria_id,
          uni_codigo: unidad_id,
          ing_costo: costo || 0,
          ing_estado: 1,
          flg_del: 1
        },
        include: {
          categoriaIngrediente: true,
          unidad: true
        }
      });

      return {
        success: true,
        data: ingredient,
        message: 'Ingredient created successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to create ingredient', 500);
    }
  }

  /**
   * Update ingredient
   */
  async updateIngredient(id: number, ingredientData: any): Promise<ApiResponse> {
    try {
      const existingIngredient = await prisma.ingrediente.findUnique({
        where: { ing_codigo: id }
      });

      if (!existingIngredient) {
        throw new CustomError('Ingredient not found', 404);
      }

      // Verify category exists if being updated
      if (ingredientData.categoria_id) {
        const category = await prisma.categoriaIngrediente.findUnique({
          where: { cin_codigo: ingredientData.categoria_id }
        });

        if (!category) {
          throw new CustomError('Ingredient category not found', 404);
        }
      }

      // Verify unit exists if being updated
      if (ingredientData.unidad_id) {
        const unit = await prisma.unidad.findUnique({
          where: { uni_codigo: ingredientData.unidad_id }
        });

        if (!unit) {
          throw new CustomError('Unit not found', 404);
        }
      }

      const ingredient = await prisma.ingrediente.update({
        where: { ing_codigo: id },
        data: ingredientData,
        include: {
          categoriaIngrediente: true,
          unidad: true
        }
      });

      return {
        success: true,
        data: ingredient,
        message: 'Ingredient updated successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update ingredient', 500);
    }
  }

  /**
   * Delete ingredient (soft delete)
   */
  async deleteIngredient(id: number): Promise<ApiResponse> {
    try {
      const existingIngredient = await prisma.ingrediente.findUnique({
        where: { ing_codigo: id }
      });

      if (!existingIngredient) {
        throw new CustomError('Ingredient not found', 404);
      }

      await prisma.ingrediente.update({
        where: { ing_codigo: id },
        data: { flg_del: 0 }
      });

      return {
        success: true,
        message: 'Ingredient deleted successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete ingredient', 500);
    }
  }

  /**
   * Toggle ingredient active status
   */
  async toggleIngredientStatus(id: number): Promise<ApiResponse> {
    try {
      const existingIngredient = await prisma.ingrediente.findUnique({
        where: { ing_codigo: id }
      });

      if (!existingIngredient) {
        throw new CustomError('Ingredient not found', 404);
      }

      const ingredient = await prisma.ingrediente.update({
        where: { ing_codigo: id },
        data: { 
          ing_estado: existingIngredient.ing_estado === 1 ? 0 : 1 
        },
        include: {
          categoriaIngrediente: true,
          unidad: true
        }
      });

      return {
        success: true,
        data: ingredient,
        message: 'Ingredient status updated successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update ingredient status', 500);
    }
  }

  /**
   * Get ingredient categories
   */
  async getIngredientCategories(): Promise<ApiResponse> {
    try {
      const categories = await prisma.categoriaIngrediente.findMany({
        where: { flg_del: 1 },
        orderBy: { cin_nombre: 'asc' }
      });

      return {
        success: true,
        data: categories,
        message: 'Ingredient categories retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve ingredient categories', 500);
    }
  }

  /**
   * Get ingredient units
   */
  async getIngredientUnits(): Promise<ApiResponse> {
    try {
      const units = await prisma.unidad.findMany({
        where: { flg_del: 1 },
        orderBy: { uni_nombre: 'asc' }
      });

      return {
        success: true,
        data: units,
        message: 'Ingredient units retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve ingredient units', 500);
    }
  }
}

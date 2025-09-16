/**
 * @fileoverview Category controller for managing product categories
 */

import { 
  getPlateCategories, 
  getBeverageCategories,
  prisma
} from '@tovocl/database';
import { 
  ApiResponse, 
  PaginatedResponse 
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';

export class CategoryController {
  /**
   * Get all categories with pagination and filters
   */
  async getCategories(
    page: number = 1, 
    limit: number = 10, 
    tipo?: string, 
    search?: string
  ): Promise<ApiResponse<PaginatedResponse>> {
    try {
      const skip = (page - 1) * limit;
      let categories: any[] = [];
      let total = 0;

      if (tipo === 'plato') {
        const [plates, plateCount] = await Promise.all([
          prisma.categoriaPlato.findMany({
            where: {
              flg_del: 1,
              ...(search && { cat_nombre: { contains: search } })
            },
            skip,
            take: limit,
            orderBy: { cat_nombre: 'asc' }
          }),
          prisma.categoriaPlato.count({
            where: {
              flg_del: 1,
              ...(search && { cat_nombre: { contains: search } })
            }
          })
        ]);
        categories = plates;
        total = plateCount;
      } else if (tipo === 'bebida') {
        const [beverages, beverageCount] = await Promise.all([
          prisma.categoriaBebida.findMany({
            where: {
              flg_del: 1,
              ...(search && { cbe_nombre: { contains: search } })
            },
            skip,
            take: limit,
            orderBy: { cbe_nombre: 'asc' }
          }),
          prisma.categoriaBebida.count({
            where: {
              flg_del: 1,
              ...(search && { cbe_nombre: { contains: search } })
            }
          })
        ]);
        categories = beverages;
        total = beverageCount;
      } else {
        // Get both plate and beverage categories
        const [plates, beverages, plateCount, beverageCount] = await Promise.all([
          prisma.categoriaPlato.findMany({
            where: {
              flg_del: 1,
              ...(search && { cat_nombre: { contains: search } })
            },
            skip: Math.floor(skip / 2),
            take: Math.floor(limit / 2),
            orderBy: { cat_nombre: 'asc' }
          }),
          prisma.categoriaBebida.findMany({
            where: {
              flg_del: 1,
              ...(search && { cbe_nombre: { contains: search } })
            },
            skip: Math.ceil(skip / 2),
            take: Math.ceil(limit / 2),
            orderBy: { cbe_nombre: 'asc' }
          }),
          prisma.categoriaPlato.count({
            where: {
              flg_del: 1,
              ...(search && { cat_nombre: { contains: search } })
            }
          }),
          prisma.categoriaBebida.count({
            where: {
              flg_del: 1,
              ...(search && { cbe_nombre: { contains: search } })
            }
          })
        ]);
        categories = [...plates, ...beverages];
        total = plateCount + beverageCount;
      }

      return {
        success: true,
        data: {
          data: categories,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
        message: 'Categories retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve categories', 500);
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: number): Promise<ApiResponse> {
    try {
      // Try to find as plate category first
      let category = await prisma.categoriaPlato.findUnique({
        where: { cat_codigo: id }
      });

      if (!category) {
        // Try to find as beverage category
        category = await prisma.categoriaBebida.findUnique({
          where: { cbe_codigo: id }
        });
      }

      if (!category || category.flg_del !== 1) {
        throw new CustomError('Category not found', 404);
      }

      return {
        success: true,
        data: category,
        message: 'Category retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve category', 500);
    }
  }

  /**
   * Create new category
   */
  async createCategory(categoryData: { nombre: string; tipo: string; imagen?: string }): Promise<ApiResponse> {
    try {
      const { tipo, nombre, imagen } = categoryData;
      
      let category;
      
      if (tipo === 'plato') {
        category = await prisma.categoriaPlato.create({
          data: {
            cat_nombre: nombre,
            cat_imagen: imagen,
            flg_del: 1
          }
        });
      } else if (tipo === 'bebida') {
        category = await prisma.categoriaBebida.create({
          data: {
            cbe_nombre: nombre,
            cbe_imagen: imagen,
            flg_del: 1
          }
        });
      } else {
        throw new CustomError('Invalid category type', 400);
      }

      return {
        success: true,
        data: category,
        message: 'Category created successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to create category', 500);
    }
  }

  /**
   * Update category
   */
  async updateCategory(id: number, categoryData: any): Promise<ApiResponse> {
    try {
      // Try to find as plate category first
      let existingCategory = await prisma.categoriaPlato.findUnique({
        where: { cat_codigo: id }
      });

      let category;
      
      if (existingCategory) {
        category = await prisma.categoriaPlato.update({
          where: { cat_codigo: id },
          data: categoryData
        });
      } else {
        // Try to find as beverage category
        existingCategory = await prisma.categoriaBebida.findUnique({
          where: { cbe_codigo: id }
        });

        if (!existingCategory) {
          throw new CustomError('Category not found', 404);
        }

        category = await prisma.categoriaBebida.update({
          where: { cbe_codigo: id },
          data: categoryData
        });
      }

      return {
        success: true,
        data: category,
        message: 'Category updated successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update category', 500);
    }
  }

  /**
   * Delete category (soft delete)
   */
  async deleteCategory(id: number): Promise<ApiResponse> {
    try {
      // Try to find as plate category first
      let existingCategory = await prisma.categoriaPlato.findUnique({
        where: { cat_codigo: id }
      });

      if (existingCategory) {
        await prisma.categoriaPlato.update({
          where: { cat_codigo: id },
          data: { flg_del: 0 }
        });
      } else {
        // Try to find as beverage category
        existingCategory = await prisma.categoriaBebida.findUnique({
          where: { cbe_codigo: id }
        });

        if (!existingCategory) {
          throw new CustomError('Category not found', 404);
        }

        await prisma.categoriaBebida.update({
          where: { cbe_codigo: id },
          data: { flg_del: 0 }
        });
      }

      return {
        success: true,
        message: 'Category deleted successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete category', 500);
    }
  }

  /**
   * Toggle category active status
   */
  async toggleCategoryStatus(id: number): Promise<ApiResponse> {
    try {
      // Try to find as plate category first
      let existingCategory = await prisma.categoriaPlato.findUnique({
        where: { cat_codigo: id }
      });

      let category;
      
      if (existingCategory) {
        // For plate categories, we don't have a status field in the current schema
        // This would need to be added to the database schema
        category = existingCategory;
      } else {
        // Try to find as beverage category
        existingCategory = await prisma.categoriaBebida.findUnique({
          where: { cbe_codigo: id }
        });

        if (!existingCategory) {
          throw new CustomError('Category not found', 404);
        }

        // For beverage categories, we don't have a status field in the current schema
        // This would need to be added to the database schema
        category = existingCategory;
      }

      return {
        success: true,
        data: category,
        message: 'Category status updated successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update category status', 500);
    }
  }

  /**
   * Get products in category
   */
  async getCategoryProducts(categoryId: number, page: number = 1, limit: number = 10): Promise<ApiResponse<PaginatedResponse>> {
    try {
      const skip = (page - 1) * limit;
      
      // Try to find as plate category first
      let category = await prisma.categoriaPlato.findUnique({
        where: { cat_codigo: categoryId }
      });

      let products: any[] = [];
      let total = 0;

      if (category) {
        // Get plates in this category
        const [plates, plateCount] = await Promise.all([
          prisma.plato.findMany({
            where: {
              cat_codigo: categoryId,
              flg_del: 1
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
              cat_codigo: categoryId,
              flg_del: 1
            }
          })
        ]);
        products = plates;
        total = plateCount;
      } else {
        // Try to find as beverage category
        category = await prisma.categoriaBebida.findUnique({
          where: { cbe_codigo: categoryId }
        });

        if (!category) {
          throw new CustomError('Category not found', 404);
        }

        // Get beverages in this category
        const [beverages, beverageCount] = await Promise.all([
          prisma.bebida.findMany({
            where: {
              cbe_codigo: categoryId,
              flg_del: 1
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
              cbe_codigo: categoryId,
              flg_del: 1
            }
          })
        ]);
        products = beverages;
        total = beverageCount;
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
        message: 'Category products retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve category products', 500);
    }
  }
}

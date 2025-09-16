/**
 * @fileoverview Product controller for CRUD operations on plates and beverages
 */

import { 
  getPlates, 
  getBeverages,
  prisma
} from '@tovocl/database';
import { 
  ApiResponse, 
  PaginatedResponse,
  Plato,
  Bebida,
  CreateProductRequest 
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';

export class ProductController {
  /**
   * Get all products with pagination and filters
   */
  async getProducts(
    page: number = 1, 
    limit: number = 10, 
    tipo?: string, 
    categoria?: number, 
    search?: string
  ): Promise<ApiResponse<PaginatedResponse>> {
    try {
      const skip = (page - 1) * limit;
      let whereClause: any = { flg_del: 1 };

      // Apply filters
      if (tipo === 'plato') {
        whereClause.pla_codigo = { not: null };
      } else if (tipo === 'bebida') {
        whereClause.beb_codigo = { not: null };
      }

      if (categoria) {
        if (tipo === 'plato') {
          whereClause.cat_codigo = categoria;
        } else if (tipo === 'bebida') {
          whereClause.cbe_codigo = categoria;
        }
      }

      if (search) {
        whereClause.OR = [
          { pla_nombre: { contains: search } },
          { beb_nombre: { contains: search } }
        ];
      }

      // Get products based on type
      let products: any[] = [];
      let total = 0;

      if (tipo === 'plato') {
        const [plates, plateCount] = await Promise.all([
          prisma.plato.findMany({
            where: {
              flg_del: 1,
              ...(categoria && { cat_codigo: categoria }),
              ...(search && { pla_nombre: { contains: search } })
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
              ...(categoria && { cat_codigo: categoria }),
              ...(search && { pla_nombre: { contains: search } })
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
              ...(categoria && { cbe_codigo: categoria }),
              ...(search && { beb_nombre: { contains: search } })
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
              ...(categoria && { cbe_codigo: categoria }),
              ...(search && { beb_nombre: { contains: search } })
            }
          })
        ]);
        products = beverages;
        total = beverageCount;
      } else {
        // Get both plates and beverages
        const [plates, beverages, plateCount, beverageCount] = await Promise.all([
          prisma.plato.findMany({
            where: {
              flg_del: 1,
              ...(categoria && { cat_codigo: categoria }),
              ...(search && { pla_nombre: { contains: search } })
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
              ...(categoria && { cbe_codigo: categoria }),
              ...(search && { beb_nombre: { contains: search } })
            },
            include: { 
              categoria: true,
              cocina: true
            },
            skip: Math.floor(skip / 2),
            take: Math.ceil(limit / 2),
            orderBy: { beb_nombre: 'asc' }
          }),
          prisma.plato.count({
            where: {
              flg_del: 1,
              ...(categoria && { cat_codigo: categoria }),
              ...(search && { pla_nombre: { contains: search } })
            }
          }),
          prisma.bebida.count({
            where: {
              flg_del: 1,
              ...(categoria && { cbe_codigo: categoria }),
              ...(search && { beb_nombre: { contains: search } })
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
        message: 'Products retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve products', 500);
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(id: number): Promise<ApiResponse> {
    try {
      // Try to find as plate first
      let product = await prisma.plato.findUnique({
        where: { pla_codigo: id },
        include: { 
          categoria: true,
          cocina: true,
          ingredientes: {
            include: {
              ingrediente: true
            }
          }
        }
      });

      if (!product) {
        // Try to find as beverage
        product = await prisma.bebida.findUnique({
          where: { beb_codigo: id },
          include: { 
            categoria: true,
            cocina: true,
            ingredientes: {
              include: {
                ingrediente: true
              }
            }
          }
        });
      }

      if (!product || product.flg_del !== 1) {
        throw new CustomError('Product not found', 404);
      }

      return {
        success: true,
        data: product,
        message: 'Product retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve product', 500);
    }
  }

  /**
   * Create new product
   */
  async createProduct(productData: CreateProductRequest & { tipo: string }): Promise<ApiResponse> {
    try {
      const { tipo, categoria, ...data } = productData;
      
      let product;
      
      if (tipo === 'plato') {
        product = await prisma.plato.create({
          data: {
            cat_codigo: categoria,
            pla_nombre: data.nombre,
            pla_descripcion: data.descripcion,
            pla_precio: data.precio,
            pla_costo: data.costo || 0,
            pla_imagen: data.imagen,
            pla_stockminimo: data.stockminimo || 0,
            pla_control: data.control || 0,
            pla_estado: 1,
            pla_vender: 1,
            pla_cocina: 1,
            pla_menu: 1,
            pla_menuqr: 1,
            pla_favorito: 0,
            flg_del: 1
          },
          include: { categoria: true, cocina: true }
        });
      } else if (tipo === 'bebida') {
        product = await prisma.bebida.create({
          data: {
            cbe_codigo: categoria,
            beb_nombre: data.nombre,
            beb_descripcion: data.descripcion,
            beb_precio: data.precio,
            beb_costo: data.costo || 0,
            beb_imagen: data.imagen,
            beb_stockminimo: data.stockminimo || 0,
            beb_control: data.control || 0,
            beb_estado: 1,
            beb_vender: 1,
            beb_cocina: 1,
            beb_menu: 1,
            beb_menuqr: 1,
            beb_favorito: 0,
            flg_del: 1
          },
          include: { categoria: true, cocina: true }
        });
      } else {
        throw new CustomError('Invalid product type', 400);
      }

      return {
        success: true,
        data: product,
        message: 'Product created successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to create product', 500);
    }
  }

  /**
   * Update product
   */
  async updateProduct(id: number, productData: any): Promise<ApiResponse> {
    try {
      // Try to find as plate first
      let existingProduct = await prisma.plato.findUnique({
        where: { pla_codigo: id }
      });

      let product;
      
      if (existingProduct) {
        product = await prisma.plato.update({
          where: { pla_codigo: id },
          data: {
            ...productData,
            pla_fechamodificacion: new Date()
          },
          include: { categoria: true, cocina: true }
        });
      } else {
        // Try to find as beverage
        existingProduct = await prisma.bebida.findUnique({
          where: { beb_codigo: id }
        });

        if (!existingProduct) {
          throw new CustomError('Product not found', 404);
        }

        product = await prisma.bebida.update({
          where: { beb_codigo: id },
          data: {
            ...productData,
            beb_fechamodificacion: new Date()
          },
          include: { categoria: true, cocina: true }
        });
      }

      return {
        success: true,
        data: product,
        message: 'Product updated successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update product', 500);
    }
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(id: number): Promise<ApiResponse> {
    try {
      // Try to find as plate first
      let existingProduct = await prisma.plato.findUnique({
        where: { pla_codigo: id }
      });

      if (existingProduct) {
        await prisma.plato.update({
          where: { pla_codigo: id },
          data: { flg_del: 0 }
        });
      } else {
        // Try to find as beverage
        existingProduct = await prisma.bebida.findUnique({
          where: { beb_codigo: id }
        });

        if (!existingProduct) {
          throw new CustomError('Product not found', 404);
        }

        await prisma.bebida.update({
          where: { beb_codigo: id },
          data: { flg_del: 0 }
        });
      }

      return {
        success: true,
        message: 'Product deleted successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to delete product', 500);
    }
  }

  /**
   * Toggle product active status
   */
  async toggleProductStatus(id: number): Promise<ApiResponse> {
    try {
      // Try to find as plate first
      let existingProduct = await prisma.plato.findUnique({
        where: { pla_codigo: id }
      });

      let product;
      
      if (existingProduct) {
        product = await prisma.plato.update({
          where: { pla_codigo: id },
          data: { 
            pla_estado: existingProduct.pla_estado === 1 ? 0 : 1 
          },
          include: { categoria: true, cocina: true }
        });
      } else {
        // Try to find as beverage
        existingProduct = await prisma.bebida.findUnique({
          where: { beb_codigo: id }
        });

        if (!existingProduct) {
          throw new CustomError('Product not found', 404);
        }

        product = await prisma.bebida.update({
          where: { beb_codigo: id },
          data: { 
            beb_estado: existingProduct.beb_estado === 1 ? 0 : 1 
          },
          include: { categoria: true, cocina: true }
        });
      }

      return {
        success: true,
        data: product,
        message: 'Product status updated successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update product status', 500);
    }
  }

  /**
   * Get product ingredients
   */
  async getProductIngredients(productId: number): Promise<ApiResponse> {
    try {
      const ingredients = await prisma.ingredienteProducto.findMany({
        where: {
          OR: [
            { pla_codigo: productId },
            { beb_codigo: productId }
          ],
          flg_del: 1
        },
        include: {
          ingrediente: {
            include: {
              categoriaIngrediente: true,
              unidad: true
            }
          }
        }
      });

      return {
        success: true,
        data: ingredients,
        message: 'Product ingredients retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve product ingredients', 500);
    }
  }

  /**
   * Add ingredient to product
   */
  async addProductIngredient(productId: number, ingredientId: number, cantidad: number): Promise<ApiResponse> {
    try {
      // Check if product exists
      const product = await prisma.plato.findUnique({
        where: { pla_codigo: productId }
      }) || await prisma.bebida.findUnique({
        where: { beb_codigo: productId }
      });

      if (!product) {
        throw new CustomError('Product not found', 404);
      }

      // Check if ingredient exists
      const ingredient = await prisma.ingrediente.findUnique({
        where: { ing_codigo: ingredientId }
      });

      if (!ingredient) {
        throw new CustomError('Ingredient not found', 404);
      }

      // Add ingredient to product
      const productIngredient = await prisma.ingredienteProducto.create({
        data: {
          ing_codigo: ingredientId,
          pla_codigo: product.pla_codigo || null,
          beb_codigo: product.beb_codigo || null,
          ipr_cantidad: cantidad,
          flg_del: 1
        },
        include: {
          ingrediente: {
            include: {
              categoriaIngrediente: true,
              unidad: true
            }
          }
        }
      });

      return {
        success: true,
        data: productIngredient,
        message: 'Ingredient added to product successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to add ingredient to product', 500);
    }
  }

  /**
   * Remove ingredient from product
   */
  async removeProductIngredient(productId: number, ingredientId: number): Promise<ApiResponse> {
    try {
      const productIngredient = await prisma.ingredienteProducto.findFirst({
        where: {
          ing_codigo: ingredientId,
          OR: [
            { pla_codigo: productId },
            { beb_codigo: productId }
          ],
          flg_del: 1
        }
      });

      if (!productIngredient) {
        throw new CustomError('Product ingredient not found', 404);
      }

      await prisma.ingredienteProducto.update({
        where: { ipr_codigo: productIngredient.ipr_codigo },
        data: { flg_del: 0 }
      });

      return {
        success: true,
        message: 'Ingredient removed from product successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to remove ingredient from product', 500);
    }
  }
}

/**
 * @fileoverview Menu controller for online ordering
 */

import { 
  prisma
} from '@tovocl/database';
import { 
  ApiResponse, 
  PaginatedResponse 
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';

export class MenuController {
  /**
   * Get menu categories
   */
  async getCategories(): Promise<ApiResponse> {
    try {
      const [platoCategories, bebidaCategories] = await Promise.all([
        prisma.categoriaPlato.findMany({
          where: { 
            cat_estado: 1,
            flg_del: 1
          },
          orderBy: { cat_nombre: 'asc' }
        }),
        prisma.categoriaBebida.findMany({
          where: { 
            cbe_estado: 1,
            flg_del: 1
          },
          orderBy: { cbe_nombre: 'asc' }
        })
      ]);

      const categories = {
        platos: platoCategories.map(cat => ({
          id: cat.cat_codigo,
          nombre: cat.cat_nombre,
          descripcion: cat.cat_descripcion,
          tipo: 'plato',
          estado: cat.cat_estado
        })),
        bebidas: bebidaCategories.map(cat => ({
          id: cat.cbe_codigo,
          nombre: cat.cbe_nombre,
          descripcion: cat.cbe_descripcion,
          tipo: 'bebida',
          estado: cat.cbe_estado
        }))
      };

      return {
        success: true,
        data: categories,
        message: 'Categories retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve categories', 500);
    }
  }

  /**
   * Get menu products with filters
   */
  async getProducts(
    page: number = 1,
    limit: number = 20,
    categoryId?: number,
    type?: string,
    search?: string
  ): Promise<ApiResponse<PaginatedResponse>> {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = { flg_del: 1 };
      
      if (type === 'plato') {
        whereClause.pla_codigo = { not: null };
      } else if (type === 'bebida') {
        whereClause.beb_codigo = { not: null };
      }
      
      if (categoryId) {
        if (type === 'plato') {
          whereClause.cat_codigo = categoryId;
        } else if (type === 'bebida') {
          whereClause.cbe_codigo = categoryId;
        }
      }
      
      if (search) {
        whereClause.OR = [
          { pla_nombre: { contains: search } },
          { beb_nombre: { contains: search } },
          { pla_descripcion: { contains: search } },
          { beb_descripcion: { contains: search } }
        ];
      }

      // Get products from both plato and bebida tables
      const [platos, bebidas, totalPlatos, totalBebidas] = await Promise.all([
        prisma.plato.findMany({
          where: {
            ...whereClause,
            pla_codigo: { not: null }
          },
          include: {
            categoria: true
          },
          skip: type === 'bebida' ? 0 : skip,
          take: type === 'bebida' ? 0 : limit,
          orderBy: { pla_nombre: 'asc' }
        }),
        prisma.bebida.findMany({
          where: {
            ...whereClause,
            beb_codigo: { not: null }
          },
          include: {
            categoria: true
          },
          skip: type === 'plato' ? 0 : skip,
          take: type === 'plato' ? 0 : limit,
          orderBy: { beb_nombre: 'asc' }
        }),
        prisma.plato.count({
          where: {
            ...whereClause,
            pla_codigo: { not: null }
          }
        }),
        prisma.bebida.count({
          where: {
            ...whereClause,
            beb_codigo: { not: null }
          }
        })
      ]);

      const products = [
        ...platos.map(plato => ({
          id: plato.pla_codigo,
          nombre: plato.pla_nombre,
          descripcion: plato.pla_descripcion,
          precio: plato.pla_precio,
          tipo: 'plato',
          categoria: {
            id: plato.categoria?.cat_codigo,
            nombre: plato.categoria?.cat_nombre
          },
          estado: plato.pla_estado,
          imagen: plato.pla_imagen
        })),
        ...bebidas.map(bebida => ({
          id: bebida.beb_codigo,
          nombre: bebida.beb_nombre,
          descripcion: bebida.beb_descripcion,
          precio: bebida.beb_precio,
          tipo: 'bebida',
          categoria: {
            id: bebida.categoria?.cbe_codigo,
            nombre: bebida.categoria?.cbe_nombre
          },
          estado: bebida.beb_estado,
          imagen: bebida.beb_imagen
        }))
      ];

      const total = totalPlatos + totalBebidas;

      const result = {
        data: products,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };

      return {
        success: true,
        data: result,
        message: 'Products retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve products', 500);
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(productId: number): Promise<ApiResponse> {
    try {
      // Try plato first
      let product = await prisma.plato.findUnique({
        where: { pla_codigo: productId },
        include: {
          categoria: true
        }
      });

      let productData = null;
      if (product && product.flg_del === 1) {
        productData = {
          id: product.pla_codigo,
          nombre: product.pla_nombre,
          descripcion: product.pla_descripcion,
          precio: product.pla_precio,
          tipo: 'plato',
          categoria: {
            id: product.categoria?.cat_codigo,
            nombre: product.categoria?.cat_nombre
          },
          estado: product.pla_estado,
          imagen: product.pla_imagen
        };
      } else {
        // Try bebida
        const bebida = await prisma.bebida.findUnique({
          where: { beb_codigo: productId },
          include: {
            categoria: true
          }
        });

        if (bebida && bebida.flg_del === 1) {
          productData = {
            id: bebida.beb_codigo,
            nombre: bebida.beb_nombre,
            descripcion: bebida.beb_descripcion,
            precio: bebida.beb_precio,
            tipo: 'bebida',
            categoria: {
              id: bebida.categoria?.cbe_codigo,
              nombre: bebida.categoria?.cbe_nombre
            },
            estado: bebida.beb_estado,
            imagen: bebida.beb_imagen
          };
        }
      }

      if (!productData) {
        throw new CustomError('Product not found', 404);
      }

      return {
        success: true,
        data: productData,
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
   * Search products
   */
  async searchProducts(query: string, limit: number = 20): Promise<ApiResponse> {
    try {
      const whereClause: any = {
        flg_del: 1,
        OR: [
          { pla_nombre: { contains: query } },
          { beb_nombre: { contains: query } },
          { pla_descripcion: { contains: query } },
          { beb_descripcion: { contains: query } }
        ]
      };

      const [platos, bebidas] = await Promise.all([
        prisma.plato.findMany({
          where: {
            ...whereClause,
            pla_codigo: { not: null }
          },
          include: {
            categoria: true
          },
          take: Math.ceil(limit / 2),
          orderBy: { pla_nombre: 'asc' }
        }),
        prisma.bebida.findMany({
          where: {
            ...whereClause,
            beb_codigo: { not: null }
          },
          include: {
            categoria: true
          },
          take: Math.floor(limit / 2),
          orderBy: { beb_nombre: 'asc' }
        })
      ]);

      const results = [
        ...platos.map(plato => ({
          id: plato.pla_codigo,
          nombre: plato.pla_nombre,
          descripcion: plato.pla_descripcion,
          precio: plato.pla_precio,
          tipo: 'plato',
          categoria: {
            id: plato.categoria?.cat_codigo,
            nombre: plato.categoria?.cat_nombre
          },
          estado: plato.pla_estado,
          imagen: plato.pla_imagen
        })),
        ...bebidas.map(bebida => ({
          id: bebida.beb_codigo,
          nombre: bebida.beb_nombre,
          descripcion: bebida.beb_descripcion,
          precio: bebida.beb_precio,
          tipo: 'bebida',
          categoria: {
            id: bebida.categoria?.cbe_codigo,
            nombre: bebida.categoria?.cbe_nombre
          },
          estado: bebida.beb_estado,
          imagen: bebida.beb_imagen
        }))
      ];

      return {
        success: true,
        data: results,
        message: 'Search results retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to search products', 500);
    }
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit: number = 10): Promise<ApiResponse> {
    try {
      // For now, return random products as featured
      // In a real implementation, you'd have a featured flag or algorithm
      const [platos, bebidas] = await Promise.all([
        prisma.plato.findMany({
          where: {
            pla_estado: 1,
            flg_del: 1
          },
          include: {
            categoria: true
          },
          take: Math.ceil(limit / 2),
          orderBy: { pla_precio: 'desc' }
        }),
        prisma.bebida.findMany({
          where: {
            beb_estado: 1,
            flg_del: 1
          },
          include: {
            categoria: true
          },
          take: Math.floor(limit / 2),
          orderBy: { beb_precio: 'desc' }
        })
      ]);

      const featured = [
        ...platos.map(plato => ({
          id: plato.pla_codigo,
          nombre: plato.pla_nombre,
          descripcion: plato.pla_descripcion,
          precio: plato.pla_precio,
          tipo: 'plato',
          categoria: {
            id: plato.categoria?.cat_codigo,
            nombre: plato.categoria?.cat_nombre
          },
          estado: plato.pla_estado,
          imagen: plato.pla_imagen
        })),
        ...bebidas.map(bebida => ({
          id: bebida.beb_codigo,
          nombre: bebida.beb_nombre,
          descripcion: bebida.beb_descripcion,
          precio: bebida.beb_precio,
          tipo: 'bebida',
          categoria: {
            id: bebida.categoria?.cbe_codigo,
            nombre: bebida.categoria?.cbe_nombre
          },
          estado: bebida.beb_estado,
          imagen: bebida.beb_imagen
        }))
      ];

      return {
        success: true,
        data: featured,
        message: 'Featured products retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve featured products', 500);
    }
  }
}

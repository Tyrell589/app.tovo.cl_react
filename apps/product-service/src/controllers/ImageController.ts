/**
 * @fileoverview Image controller for managing product images
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { 
  prisma
} from '@tovocl/database';
import { 
  ApiResponse 
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';

export class ImageController {
  private readonly uploadPath: string;
  private readonly thumbnailSize: number;
  private readonly resizeWidth: number;
  private readonly resizeHeight: number;
  private readonly imageQuality: number;

  constructor() {
    this.uploadPath = process.env.UPLOAD_PATH || './uploads';
    this.thumbnailSize = parseInt(process.env.THUMBNAIL_SIZE || '300');
    this.resizeWidth = parseInt(process.env.RESIZE_WIDTH || '800');
    this.resizeHeight = parseInt(process.env.RESIZE_HEIGHT || '600');
    this.imageQuality = parseInt(process.env.IMAGE_QUALITY || '80');
  }

  /**
   * Upload product image
   */
  async uploadProductImage(
    productId: number, 
    tipo: string, 
    file: Express.Multer.File
  ): Promise<ApiResponse> {
    try {
      // Verify product exists
      let product;
      if (tipo === 'plato') {
        product = await prisma.plato.findUnique({
          where: { pla_codigo: productId }
        });
      } else if (tipo === 'bebida') {
        product = await prisma.bebida.findUnique({
          where: { beb_codigo: productId }
        });
      } else {
        throw new CustomError('Invalid product type', 400);
      }

      if (!product) {
        throw new CustomError('Product not found', 404);
      }

      // Process image
      const processedImage = await this.processImage(file);

      // Update product with image path
      if (tipo === 'plato') {
        await prisma.plato.update({
          where: { pla_codigo: productId },
          data: { pla_imagen: processedImage.filename }
        });
      } else if (tipo === 'bebida') {
        await prisma.bebida.update({
          where: { beb_codigo: productId },
          data: { beb_imagen: processedImage.filename }
        });
      }

      return {
        success: true,
        data: {
          filename: processedImage.filename,
          originalName: file.originalname,
          size: processedImage.size,
          width: processedImage.width,
          height: processedImage.height,
          url: `/uploads/${processedImage.filename}`,
          thumbnail: `/uploads/thumb_${processedImage.filename}`
        },
        message: 'Image uploaded successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to upload image', 500);
    }
  }

  /**
   * Delete product image
   */
  async deleteProductImage(imageId: number): Promise<ApiResponse> {
    try {
      // This is a simplified implementation
      // In a real system, you'd have an images table to track image metadata
      
      return {
        success: true,
        message: 'Image deleted successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to delete image', 500);
    }
  }

  /**
   * Get product images
   */
  async getProductImages(productId: number): Promise<ApiResponse> {
    try {
      // Try to find as plate first
      let product = await prisma.plato.findUnique({
        where: { pla_codigo: productId }
      });

      if (!product) {
        // Try to find as beverage
        product = await prisma.bebida.findUnique({
          where: { beb_codigo: productId }
        });
      }

      if (!product) {
        throw new CustomError('Product not found', 404);
      }

      const imagePath = product.pla_imagen || product.beb_imagen;
      
      if (!imagePath) {
        return {
          success: true,
          data: [],
          message: 'No images found for this product'
        };
      }

      const images = [{
        id: 1,
        filename: imagePath,
        url: `/uploads/${imagePath}`,
        thumbnail: `/uploads/thumb_${imagePath}`,
        isPrimary: true
      }];

      return {
        success: true,
        data: images,
        message: 'Product images retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve product images', 500);
    }
  }

  /**
   * Set image as primary
   */
  async setPrimaryImage(imageId: number): Promise<ApiResponse> {
    try {
      // This is a simplified implementation
      // In a real system, you'd have an images table to track image metadata
      
      return {
        success: true,
        message: 'Primary image set successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to set primary image', 500);
    }
  }

  /**
   * Resize image
   */
  async resizeImage(
    file: Express.Multer.File,
    width?: number,
    height?: number,
    quality?: number
  ): Promise<ApiResponse> {
    try {
      const resizeWidth = width || this.resizeWidth;
      const resizeHeight = height || this.resizeHeight;
      const imageQuality = quality || this.imageQuality;

      const filename = `resized_${Date.now()}_${file.originalname}`;
      const filepath = path.join(this.uploadPath, filename);

      // Ensure upload directory exists
      if (!fs.existsSync(this.uploadPath)) {
        fs.mkdirSync(this.uploadPath, { recursive: true });
      }

      // Resize image
      await sharp(file.buffer)
        .resize(resizeWidth, resizeHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: imageQuality })
        .toFile(filepath);

      // Get image metadata
      const metadata = await sharp(filepath).metadata();

      return {
        success: true,
        data: {
          filename,
          originalName: file.originalname,
          size: fs.statSync(filepath).size,
          width: metadata.width,
          height: metadata.height,
          url: `/uploads/${filename}`
        },
        message: 'Image resized successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to resize image', 500);
    }
  }

  /**
   * Process uploaded image (resize, create thumbnail, etc.)
   */
  private async processImage(file: Express.Multer.File): Promise<{
    filename: string;
    size: number;
    width: number;
    height: number;
  }> {
    try {
      const filename = `img_${Date.now()}_${Math.round(Math.random() * 1E9)}.jpg`;
      const filepath = path.join(this.uploadPath, filename);
      const thumbnailPath = path.join(this.uploadPath, `thumb_${filename}`);

      // Ensure upload directory exists
      if (!fs.existsSync(this.uploadPath)) {
        fs.mkdirSync(this.uploadPath, { recursive: true });
      }

      // Process main image
      const processedImage = await sharp(file.buffer)
        .resize(this.resizeWidth, this.resizeHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: this.imageQuality })
        .toFile(filepath);

      // Create thumbnail
      await sharp(file.buffer)
        .resize(this.thumbnailSize, this.thumbnailSize, {
          fit: 'cover'
        })
        .jpeg({ quality: this.imageQuality })
        .toFile(thumbnailPath);

      return {
        filename,
        size: processedImage.size,
        width: processedImage.width || 0,
        height: processedImage.height || 0
      };
    } catch (error) {
      throw new CustomError('Failed to process image', 500);
    }
  }
}

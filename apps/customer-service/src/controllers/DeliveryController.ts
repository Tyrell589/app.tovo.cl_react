/**
 * @fileoverview Delivery controller for delivery management
 */

import { 
  prisma
} from '@tovocl/database';
import { 
  ApiResponse, 
  PaginatedResponse 
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';

export class DeliveryController {
  /**
   * Calculate delivery fee
   */
  async calculateDeliveryFee(calculationData: {
    latitud: number;
    longitud: number;
    monto_orden?: number;
  }): Promise<ApiResponse> {
    try {
      const { latitud, longitud, monto_orden = 0 } = calculationData;

      // Restaurant coordinates (example - should be configurable)
      const restaurantLat = -33.4489;
      const restaurantLng = -70.6693;

      // Calculate distance using Haversine formula
      const distance = this.calculateDistance(restaurantLat, restaurantLng, latitud, longitud);
      
      // Check if within delivery radius
      const deliveryRadius = parseInt(process.env.DELIVERY_RADIUS_KM || '10');
      if (distance > deliveryRadius) {
        return {
          success: false,
          data: {
            available: false,
            reason: 'Outside delivery radius'
          },
          message: 'Delivery not available at this location'
        };
      }

      // Calculate base fee
      const baseFee = parseInt(process.env.DELIVERY_FEE_BASE || '2000');
      const perKmFee = parseInt(process.env.DELIVERY_FEE_PER_KM || '500');
      const freeThreshold = parseInt(process.env.DELIVERY_FREE_THRESHOLD || '25000');

      let deliveryFee = baseFee + (distance * perKmFee);

      // Check if order qualifies for free delivery
      if (monto_orden >= freeThreshold) {
        deliveryFee = 0;
      }

      const estimatedTime = parseInt(process.env.DELIVERY_ESTIMATED_TIME_MINUTES || '30') + (distance * 2);

      return {
        success: true,
        data: {
          available: true,
          distance_km: Math.round(distance * 100) / 100,
          delivery_fee: deliveryFee,
          estimated_time_minutes: estimatedTime,
          free_delivery_threshold: freeThreshold,
          qualifies_for_free: monto_orden >= freeThreshold
        },
        message: 'Delivery fee calculated successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to calculate delivery fee', 500);
    }
  }

  /**
   * Request delivery
   */
  async requestDelivery(
    deliveryData: {
      orden_codigo: number;
      direccion: string;
      ciudad: string;
      telefono: string;
      instrucciones?: string;
    }, 
    customerId: number
  ): Promise<ApiResponse> {
    try {
      const { orden_codigo, direccion, ciudad, telefono, instrucciones } = deliveryData;

      // Verify order exists and belongs to customer
      const order = await prisma.orden.findFirst({
        where: { 
          ord_codigo: orden_codigo,
          cli_codigo: customerId,
          flg_del: 1
        }
      });

      if (!order) {
        throw new CustomError('Order not found', 404);
      }

      // Check if delivery already exists for this order
      const existingDelivery = await prisma.entrega.findFirst({
        where: {
          ord_codigo: orden_codigo,
          flg_del: 1
        }
      });

      if (existingDelivery) {
        throw new CustomError('Delivery already requested for this order', 400);
      }

      // Create delivery request
      const delivery = await prisma.entrega.create({
        data: {
          ord_codigo: orden_codigo,
          ent_direccion: direccion,
          ent_ciudad: ciudad,
          ent_telefono: telefono,
          ent_instrucciones: instrucciones || '',
          ent_estado: 'pendiente',
          ent_fecha_solicitud: new Date(),
          flg_del: 1
        },
        include: {
          orden: {
            include: {
              cliente: {
                select: {
                  cli_nombre: true,
                  cli_apellidopat: true,
                  cli_telefono: true
                }
              }
            }
          }
        }
      });

      return {
        success: true,
        data: delivery,
        message: 'Delivery requested successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to request delivery', 500);
    }
  }

  /**
   * Get delivery requests
   */
  async getDeliveryRequests(
    page: number = 1, 
    limit: number = 10, 
    estado?: string
  ): Promise<ApiResponse<PaginatedResponse>> {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = { flg_del: 1 };
      
      if (estado) {
        whereClause.ent_estado = estado;
      }

      const [deliveries, total] = await Promise.all([
        prisma.entrega.findMany({
          where: whereClause,
          include: {
            orden: {
              include: {
                cliente: {
                  select: {
                    cli_codigo: true,
                    cli_nombre: true,
                    cli_apellidopat: true,
                    cli_telefono: true
                  }
                }
              }
            }
          },
          skip,
          take: limit,
          orderBy: { ent_fecha_solicitud: 'desc' }
        }),
        prisma.entrega.count({
          where: whereClause
        })
      ]);

      return {
        success: true,
        data: {
          data: deliveries,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        },
        message: 'Delivery requests retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve delivery requests', 500);
    }
  }

  /**
   * Get delivery request by ID
   */
  async getDeliveryRequestById(deliveryId: number): Promise<ApiResponse> {
    try {
      const delivery = await prisma.entrega.findUnique({
        where: { ent_codigo: deliveryId },
        include: {
          orden: {
            include: {
              cliente: {
                select: {
                  cli_codigo: true,
                  cli_nombre: true,
                  cli_apellidopat: true,
                  cli_telefono: true
                }
              },
              ordenproducto: {
                include: {
                  plato: true,
                  bebida: true
                }
              }
            }
          }
        }
      });

      if (!delivery || delivery.flg_del !== 1) {
        throw new CustomError('Delivery not found', 404);
      }

      return {
        success: true,
        data: delivery,
        message: 'Delivery request retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve delivery request', 500);
    }
  }

  /**
   * Update delivery status
   */
  async updateDeliveryStatus(
    deliveryId: number, 
    estado: string, 
    comentarios?: string
  ): Promise<ApiResponse> {
    try {
      const existingDelivery = await prisma.entrega.findUnique({
        where: { ent_codigo: deliveryId }
      });

      if (!existingDelivery) {
        throw new CustomError('Delivery not found', 404);
      }

      const updateData: any = {
        ent_estado: estado
      };

      if (estado === 'en_camino') {
        updateData.ent_fecha_salida = new Date();
      } else if (estado === 'entregado') {
        updateData.ent_fecha_entrega = new Date();
      }

      if (comentarios) {
        updateData.ent_comentarios = comentarios;
      }

      const delivery = await prisma.entrega.update({
        where: { ent_codigo: deliveryId },
        data: updateData,
        include: {
          orden: {
            include: {
              cliente: {
                select: {
                  cli_nombre: true,
                  cli_apellidopat: true,
                  cli_telefono: true
                }
              }
            }
          }
        }
      });

      return {
        success: true,
        data: delivery,
        message: 'Delivery status updated successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to update delivery status', 500);
    }
  }

  /**
   * Track delivery
   */
  async trackDelivery(deliveryId: number): Promise<ApiResponse> {
    try {
      const delivery = await prisma.entrega.findUnique({
        where: { ent_codigo: deliveryId },
        include: {
          orden: {
            include: {
              cliente: {
                select: {
                  cli_nombre: true,
                  cli_apellidopat: true,
                  cli_telefono: true
                }
              }
            }
          }
        }
      });

      if (!delivery || delivery.flg_del !== 1) {
        throw new CustomError('Delivery not found', 404);
      }

      const tracking = {
        delivery_id: delivery.ent_codigo,
        status: delivery.ent_estado,
        address: delivery.ent_direccion,
        city: delivery.ent_ciudad,
        phone: delivery.ent_telefono,
        instructions: delivery.ent_instrucciones,
        requested_at: delivery.ent_fecha_solicitud,
        dispatched_at: delivery.ent_fecha_salida,
        delivered_at: delivery.ent_fecha_entrega,
        comments: delivery.ent_comentarios,
        order: {
          order_id: delivery.orden.ord_codigo,
          total: delivery.orden.ord_total,
          customer: delivery.orden.cliente
        }
      };

      return {
        success: true,
        data: tracking,
        message: 'Delivery tracking retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to track delivery', 500);
    }
  }

  /**
   * Cancel delivery
   */
  async cancelDelivery(deliveryId: number, motivo: string): Promise<ApiResponse> {
    try {
      const existingDelivery = await prisma.entrega.findUnique({
        where: { ent_codigo: deliveryId }
      });

      if (!existingDelivery) {
        throw new CustomError('Delivery not found', 404);
      }

      if (existingDelivery.ent_estado === 'entregado') {
        throw new CustomError('Cannot cancel delivered order', 400);
      }

      if (existingDelivery.ent_estado === 'cancelado') {
        throw new CustomError('Delivery already cancelled', 400);
      }

      const delivery = await prisma.entrega.update({
        where: { ent_codigo: deliveryId },
        data: {
          ent_estado: 'cancelado',
          ent_comentarios: motivo,
          ent_fecha_cancelacion: new Date()
        }
      });

      return {
        success: true,
        data: delivery,
        message: 'Delivery cancelled successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to cancel delivery', 500);
    }
  }

  /**
   * Get delivery statistics
   */
  async getDeliveryStats(): Promise<ApiResponse> {
    try {
      const [
        totalDeliveries,
        statusCounts,
        averageDeliveryTime,
        recentDeliveries
      ] = await Promise.all([
        // Total deliveries
        prisma.entrega.count({
          where: { flg_del: 1 }
        }),
        // Status counts
        prisma.entrega.groupBy({
          by: ['ent_estado'],
          where: { flg_del: 1 },
          _count: {
            ent_codigo: true
          }
        }),
        // Average delivery time (simplified)
        prisma.$queryRaw`
          SELECT 
            AVG(TIMESTAMPDIFF(MINUTE, ent_fecha_solicitud, ent_fecha_entrega)) as avg_delivery_time
          FROM entrega 
          WHERE flg_del = 1 
            AND ent_estado = 'entregado'
            AND ent_fecha_entrega IS NOT NULL
        `,
        // Recent deliveries
        prisma.entrega.findMany({
          where: { flg_del: 1 },
          include: {
            orden: {
              include: {
                cliente: {
                  select: {
                    cli_nombre: true,
                    cli_apellidopat: true
                  }
                }
              }
            }
          },
          orderBy: { ent_fecha_solicitud: 'desc' },
          take: 10
        })
      ]);

      const stats = {
        total_deliveries: totalDeliveries,
        status_counts: statusCounts.reduce((acc, status) => {
          acc[status.ent_estado] = status._count.ent_codigo;
          return acc;
        }, {} as Record<string, number>),
        average_delivery_time_minutes: averageDeliveryTime[0]?.avg_delivery_time || 0,
        recent_deliveries: recentDeliveries
      };

      return {
        success: true,
        data: stats,
        message: 'Delivery statistics retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve delivery statistics', 500);
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  /**
   * Convert degrees to radians
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}

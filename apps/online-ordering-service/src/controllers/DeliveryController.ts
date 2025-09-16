/**
 * @fileoverview Delivery controller for online ordering
 */

import { 
  prisma
} from '@tovocl/database';
import { 
  ApiResponse
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
   * Track delivery by order ID
   */
  async trackDelivery(orderId: number): Promise<ApiResponse> {
    try {
      const order = await prisma.orden.findUnique({
        where: { ord_codigo: orderId },
        include: {
          entrega: true,
          cliente: {
            select: {
              cli_nombre: true,
              cli_apellidopat: true,
              cli_telefono: true
            }
          }
        }
      });

      if (!order || order.flg_del !== 1) {
        throw new CustomError('Order not found', 404);
      }

      if (!order.entrega) {
        throw new CustomError('Delivery not found for this order', 404);
      }

      const tracking = {
        order_id: order.ord_codigo,
        tracking_code: order.ord_codigo_seguimiento,
        status: order.ord_estado,
        delivery_status: order.entrega.ent_estado,
        address: order.entrega.ent_direccion,
        city: order.entrega.ent_ciudad,
        phone: order.entrega.ent_telefono,
        instructions: order.entrega.ent_instrucciones,
        requested_at: order.entrega.ent_fecha_solicitud,
        dispatched_at: order.entrega.ent_fecha_salida,
        delivered_at: order.entrega.ent_fecha_entrega,
        comments: order.entrega.ent_comentarios,
        customer: order.cliente
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
   * Get delivery status by order ID
   */
  async getDeliveryStatus(orderId: number): Promise<ApiResponse> {
    try {
      const order = await prisma.orden.findUnique({
        where: { ord_codigo: orderId },
        include: {
          entrega: true
        }
      });

      if (!order || order.flg_del !== 1) {
        throw new CustomError('Order not found', 404);
      }

      if (!order.entrega) {
        throw new CustomError('Delivery not found for this order', 404);
      }

      const status = {
        order_id: order.ord_codigo,
        order_status: order.ord_estado,
        delivery_status: order.entrega.ent_estado,
        last_updated: order.entrega.ent_fecha_solicitud,
        estimated_delivery: this.calculateEstimatedDelivery(order.entrega.ent_fecha_solicitud)
      };

      return {
        success: true,
        data: status,
        message: 'Delivery status retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to get delivery status', 500);
    }
  }

  /**
   * Get delivery time estimates
   */
  async getDeliveryEstimates(latitud: number, longitud: number): Promise<ApiResponse> {
    try {
      // Restaurant coordinates (example - should be configurable)
      const restaurantLat = -33.4489;
      const restaurantLng = -70.6693;

      // Calculate distance
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

      // Calculate estimates
      const baseTime = parseInt(process.env.DELIVERY_ESTIMATED_TIME_MINUTES || '30');
      const estimatedTime = baseTime + (distance * 2);
      const rushHourMultiplier = this.getRushHourMultiplier();
      const finalEstimate = Math.round(estimatedTime * rushHourMultiplier);

      const estimates = {
        available: true,
        distance_km: Math.round(distance * 100) / 100,
        estimated_time_minutes: finalEstimate,
        estimated_time_range: {
          min: Math.max(15, finalEstimate - 10),
          max: finalEstimate + 15
        },
        rush_hour: rushHourMultiplier > 1,
        factors: {
          distance: distance,
          rush_hour: rushHourMultiplier > 1,
          weather: 'normal' // Could be enhanced with weather API
        }
      };

      return {
        success: true,
        data: estimates,
        message: 'Delivery estimates retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to get delivery estimates', 500);
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

  /**
   * Calculate estimated delivery time
   */
  private calculateEstimatedDelivery(requestedAt: Date): Date {
    const baseTime = parseInt(process.env.DELIVERY_ESTIMATED_TIME_MINUTES || '30');
    const estimatedMinutes = baseTime + 15; // Add buffer
    return new Date(requestedAt.getTime() + estimatedMinutes * 60000);
  }

  /**
   * Get rush hour multiplier
   */
  private getRushHourMultiplier(): number {
    const now = new Date();
    const hour = now.getHours();
    
    // Rush hours: 12-14 (lunch) and 19-21 (dinner)
    if ((hour >= 12 && hour < 14) || (hour >= 19 && hour < 21)) {
      return 1.5;
    }
    
    return 1.0;
  }
}

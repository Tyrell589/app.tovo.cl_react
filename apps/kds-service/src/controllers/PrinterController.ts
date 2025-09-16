/**
 * @fileoverview Printer controller for kitchen printing
 */

import { 
  prisma
} from '@tovocl/database';
import { 
  ApiResponse
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';
import { PrinterService } from '../services/PrinterService';

export class PrinterController {
  private printerService: PrinterService;

  constructor() {
    this.printerService = new PrinterService();
  }

  /**
   * Test printer connection
   */
  async testConnection(): Promise<ApiResponse> {
    try {
      const isConnected = await this.printerService.testConnection();
      
      return {
        success: true,
        data: {
          connected: isConnected,
          printer_type: process.env.PRINTER_TYPE || 'thermal',
          printer_ip: process.env.PRINTER_IP || '192.168.1.100',
          printer_port: process.env.PRINTER_PORT || '9100'
        },
        message: isConnected ? 'Printer connection successful' : 'Printer connection failed'
      };
    } catch (error) {
      throw new CustomError('Failed to test printer connection', 500);
    }
  }

  /**
   * Print order
   */
  async printOrder(orderId: number): Promise<ApiResponse> {
    try {
      const order = await prisma.orden.findUnique({
        where: { ord_codigo: orderId },
        include: {
          cliente: {
            select: {
              cli_nombre: true,
              cli_apellidopat: true,
              cli_telefono: true
            }
          },
          mesa: {
            select: {
              mesa_nombre: true
            }
          },
          ordenproducto: {
            include: {
              plato: true,
              bebida: true
            }
          }
        }
      });

      if (!order || order.flg_del !== 1) {
        throw new CustomError('Order not found', 404);
      }

      const success = await this.printerService.printOrder(order);

      return {
        success: success,
        data: {
          order_id: orderId,
          printed: success,
          printed_at: new Date().toISOString()
        },
        message: success ? 'Order printed successfully' : 'Failed to print order'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to print order', 500);
    }
  }

  /**
   * Print kitchen ticket
   */
  async printKitchenTicket(orderId: number, station: string): Promise<ApiResponse> {
    try {
      const order = await prisma.orden.findUnique({
        where: { ord_codigo: orderId },
        include: {
          cliente: {
            select: {
              cli_nombre: true,
              cli_apellidopat: true
            }
          },
          mesa: {
            select: {
              mesa_nombre: true
            }
          },
          ordenproducto: {
            include: {
              plato: true,
              bebida: true
            }
          }
        }
      });

      if (!order || order.flg_del !== 1) {
        throw new CustomError('Order not found', 404);
      }

      const success = await this.printerService.printKitchenTicket(order, station);

      return {
        success: success,
        data: {
          order_id: orderId,
          station: station,
          printed: success,
          printed_at: new Date().toISOString()
        },
        message: success ? 'Kitchen ticket printed successfully' : 'Failed to print kitchen ticket'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to print kitchen ticket', 500);
    }
  }

  /**
   * Print receipt
   */
  async printReceipt(orderId: number): Promise<ApiResponse> {
    try {
      const order = await prisma.orden.findUnique({
        where: { ord_codigo: orderId },
        include: {
          cliente: {
            select: {
              cli_nombre: true,
              cli_apellidopat: true
            }
          },
          mesa: {
            select: {
              mesa_nombre: true
            }
          },
          ordenproducto: {
            include: {
              plato: true,
              bebida: true
            }
          }
        }
      });

      if (!order || order.flg_del !== 1) {
        throw new CustomError('Order not found', 404);
      }

      const success = await this.printerService.printReceipt(order);

      return {
        success: success,
        data: {
          order_id: orderId,
          printed: success,
          printed_at: new Date().toISOString()
        },
        message: success ? 'Receipt printed successfully' : 'Failed to print receipt'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to print receipt', 500);
    }
  }

  /**
   * Get printer status
   */
  async getPrinterStatus(): Promise<ApiResponse> {
    try {
      const healthCheck = await this.printerService.healthCheck();
      
      return {
        success: true,
        data: {
          status: healthCheck.status,
          connected: healthCheck.connected,
          type: healthCheck.type,
          enabled: process.env.PRINTER_ENABLED === 'true',
          ip: process.env.PRINTER_IP || '192.168.1.100',
          port: process.env.PRINTER_PORT || '9100',
          timeout: process.env.PRINTER_TIMEOUT || '5000'
        },
        message: 'Printer status retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to get printer status', 500);
    }
  }
}

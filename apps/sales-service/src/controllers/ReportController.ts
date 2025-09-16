/**
 * @fileoverview Report controller for financial reports and analytics
 */

import { 
  prisma
} from '@tovocl/database';
import { 
  ApiResponse 
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';
import moment from 'moment';

export class ReportController {
  /**
   * Get sales report
   */
  async getSalesReport(fechaInicio: string, fechaFin: string, groupBy: string): Promise<ApiResponse> {
    try {
      const startDate = new Date(fechaInicio);
      const endDate = new Date(fechaFin);

      // Get sales data grouped by time period
      let groupByClause: string;
      let dateFormat: string;

      switch (groupBy) {
        case 'day':
          groupByClause = 'DATE(ord_fecha)';
          dateFormat = '%Y-%m-%d';
          break;
        case 'week':
          groupByClause = 'YEARWEEK(ord_fecha)';
          dateFormat = '%Y-%u';
          break;
        case 'month':
          groupByClause = 'DATE_FORMAT(ord_fecha, "%Y-%m")';
          dateFormat = '%Y-%m';
          break;
        case 'year':
          groupByClause = 'YEAR(ord_fecha)';
          dateFormat = '%Y';
          break;
        default:
          groupByClause = 'DATE(ord_fecha)';
          dateFormat = '%Y-%m-%d';
      }

      const salesData = await prisma.$queryRaw`
        SELECT 
          ${groupByClause} as period,
          COUNT(*) as total_orders,
          SUM(ord_total) as total_sales,
          AVG(ord_total) as avg_order_value,
          SUM(ord_impuesto) as total_tax,
          SUM(ord_cargoservicio) as total_service_charge,
          SUM(ord_propina) as total_tips
        FROM orden 
        WHERE ord_fecha >= ${startDate} 
          AND ord_fecha <= ${endDate}
          AND ord_estado = 'entregado'
          AND flg_del = 1
        GROUP BY ${groupByClause}
        ORDER BY period
      `;

      // Get payment methods breakdown
      const paymentMethods = await prisma.orden.groupBy({
        by: ['ord_metodopago'],
        where: {
          ord_fecha: {
            gte: startDate,
            lte: endDate
          },
          ord_estado: 'entregado',
          flg_del: 1
        },
        _sum: {
          ord_total: true
        },
        _count: {
          ord_codigo: true
        }
      });

      return {
        success: true,
        data: {
          period: groupBy,
          date_range: {
            start: fechaInicio,
            end: fechaFin
          },
          sales_data: salesData,
          payment_methods: paymentMethods.map(pm => ({
            method: pm.ord_metodopago,
            total_sales: pm._sum.ord_total || 0,
            order_count: pm._count.ord_codigo
          }))
        },
        message: 'Sales report retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve sales report', 500);
    }
  }

  /**
   * Get products report
   */
  async getProductsReport(fechaInicio: string, fechaFin: string, limit: number): Promise<ApiResponse> {
    try {
      const startDate = new Date(fechaInicio);
      const endDate = new Date(fechaFin);

      const productsData = await prisma.ordenProducto.groupBy({
        by: ['pla_codigo', 'beb_codigo'],
        where: {
          orden: {
            ord_fecha: {
              gte: startDate,
              lte: endDate
            },
            ord_estado: 'entregado',
            flg_del: 1
          },
          flg_del: 1
        },
        _sum: {
          orp_cantidad: true,
          orp_subtotal: true
        },
        orderBy: {
          _sum: {
            orp_cantidad: 'desc'
          }
        },
        take: limit
      });

      // Get product details
      const productDetails = await Promise.all(
        productsData.map(async (product) => {
          let productInfo = null;
          if (product.pla_codigo) {
            productInfo = await prisma.plato.findUnique({
              where: { pla_codigo: product.pla_codigo },
              select: { 
                pla_nombre: true, 
                pla_precio: true,
                categoria: {
                  select: { cat_nombre: true }
                }
              }
            });
          } else if (product.beb_codigo) {
            productInfo = await prisma.bebida.findUnique({
              where: { beb_codigo: product.beb_codigo },
              select: { 
                beb_nombre: true, 
                beb_precio: true,
                categoria: {
                  select: { cbe_nombre: true }
                }
              }
            });
          }

          return {
            product_id: product.pla_codigo || product.beb_codigo,
            type: product.pla_codigo ? 'plato' : 'bebida',
            name: productInfo?.pla_nombre || productInfo?.beb_nombre || 'Unknown',
            price: productInfo?.pla_precio || productInfo?.beb_precio || 0,
            category: productInfo?.categoria?.cat_nombre || productInfo?.categoria?.cbe_nombre || 'Unknown',
            quantity_sold: product._sum.orp_cantidad || 0,
            total_revenue: product._sum.orp_subtotal || 0
          };
        })
      );

      return {
        success: true,
        data: {
          date_range: {
            start: fechaInicio,
            end: fechaFin
          },
          products: productDetails
        },
        message: 'Products report retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve products report', 500);
    }
  }

  /**
   * Get tables report
   */
  async getTablesReport(fechaInicio: string, fechaFin: string): Promise<ApiResponse> {
    try {
      const startDate = new Date(fechaInicio);
      const endDate = new Date(fechaFin);

      const tablesData = await prisma.orden.groupBy({
        by: ['mesa_codigo'],
        where: {
          ord_fecha: {
            gte: startDate,
            lte: endDate
          },
          ord_estado: 'entregado',
          flg_del: 1
        },
        _sum: {
          ord_total: true
        },
        _count: {
          ord_codigo: true
        },
        _avg: {
          ord_total: true
        }
      });

      // Get table details
      const tableDetails = await Promise.all(
        tablesData.map(async (table) => {
          const tableInfo = await prisma.mesa.findUnique({
            where: { mesa_codigo: table.mesa_codigo },
            select: { 
              mesa_nombre: true, 
              mesa_capacidad: true,
              categoria: {
                select: { cat_nombre: true }
              }
            }
          });

          return {
            mesa_codigo: table.mesa_codigo,
            mesa_nombre: tableInfo?.mesa_nombre || 'Unknown',
            mesa_capacidad: tableInfo?.mesa_capacidad || 0,
            categoria: tableInfo?.categoria?.cat_nombre || 'Unknown',
            total_sales: table._sum.ord_total || 0,
            order_count: table._count.ord_codigo,
            avg_order_value: table._avg.ord_total || 0,
            revenue_per_seat: tableInfo?.mesa_capacidad ? (table._sum.ord_total || 0) / tableInfo.mesa_capacidad : 0
          };
        })
      );

      return {
        success: true,
        data: {
          date_range: {
            start: fechaInicio,
            end: fechaFin
          },
          tables: tableDetails.sort((a, b) => b.total_sales - a.total_sales)
        },
        message: 'Tables report retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve tables report', 500);
    }
  }

  /**
   * Get payments report
   */
  async getPaymentsReport(fechaInicio: string, fechaFin: string): Promise<ApiResponse> {
    try {
      const startDate = new Date(fechaInicio);
      const endDate = new Date(fechaFin);

      const [
        paymentMethods,
        totalPayments,
        totalRefunds
      ] = await Promise.all([
        // Payment methods breakdown
        prisma.orden.groupBy({
          by: ['ord_metodopago'],
          where: {
            ord_fecha: {
              gte: startDate,
              lte: endDate
            },
            ord_estado: 'entregado',
            flg_del: 1
          },
          _sum: {
            ord_total: true
          },
          _count: {
            ord_codigo: true
          }
        }),
        // Total payments
        prisma.movimientoDinero.aggregate({
          where: {
            mov_tipo: 1, // Payments
            mov_fecha: {
              gte: startDate,
              lte: endDate
            },
            flg_del: 1
          },
          _sum: {
            mov_monto: true
          },
          _count: {
            mov_codigo: true
          }
        }),
        // Total refunds
        prisma.movimientoDinero.aggregate({
          where: {
            mov_tipo: 2, // Refunds
            mov_fecha: {
              gte: startDate,
              lte: endDate
            },
            flg_del: 1
          },
          _sum: {
            mov_monto: true
          },
          _count: {
            mov_codigo: true
          }
        })
      ]);

      return {
        success: true,
        data: {
          date_range: {
            start: fechaInicio,
            end: fechaFin
          },
          payment_methods: paymentMethods.map(pm => ({
            method: pm.ord_metodopago,
            total_sales: pm._sum.ord_total || 0,
            order_count: pm._count.ord_codigo
          })),
          total_payments: {
            amount: totalPayments._sum.mov_monto || 0,
            count: totalPayments._count.mov_codigo || 0
          },
          total_refunds: {
            amount: totalRefunds._sum.mov_monto || 0,
            count: totalRefunds._count.mov_codigo || 0
          },
          net_amount: (totalPayments._sum.mov_monto || 0) - (totalRefunds._sum.mov_monto || 0)
        },
        message: 'Payments report retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve payments report', 500);
    }
  }

  /**
   * Get cash report
   */
  async getCashReport(fechaInicio: string, fechaFin: string): Promise<ApiResponse> {
    try {
      const startDate = new Date(fechaInicio);
      const endDate = new Date(fechaFin);

      const [
        cashRegisters,
        cashMovements,
        cashSales
      ] = await Promise.all([
        // Cash registers
        prisma.arqueoDinero.findMany({
          where: {
            arq_fechaapertura: {
              gte: startDate,
              lte: endDate
            },
            flg_del: 1
          },
          include: {
            usuario: {
              select: {
                usu_nombre: true,
                usu_apellidopat: true
              }
            }
          }
        }),
        // Cash movements
        prisma.movimientoDinero.aggregate({
          where: {
            arq_codigo: null,
            mov_fecha: {
              gte: startDate,
              lte: endDate
            },
            flg_del: 1
          },
          _sum: {
            mov_monto: true
          }
        }),
        // Cash sales
        prisma.orden.aggregate({
          where: {
            ord_metodopago: 'efectivo',
            ord_fecha: {
              gte: startDate,
              lte: endDate
            },
            ord_estado: 'entregado',
            flg_del: 1
          },
          _sum: {
            ord_total: true
          },
          _count: {
            ord_codigo: true
          }
        })
      ]);

      return {
        success: true,
        data: {
          date_range: {
            start: fechaInicio,
            end: fechaFin
          },
          cash_registers: cashRegisters.map(cr => ({
            id: cr.arq_codigo,
            monto_inicial: cr.arq_montoinicial,
            monto_final: cr.arq_monto,
            diferencia: cr.arq_diferencia,
            estado: cr.arq_estado === 1 ? 'abierto' : 'cerrado',
            apertura: cr.arq_fechaapertura,
            cierre: cr.arq_fechacierre,
            usuario: cr.usuario ? `${cr.usuario.usu_nombre} ${cr.usuario.usu_apellidopat}` : 'Unknown'
          })),
          cash_movements: cashMovements._sum.mov_monto || 0,
          cash_sales: {
            amount: cashSales._sum.ord_total || 0,
            count: cashSales._count.ord_codigo || 0
          },
          total_cash_flow: (cashMovements._sum.mov_monto || 0) + (cashSales._sum.ord_total || 0)
        },
        message: 'Cash report retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve cash report', 500);
    }
  }

  /**
   * Get summary report
   */
  async getSummaryReport(fechaInicio: string, fechaFin: string): Promise<ApiResponse> {
    try {
      const startDate = new Date(fechaInicio);
      const endDate = new Date(fechaFin);

      const [
        salesSummary,
        ordersSummary,
        productsSummary,
        tablesSummary,
        paymentsSummary
      ] = await Promise.all([
        // Sales summary
        prisma.orden.aggregate({
          where: {
            ord_fecha: {
              gte: startDate,
              lte: endDate
            },
            ord_estado: 'entregado',
            flg_del: 1
          },
          _sum: {
            ord_total: true,
            ord_impuesto: true,
            ord_cargoservicio: true,
            ord_propina: true
          },
          _count: {
            ord_codigo: true
          },
          _avg: {
            ord_total: true
          }
        }),
        // Orders summary
        prisma.orden.groupBy({
          by: ['ord_estado'],
          where: {
            ord_fecha: {
              gte: startDate,
              lte: endDate
            },
            flg_del: 1
          },
          _count: {
            ord_codigo: true
          }
        }),
        // Products summary
        prisma.ordenProducto.aggregate({
          where: {
            orden: {
              ord_fecha: {
                gte: startDate,
                lte: endDate
              },
              ord_estado: 'entregado',
              flg_del: 1
            },
            flg_del: 1
          },
          _sum: {
            orp_cantidad: true,
            orp_subtotal: true
          }
        }),
        // Tables summary
        prisma.orden.groupBy({
          by: ['mesa_codigo'],
          where: {
            ord_fecha: {
              gte: startDate,
              lte: endDate
            },
            ord_estado: 'entregado',
            flg_del: 1
          },
          _count: {
            ord_codigo: true
          }
        }),
        // Payments summary
        prisma.orden.groupBy({
          by: ['ord_metodopago'],
          where: {
            ord_fecha: {
              gte: startDate,
              lte: endDate
            },
            ord_estado: 'entregado',
            flg_del: 1
          },
          _sum: {
            ord_total: true
          }
        })
      ]);

      const summary = {
        date_range: {
          start: fechaInicio,
          end: fechaFin
        },
        sales: {
          total_sales: salesSummary._sum.ord_total || 0,
          total_tax: salesSummary._sum.ord_impuesto || 0,
          total_service_charge: salesSummary._sum.ord_cargoservicio || 0,
          total_tips: salesSummary._sum.ord_propina || 0,
          total_orders: salesSummary._count.ord_codigo || 0,
          avg_order_value: salesSummary._avg.ord_total || 0
        },
        orders: {
          by_status: ordersSummary.reduce((acc, order) => {
            acc[order.ord_estado] = order._count.ord_codigo;
            return acc;
          }, {} as Record<string, number>)
        },
        products: {
          total_quantity_sold: productsSummary._sum.orp_cantidad || 0,
          total_revenue: productsSummary._sum.orp_subtotal || 0
        },
        tables: {
          active_tables: tablesSummary.length,
          total_table_turns: tablesSummary.reduce((sum, table) => sum + table._count.ord_codigo, 0)
        },
        payments: {
          by_method: paymentsSummary.map(pm => ({
            method: pm.ord_metodopago,
            amount: pm._sum.ord_total || 0
          }))
        }
      };

      return {
        success: true,
        data: summary,
        message: 'Summary report retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve summary report', 500);
    }
  }

  /**
   * Export report
   */
  async exportReport(reportType: string, fechaInicio: string, fechaFin: string, format: string): Promise<ApiResponse> {
    try {
      // This is a placeholder for export functionality
      // In a real implementation, you would generate the appropriate file format
      
      const exportData = {
        report_type: reportType,
        date_range: {
          start: fechaInicio,
          end: fechaFin
        },
        format: format,
        status: 'pending',
        download_url: `/api/reports/download/${reportType}-${fechaInicio}-${fechaFin}.${format}`
      };

      return {
        success: true,
        data: exportData,
        message: 'Report export initiated successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to export report', 500);
    }
  }
}

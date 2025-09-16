/**
 * @fileoverview Printer service for kitchen order printing
 */

export class PrinterService {
  private isConnected: boolean = false;
  private printerType: string;
  private printerIP: string;
  private printerPort: number;

  constructor() {
    this.printerType = process.env.PRINTER_TYPE || 'thermal';
    this.printerIP = process.env.PRINTER_IP || '192.168.1.100';
    this.printerPort = parseInt(process.env.PRINTER_PORT || '9100');
  }

  /**
   * Initialize printer service
   */
  async initialize(): Promise<void> {
    try {
      if (process.env.PRINTER_ENABLED === 'true') {
        // In a real implementation, you would initialize the actual printer connection
        // For now, we'll simulate the connection
        this.isConnected = true;
        console.log(`🖨️ Printer service initialized (${this.printerType})`);
      } else {
        console.log('🖨️ Printer service disabled');
      }
    } catch (error) {
      console.error('Failed to initialize printer service:', error);
      this.isConnected = false;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; connected: boolean; type: string }> {
    return {
      status: this.isConnected ? 'healthy' : 'disconnected',
      connected: this.isConnected,
      type: this.printerType
    };
  }

  /**
   * Print order
   */
  async printOrder(order: any): Promise<boolean> {
    try {
      if (!this.isConnected) {
        console.log('Printer not connected, skipping print');
        return false;
      }

      const printData = this.formatOrderForPrint(order);
      console.log('🖨️ Printing order:', printData);
      
      // In a real implementation, you would send the data to the actual printer
      // For now, we'll just log it
      return true;
    } catch (error) {
      console.error('Failed to print order:', error);
      return false;
    }
  }

  /**
   * Print kitchen ticket
   */
  async printKitchenTicket(order: any, station: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        console.log('Printer not connected, skipping print');
        return false;
      }

      const ticketData = this.formatKitchenTicket(order, station);
      console.log('🍳 Printing kitchen ticket:', ticketData);
      
      // In a real implementation, you would send the data to the actual printer
      return true;
    } catch (error) {
      console.error('Failed to print kitchen ticket:', error);
      return false;
    }
  }

  /**
   * Print receipt
   */
  async printReceipt(order: any): Promise<boolean> {
    try {
      if (!this.isConnected) {
        console.log('Printer not connected, skipping print');
        return false;
      }

      const receiptData = this.formatReceipt(order);
      console.log('🧾 Printing receipt:', receiptData);
      
      // In a real implementation, you would send the data to the actual printer
      return true;
    } catch (error) {
      console.error('Failed to print receipt:', error);
      return false;
    }
  }

  /**
   * Test printer connection
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      // In a real implementation, you would test the actual printer connection
      console.log('🖨️ Printer connection test successful');
      return true;
    } catch (error) {
      console.error('Printer connection test failed:', error);
      return false;
    }
  }

  /**
   * Disconnect printer
   */
  async disconnect(): Promise<void> {
    try {
      this.isConnected = false;
      console.log('🖨️ Printer service disconnected');
    } catch (error) {
      console.error('Failed to disconnect printer service:', error);
    }
  }

  /**
   * Format order for printing
   */
  private formatOrderForPrint(order: any): string {
    const lines = [];
    lines.push('='.repeat(40));
    lines.push('ORDER #' + order.ord_codigo);
    lines.push('='.repeat(40));
    lines.push(`Time: ${new Date(order.ord_fecha).toLocaleString()}`);
    lines.push(`Table: ${order.mesa?.mesa_nombre || 'N/A'}`);
    lines.push(`Customer: ${order.cliente?.cli_nombre || 'N/A'}`);
    lines.push('-'.repeat(40));
    
    if (order.ordenproducto) {
      order.ordenproducto.forEach((item: any) => {
        lines.push(`${item.orp_cantidad}x ${item.plato?.pla_nombre || item.bebida?.beb_nombre || 'Unknown'}`);
        if (item.orp_comentario) {
          lines.push(`  Note: ${item.orp_comentario}`);
        }
        lines.push(`  Price: $${item.orp_precio}`);
      });
    }
    
    lines.push('-'.repeat(40));
    lines.push(`Total: $${order.ord_total}`);
    lines.push('='.repeat(40));
    
    return lines.join('\n');
  }

  /**
   * Format kitchen ticket
   */
  private formatKitchenTicket(order: any, station: string): string {
    const lines = [];
    lines.push('='.repeat(40));
    lines.push(`KITCHEN TICKET - ${station.toUpperCase()}`);
    lines.push('='.repeat(40));
    lines.push(`Order #${order.ord_codigo}`);
    lines.push(`Time: ${new Date(order.ord_fecha).toLocaleString()}`);
    lines.push(`Table: ${order.mesa?.mesa_nombre || 'N/A'}`);
    lines.push('-'.repeat(40));
    
    if (order.ordenproducto) {
      order.ordenproducto.forEach((item: any) => {
        const productName = item.plato?.pla_nombre || item.bebida?.beb_nombre || 'Unknown';
        const productType = item.plato ? 'PLATO' : 'BEBIDA';
        
        if (this.shouldPrintForStation(productName, station)) {
          lines.push(`${item.orp_cantidad}x ${productName} (${productType})`);
          if (item.orp_comentario) {
            lines.push(`  Note: ${item.orp_comentario}`);
          }
        }
      });
    }
    
    lines.push('-'.repeat(40));
    lines.push('='.repeat(40));
    
    return lines.join('\n');
  }

  /**
   * Format receipt
   */
  private formatReceipt(order: any): string {
    const lines = [];
    lines.push('='.repeat(40));
    lines.push('RECEIPT');
    lines.push('='.repeat(40));
    lines.push(`Order #${order.ord_codigo}`);
    lines.push(`Date: ${new Date(order.ord_fecha).toLocaleString()}`);
    lines.push(`Table: ${order.mesa?.mesa_nombre || 'N/A'}`);
    lines.push('-'.repeat(40));
    
    if (order.ordenproducto) {
      order.ordenproducto.forEach((item: any) => {
        const productName = item.plato?.pla_nombre || item.bebida?.beb_nombre || 'Unknown';
        const subtotal = item.orp_cantidad * item.orp_precio;
        lines.push(`${item.orp_cantidad}x ${productName}`);
        lines.push(`  $${item.orp_precio} x ${item.orp_cantidad} = $${subtotal.toFixed(2)}`);
      });
    }
    
    lines.push('-'.repeat(40));
    lines.push(`Subtotal: $${order.ord_total}`);
    lines.push(`Total: $${order.ord_total}`);
    lines.push('='.repeat(40));
    lines.push('Thank you for your order!');
    
    return lines.join('\n');
  }

  /**
   * Check if product should be printed for station
   */
  private shouldPrintForStation(productName: string, station: string): boolean {
    // Simple logic to determine which products go to which stations
    // In a real implementation, this would be more sophisticated
    const stationProducts: { [key: string]: string[] } = {
      grill: ['hamburguesa', 'pollo', 'carne', 'pescado'],
      salad: ['ensalada', 'verdura', 'vegetal'],
      pizza: ['pizza', 'pasta'],
      dessert: ['postre', 'helado', 'torta', 'flan'],
      beverage: ['bebida', 'jugo', 'agua', 'coca', 'cerveza']
    };

    const stationKeywords = stationProducts[station.toLowerCase()] || [];
    return stationKeywords.some(keyword => 
      productName.toLowerCase().includes(keyword)
    );
  }
}

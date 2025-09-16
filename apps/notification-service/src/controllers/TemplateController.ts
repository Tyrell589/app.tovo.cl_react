/**
 * @fileoverview Template controller
 */

import { 
  ApiResponse
} from '@tovocl/types';
import { CustomError } from '../middleware/errorHandler';

export class TemplateController {
  /**
   * Get available templates
   */
  async getTemplates(): Promise<ApiResponse> {
    try {
      const templates = [
        {
          name: 'order-confirmation',
          title: 'Order Confirmation',
          description: 'Email template for order confirmation',
          type: 'email',
          variables: ['order_id', 'customer_name', 'total', 'status']
        },
        {
          name: 'order-status-update',
          title: 'Order Status Update',
          description: 'Email template for order status updates',
          type: 'email',
          variables: ['order_id', 'customer_name', 'status', 'message']
        },
        {
          name: 'delivery-notification',
          title: 'Delivery Notification',
          description: 'Email template for delivery notifications',
          type: 'email',
          variables: ['order_id', 'customer_name', 'estimated_time', 'driver_name']
        },
        {
          name: 'low-stock-alert',
          title: 'Low Stock Alert',
          description: 'Email template for low stock alerts',
          type: 'email',
          variables: ['items', 'recipients']
        },
        {
          name: 'daily-sales-report',
          title: 'Daily Sales Report',
          description: 'Email template for daily sales reports',
          type: 'email',
          variables: ['date', 'total_orders', 'total_revenue']
        },
        {
          name: 'system-notification',
          title: 'System Notification',
          description: 'Email template for system notifications',
          type: 'email',
          variables: ['message', 'recipients']
        }
      ];

      return {
        success: true,
        data: templates,
        message: 'Templates retrieved successfully'
      };
    } catch (error) {
      throw new CustomError('Failed to retrieve templates', 500);
    }
  }

  /**
   * Get specific template
   */
  async getTemplate(templateName: string, preview: boolean = false): Promise<ApiResponse> {
    try {
      const templates: { [key: string]: any } = {
        'order-confirmation': {
          name: 'order-confirmation',
          title: 'Order Confirmation',
          description: 'Email template for order confirmation',
          type: 'email',
          variables: ['order_id', 'customer_name', 'total', 'status'],
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Order Confirmation</title>
            </head>
            <body>
              <h2>Order Confirmation</h2>
              <p>Thank you for your order!</p>
              <p><strong>Order #{{order_id}}</strong></p>
              <p>Total: ${{total}}</p>
              <p>Status: {{status}}</p>
            </body>
            </html>
          `,
          text: `Order Confirmation\n\nThank you for your order!\nOrder #{{order_id}}\nTotal: ${{total}}\nStatus: {{status}}`
        },
        'order-status-update': {
          name: 'order-status-update',
          title: 'Order Status Update',
          description: 'Email template for order status updates',
          type: 'email',
          variables: ['order_id', 'customer_name', 'status', 'message'],
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Order Status Update</title>
            </head>
            <body>
              <h2>Order Status Update</h2>
              <p>Your order status has been updated.</p>
              <p><strong>Order #{{order_id}}</strong></p>
              <p>New Status: {{status}}</p>
              <p>{{message}}</p>
            </body>
            </html>
          `,
          text: `Order Status Update\n\nYour order status has been updated.\nOrder #{{order_id}}\nNew Status: {{status}}\n{{message}}`
        },
        'delivery-notification': {
          name: 'delivery-notification',
          title: 'Delivery Notification',
          description: 'Email template for delivery notifications',
          type: 'email',
          variables: ['order_id', 'customer_name', 'estimated_time', 'driver_name'],
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Delivery Update</title>
            </head>
            <body>
              <h2>Delivery Update</h2>
              <p>Your delivery is on its way!</p>
              <p><strong>Order #{{order_id}}</strong></p>
              <p>Estimated delivery time: {{estimated_time}}</p>
              <p>Driver: {{driver_name}}</p>
            </body>
            </html>
          `,
          text: `Delivery Update\n\nYour delivery is on its way!\nOrder #{{order_id}}\nEstimated delivery time: {{estimated_time}}\nDriver: {{driver_name}}`
        },
        'low-stock-alert': {
          name: 'low-stock-alert',
          title: 'Low Stock Alert',
          description: 'Email template for low stock alerts',
          type: 'email',
          variables: ['items', 'recipients'],
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Low Stock Alert</title>
            </head>
            <body>
              <h2>Low Stock Alert</h2>
              <p>The following items are running low on stock:</p>
              <ul>
                {{#each items}}
                <li>{{name}} - {{stock}} {{unit}}</li>
                {{/each}}
              </ul>
            </body>
            </html>
          `,
          text: `Low Stock Alert\n\nThe following items are running low on stock:\n{{#each items}}\n- {{name}} - {{stock}} {{unit}}\n{{/each}}`
        },
        'daily-sales-report': {
          name: 'daily-sales-report',
          title: 'Daily Sales Report',
          description: 'Email template for daily sales reports',
          type: 'email',
          variables: ['date', 'total_orders', 'total_revenue'],
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Daily Sales Report</title>
            </head>
            <body>
              <h2>Daily Sales Report</h2>
              <p>Date: {{date}}</p>
              <p>Total Orders: {{total_orders}}</p>
              <p>Total Revenue: ${{total_revenue}}</p>
            </body>
            </html>
          `,
          text: `Daily Sales Report\n\nDate: {{date}}\nTotal Orders: {{total_orders}}\nTotal Revenue: ${{total_revenue}}`
        },
        'system-notification': {
          name: 'system-notification',
          title: 'System Notification',
          description: 'Email template for system notifications',
          type: 'email',
          variables: ['message', 'recipients'],
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>System Notification</title>
            </head>
            <body>
              <h2>System Notification</h2>
              <p>{{message}}</p>
            </body>
            </html>
          `,
          text: `System Notification\n\n{{message}}`
        }
      };

      const template = templates[templateName];
      if (!template) {
        throw new CustomError('Template not found', 404);
      }

      if (preview) {
        // Return template with sample data for preview
        const sampleData = this.getSampleData(templateName);
        template.preview = {
          html: this.renderTemplate(template.html, sampleData),
          text: this.renderTemplate(template.text, sampleData)
        };
      }

      return {
        success: true,
        data: template,
        message: 'Template retrieved successfully'
      };
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError('Failed to retrieve template', 500);
    }
  }

  /**
   * Get sample data for template preview
   */
  private getSampleData(templateName: string): any {
    const sampleData: { [key: string]: any } = {
      'order-confirmation': {
        order_id: '12345',
        customer_name: 'John Doe',
        total: '25.99',
        status: 'confirmed'
      },
      'order-status-update': {
        order_id: '12345',
        customer_name: 'John Doe',
        status: 'in_progress',
        message: 'Your order is being prepared'
      },
      'delivery-notification': {
        order_id: '12345',
        customer_name: 'John Doe',
        estimated_time: '30 minutes',
        driver_name: 'Mike Johnson'
      },
      'low-stock-alert': {
        items: [
          { name: 'Tomatoes', stock: 5, unit: 'kg' },
          { name: 'Onions', stock: 3, unit: 'kg' }
        ]
      },
      'daily-sales-report': {
        date: '2024-01-15',
        total_orders: 45,
        total_revenue: '1,250.50'
      },
      'system-notification': {
        message: 'System maintenance scheduled for tonight at 2 AM'
      }
    };

    return sampleData[templateName] || {};
  }

  /**
   * Render template with data
   */
  private renderTemplate(template: string, data: any): string {
    // Simple template rendering - in a real implementation, you would use a template engine
    let rendered = template;
    
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return rendered;
  }
}

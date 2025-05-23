import http from 'http';
import { invoiceController } from '../controllers/invoice.controller';

// Definição das rotas para notas fiscais
export const invoiceRoutes = [
  // Listar todas as notas fiscais
  {
    method: 'GET',
    path: '/invoices',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      await invoiceController.getAllInvoices(req, res);
    }
  },
  
  // Buscar uma nota fiscal por ID
  {
    method: 'GET',
    path: '/invoices/:id',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      await invoiceController.getInvoiceById(req, res, params.id);
    }
  },
  
  // Criar uma nova nota fiscal
  {
    method: 'POST',
    path: '/invoices',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      await invoiceController.createInvoice(req, res);
    }
  },
  
  // Atualizar uma nota fiscal
  {
    method: 'PUT',
    path: '/invoices/:id',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      await invoiceController.updateInvoice(req, res, params.id);
    }
  },
  
  // Atualizar o status de uma nota fiscal
  {
    method: 'PATCH',
    path: '/invoices/:id/status',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      await invoiceController.updateInvoiceStatus(req, res, params.id);
    }
  },
  
  // Excluir uma nota fiscal
  {
    method: 'DELETE',
    path: '/invoices/:id',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      await invoiceController.deleteInvoice(req, res, params.id);
    }
  },
  
  // Download do arquivo da nota fiscal
  {
    method: 'GET',
    path: '/invoices/:id/download',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      await invoiceController.downloadInvoice(req, res, params.id);
    }
  }
];

export default invoiceRoutes;
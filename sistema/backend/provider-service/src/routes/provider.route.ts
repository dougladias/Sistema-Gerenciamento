import http from 'http';
import { providerController } from '../controllers/provider.controller';

// Definição das rotas para fornecedores
export const providerRoutes = [
  // Listar todos os fornecedores (com filtros opcionais via query params)
  {
    method: 'GET',
    path: '/providers',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      await providerController.getAllProviders(req, res);
    }
  },
  
  // Obter fornecedores atuais (que estão no prédio)
  {
    method: 'GET',
    path: '/providers/current',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      await providerController.getCurrentProviders(req, res);
    }
  },
  
  // Buscar um fornecedor por ID
  {
    method: 'GET',
    path: '/providers/:id',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      await providerController.getProviderById(req, res, params.id);
    }
  },
  
  // Obter a foto de um fornecedor
  {
    method: 'GET',
    path: '/providers/:id/photo',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      await providerController.getProviderPhoto(req, res, params.id);
    }
  },
  
  // Criar um novo fornecedor
  {
    method: 'POST',
    path: '/providers',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      await providerController.createProvider(req, res);
    }
  },
  
  // Atualizar um fornecedor
  {
    method: 'PUT',
    path: '/providers/:id',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      await providerController.updateProvider(req, res, params.id);
    }
  },
  
  // Atualizar a foto de um fornecedor
  {
    method: 'PUT',
    path: '/providers/:id/photo',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      await providerController.updateProviderPhoto(req, res, params.id);
    }
  },
  
  // Atualizar o status de um fornecedor
  {
    method: 'PATCH',
    path: '/providers/:id/status',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      await providerController.updateProviderStatus(req, res, params.id);
    }
  },
  
  // Registrar entrada de um fornecedor
  {
    method: 'POST',
    path: '/providers/:id/check-in',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      await providerController.checkInProvider(req, res, params.id);
    }
  },
  
  // Registrar saída de um fornecedor
  {
    method: 'POST',
    path: '/providers/:id/check-out',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      await providerController.checkOutProvider(req, res, params.id);
    }
  },
  
  // Excluir um fornecedor
  {
    method: 'DELETE',
    path: '/providers/:id',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      await providerController.deleteProvider(req, res, params.id);
    }
  },

  // Verificar saúde do serviço
  {
    method: 'GET',
    path: '/health',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'provider-service' }));
    }
  }
];

export default providerRoutes;
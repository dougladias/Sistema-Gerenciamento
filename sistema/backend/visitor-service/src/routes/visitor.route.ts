import http from 'http';
import { visitorController } from '../controllers/visitor.controller';

// Definição das rotas para visitantes
export const visitorRoutes = [
  // Listar todos os visitantes (com filtros opcionais via query params)
  {
    method: 'GET',
    path: '/visitors',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      await visitorController.getAllVisitors(req, res);
    }
  },
  
  // Obter visitantes atuais (que estão no prédio)
  {
    method: 'GET',
    path: '/visitors/current',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      await visitorController.getCurrentVisitors(req, res);
    }
  },
  
  // Buscar um visitante por ID
  {
    method: 'GET',
    path: '/visitors/:id',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      await visitorController.getVisitorById(req, res, params.id);
    }
  },
  
  // Obter a foto de um visitante
  {
    method: 'GET',
    path: '/visitors/:id/photo',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      await visitorController.getVisitorPhoto(req, res, params.id);
    }
  },
  
  // Criar um novo visitante
  {
    method: 'POST',
    path: '/visitors',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      await visitorController.createVisitor(req, res);
    }
  },
  
  // Atualizar um visitante
  {
    method: 'PUT',
    path: '/visitors/:id',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      await visitorController.updateVisitor(req, res, params.id);
    }
  },
  
  // Atualizar a foto de um visitante
  {
    method: 'PUT',
    path: '/visitors/:id/photo',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      await visitorController.updateVisitorPhoto(req, res, params.id);
    }
  },
  
  // Atualizar o status de um visitante
  {
    method: 'PATCH',
    path: '/visitors/:id/status',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      await visitorController.updateVisitorStatus(req, res, params.id);
    }
  },
  
  // Registrar entrada de um visitante
  {
    method: 'POST',
    path: '/visitors/:id/check-in',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      await visitorController.checkInVisitor(req, res, params.id);
    }
  },
  
  // Registrar saída de um visitante
  {
    method: 'POST',
    path: '/visitors/:id/check-out',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      await visitorController.checkOutVisitor(req, res, params.id);
    }
  },
  
  // Excluir um visitante
  {
    method: 'DELETE',
    path: '/visitors/:id',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      await visitorController.deleteVisitor(req, res, params.id);
    }
  },

  // Verificar saúde do serviço
  {
    method: 'GET',
    path: '/health',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', service: 'visitor-service' }));
    }
  }
];

export default visitorRoutes;
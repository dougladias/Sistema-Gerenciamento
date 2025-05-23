import http from 'http';
import { visitorService } from '../services/visitor.service';
import { connectToDatabase } from '../config/database';
import { VisitorStatus, DocumentType } from '../models/visitor.model';

// Função para ler o corpo da requisição
export async function readRequestBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    const body: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      body.push(chunk);
    });
    req.on('end', () => {
      const bodyString = Buffer.concat(body).toString();
      if (bodyString) {
        try {
          resolve(JSON.parse(bodyString));
        } catch (e) {
          resolve(bodyString);
        }
      } else {
        resolve({});
      }
    });
  });
}

// Função para extrair parâmetros de query da URL
export function parseQueryParams(req: http.IncomingMessage): any {
  const url = new URL(req.url || '/', `http://${req.headers.host}`);
  const params: any = {};
  
  // Extrai todos os parâmetros de query
  for (const [key, value] of url.searchParams.entries()) {
    params[key] = value;
  }
  
  return params;
}

export class VisitorController {
  // Lista todos os visitantes (com filtros opcionais)
  async getAllVisitors(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      await connectToDatabase();
      
      // Extrai parâmetros de query para filtros
      const params = parseQueryParams(req);
      const filter: any = {};
      
      // Aplica filtros se fornecidos
      if (params.name) filter.name = params.name;
      if (params.documentNumber) filter.documentNumber = params.documentNumber;
      if (params.hostName) filter.hostName = params.hostName;
      
      // Filtro por status
      if (params.status && Object.values(VisitorStatus).includes(params.status)) {
        filter.status = params.status;
      }
      
      // Filtro por intervalo de datas
      if (params.startDate) filter.startDate = new Date(params.startDate);
      if (params.endDate) filter.endDate = new Date(params.endDate);
      
      // Busca os visitantes com os filtros aplicados
      const visitors = await visitorService.getAllVisitors(filter);
      
      // Remove o conteúdo binário das fotos para economizar largura de banda
      const visitorsWithoutPhotoContent = visitors.map(visitor => {
        const visitorObj = visitor.toObject ? visitor.toObject() : visitor;
        
        if (visitorObj.photo && visitorObj.photo.content) {
          const { content, ...photoWithoutContent } = visitorObj.photo;
          visitorObj.photo = photoWithoutContent;
        }
        
        return visitorObj;
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(visitorsWithoutPhotoContent));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao buscar visitantes: ${(error as Error).message}` }));
    }
  }

  // Busca um visitante por ID
  async getVisitorById(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      await connectToDatabase();
      const visitor = await visitorService.getVisitorById(id);
      
      if (!visitor) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Visitante não encontrado' }));
        return;
      }
      
      // Remove o conteúdo binário da foto para economizar largura de banda
      const visitorObj = visitor.toObject ? visitor.toObject() : visitor;
      
      if (visitorObj.photo && visitorObj.photo.content) {
        const { content, ...photoWithoutContent } = visitorObj.photo;
        visitorObj.photo = photoWithoutContent;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(visitorObj));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao buscar visitante: ${(error as Error).message}` }));
    }
  }

  // Cria um novo visitante
  async createVisitor(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      await connectToDatabase();
      const body = await readRequestBody(req);
      
      // Cria o visitante
      const visitor = await visitorService.createVisitor(body);
      
      // Remove o conteúdo binário da foto para economizar largura de banda
      const visitorObj = visitor.toObject ? visitor.toObject() : visitor;
      
      if (visitorObj.photo && visitorObj.photo.content) {
        const { content, ...photoWithoutContent } = visitorObj.photo;
        visitorObj.photo = photoWithoutContent;
      }
      
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(visitorObj));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao criar visitante: ${(error as Error).message}` }));
    }
  }

  // Atualiza um visitante
  async updateVisitor(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      await connectToDatabase();
      const body = await readRequestBody(req);
      
      // Atualiza o visitante
      const visitor = await visitorService.updateVisitor(id, body);
      
      if (!visitor) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Visitante não encontrado' }));
        return;
      }
      
      // Remove o conteúdo binário da foto para economizar largura de banda
      const visitorObj = visitor.toObject ? visitor.toObject() : visitor;
      
      if (visitorObj.photo && visitorObj.photo.content) {
        const { content, ...photoWithoutContent } = visitorObj.photo;
        visitorObj.photo = photoWithoutContent;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(visitorObj));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao atualizar visitante: ${(error as Error).message}` }));
    }
  }

  // Atualiza a foto de um visitante
  async updateVisitorPhoto(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      await connectToDatabase();
      const body = await readRequestBody(req);
      
      // Valida os dados da foto
      if (!body.content || !body.originalName || !body.mimetype) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Dados incompletos. É necessário fornecer content, originalName e mimetype' }));
        return;
      }
      
      // Atualiza a foto do visitante
      const visitor = await visitorService.updateVisitorPhoto(id, {
        originalName: body.originalName,
        mimetype: body.mimetype,
        size: body.size || 0,
        content: body.content
      });
      
      if (!visitor) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Visitante não encontrado' }));
        return;
      }
      
      // Remove o conteúdo binário da foto para economizar largura de banda
      const visitorObj = visitor.toObject ? visitor.toObject() : visitor;
      
      if (visitorObj.photo && visitorObj.photo.content) {
        const { content, ...photoWithoutContent } = visitorObj.photo;
        visitorObj.photo = photoWithoutContent;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(visitorObj));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao atualizar foto do visitante: ${(error as Error).message}` }));
    }
  }

  // Exclui um visitante
  async deleteVisitor(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      await connectToDatabase();
      const deleted = await visitorService.deleteVisitor(id);
      
      if (!deleted) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Visitante não encontrado' }));
        return;
      }
      
      res.writeHead(204);
      res.end();
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao excluir visitante: ${(error as Error).message}` }));
    }
  }

  // Atualiza o status de um visitante
  async updateVisitorStatus(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      await connectToDatabase();
      const body = await readRequestBody(req);
      
      if (!body.status || !Object.values(VisitorStatus).includes(body.status)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Status inválido' }));
        return;
      }
      
      // Atualiza o status do visitante
      const visitor = await visitorService.updateVisitorStatus(id, body.status);
      
      if (!visitor) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Visitante não encontrado' }));
        return;
      }
      
      // Remove o conteúdo binário da foto para economizar largura de banda
      const visitorObj = visitor.toObject ? visitor.toObject() : visitor;
      
      if (visitorObj.photo && visitorObj.photo.content) {
        const { content, ...photoWithoutContent } = visitorObj.photo;
        visitorObj.photo = photoWithoutContent;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(visitorObj));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao atualizar status do visitante: ${(error as Error).message}` }));
    }
  }

  // Registra a entrada de um visitante
  async checkInVisitor(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      await connectToDatabase();
      
      // Registra a entrada do visitante
      const visitor = await visitorService.checkInVisitor(id);
      
      if (!visitor) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Visitante não encontrado' }));
        return;
      }
      
      // Remove o conteúdo binário da foto para economizar largura de banda
      const visitorObj = visitor.toObject ? visitor.toObject() : visitor;
      
      if (visitorObj.photo && visitorObj.photo.content) {
        const { content, ...photoWithoutContent } = visitorObj.photo;
        visitorObj.photo = photoWithoutContent;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(visitorObj));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao registrar entrada do visitante: ${(error as Error).message}` }));
    }
  }

  // Registra a saída de um visitante
  async checkOutVisitor(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      await connectToDatabase();
      
      // Registra a saída do visitante
      const visitor = await visitorService.checkOutVisitor(id);
      
      if (!visitor) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Visitante não encontrado' }));
        return;
      }
      
      // Remove o conteúdo binário da foto para economizar largura de banda
      const visitorObj = visitor.toObject ? visitor.toObject() : visitor;
      
      if (visitorObj.photo && visitorObj.photo.content) {
        const { content, ...photoWithoutContent } = visitorObj.photo;
        visitorObj.photo = photoWithoutContent;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(visitorObj));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao registrar saída do visitante: ${(error as Error).message}` }));
    }
  }

  // Busca os visitantes atuais (que estão no prédio)
  async getCurrentVisitors(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      await connectToDatabase();
      
      // Busca os visitantes atuais
      const visitors = await visitorService.getCurrentVisitors();
      
      // Remove o conteúdo binário das fotos para economizar largura de banda
      const visitorsWithoutPhotoContent = visitors.map(visitor => {
        const visitorObj = visitor.toObject ? visitor.toObject() : visitor;
        
        if (visitorObj.photo && visitorObj.photo.content) {
          const { content, ...photoWithoutContent } = visitorObj.photo;
          visitorObj.photo = photoWithoutContent;
        }
        
        return visitorObj;
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(visitorsWithoutPhotoContent));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao buscar visitantes atuais: ${(error as Error).message}` }));
    }
  }

  // Obtém a foto de um visitante
  async getVisitorPhoto(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      await connectToDatabase();
      const visitor = await visitorService.getVisitorById(id);
      
      if (!visitor || !visitor.photo || !visitor.photo.content) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Foto do visitante não encontrada' }));
        return;
      }
      
      // Configura os cabeçalhos para a imagem
      res.writeHead(200, {
        'Content-Type': visitor.photo.mimetype,
        'Content-Disposition': `inline; filename="${encodeURIComponent(visitor.photo.originalName)}"`
      });
      
      // Envia o conteúdo binário da foto
      res.end(visitor.photo.content);
    } catch (error) {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Erro ao obter foto do visitante: ${(error as Error).message}` }));
      }
    }
  }
}

// Exporta uma instância única do controlador
export const visitorController = new VisitorController();
export default visitorController;
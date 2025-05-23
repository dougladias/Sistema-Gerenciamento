import http from 'http';
import { providerService } from '../services/provider.service';
import { connectToDatabase } from '../config/database';
import { ProviderStatus, DocumentType } from '../models/provider.model';

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

export class ProviderController {
  // Lista todos os fornecedores (com filtros opcionais)
  async getAllProviders(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
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
      if (params.status && Object.values(ProviderStatus).includes(params.status)) {
        filter.status = params.status;
      }
      
      // Filtro por intervalo de datas
      if (params.startDate) filter.startDate = new Date(params.startDate);
      if (params.endDate) filter.endDate = new Date(params.endDate);
      
      // Busca os fornecedores com os filtros aplicados
      const providers = await providerService.getAllProviders(filter);
      
      // Remove o conteúdo binário das fotos para economizar largura de banda
      const providersWithoutPhotoContent = providers.map(provider => {
        const providerObj = provider.toObject ? provider.toObject() : provider;
        
        if (providerObj.photo && providerObj.photo.content) {
          const { content, ...photoWithoutContent } = providerObj.photo;
          providerObj.photo = photoWithoutContent;
        }
        
        return providerObj;
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(providersWithoutPhotoContent));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao buscar fornecedores: ${(error as Error).message}` }));
    }
  }

  // Busca um fornecedor por ID
  async getProviderById(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      await connectToDatabase();
      const provider = await providerService.getProviderById(id);
      
      if (!provider) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Fornecedor não encontrado' }));
        return;
      }
      
      // Remove o conteúdo binário da foto para economizar largura de banda
      const providerObj = provider.toObject ? provider.toObject() : provider;
      
      if (providerObj.photo && providerObj.photo.content) {
        const { content, ...photoWithoutContent } = providerObj.photo;
        providerObj.photo = photoWithoutContent;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(providerObj));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao buscar fornecedor: ${(error as Error).message}` }));
    }
  }

  // Cria um novo fornecedor
  async createProvider(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      await connectToDatabase();
      const body = await readRequestBody(req);
      
      // Cria o fornecedor
      const provider = await providerService.createProvider(body);
      
      // Remove o conteúdo binário da foto para economizar largura de banda
      const providerObj = provider.toObject ? provider.toObject() : provider;
      
      if (providerObj.photo && providerObj.photo.content) {
        const { content, ...photoWithoutContent } = providerObj.photo;
        providerObj.photo = photoWithoutContent;
      }
      
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(providerObj));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao criar fornecedor: ${(error as Error).message}` }));
    }
  }

  // Atualiza um fornecedor
  async updateProvider(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      await connectToDatabase();
      const body = await readRequestBody(req);
      
      // Atualiza o fornecedor
      const provider = await providerService.updateProvider(id, body);
      
      if (!provider) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Fornecedor não encontrado' }));
        return;
      }
      
      // Remove o conteúdo binário da foto para economizar largura de banda
      const providerObj = provider.toObject ? provider.toObject() : provider;
      
      if (providerObj.photo && providerObj.photo.content) {
        const { content, ...photoWithoutContent } = providerObj.photo;
        providerObj.photo = photoWithoutContent;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(providerObj));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao atualizar fornecedor: ${(error as Error).message}` }));
    }
  }

  // Atualiza a foto de um fornecedor
  async updateProviderPhoto(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      await connectToDatabase();
      const body = await readRequestBody(req);
      
      // Valida os dados da foto
      if (!body.content || !body.originalName || !body.mimetype) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Dados incompletos. É necessário fornecer content, originalName e mimetype' }));
        return;
      }
      
      // Atualiza a foto do fornecedor
      const provider = await providerService.updateProviderPhoto(id, {
        originalName: body.originalName,
        mimetype: body.mimetype,
        size: body.size || 0,
        content: body.content
      });
      
      if (!provider) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Fornecedor não encontrado' }));
        return;
      }
      
      // Remove o conteúdo binário da foto para economizar largura de banda
      const providerObj = provider.toObject ? provider.toObject() : provider;
      
      if (providerObj.photo && providerObj.photo.content) {
        const { content, ...photoWithoutContent } = providerObj.photo;
        providerObj.photo = photoWithoutContent;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(providerObj));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao atualizar foto do fornecedor: ${(error as Error).message}` }));
    }
  }

  // Exclui um fornecedor
  async deleteProvider(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      await connectToDatabase();
      const deleted = await providerService.deleteProvider(id);
      
      if (!deleted) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Fornecedor não encontrado' }));
        return;
      }
      
      res.writeHead(204);
      res.end();
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao excluir fornecedor: ${(error as Error).message}` }));
    }
  }

  // Atualiza o status de um fornecedor
  async updateProviderStatus(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      await connectToDatabase();
      const body = await readRequestBody(req);
      
      if (!body.status || !Object.values(ProviderStatus).includes(body.status)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Status inválido' }));
        return;
      }
      
      // Atualiza o status do fornecedor
      const provider = await providerService.updateProviderStatus(id, body.status);
      
      if (!provider) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Fornecedor não encontrado' }));
        return;
      }
      
      // Remove o conteúdo binário da foto para economizar largura de banda
      const providerObj = provider.toObject ? provider.toObject() : provider;
      
      if (providerObj.photo && providerObj.photo.content) {
        const { content, ...photoWithoutContent } = providerObj.photo;
        providerObj.photo = photoWithoutContent;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(providerObj));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao atualizar status do fornecedor: ${(error as Error).message}` }));
    }
  }

  // Registra a entrada de um fornecedor
  async checkInProvider(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      await connectToDatabase();
      
      // Registra a entrada do fornecedor
      const provider = await providerService.checkInProvider(id);
      
      if (!provider) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Fornecedor não encontrado' }));
        return;
      }
      
      // Remove o conteúdo binário da foto para economizar largura de banda
      const providerObj = provider.toObject ? provider.toObject() : provider;
      
      if (providerObj.photo && providerObj.photo.content) {
        const { content, ...photoWithoutContent } = providerObj.photo;
        providerObj.photo = photoWithoutContent;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(providerObj));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao registrar entrada do fornecedor: ${(error as Error).message}` }));
    }
  }

  // Registra a saída de um fornecedor
  async checkOutProvider(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      await connectToDatabase();
      
      // Registra a saída do fornecedor
      const provider = await providerService.checkOutProvider(id);
      
      if (!provider) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Fornecedor não encontrado' }));
        return;
      }
      
      // Remove o conteúdo binário da foto para economizar largura de banda
      const providerObj = provider.toObject ? provider.toObject() : provider;
      
      if (providerObj.photo && providerObj.photo.content) {
        const { content, ...photoWithoutContent } = providerObj.photo;
        providerObj.photo = photoWithoutContent;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(providerObj));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao registrar saída do fornecedor: ${(error as Error).message}` }));
    }
  }

  // Busca os fornecedores atuais (que estão no prédio)
  async getCurrentProviders(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      await connectToDatabase();
      
      // Busca os fornecedores atuais
      const providers = await providerService.getCurrentProviders();
      
      // Remove o conteúdo binário das fotos para economizar largura de banda
      const providersWithoutPhotoContent = providers.map(provider => {
        const providerObj = provider.toObject ? provider.toObject() : provider;
        
        if (providerObj.photo && providerObj.photo.content) {
          const { content, ...photoWithoutContent } = providerObj.photo;
          providerObj.photo = photoWithoutContent;
        }
        
        return providerObj;
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(providersWithoutPhotoContent));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao buscar fornecedores atuais: ${(error as Error).message}` }));
    }
  }

  // Obtém a foto de um fornecedor
  async getProviderPhoto(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      await connectToDatabase();
      const provider = await providerService.getProviderById(id);
      
      if (!provider || !provider.photo || !provider.photo.content) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Foto do fornecedor não encontrada' }));
        return;
      }
      
      // Configura os cabeçalhos para a imagem
      res.writeHead(200, {
        'Content-Type': provider.photo.mimetype,
        'Content-Disposition': `inline; filename="${encodeURIComponent(provider.photo.originalName)}"`
      });
      
      // Envia o conteúdo binário da foto
      res.end(provider.photo.content);
    } catch (error) {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Erro ao obter foto do fornecedor: ${(error as Error).message}` }));
      }
    }
  }
}

// Exporta uma instância única do controlador
export const providerController = new ProviderController();
export default providerController;
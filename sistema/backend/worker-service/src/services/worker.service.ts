import http from 'http';
import url from 'url';
import { workerRepository } from '../repositories/worker.repository';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config();

// Tipos para o serviço HTTP
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS';
type RouteHandler = (req: http.IncomingMessage, res: http.ServerResponse, params: any) => Promise<void>;

interface Route {
  method: HttpMethod;
  path: string;
  handler: RouteHandler;
}

// Função para ler o corpo da requisição
async function readRequestBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    const body: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      body.push(chunk);
    });
    // Quando o corpo da requisição terminar de ser lido
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

// Classe principal do serviço
export class WorkerService {
  private server: http.Server;
  private routes: Route[] = [];

  constructor(private port: number = Number(process.env.PORT) || 4015) {
    // Registra as rotas
    this.registerRoutes();

    // Cria o servidor HTTP
    this.server = http.createServer(this.handleRequest.bind(this));
  }

  // Inicia o servidor
  public start(): void {
    this.server.listen(this.port, () => {
      console.log(`Servidor iniciado na porta ${this.port}`);
    });
  }

  // Registra as rotas da API
  private registerRoutes(): void {
    // Rota de teste
    this.addRoute('GET', '/', async (req, res) => {
      this.sendJson(res, { message: 'API de Funcionários funcionando!' });
    });

    // Rota de listar todos os funcionários
    this.addRoute('GET', '/workers', async (req, res) => {
      try {
        const workers = await workerRepository.findAll();
        this.sendJson(res, workers);
      } catch (error) {
        this.sendError(res, 500, 'Erro ao buscar funcionários');
      }
    });

    // Rota de buscar funcionário por ID
    this.addRoute('GET', '/workers/:id', async (req, res, params) => {
      try {
        const worker = await workerRepository.findById(params.id);
        if (!worker) {
          this.sendError(res, 404, 'Funcionário não encontrado');
          return;
        }
        // Envia a resposta JSON
        this.sendJson(res, worker);
      } catch (error) {
        this.sendError(res, 500, 'Erro ao buscar funcionário');
      }
    });

    // Rota de criar funcionário
    this.addRoute('POST', '/workers', async (req, res) => {
      try {
        const body = await readRequestBody(req);
        const worker = await workerRepository.create(body);
        this.sendJson(res, worker, 201);
      } catch (error) {
        this.sendError(res, 400, `Erro ao criar funcionário: ${(error as Error).message}`);
      }
    });

    // Rota de atualizar funcionário
    this.addRoute('PUT', '/workers/:id', async (req, res, params) => {
      try {
        const body = await readRequestBody(req);
        const worker = await workerRepository.update(params.id, body);
        if (!worker) {
          this.sendError(res, 404, 'Funcionário não encontrado');
          return;
        }
        // Envia a resposta JSON
        this.sendJson(res, worker);
      } catch (error) {
        this.sendError(res, 400, `Erro ao atualizar funcionário: ${(error as Error).message}`);
      }
    });

    // Rota de excluir funcionário
    this.addRoute('DELETE', '/workers/:id', async (req, res, params) => {
      try {
        const deleted = await workerRepository.delete(params.id);
        if (!deleted) {
          this.sendError(res, 404, 'Funcionário não encontrado');
          return;
        }
        // Envia resposta sem conteúdo
        this.sendNoContent(res);
      } catch (error) {
        this.sendError(res, 500, 'Erro ao excluir funcionário');
      }
    });

    // Rota de adicionar registro de entrada/saída
    this.addRoute('POST', '/workers/:id/entries', async (req, res, params) => {
      try {
        const body = await readRequestBody(req);
        const worker = await workerRepository.addEntry(params.id, body);
        if (!worker) {
          this.sendError(res, 404, 'Funcionário não encontrado');
          return;
        }
        // Envia a resposta JSON
        this.sendJson(res, worker);
      } catch (error) {
        this.sendError(res, 400, `Erro ao adicionar registro: ${(error as Error).message}`);
      }
    });

    // Rota de adicionar arquivo
    this.addRoute('POST', '/workers/:id/files', async (req, res, params) => {
      try {
        const body = await readRequestBody(req);
        const worker = await workerRepository.addFile(params.id, body);
        if (!worker) {
          this.sendError(res, 404, 'Funcionário não encontrado');
          return;
        }
        this.sendJson(res, worker);
      } catch (error) {
        this.sendError(res, 400, `Erro ao adicionar arquivo: ${(error as Error).message}`);
      }
    });

    // Rota de atualizar arquivo
    this.addRoute('PUT', '/workers/:id/files/:fileId', async (req, res, params) => {
      try {
        const body = await readRequestBody(req);
        const worker = await workerRepository.updateFile(params.id, params.fileId, body);
        if (!worker) {
          this.sendError(res, 404, 'Funcionário ou arquivo não encontrado');
          return;
        }
        this.sendJson(res, worker);
      } catch (error) {
        this.sendError(res, 400, `Erro ao atualizar arquivo: ${(error as Error).message}`);
      }
    });

    // Rota de remover arquivo
    this.addRoute('DELETE', '/workers/:id/files/:fileId', async (req, res, params) => {
      try {
        const worker = await workerRepository.removeFile(params.id, params.fileId);
        if (!worker) {
          this.sendError(res, 404, 'Funcionário ou arquivo não encontrado');
          return;
        }
        this.sendJson(res, worker);
      } catch (error) {
        this.sendError(res, 400, `Erro ao remover arquivo: ${(error as Error).message}`);
      }
    });
  }

  // Adiciona uma rota ao serviço
  private addRoute(method: HttpMethod, path: string, handler: RouteHandler): void {
    this.routes.push({ method, path, handler });
  }

  // Trata as requisições HTTP
  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // Habilita CORS
    this.setCorsHeaders(res);
    
    // Responde ao preflight OPTIONS
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Analisa a URL
    const parsedUrl = url.parse(req.url || '', true);
    const path = parsedUrl.pathname || '/';
    const method = req.method as HttpMethod;

    // Encontra a rota
    const route = this.findRoute(method, path);
    if (!route) {
      this.sendError(res, 404, 'Rota não encontrada');
      return;
    }

    // Executa o handler da rota
    try {
      await route.handler(req, res, route.params);
    } catch (error) {
      console.error('Erro não tratado:', error);
      this.sendError(res, 500, 'Erro interno do servidor');
    }
  }

  // Encontra uma rota que corresponda ao método e caminho
  private findRoute(method: HttpMethod, path: string): { handler: RouteHandler; params: any } | null {
    for (const route of this.routes) {
      if (route.method !== method) continue;

      // Analisa rotas com parâmetros
      const routeParts = route.path.split('/');
      const pathParts = path.split('/');

      // Comprimento diferente, não é uma correspondência
      if (routeParts.length !== pathParts.length) continue;

      const params: Record<string, string> = {};
      let match = true;

      for (let i = 0; i < routeParts.length; i++) {
        // Parâmetro dinâmico (:id)
        if (routeParts[i].startsWith(':')) {
          const paramName = routeParts[i].substring(1);
          params[paramName] = pathParts[i];
          continue;
        }

        // Correspondência exata
        if (routeParts[i] !== pathParts[i]) {
          match = false;
          break;
        }
      }

      // Se a rota corresponder, retorna o handler e os parâmetros
      if (match) {
        return { handler: route.handler, params };
      }
    }

    return null;
  }

  // Define os cabeçalhos CORS
  private setCorsHeaders(res: http.ServerResponse): void {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  // Envia uma resposta JSON
  private sendJson(res: http.ServerResponse, data: any, statusCode: number = 200): void {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  // Envia uma resposta de erro
  private sendError(res: http.ServerResponse, statusCode: number, message: string): void {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: message }));
  }

  // Envia uma resposta sem conteúdo (204)
  private sendNoContent(res: http.ServerResponse): void {
    res.writeHead(204);
    res.end();
  }
}

// Exporta o serviço
export const workerService = new WorkerService();
export default workerService;
import http from 'http';
import url from 'url';
import dotenv from 'dotenv';
import { workerRoutes } from '../routes/worker.routes';
import { documentRoutes } from '../routes/document.routes';
import { logRoutes } from '../routes/timeSheet.routes';

// Carrega as variáveis de ambiente
dotenv.config();

// Tipos para o serviço HTTP
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS';
type RouteHandler = (req: http.IncomingMessage, res: http.ServerResponse, params: any) => Promise<void>;

// Interface para as rotas
interface Route {
  method: HttpMethod;
  path: string;
  handler: RouteHandler;
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
      this.logAvailableRoutes();
    });
  }

  // Registra as rotas da API
  private registerRoutes(): void {
    // Rota de teste/status
    this.addRoute('GET', '/', async (req, res) => {
      this.sendJson(res, { message: 'API de Funcionários funcionando!' });
    });

    // Adiciona as rotas de funcionários
    workerRoutes.forEach(route => {
      this.addRoute(route.method as HttpMethod, route.path, route.handler);
    });

    // Adiciona as rotas de documentos
    documentRoutes.forEach(route => {
      this.addRoute(route.method as HttpMethod, route.path, route.handler);
    });

    // Adiciona as rotas de logs (registro de ponto)
    logRoutes.forEach(route => {
      this.addRoute(route.method as HttpMethod, route.path, route.handler);
    });
  }

  // Exibe as rotas disponíveis no console
  private logAvailableRoutes(): void {
    console.log(`📊 Endpoints disponíveis:`);
    
    // Rotas gerais
    console.log(`\n🔹 Rotas gerais:`);
    this.routes
      .filter(r => !r.path.startsWith('/workers'))
      .forEach(route => {
        console.log(`   ${route.method.padEnd(6)} ${route.path}`);
      });
    
    // Rotas de funcionários
    console.log(`\n🔹 Rotas de funcionários:`);
    this.routes
      .filter(r => r.path.startsWith('/workers') && !r.path.includes('/files') && !r.path.includes('/logs'))
      .forEach(route => {
        console.log(`   ${route.method.padEnd(6)} ${route.path}`);
      });
    
    // Rotas de documentos
    console.log(`\n🔹 Rotas de documentos:`);
    this.routes
      .filter(r => r.path.includes('/files'))
      .forEach(route => {
        console.log(`   ${route.method.padEnd(6)} ${route.path}`);
      });
    
    // Rotas de logs
    console.log(`\n🔹 Rotas de registro de ponto:`);
    this.routes
      .filter(r => r.path.includes('/logs'))
      .forEach(route => {
        console.log(`   ${route.method.padEnd(6)} ${route.path}`);
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
}

// Exporta o serviço
export const workerService = new WorkerService();
export default workerService;
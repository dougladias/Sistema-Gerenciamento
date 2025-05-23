import http from 'http';
import url from 'url';
import dotenv from 'dotenv';
import path from 'path';
import { connectToDatabase } from './config/database';
import { invoiceRoutes } from './routes/invoice.route';

// Carrega as variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Porta do serviço
const PORT = process.env.INVOICE_SERVICE_PORT || 4014;

// Classe do serviço de Notas Fiscais
class InvoiceService {
  private server: http.Server;
  private routes: any[] = [];

  constructor(private port: number = Number(PORT)) {
    // Registra as rotas
    this.registerRoutes();

    // Cria o servidor HTTP
    this.server = http.createServer(this.handleRequest.bind(this));
  }

  // Inicia o servidor
  public start(): void {
    this.server.listen(this.port, () => {
      console.log(`🚀 Serviço de Notas Fiscais iniciado na porta ${this.port}`);
      this.logAvailableRoutes();
    });
  }

  // Registra as rotas
  private registerRoutes(): void {
    // Rota de status
    this.addRoute('GET', '/', async (req: http.IncomingMessage, res: http.ServerResponse) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Serviço de Notas Fiscais ativo!' }));
    });

    // Adiciona as rotas de notas fiscais
    invoiceRoutes.forEach(route => {
      this.addRoute(route.method, route.path, route.handler);
    });
  }

  // Exibe as rotas disponíveis no console
  private logAvailableRoutes(): void {
    console.log(`📊 Endpoints disponíveis:`);
    this.routes.forEach(route => {
      console.log(`   ${route.method.padEnd(6)} ${route.path}`);
    });
  }

  // Adiciona uma rota
  private addRoute(method: string, path: string, handler: Function): void {
    this.routes.push({ method, path, handler });
  }

  // Trata as requisições
  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // Habilita CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Responde ao preflight OPTIONS
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Analisa a URL
    const parsedUrl = url.parse(req.url || '', true);
    const path = parsedUrl.pathname || '/';
    const method = req.method || 'GET';

    // Encontra a rota
    for (const route of this.routes) {
      if (route.method !== method) continue;

      // Verifica se é uma rota com parâmetros
      const routeParts = route.path.split('/');
      const pathParts = path.split('/');

      // Desconsidera se tiver partes diferentes
      if (routeParts.length !== pathParts.length) continue;

      const params: Record<string, string> = {};
      let match = true;

      // Compara cada parte da rota
      for (let i = 0; i < routeParts.length; i++) {
        // Parâmetro dinâmico (:id)
        if (routeParts[i].startsWith(':')) {
          const paramName = routeParts[i].substring(1);
          params[paramName] = pathParts[i];
          continue;
        }

        // Parte estática da rota
        if (routeParts[i] !== pathParts[i]) {
          match = false;
          break;
        }
      }

      // Se encontrou a rota
      if (match) {
        try {
          await route.handler(req, res, params);
          return;
        } catch (error) {
          console.error('Erro ao processar requisição:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Erro interno do servidor' }));
          return;
        }
      }
    }

    // Rota não encontrada
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Rota não encontrada' }));
  }
}

// Iniciar o serviço
async function startServer(): Promise<void> {
  try {
    console.log('🚀 Iniciando Serviço de Notas Fiscais...');
    
    // Conecta ao banco de dados
    await connectToDatabase();
    
    // Inicia o serviço HTTP
    const invoiceService = new InvoiceService();
    invoiceService.start();
    
    console.log('✅ Serviço de Notas Fiscais iniciado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
}

// Inicia o servidor
startServer();

// Trata o encerramento do processo
process.on('SIGINT', async () => {
  console.log('🛑 Serviço de Notas Fiscais encerrando...');
  process.exit(0);
});
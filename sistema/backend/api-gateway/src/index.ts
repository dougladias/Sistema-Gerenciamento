import http from 'http';
import url from 'url';
import { 
  API_GATEWAY_PORT, 
  TEMPLATE_SERVICE_HOST, 
  TEMPLATE_SERVICE_PORT,
  WORKER_SERVICE_HOST,
  WORKER_SERVICE_PORT 
} from './config/env';
import { handleWorkerRoutes } from './routes/worker.routes';
import { handleDocumentRoutes } from './routes/document.routes';
import { handleTemplateRoutes } from './routes/template.routes';
import { sendError } from './middlewares/errorHandler';
import { checkTemplateService } from './services/templateServiceChecker';
import { checkWorkerService } from './services/workerServiceChecker';

// API Gateway para rotear requisições para os serviços apropriados
export class SimpleApiGateway {
  private server: http.Server;

  // Construtor do API Gateway
  constructor() {
    this.server = http.createServer(this.handleRequest.bind(this));
  }

  // Método para iniciar o servidor
  public start(): void {
    this.server.listen(API_GATEWAY_PORT, () => {
      console.log(`🚪 API Gateway rodando na porta ${API_GATEWAY_PORT}`);
    });
  }

  // Método para lidar com as requisições
  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // Configuração de CORS para permitir requisições cross-origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');

    // Verifica se a requisição é uma pré-verificação CORS
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Processa a requisição
    try {
      const parsedUrl = url.parse(req.url || '/', true);
      const path = parsedUrl.pathname || '/';
      console.log(`🔄 Gateway recebeu requisição: ${req.method} ${path}`);
      
      // Tenta processar as rotas de documentos 
      if (await handleDocumentRoutes(req, res, path, new URL(req.url || '/', `http://${req.headers.host}`))) {
        return;
      }

      // Tenta processar as rotas de workers
      if (await handleWorkerRoutes(req, res, path, new URL(req.url || '/', `http://${req.headers.host}`))) {
        return;
      }

      // Tenta processar as rotas de templates
      if (await handleTemplateRoutes(req, res, path, new URL(req.url || '/', `http://${req.headers.host}`))) {
        return;
      }

      // Caso nenhuma rota seja encontrada
      console.warn(`❌ Rota não encontrada: ${path}`);
      sendError(res, 404, 'Rota não encontrada');
    } catch (error) {
      console.error('❌ Erro no API Gateway:', error);
      sendError(res, 500, 'Erro interno no API Gateway');
    }
  }
}

// Inicia o API Gateway
const apiGateway = new SimpleApiGateway();

// Verifica se os serviços estão disponíveis
async function startGateway() {
  console.log('🚀 Iniciando API Gateway...');  

  // Verifica se o serviço de templates está disponível
  const templateServiceAvailable = await checkTemplateService(
    TEMPLATE_SERVICE_HOST, 
    Number(TEMPLATE_SERVICE_PORT)
  );
  
  // Verifica se o serviço de workers está disponível
  const workerServiceAvailable = await checkWorkerService(
    WORKER_SERVICE_HOST,
    Number(WORKER_SERVICE_PORT)
  );
  
  // Exibe o status dos serviços
  console.log(`📊 Status dos serviços:`);  
  console.log(`Serviço de Workers (inclui Documentos): ${workerServiceAvailable ? '✅ Online' : '❌ Offline'}`);
  console.log(`Serviço de Templates: ${templateServiceAvailable ? '✅ Online' : '❌ Offline'}`);
  
  // Inicia o gateway mesmo que alguns serviços estejam offline
  apiGateway.start();
}

// Inicia o gateway
if (require.main === module) {
  startGateway();
}

export default apiGateway;
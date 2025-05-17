import http from 'http';
import url from 'url';
import templateRepository from '../repositories/template.repository';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config();

// Tipos para o serviço HTTP
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'HEAD';
type RouteHandler = (req: http.IncomingMessage, res: http.ServerResponse, params: any) => Promise<void>;

// Interface para as rotas
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
          // Se não conseguir parsear como JSON, retorna o buffer para upload de arquivo
          resolve(Buffer.concat(body));
        }
      } else {
        resolve({});
      }
    });
  });
}

// Classe principal do serviço
export class TemplateService {
  private server: http.Server;
  private routes: Route[] = [];

  // Construtor da classe
  constructor(private port: number = Number(process.env.PORT) || 4012) {
    // Registra as rotas
    this.registerRoutes();

    // Cria o servidor HTTP
    this.server = http.createServer(this.handleRequest.bind(this));
  }

  // Inicia o servidor
  public start(): void {
    this.server.listen(this.port, () => {
      console.log(`Servidor de Templates iniciado na porta ${this.port}`);
    });
  }

  // Registra as rotas da API
  private registerRoutes(): void {
    // Rota de teste
    this.addRoute('GET', '/', async (req, res) => {
      this.sendJson(res, { message: 'API de Templates funcionando!' });
    });

    // Rota HEAD para health check do API Gateway
    this.addRoute('HEAD', '/', async (req, res) => {
      // Apenas envia status 200 sem corpo
      res.writeHead(200);
      res.end();
    });

    // Rota de listar todos os templates
    this.addRoute('GET', '/templates', async (req, res) => {
      try {
        const templates: any[] = await templateRepository().find({});
        
        // Remove fileData do resultado para não sobrecarregar a resposta
        const templatesWithoutFileData = templates.map(template => {
          const templateObj = template.toObject();
          delete templateObj.fileData;
          return templateObj;
        });
        
        // Envia a resposta JSON
        this.sendJson(res, templatesWithoutFileData);
      } catch (error) {
        this.sendError(res, 500, 'Erro ao buscar templates');
      }
    });

    // Rota de buscar template por ID
    this.addRoute('GET', '/templates/:id', async (req, res, params) => {
      try {
        const template = await templateRepository().findById(params.id);
        if (!template) {
          this.sendError(res, 404, 'Template não encontrado');
          return;
        }

        // Remove fileData do resultado para não sobrecarregar a resposta
        const templateObj = template.toObject();
        delete templateObj.fileData;
        
        // Envia a resposta JSON
        this.sendJson(res, templateObj);
      } catch (error) {
        this.sendError(res, 500, 'Erro ao buscar template');
      }
    });
    
    // Rota para baixar o arquivo do template
    this.addRoute('GET', '/templates/:id/download', async (req, res, params) => {
      try {
        // Busca o template pelo ID
        const template = await templateRepository().findById(params.id);
        if (!template) {
          this.sendError(res, 404, 'Template não encontrado');
          return;
        }
        
        // Configura os cabeçalhos para download
        res.writeHead(200, { 
          'Content-Type': template.mimeType,
          'Content-Disposition': `attachment; filename=${template.fileName}`,
          'Content-Length': template.fileSize
        });
        
        // Envia o arquivo
        res.end(template.fileData);
      } catch (error) {
        this.sendError(res, 500, 'Erro ao baixar arquivo do template');
      }
    });

    // Rota de buscar templates por tipo
    this.addRoute('GET', '/templates/type/:type', async (req, res, params) => {
      try {
        const type = decodeURIComponent(params.type);
        const templates = await templateRepository().find({ type });
        
        // Remove fileData do resultado para não sobrecarregar a resposta
        const templatesWithoutFileData = templates.map(template => {
          const templateObj = template.toObject();
          delete templateObj.fileData;
          return templateObj;
        });
        
        // Envia a resposta JSON
        this.sendJson(res, templatesWithoutFileData);
      } catch (error) {
        this.sendError(res, 500, 'Erro ao buscar templates por tipo');
      }
    });

    // Rota de criar template
    this.addRoute('POST', '/templates', async (req, res) => {
      try {
        // Para criar um template, usamos multipart/form-data        
        // Os dados do arquivo e metadados são enviados como JSON
        const body = await readRequestBody(req);
        
        // Verifica se os dados necessários estão presentes
        if (!body.name || !body.type || !body.description || !body.fileData) {
          this.sendError(res, 400, 'Dados incompletos para criar o template');
          return;
        }
        
        // Converte fileData para Buffer
        const template = await templateRepository().create({
          name: body.name,
          type: body.type,
          description: body.description,
          createdBy: body.createdBy,
          format: body.format,
          fileData: Buffer.from(body.fileData, 'base64'),
          fileName: body.fileName,
          fileSize: body.fileSize,
          mimeType: body.mimeType,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Remove fileData do resultado para não sobrecarregar a resposta
        const templateObj = template.toObject();
        delete templateObj.fileData;
        
        // Envia a resposta JSON
        this.sendJson(res, templateObj, 201);
      } catch (error) {
        this.sendError(res, 400, `Erro ao criar template: ${(error as Error).message}`);
      }
    });

    // Rota de atualizar template
    this.addRoute('PUT', '/templates/:id', async (req, res, params) => {
      try {
        const body = await readRequestBody(req);
        
        // Remove fileData se não for fornecido (para não substituir o arquivo existente)
        if (!body.fileData) {
          delete body.fileData;
          delete body.fileName;
          delete body.fileSize;
          delete body.mimeType;
        } else {
          // Se fileData for fornecido, converte para Buffer
          body.fileData = Buffer.from(body.fileData, 'base64');
        }
        
        // Verifica se os dados necessários estão presentes
        body.updatedAt = new Date();
        
        // Atualiza o template no banco de dados
        const template = await templateRepository().findByIdAndUpdate(params.id, body, { new: true });
        if (!template) {
          this.sendError(res, 404, 'Template não encontrado');
          return;
        }
        
        // Remove fileData do resultado para não sobrecarregar a resposta
        const templateObj = template.toObject();
        delete templateObj.fileData;
        
        // Envia a resposta JSON
        this.sendJson(res, templateObj);
      } catch (error) {
        this.sendError(res, 400, `Erro ao atualizar template: ${(error as Error).message}`);
      }
    });

    // Rota de excluir template
    this.addRoute('DELETE', '/templates/:id', async (req, res, params) => {
      try {
        // Verifica se o ID do template foi fornecido
        const deleted = await templateRepository().findByIdAndDelete(params.id);
        if (!deleted) {
          this.sendError(res, 404, 'Template não encontrado');
          return;
        }
        // Envia resposta sem conteúdo
        this.sendNoContent(res);
      } catch (error) {
        this.sendError(res, 500, 'Erro ao excluir template');
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
      
      // Verifica se a rota tem parâmetros dinâmicos
      const params: Record<string, string> = {};
      let match = true;
      
      // Compara cada parte da rota com a parte correspondente do caminho
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
export const templateService = new TemplateService();
export default templateService;
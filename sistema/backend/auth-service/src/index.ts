import http from 'http';
import { connectToDatabase } from './config/database';
import { permissionService } from './services/permission.service';
import { roleService } from './services/role.service';
import { userService } from './services/user.service';
import authRoutes from './routes/auth.routes';
import backofficeRoutes from './routes/backoffice.routes';
import userRoutes from './routes/user.routes';
import { corsMiddleware } from './middlewares/auth.middleware';
import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Tipos para o serviço HTTP
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS';
type RouteHandler = (req: http.IncomingMessage, res: http.ServerResponse, params: any) => Promise<void>;

// Interface para as rotas
interface Route {
  method: HttpMethod;
  path: string;
  handler: RouteHandler;
}

// Classe principal do serviço de autenticação
export class AuthenticationService {
  private server: http.Server;
  private routes: Route[] = [];
  private port: number;

  constructor(port: number = Number(process.env.AUTH_SERVICE_PORT) || 4016) {
    this.port = port;
    this.registerRoutes();
    this.server = http.createServer(this.handleRequest.bind(this));
  }

  // Inicia o servidor
  public start(): void {
    this.server.listen(this.port, async () => {
      console.log(`🔐 Auth Service iniciado na porta ${this.port}`);
      console.log(`📝 ${process.env.APP_NAME || 'Sistema de Autenticação'}`);
      await this.initializeSystem();
      this.logAvailableRoutes();
    });
  }

  // Inicializa o sistema (cria usuário admin padrão, roles, etc.)
  private async initializeSystem(): Promise<void> {
    try {
      await connectToDatabase();
      
      console.log('🔄 Inicializando sistema de autenticação...');
      
      // Inicializa permissões padrão
      await this.createDefaultPermissions();
      
      // Cria roles padrão
      await this.createDefaultRoles();
      
      // Cria usuário admin padrão
      await this.createDefaultAdmin();
      
      console.log('✅ Sistema de autenticação inicializado com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao inicializar sistema:', error);
    }
  }

  // Cria permissões padrão do sistema
  private async createDefaultPermissions(): Promise<void> {
    try {
      const result = await permissionService.initializeDefaultPermissions();
      if (result.success) {
        console.log('✅ Permissões padrão verificadas');
      }
    } catch (error) {
      console.error('Erro ao criar permissões padrão:', error);
    }
  }

  // Cria roles padrão do sistema
  private async createDefaultRoles(): Promise<void> {
    const defaultRoles = [
      {
        name: 'Super Admin',
        description: 'Administrador com acesso total ao sistema',
        permissions: [
          'backoffice:manage', 'backoffice:access', 'backoffice:users',
          'workers:read', 'workers:create', 'workers:update', 'workers:delete',
          'documents:read', 'documents:upload', 'documents:download', 'documents:delete',
          'timesheet:read', 'timesheet:create', 'timesheet:update', 'timesheet:delete', 'reports:read', 'reports:create'
        ],
        isDefault: false
      },
      {
        name: 'Gerente RH',
        description: 'Gerente com acesso a funcionários e relatórios',
        permissions: [
          'backoffice:access',
          'workers:read', 'workers:create', 'workers:update',
          'documents:read', 'documents:upload', 'documents:download',
          'timesheet:read', 'timesheet:create', 'timesheet:update', 'reports:read'
        ],
        isDefault: false
      },
      {
        name: 'Operador',
        description: 'Operador com acesso limitado',
        permissions: [
          'workers:read', 'workers:create',
          'documents:read', 'documents:upload',
          'timesheet:read', 'timesheet:create'
        ],
        isDefault: true
      },
      {
        name: 'Visualizador',
        description: 'Acesso somente leitura',
        permissions: [
          'workers:read',
          'documents:read',
          'timesheet:read'
        ],
        isDefault: false
      }
    ];

    for (const roleData of defaultRoles) {
      try {
        const result = await roleService.createRole(roleData);
        if (result.success) {
          console.log(`✅ Role criada: ${roleData.name}`);
        }
      } catch (error) {
        // Role já existe, continua
      }
    }
  }

  // Cria usuário admin padrão
  private async createDefaultAdmin(): Promise<void> {
    try {
      // Busca role de Super Admin
      const adminRole = await roleService.getRoleByName('Super Admin') as { _id: string };
      if (!adminRole) {
        console.error('❌ Role Super Admin não encontrada');
        return;
      }

      const adminData = {
        name: 'Administrador',
        email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@sistema.com',
        password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
        role: adminRole._id,
        status: 'active' as const
      };

      const result = await userService.createUser(adminData);
      if (result.success) {
        console.log(`✅ Usuário admin criado: ${adminData.email}`);
        console.log(`🔑 Senha padrão: ${adminData.password}`);
        console.log('⚠️  ALTERE A SENHA PADRÃO IMEDIATAMENTE!');
      }
    } catch (error) {
      // Admin já existe
    }
  }

  // Registra as rotas do serviço
  private registerRoutes(): void {
    // Rota de status/health check
    this.addRoute('GET', '/health', async (req, res) => {
      try {
        await connectToDatabase();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          service: 'auth-service',
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          service: 'auth-service',
          status: 'unhealthy',
          error: 'Database connection failed'
        }));
      }
    });

    // Rota raiz
    this.addRoute('GET', '/', async (req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: 'Sistema de Autenticação funcionando!',
        service: 'auth-service',
        version: '1.0.0',
        endpoints: {
          auth: '/auth/*',
          backoffice: '/backoffice/*',
          user: '/user/*',
          health: '/health'
        }
      }));
    });

    // Adiciona rotas de autenticação
    authRoutes.forEach((route: any) => {
      this.addRoute(route.method, route.path, route.handler);
    });

    // Adiciona rotas do backoffice
    backofficeRoutes.forEach((route: any) => {
      this.addRoute(route.method, route.path, route.handler);
    });

    // Adiciona rotas de usuário
    userRoutes.forEach((route: any) => {
      this.addRoute(route.method, route.path, route.handler);
    });
  }

  // Adiciona uma rota
  private addRoute(method: HttpMethod, path: string, handler: RouteHandler): void {
    this.routes.push({ method, path, handler });
  }

  // Trata requisições HTTP
  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      // Aplica middleware de CORS
      const corsResult = await corsMiddleware(req, res);
      if (!corsResult) return; // Se foi OPTIONS, já foi respondido

      const url = require('url');
      const parsedUrl = url.parse(req.url || '', true);
      const path = parsedUrl.pathname || '/';
      const method = req.method as HttpMethod;

      // Log da requisição
      console.log(`[${new Date().toISOString()}] ${method} ${path} - ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);

      // Encontra rota
      const route = this.findRoute(method, path);
      if (!route) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: 'Rota não encontrada',
          method,
          path,
          availableRoutes: this.routes.map(r => `${r.method} ${r.path}`)
        }));
        return;
      }

      // Executa o handler da rota
      await route.handler(req, res, route.params);

    } catch (error) {
      console.error('Erro não tratado na requisição:', error);
      
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: 'Erro interno do servidor',
          timestamp: new Date().toISOString()
        }));
      }
    }
  }

  // Encontra rota que corresponde ao método e caminho
  private findRoute(method: HttpMethod, path: string): { handler: RouteHandler; params: any } | null {
    for (const route of this.routes) {
      if (route.method !== method) continue;

      const routeParts = route.path.split('/');
      const pathParts = path.split('/');

      if (routeParts.length !== pathParts.length) continue;

      const params: Record<string, string> = {};
      let match = true;

      for (let i = 0; i < routeParts.length; i++) {
        if (routeParts[i].startsWith(':')) {
          const paramName = routeParts[i].substring(1);
          params[paramName] = pathParts[i];
          continue;
        }

        if (routeParts[i] !== pathParts[i]) {
          match = false;
          break;
        }
      }

      if (match) {
        return { handler: route.handler, params };
      }
    }

    return null;
  }

  // Exibe rotas disponíveis
  private logAvailableRoutes(): void {
    console.log(`\n📊 Endpoints disponíveis:`);
    
    console.log(`\n🔹 Sistema:`);
    this.routes
      .filter(r => !r.path.startsWith('/auth') && !r.path.startsWith('/backoffice') && !r.path.startsWith('/user'))
      .forEach(route => {
        console.log(`   ${route.method.padEnd(6)} ${route.path}`);
      });
    
    console.log(`\n🔹 Autenticação:`);
    this.routes
      .filter(r => r.path.startsWith('/auth'))
      .forEach(route => {
        console.log(`   ${route.method.padEnd(6)} ${route.path}`);
      });
    
    console.log(`\n🔹 Backoffice:`);
    this.routes
      .filter(r => r.path.startsWith('/backoffice'))
      .forEach(route => {
        console.log(`   ${route.method.padEnd(6)} ${route.path}`);
      });

    console.log(`\n🔹 Usuário:`);
    this.routes
      .filter(r => r.path.startsWith('/user'))
      .forEach(route => {
        console.log(`   ${route.method.padEnd(6)} ${route.path}`);
      });

    console.log(`\n🌐 Acesse: http://localhost:${this.port}`);
  }

  // Para o servidor
  public stop(): void {
    this.server.close(() => {
      console.log('🛑 Auth Service parado');
    });
  }
}

// ===== INICIALIZAÇÃO =====

async function startServer() {
  try {
    console.log('🚀 Iniciando Auth Service...');
    
    // Verifica variáveis de ambiente essenciais
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️  JWT_SECRET não configurado! Usando valor padrão (INSEGURO para produção)');
    }
    
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI não configurado!');
      console.log('💡 Configure a variável MONGODB_URI no arquivo .env');
      process.exit(1);
    }

    console.log(`📝 Configuração: porta=${process.env.AUTH_SERVICE_PORT || 4016}, banco=${process.env.MONGODB_URI?.substring(0, 20)}...`);
    
    // Inicia o serviço de autenticação
    const authService = new AuthenticationService();
    authService.start();
    
    // Configura handlers para encerramento graceful
    process.on('SIGINT', () => {
      console.log('\n🛑 Recebido SIGINT, encerrando Auth Service...');
      authService.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Recebido SIGTERM, encerrando Auth Service...');
      authService.stop();
      process.exit(0);
    });

    // Handler para erros não capturados
    process.on('uncaughtException', (error) => {
      console.error('❌ Erro não capturado:', error);
      authService.stop();
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promise rejeitada não tratada:', reason);
      authService.stop();
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Exporta a classe e função de inicialização
export { startServer };
export default AuthenticationService;

// Inicia o servidor se este arquivo for executado diretamente
if (require.main === module) {
  startServer();
}
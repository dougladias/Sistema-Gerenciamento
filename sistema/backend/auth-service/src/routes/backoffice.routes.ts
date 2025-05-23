import http from 'http';
import { userService } from '../services/user.service';
import { roleService } from '../services/role.service';
import { permissionService } from '../services/permission.service';
import { connectToDatabase } from '../config/database';
import { authMiddleware } from '../middlewares/auth.middleware';
import { permissionMiddleware } from '../middlewares/permission.middleware';

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

// Middleware para aplicar autenticação e permissão
async function applyMiddleware(
  req: http.IncomingMessage, 
  res: http.ServerResponse, 
  requiredPermission?: string
): Promise<boolean> {
  // Aplica middleware de autenticação
  const authResult = await authMiddleware(req, res);
  if (!authResult) return false;

  // Aplica middleware de permissão se especificado
  if (requiredPermission) {
    const permResult = await permissionMiddleware(requiredPermission)(req, res);
    if (!permResult) return false;
  }

  return true;
}

// Definição das rotas do backoffice
export const backofficeRoutes = [
  // ===== DASHBOARD =====
  {
    method: 'GET',
    path: '/backoffice/dashboard',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        // Verifica autenticação e permissão
        const hasAccess = await applyMiddleware(req, res, 'backoffice:access');
        if (!hasAccess) return;

        await connectToDatabase();

        // Busca estatísticas do dashboard
        const stats = await userService.getDashboardStats();
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: stats
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: `Erro ao carregar dashboard: ${(error as Error).message}` 
        }));
      }
    }
  },

  // ===== GESTÃO DE USUÁRIOS =====
  {
    method: 'GET',
    path: '/backoffice/users',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const hasAccess = await applyMiddleware(req, res, 'backoffice:users');
        if (!hasAccess) return;

        await connectToDatabase();
        
        // Parse query parameters
        const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
        const page = parseInt(parsedUrl.searchParams.get('page') || '1');
        const limit = parseInt(parsedUrl.searchParams.get('limit') || '10');
        const search = parsedUrl.searchParams.get('search') || '';
        const status = parsedUrl.searchParams.get('status') || '';
        const role = parsedUrl.searchParams.get('role') || '';

        const result = await userService.getUsers({
          page,
          limit,
          search,
          status,
          role
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: result
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: `Erro ao buscar usuários: ${(error as Error).message}` 
        }));
      }
    }
  },

  {
    method: 'GET',
    path: '/backoffice/users/:id',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        const hasAccess = await applyMiddleware(req, res, 'backoffice:users');
        if (!hasAccess) return;

        await connectToDatabase();
        const user = await userService.getUserById(params.id);

        if (!user) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false,
            error: 'Usuário não encontrado' 
          }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: user
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: `Erro ao buscar usuário: ${(error as Error).message}` 
        }));
      }
    }
  },

  {
    method: 'POST',
    path: '/backoffice/users',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const hasAccess = await applyMiddleware(req, res, 'backoffice:users');
        if (!hasAccess) return;

        await connectToDatabase();
        const body = await readRequestBody(req);
        
        // Adiciona o ID do usuário que está criando
        const creatorId = (req as any).user?.userId;
        body.createdBy = creatorId;

        const result = await userService.createUser(body);

        if (!result.success) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          return;
        }

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: `Erro ao criar usuário: ${(error as Error).message}` 
        }));
      }
    }
  },

  {
    method: 'PUT',
    path: '/backoffice/users/:id',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        const hasAccess = await applyMiddleware(req, res, 'backoffice:users');
        if (!hasAccess) return;

        await connectToDatabase();
        const body = await readRequestBody(req);
        
        const result = await userService.updateUser(params.id, body);

        if (!result.success) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: `Erro ao atualizar usuário: ${(error as Error).message}` 
        }));
      }
    }
  },

  {
    method: 'DELETE',
    path: '/backoffice/users/:id',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        const hasAccess = await applyMiddleware(req, res, 'backoffice:users');
        if (!hasAccess) return;

        await connectToDatabase();
        
        // Verifica se não está tentando deletar a própria conta
        const currentUserId = (req as any).user?.userId;
        if (currentUserId === params.id) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false,
            error: 'Não é possível excluir sua própria conta' 
          }));
          return;
        }

        const result = await userService.deleteUser(params.id);

        if (!result.success) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: `Erro ao excluir usuário: ${(error as Error).message}` 
        }));
      }
    }
  },

  {
    method: 'PUT',
    path: '/backoffice/users/:id/status',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        const hasAccess = await applyMiddleware(req, res, 'backoffice:users');
        if (!hasAccess) return;

        await connectToDatabase();
        const body = await readRequestBody(req);
        
        const result = await userService.updateUserStatus(params.id, body.status);

        if (!result.success) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: `Erro ao atualizar status: ${(error as Error).message}` 
        }));
      }
    }
  },

  {
    method: 'PUT',
    path: '/backoffice/users/:id/reset-password',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        const hasAccess = await applyMiddleware(req, res, 'backoffice:users');
        if (!hasAccess) return;

        await connectToDatabase();
        const body = await readRequestBody(req);
        
        if (!body.newPassword) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false,
            error: 'Nova senha é obrigatória' 
          }));
          return;
        }

        const result = await userService.resetUserPassword(params.id, body.newPassword);

        if (!result.success) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: `Erro ao resetar senha: ${(error as Error).message}` 
        }));
      }
    }
  },

  // ===== GESTÃO DE ROLES =====
  {
    method: 'GET',
    path: '/backoffice/roles',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const hasAccess = await applyMiddleware(req, res, 'backoffice:access');
        if (!hasAccess) return;

        await connectToDatabase();
        const roles = await roleService.getAllRoles();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: roles
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: `Erro ao buscar roles: ${(error as Error).message}` 
        }));
      }
    }
  },

  {
    method: 'GET',
    path: '/backoffice/roles/:id',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        const hasAccess = await applyMiddleware(req, res, 'backoffice:access');
        if (!hasAccess) return;

        await connectToDatabase();
        const role = await roleService.getRoleById(params.id);

        if (!role) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false,
            error: 'Role não encontrada' 
          }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: role
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: `Erro ao buscar role: ${(error as Error).message}` 
        }));
      }
    }
  },

  {
    method: 'POST',
    path: '/backoffice/roles',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const hasAccess = await applyMiddleware(req, res, 'backoffice:manage');
        if (!hasAccess) return;

        await connectToDatabase();
        const body = await readRequestBody(req);
        
        const result = await roleService.createRole(body);

        if (!result.success) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          return;
        }

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: `Erro ao criar role: ${(error as Error).message}` 
        }));
      }
    }
  },

  {
    method: 'PUT',
    path: '/backoffice/roles/:id',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        const hasAccess = await applyMiddleware(req, res, 'backoffice:manage');
        if (!hasAccess) return;

        await connectToDatabase();
        const body = await readRequestBody(req);
        
        const result = await roleService.updateRole(params.id, body);

        if (!result.success) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: `Erro ao atualizar role: ${(error as Error).message}` 
        }));
      }
    }
  },

  {
    method: 'DELETE',
    path: '/backoffice/roles/:id',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        const hasAccess = await applyMiddleware(req, res, 'backoffice:manage');
        if (!hasAccess) return;

        await connectToDatabase();
        
        const result = await roleService.deleteRole(params.id);

        if (!result.success) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: `Erro ao excluir role: ${(error as Error).message}` 
        }));
      }
    }
  },

  {
    method: 'POST',
    path: '/backoffice/roles/:id/clone',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        const hasAccess = await applyMiddleware(req, res, 'backoffice:manage');
        if (!hasAccess) return;

        await connectToDatabase();
        const body = await readRequestBody(req);
        
        if (!body.newName) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false,
            error: 'Nome para nova role é obrigatório' 
          }));
          return;
        }

        const result = await roleService.cloneRole(params.id, body.newName);

        if (!result.success) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          return;
        }

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: `Erro ao clonar role: ${(error as Error).message}` 
        }));
      }
    }
  },

  {
    method: 'GET',
    path: '/backoffice/roles/:id/users',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        const hasAccess = await applyMiddleware(req, res, 'backoffice:access');
        if (!hasAccess) return;

        await connectToDatabase();
        const users = await roleService.getUsersByRole(params.id);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: users
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: `Erro ao buscar usuários da role: ${(error as Error).message}` 
        }));
      }
    }
  },

  // ===== PERMISSÕES DISPONÍVEIS =====
  {
    method: 'GET',
    path: '/backoffice/permissions',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const hasAccess = await applyMiddleware(req, res, 'backoffice:access');
        if (!hasAccess) return;

        await connectToDatabase();
        const permissions = await permissionService.getAvailablePermissions();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: permissions
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: `Erro ao buscar permissões: ${(error as Error).message}` 
        }));
      }
    }
  },

  {
    method: 'GET',
    path: '/backoffice/permissions/stats',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const hasAccess = await applyMiddleware(req, res, 'backoffice:access');
        if (!hasAccess) return;

        await connectToDatabase();
        const stats = await permissionService.getPermissionStats();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: stats
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: `Erro ao buscar estatísticas de permissões: ${(error as Error).message}` 
        }));
      }
    }
  },

  // ===== LOGS DE AUDITORIA =====
  {
    method: 'GET',
    path: '/backoffice/logs',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const hasAccess = await applyMiddleware(req, res, 'backoffice:access');
        if (!hasAccess) return;

        await connectToDatabase();
        
        // Parse query parameters
        const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
        const page = parseInt(parsedUrl.searchParams.get('page') || '1');
        const limit = parseInt(parsedUrl.searchParams.get('limit') || '50');
        const userId = parsedUrl.searchParams.get('userId') || '';
        const action = parsedUrl.searchParams.get('action') || '';
        const startDate = parsedUrl.searchParams.get('startDate') || '';
        const endDate = parsedUrl.searchParams.get('endDate') || '';

        const result = await userService.getAuditLogs({
          page,
          limit,
          userId,
          action,
          startDate,
          endDate
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: result
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: `Erro ao buscar logs: ${(error as Error).message}` 
        }));
      }
    }
  },

  // ===== RELATÓRIOS =====
  {
    method: 'GET',
    path: '/backoffice/reports/users',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const hasAccess = await applyMiddleware(req, res, 'backoffice:access');
        if (!hasAccess) return;

        await connectToDatabase();
        
        const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
        const format = parsedUrl.searchParams.get('format') || 'json';
        const startDate = parsedUrl.searchParams.get('startDate') || '';
        const endDate = parsedUrl.searchParams.get('endDate') || '';

        const report = await userService.generateUserReport({
          format,
          startDate,
          endDate
        });

        if (format === 'csv') {
          res.writeHead(200, { 
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="relatorio-usuarios.csv"'
          });
          res.end(report);
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            data: report
          }));
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: `Erro ao gerar relatório: ${(error as Error).message}` 
        }));
      }
    }
  },

  {
    method: 'GET',
    path: '/backoffice/reports/roles',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const hasAccess = await applyMiddleware(req, res, 'backoffice:access');
        if (!hasAccess) return;

        await connectToDatabase();
        const stats = await roleService.getRoleStats();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: stats
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: `Erro ao gerar relatório de roles: ${(error as Error).message}` 
        }));
      }
    }
  },

  // ===== CONFIGURAÇÕES DO SISTEMA =====
  {
    method: 'GET',
    path: '/backoffice/settings',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const hasAccess = await applyMiddleware(req, res, 'backoffice:manage');
        if (!hasAccess) return;

        await connectToDatabase();
        
        // Retorna configurações básicas do sistema
        const settings = {
          system: {
            name: process.env.APP_NAME || 'Sistema de Funcionários',
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development'
          },
          security: {
            sessionTimeout: process.env.JWT_EXPIRE || '8h',
            maxLoginAttempts: 5,
            lockoutDuration: '2h'
          },
          features: {
            registration: process.env.ALLOW_REGISTRATION === 'true',
            passwordReset: true,
            auditLogs: true
          },
          database: {
            connected: true,
            host: process.env.MONGODB_URI ? 'Configured' : 'Not configured'
          }
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: settings
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: `Erro ao buscar configurações: ${(error as Error).message}` 
        }));
      }
    }
  },

  // ===== INICIALIZAÇÃO DO SISTEMA =====
  {
    method: 'POST',
    path: '/backoffice/initialize',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const hasAccess = await applyMiddleware(req, res, 'backoffice:manage');
        if (!hasAccess) return;

        await connectToDatabase();
        
        // Inicializa permissões padrão
        const permissionResult = await permissionService.initializeDefaultPermissions();
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Sistema inicializado com sucesso',
          data: {
            permissions: permissionResult
          }
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: `Erro ao inicializar sistema: ${(error as Error).message}` 
        }));
      }
    }
  },

  // ===== ESTATÍSTICAS GERAIS =====
  {
    method: 'GET',
    path: '/backoffice/stats',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const hasAccess = await applyMiddleware(req, res, 'backoffice:access');
        if (!hasAccess) return;

        await connectToDatabase();
        
        // Busca estatísticas de diferentes serviços
        const [userStats, roleStats, permissionStats] = await Promise.all([
          userService.getDashboardStats(),
          roleService.getRoleStats(),
          permissionService.getPermissionStats()
        ]);

        const stats = {
          users: userStats,
          roles: roleStats,
          permissions: permissionStats,
          system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
          }
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: stats
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: `Erro ao buscar estatísticas: ${(error as Error).message}` 
        }));
      }
    }
  }
];

export default backofficeRoutes;
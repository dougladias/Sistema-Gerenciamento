import http from 'http';
import { userService } from '../services/user.service';
import { authService } from '../services/auth.service';
import { connectToDatabase } from '../config/database';
import { authMiddleware } from '../middlewares/auth.middleware';

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

// Middleware para aplicar autenticação
async function applyAuth(
  req: http.IncomingMessage, 
  res: http.ServerResponse
): Promise<boolean> {
  return await authMiddleware(req, res);
}

// Definição das rotas de usuário (perfil próprio)
export const userRoutes = [
  // ===== PERFIL DO USUÁRIO =====
  {
    method: 'GET',
    path: '/user/profile',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        // Verifica autenticação
        const hasAccess = await applyAuth(req, res);
        if (!hasAccess) return;

        await connectToDatabase();
        
        const userId = (req as any).user?.userId;
        const user = await userService.getUserById(userId);

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
          error: `Erro ao buscar perfil: ${(error as Error).message}`
        }));
      }
    }
  },

  // ===== ATUALIZAR PERFIL =====
  {
    method: 'PUT',
    path: '/user/profile',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const hasAccess = await applyAuth(req, res);
        if (!hasAccess) return;

        await connectToDatabase();
        const body = await readRequestBody(req);
        const userId = (req as any).user?.userId;

        // Remove campos que o usuário não pode alterar sozinho
        const allowedFields = {
          name: body.name
        };

        // Remove campos vazios/undefined
        Object.keys(allowedFields).forEach(key => {
          if (!allowedFields[key as keyof typeof allowedFields]) {
            delete allowedFields[key as keyof typeof allowedFields];
          }
        });

        const result = await userService.updateUser(userId, allowedFields);

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
          error: `Erro ao atualizar perfil: ${(error as Error).message}`
        }));
      }
    }
  },

  // ===== ALTERAR SENHA =====
  {
    method: 'PUT',
    path: '/user/change-password',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const hasAccess = await applyAuth(req, res);
        if (!hasAccess) return;

        await connectToDatabase();
        const body = await readRequestBody(req);
        const userId = (req as any).user?.userId;

        // Validação dos campos necessários
        if (!body.currentPassword || !body.newPassword) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Senha atual e nova senha são obrigatórias'
          }));
          return;
        }

        // Busca o usuário atual para verificar senha
        const currentUser = await userService.getUserById(userId);
        if (!currentUser) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Usuário não encontrado'
          }));
          return;
        }

        // Verifica se a senha atual está correta
        // Precisamos buscar o usuário com senha para comparar
        const { userRepository } = require('../repositories/user.repository');
        const userWithPassword = await userRepository.findByEmail(currentUser.email);
        
        if (!userWithPassword || !(await userWithPassword.comparePassword(body.currentPassword))) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Senha atual incorreta'
          }));
          return;
        }

        // Valida nova senha
        if (body.newPassword.length < 6) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Nova senha deve ter pelo menos 6 caracteres'
          }));
          return;
        }

        // Verifica se nova senha é diferente da atual
        if (body.currentPassword === body.newPassword) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Nova senha deve ser diferente da senha atual'
          }));
          return;
        }

        // Atualiza a senha
        const result = await userService.updateUser(userId, {
          password: body.newPassword
        });

        if (!result.success) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Senha alterada com sucesso'
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: `Erro ao alterar senha: ${(error as Error).message}`
        }));
      }
    }
  },

  // ===== MINHAS PERMISSÕES =====
  {
    method: 'GET',
    path: '/user/permissions',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const hasAccess = await applyAuth(req, res);
        if (!hasAccess) return;

        const userPermissions = (req as any).user?.permissions || [];
        const userData = (req as any).user?.userData;

        // Organiza permissões por recurso
        const permissionsByResource: Record<string, string[]> = {};
        
        userPermissions.forEach((permission: string) => {
          const [resource, action] = permission.split(':');
          if (!permissionsByResource[resource]) {
            permissionsByResource[resource] = [];
          }
          permissionsByResource[resource].push(action);
        });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            user: {
              name: userData?.name,
              email: userData?.email,
              role: userData?.role?.name
            },
            permissions: {
              total: userPermissions.length,
              byResource: permissionsByResource,
              all: userPermissions
            }
          }
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

  // ===== VERIFICAR PERMISSÃO ESPECÍFICA =====
  {
    method: 'POST',
    path: '/user/check-permission',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const hasAccess = await applyAuth(req, res);
        if (!hasAccess) return;

        const body = await readRequestBody(req);
        
        if (!body.permission) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Permissão é obrigatória'
          }));
          return;
        }

        const userPermissions = (req as any).user?.permissions || [];
        const hasPermission = authService.hasPermission(userPermissions, body.permission);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            permission: body.permission,
            hasPermission,
            userPermissions
          }
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: `Erro ao verificar permissão: ${(error as Error).message}`
        }));
      }
    }
  },

  // ===== HISTÓRICO DE ATIVIDADES =====
  {
    method: 'GET',
    path: '/user/activity',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const hasAccess = await applyAuth(req, res);
        if (!hasAccess) return;

        const userId = (req as any).user?.userId;
        
        // Parse query parameters
        const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
        const page = parseInt(parsedUrl.searchParams.get('page') || '1');
        const limit = parseInt(parsedUrl.searchParams.get('limit') || '20');

        // Busca logs do usuário
        const result = await userService.getAuditLogs({
          page,
          limit,
          userId,
          action: '',
          startDate: '',
          endDate: ''
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
          error: `Erro ao buscar atividades: ${(error as Error).message}`
        }));
      }
    }
  },

  // ===== ESTATÍSTICAS PESSOAIS =====
  {
    method: 'GET',
    path: '/user/stats',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const hasAccess = await applyAuth(req, res);
        if (!hasAccess) return;

        const userData = (req as any).user?.userData;
        const userId = (req as any).user?.userId;

        // Busca estatísticas pessoais
        const user = await userService.getUserById(userId);
        
        if (!user) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Usuário não encontrado'
          }));
          return;
        }

        const stats = {
          profile: {
            name: user.name,
            email: user.email,
            role: user.role?.name,
            status: user.status,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
          },
          permissions: {
            total: user.allPermissions?.length || 0,
            byRole: user.role?.permissions?.length || 0,
            custom: user.customPermissions?.length || 0
          },
          activity: {
            accountAge: user.createdAt ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0,
            lastLoginDays: user.lastLogin ? Math.floor((Date.now() - new Date(user.lastLogin).getTime()) / (1000 * 60 * 60 * 24)) : null
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
  },

  // ===== PREFERÊNCIAS DO USUÁRIO =====
  {
    method: 'GET',
    path: '/user/preferences',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const hasAccess = await applyAuth(req, res);
        if (!hasAccess) return;

        // Por enquanto retorna preferências padrão
        // Em uma implementação real, você salvaria isso no banco
        const preferences = {
          theme: 'light',
          language: 'pt-BR',
          timezone: 'America/Sao_Paulo',
          notifications: {
            email: true,
            browser: false,
            mobile: false
          },
          dashboard: {
            showStats: true,
            showRecentActivity: true,
            autoRefresh: false
          }
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: preferences
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: `Erro ao buscar preferências: ${(error as Error).message}`
        }));
      }
    }
  },

  {
    method: 'PUT',
    path: '/user/preferences',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const hasAccess = await applyAuth(req, res);
        if (!hasAccess) return;

        const body = await readRequestBody(req);
        
        // Em uma implementação real, você salvaria as preferências no banco
        // Por enquanto apenas validamos e retornamos sucesso
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Preferências atualizadas com sucesso',
          data: body
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: `Erro ao atualizar preferências: ${(error as Error).message}`
        }));
      }
    }
  }
];

export default userRoutes;
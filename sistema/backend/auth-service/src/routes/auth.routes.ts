import http from 'http';
import { authService } from '../services/auth.service';
import { connectToDatabase } from '../config/database';

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

// Definição das rotas de autenticação
export const authRoutes = [
  // ===== LOGIN =====
  {
    method: 'POST',
    path: '/auth/login',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        await connectToDatabase();
        const body = await readRequestBody(req);
        
        // Validação básica
        if (!body.email || !body.password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Email e senha são obrigatórios'
          }));
          return;
        }

        // Valida formato do email
        const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(body.email)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Formato de email inválido'
          }));
          return;
        }

        // Realiza o login
        const result = await authService.login({
          email: body.email,
          password: body.password
        });

        const statusCode = result.success ? 200 : 401;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));

      } catch (error) {
        console.error('Erro na rota de login:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Erro interno do servidor'
        }));
      }
    }
  },

  // ===== LOGOUT =====
  {
    method: 'POST',
    path: '/auth/logout',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        // Busca o token no header Authorization
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Token de acesso não fornecido'
          }));
          return;
        }

        const token = authHeader.substring(7);
        
        // Realiza o logout
        const result = await authService.logout(token);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));

      } catch (error) {
        console.error('Erro na rota de logout:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Erro interno do servidor'
        }));
      }
    }
  },

  // ===== REFRESH TOKEN =====
  {
    method: 'POST',
    path: '/auth/refresh',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const body = await readRequestBody(req);
        
        if (!body.refreshToken) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Refresh token é obrigatório'
          }));
          return;
        }

        // Renova o token
        const result = await authService.refreshToken(body.refreshToken);

        const statusCode = result.success ? 200 : 401;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));

      } catch (error) {
        console.error('Erro na rota de refresh:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Erro interno do servidor'
        }));
      }
    }
  },

  // ===== VALIDAR TOKEN =====
  {
    method: 'POST',
    path: '/auth/validate',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const body = await readRequestBody(req);
        
        if (!body.token) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Token é obrigatório'
          }));
          return;
        }

        // Valida o token
        const validation = await authService.validateToken(body.token);

        if (validation.valid) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            message: 'Token válido',
            data: {
              user: validation.user,
              payload: validation.payload
            }
          }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Token inválido ou expirado'
          }));
        }

      } catch (error) {
        console.error('Erro na rota de validação:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Erro interno do servidor'
        }));
      }
    }
  },

  // ===== DADOS DO USUÁRIO LOGADO =====
  {
    method: 'GET',
    path: '/auth/me',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        // Busca o token no header Authorization
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Token de acesso não fornecido'
          }));
          return;
        }

        const token = authHeader.substring(7);
        
        // Busca dados do usuário
        const result = await authService.getMe(token);

        const statusCode = result.success ? 200 : 401;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));

      } catch (error) {
        console.error('Erro na rota me:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Erro interno do servidor'
        }));
      }
    }
  },

  // ===== VERIFICAR PERMISSÃO =====
  {
    method: 'POST',
    path: '/auth/check-permission',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        // Busca o token no header Authorization
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Token de acesso não fornecido'
          }));
          return;
        }

        const token = authHeader.substring(7);
        const body = await readRequestBody(req);
        
        if (!body.permission) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Permissão é obrigatória'
          }));
          return;
        }

        // Valida o token e verifica permissão
        const validation = await authService.validateToken(token);
        
        if (!validation.valid || !validation.user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Token inválido'
          }));
          return;
        }

        // Verifica se tem a permissão
        const hasPermission = authService.hasPermission(
          validation.user.allPermissions,
          body.permission
        );

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            hasPermission,
            permission: body.permission,
            user: {
              id: validation.user.id,
              name: validation.user.name,
              email: validation.user.email
            }
          }
        }));

      } catch (error) {
        console.error('Erro na rota check-permission:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Erro interno do servidor'
        }));
      }
    }
  },

  // ===== STATUS/HEALTH CHECK =====
  {
    method: 'GET',
    path: '/auth/status',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        await connectToDatabase();
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          service: 'auth-service',
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }));

      } catch (error) {
        console.error('Erro na rota de status:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          service: 'auth-service',
          status: 'unhealthy',
          error: 'Erro de conexão com banco de dados'
        }));
      }
    }
  },

  // ===== INFORMAÇÕES DO SISTEMA =====
  {
    method: 'GET',
    path: '/auth/info',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const info = {
          name: 'Sistema de Autenticação',
          version: '1.0.0',
          description: 'Serviço de autenticação e autorização',
          features: [
            'Login/Logout',
            'JWT Tokens',
            'Refresh Tokens',
            'Controle de Permissões',
            'Gestão de Usuários',
            'Gestão de Roles'
          ],
          endpoints: {
            auth: [
              'POST /auth/login',
              'POST /auth/logout',
              'POST /auth/refresh',
              'POST /auth/validate',
              'GET /auth/me',
              'POST /auth/check-permission'
            ],
            backoffice: [
              'GET /backoffice/dashboard',
              'GET /backoffice/users',
              'POST /backoffice/users',
              'GET /backoffice/roles',
              'POST /backoffice/roles'
            ]
          }
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: info
        }));

      } catch (error) {
        console.error('Erro na rota de info:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: 'Erro interno do servidor'
        }));
      }
    }
  }
];

export default authRoutes;
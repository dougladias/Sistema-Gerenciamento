import http from 'http';
import { authService } from '../services/auth.service';

// Interface para requisição com dados do usuário
interface AuthenticatedRequest extends http.IncomingMessage {
  user?: {
    userId: string;
    email: string;
    roleId: string;
    permissions: string[];
    userData: any;
  };
}

// Middleware de autenticação
export async function authMiddleware(
  req: AuthenticatedRequest, 
  res: http.ServerResponse
): Promise<boolean> {
  try {
    // Busca o token no header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Token de acesso não fornecido',
        code: 'MISSING_TOKEN'
      }));
      return false;
    }

    // Extrai o token
    const token = authHeader.substring(7);
    
    if (!token || token.trim() === '') {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Token vazio',
        code: 'EMPTY_TOKEN'
      }));
      return false;
    }

    // Valida o token
    const validation = await authService.validateToken(token);
    
    if (!validation.valid || !validation.payload || !validation.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Token inválido ou expirado',
        code: 'INVALID_TOKEN'
      }));
      return false;
    }

    // Adiciona dados do usuário à requisição
    req.user = {
      userId: validation.payload.userId,
      email: validation.payload.email,
      roleId: validation.payload.roleId,
      permissions: validation.payload.permissions,
      userData: validation.user
    };

    // Log da requisição autenticada (opcional)
    console.log(`[AUTH] ${req.method} ${req.url} - ${validation.user.email}`);

    return true;

  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    
    // Verifica se é erro de token expirado
    if (error instanceof Error && error.message.includes('expired')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Token expirado',
        code: 'EXPIRED_TOKEN'
      }));
    } else {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Erro interno de autenticação',
        code: 'AUTH_ERROR'
      }));
    }
    
    return false;
  }
}

// Middleware de autenticação opcional (não bloqueia se não tiver token)
export async function optionalAuthMiddleware(
  req: AuthenticatedRequest, 
  res: http.ServerResponse
): Promise<boolean> {
  try {
    const authHeader = req.headers.authorization;
    
    // Se não há header de autorização, continua sem autenticação
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return true;
    }

    const token = authHeader.substring(7);
    
    // Se token está vazio, continua sem autenticação
    if (!token || token.trim() === '') {
      return true;
    }

    // Tenta validar o token
    const validation = await authService.validateToken(token);
    
    if (validation.valid && validation.payload && validation.user) {
      // Adiciona dados do usuário se token for válido
      req.user = {
        userId: validation.payload.userId,
        email: validation.payload.email,
        roleId: validation.payload.roleId,
        permissions: validation.payload.permissions,
        userData: validation.user
      };
    }

    // Sempre retorna true (não bloqueia)
    return true;

  } catch (error) {
    console.error('Erro no middleware de autenticação opcional:', error);
    // Em caso de erro, continua sem autenticação
    return true;
  }
}

// Middleware para verificar se usuário está ativo
export async function activeUserMiddleware(
  req: AuthenticatedRequest, 
  res: http.ServerResponse
): Promise<boolean> {
  try {
    if (!req.user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      }));
      return false;
    }

    // Verifica se o usuário está ativo
    if (req.user.userData?.status !== 'active') {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Conta inativa. Contate o administrador',
        code: 'INACTIVE_USER'
      }));
      return false;
    }

    return true;

  } catch (error) {
    console.error('Erro no middleware de usuário ativo:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: false,
      error: 'Erro interno do servidor',
      code: 'SERVER_ERROR'
    }));
    return false;
  }
}

// Middleware para logging de ações
export function auditMiddleware(action: string) {
  return async (req: AuthenticatedRequest, res: http.ServerResponse): Promise<boolean> => {
    try {
      if (req.user) {
        const logData = {
          timestamp: new Date().toISOString(),
          userId: req.user.userId,
          email: req.user.email,
          action,
          method: req.method,
          url: req.url,
          ip: req.connection.remoteAddress || req.socket.remoteAddress,
          userAgent: req.headers['user-agent']
        };

        // Log da ação
        console.log(`[AUDIT] ${logData.timestamp} - ${logData.email} executou: ${action}`);
        
        // Em produção, salvar no banco de dados:
        // await auditService.log(logData);
      }

      return true;

    } catch (error) {
      console.error('Erro no middleware de auditoria:', error);
      return true; // Não bloqueia em caso de erro no log
    }
  };
}

// Middleware para rate limiting básico por usuário
export function rateLimitMiddleware(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return async (req: AuthenticatedRequest, res: http.ServerResponse): Promise<boolean> => {
    try {
      const clientId = req.user?.userId || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
      const now = Date.now();
      
      const clientData = requests.get(clientId) || { count: 0, resetTime: now + windowMs };
      
      // Reset contador se a janela expirou
      if (now > clientData.resetTime) {
        clientData.count = 0;
        clientData.resetTime = now + windowMs;
      }
      
      clientData.count++;
      requests.set(clientId, clientData);
      
      if (clientData.count > maxRequests) {
        const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);
        
        res.writeHead(429, { 
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': clientData.resetTime.toString()
        });
        res.end(JSON.stringify({ 
          success: false,
          error: 'Muitas requisições. Tente novamente mais tarde.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter
        }));
        return false;
      }

      // Adiciona headers informativos
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (maxRequests - clientData.count).toString());
      res.setHeader('X-RateLimit-Reset', clientData.resetTime.toString());

      return true;

    } catch (error) {
      console.error('Erro no middleware de rate limit:', error);
      return true; // Permite continuar em caso de erro
    }
  };
}

// Middleware para CORS
export async function corsMiddleware(
  req: http.IncomingMessage, 
  res: http.ServerResponse
): Promise<boolean> {
  try {
    // Define headers CORS
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 horas

    // Responde ao preflight OPTIONS
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return false; // Para a execução aqui para OPTIONS
    }

    return true;

  } catch (error) {
    console.error('Erro no middleware de CORS:', error);
    return true; // Permite continuar em caso de erro
  }
}

// Função helper para aplicar múltiplos middlewares
export async function applyMiddlewares(
  req: AuthenticatedRequest,
  res: http.ServerResponse,
  middlewares: Array<(req: AuthenticatedRequest, res: http.ServerResponse) => Promise<boolean>>
): Promise<boolean> {
  for (const middleware of middlewares) {
    const result = await middleware(req, res);
    if (!result) {
      return false; // Para na primeira falha
    }
  }
  return true;
}

// Middleware combinado comum
export async function standardMiddleware(
  req: AuthenticatedRequest,
  res: http.ServerResponse
): Promise<boolean> {
  return applyMiddlewares(req, res, [
    corsMiddleware,
    rateLimitMiddleware(100, 15 * 60 * 1000), // 100 requests per 15 minutes
    authMiddleware,
    activeUserMiddleware
  ]);
}

// Middleware combinado para rotas públicas
export async function publicMiddleware(
  req: AuthenticatedRequest,
  res: http.ServerResponse
): Promise<boolean> {
  return applyMiddlewares(req, res, [
    corsMiddleware,
    rateLimitMiddleware(200, 15 * 60 * 1000) // 200 requests per 15 minutes for public routes
  ]);
}

// Exporta os middlewares individualmente e como default
export default {
  authMiddleware,
  optionalAuthMiddleware,
  activeUserMiddleware,
  auditMiddleware,
  rateLimitMiddleware,
  corsMiddleware,
  applyMiddlewares,
  standardMiddleware,
  publicMiddleware
};
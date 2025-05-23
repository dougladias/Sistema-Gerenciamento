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

// Middleware de permissão
export function permissionMiddleware(requiredPermission: string) {
  return async (req: AuthenticatedRequest, res: http.ServerResponse): Promise<boolean> => {
    try {
      // Verifica se o usuário foi autenticado
      if (!req.user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: 'Usuário não autenticado',
          code: 'NOT_AUTHENTICATED'
        }));
        return false;
      }

      // Verifica se o usuário tem a permissão necessária
      const hasPermission = authService.hasPermission(
        req.user.permissions, 
        requiredPermission
      );

      if (!hasPermission) {
        // Log da tentativa de acesso negado
        console.warn(`[ACCESS_DENIED] ${req.user.email} tentou acessar ${requiredPermission} em ${req.method} ${req.url}`);
        
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: 'Acesso negado. Permissão insuficiente',
          code: 'INSUFFICIENT_PERMISSION',
          required: requiredPermission,
          userPermissions: req.user.permissions
        }));
        return false;
      }

      // Log da permissão concedida
      console.log(`[ACCESS_GRANTED] ${req.user.email} acessou ${requiredPermission} em ${req.method} ${req.url}`);

      return true;

    } catch (error) {
      console.error('Erro no middleware de permissão:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Erro interno de autorização',
        code: 'AUTHORIZATION_ERROR'
      }));
      return false;
    }
  };
}

// Middleware de permissão com múltiplas opções (OR)
export function anyPermissionMiddleware(requiredPermissions: string[]) {
  return async (req: AuthenticatedRequest, res: http.ServerResponse): Promise<boolean> => {
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

      // Verifica se o usuário tem pelo menos uma das permissões necessárias
      const hasAnyPermission = requiredPermissions.some(permission => 
        authService.hasPermission(req.user!.permissions, permission)
      );

      if (!hasAnyPermission) {
        console.warn(`[ACCESS_DENIED] ${req.user.email} tentou acessar ${requiredPermissions.join(' OR ')} em ${req.method} ${req.url}`);
        
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: 'Acesso negado. Nenhuma das permissões necessárias encontrada',
          code: 'INSUFFICIENT_PERMISSION',
          requiredAny: requiredPermissions,
          userPermissions: req.user.permissions
        }));
        return false;
      }

      console.log(`[ACCESS_GRANTED] ${req.user.email} acessou uma de ${requiredPermissions.join(' OR ')} em ${req.method} ${req.url}`);

      return true;

    } catch (error) {
      console.error('Erro no middleware de permissão múltipla:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Erro interno de autorização',
        code: 'AUTHORIZATION_ERROR'
      }));
      return false;
    }
  };
}

// Middleware de permissão com múltiplas obrigatórias (AND)
export function allPermissionsMiddleware(requiredPermissions: string[]) {
  return async (req: AuthenticatedRequest, res: http.ServerResponse): Promise<boolean> => {
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

      // Verifica se o usuário tem todas as permissões necessárias
      const missingPermissions = requiredPermissions.filter(permission => 
        !authService.hasPermission(req.user!.permissions, permission)
      );

      if (missingPermissions.length > 0) {
        console.warn(`[ACCESS_DENIED] ${req.user.email} não possui ${missingPermissions.join(', ')} em ${req.method} ${req.url}`);
        
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: 'Acesso negado. Permissões insuficientes',
          code: 'INSUFFICIENT_PERMISSION',
          requiredAll: requiredPermissions,
          missing: missingPermissions,
          userPermissions: req.user.permissions
        }));
        return false;
      }

      console.log(`[ACCESS_GRANTED] ${req.user.email} possui todas as permissões ${requiredPermissions.join(', ')} em ${req.method} ${req.url}`);

      return true;

    } catch (error) {
      console.error('Erro no middleware de permissão completa:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Erro interno de autorização',
        code: 'AUTHORIZATION_ERROR'
      }));
      return false;
    }
  };
}

// Middleware opcional de permissão (não bloqueia se não tiver)
export function optionalPermissionMiddleware(requiredPermission: string) {
  return async (req: AuthenticatedRequest, res: http.ServerResponse): Promise<boolean> => {
    try {
      if (!req.user) {
        return true; // Permite continuar sem autenticação
      }

      const hasPermission = authService.hasPermission(
        req.user.permissions, 
        requiredPermission
      );

      // Adiciona flag indicando se tem permissão
      (req as any).hasPermission = hasPermission;
      (req as any).checkedPermission = requiredPermission;

      return true;

    } catch (error) {
      console.error('Erro no middleware de permissão opcional:', error);
      return true; // Em caso de erro, permite continuar
    }
  };
}

// Middleware para verificar se é admin
export async function adminOnlyMiddleware(
  req: AuthenticatedRequest, 
  res: http.ServerResponse
): Promise<boolean> {
  return permissionMiddleware('backoffice:manage')(req, res);
}

// Middleware para verificar se pode acessar backoffice
export async function backofficeAccessMiddleware(
  req: AuthenticatedRequest, 
  res: http.ServerResponse
): Promise<boolean> {
  return anyPermissionMiddleware(['backoffice:access', 'backoffice:manage'])(req, res);
}

// Middleware baseado em role específica
export function roleMiddleware(requiredRole: string) {
  return async (req: AuthenticatedRequest, res: http.ServerResponse): Promise<boolean> => {
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

      const userRole = req.user.userData?.role?.name;
      
      if (userRole !== requiredRole) {
        console.warn(`[ACCESS_DENIED] ${req.user.email} (role: ${userRole}) tentou acessar recurso que requer role: ${requiredRole}`);
        
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: `Acesso negado. Role necessária: ${requiredRole}`,
          code: 'INSUFFICIENT_ROLE',
          requiredRole,
          userRole
        }));
        return false;
      }

      console.log(`[ACCESS_GRANTED] ${req.user.email} (role: ${userRole}) acessou recurso com role: ${requiredRole}`);

      return true;

    } catch (error) {
      console.error('Erro no middleware de role:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Erro interno de autorização',
        code: 'AUTHORIZATION_ERROR'
      }));
      return false;
    }
  };
}

// Middleware para validar propriedade do recurso (ex: usuário só pode editar próprio perfil)
export function resourceOwnerMiddleware(resourceIdParam: string = 'id') {
  return async (req: AuthenticatedRequest, res: http.ServerResponse, params?: any): Promise<boolean> => {
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

      // Extrai ID do recurso dos parâmetros
      const resourceId = params?.[resourceIdParam];
      
      if (!resourceId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: 'ID do recurso não fornecido',
          code: 'MISSING_RESOURCE_ID'
        }));
        return false;
      }

      // Verifica se o usuário é proprietário do recurso ou é admin
      const isOwner = req.user.userId === resourceId;
      const isAdmin = authService.hasPermission(req.user.permissions, 'backoffice:manage');

      if (!isOwner && !isAdmin) {
        console.warn(`[ACCESS_DENIED] ${req.user.email} tentou acessar recurso ${resourceId} que não é seu`);
        
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false,
          error: 'Acesso negado. Você só pode acessar seus próprios recursos',
          code: 'NOT_RESOURCE_OWNER'
        }));
        return false;
      }

      console.log(`[ACCESS_GRANTED] ${req.user.email} acessou recurso ${resourceId} (owner: ${isOwner}, admin: ${isAdmin})`);

      return true;

    } catch (error) {
      console.error('Erro no middleware de propriedade de recurso:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Erro interno de autorização',
        code: 'AUTHORIZATION_ERROR'
      }));
      return false;
    }
  };
}

// Middleware para verificar permissão baseada em horário
export function timeBasedPermissionMiddleware(
  permission: string,
  allowedHours: { start: number; end: number } = { start: 8, end: 18 }
) {
  return async (req: AuthenticatedRequest, res: http.ServerResponse): Promise<boolean> => {
    try {
      // Primeiro verifica a permissão normal
      const hasPermission = await permissionMiddleware(permission)(req, res);
      if (!hasPermission) {
        return false;
      }

      // Verifica horário (se não for admin)
      const isAdmin = req.user && authService.hasPermission(req.user.permissions, 'backoffice:manage');
      
      if (!isAdmin) {
        const currentHour = new Date().getHours();
        
        if (currentHour < allowedHours.start || currentHour >= allowedHours.end) {
          console.warn(`[ACCESS_DENIED] ${req.user?.email} tentou acessar ${permission} fora do horário permitido (${currentHour}h)`);
          
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false,
            error: `Acesso negado. Horário permitido: ${allowedHours.start}h às ${allowedHours.end}h`,
            code: 'TIME_RESTRICTED',
            currentHour,
            allowedHours
          }));
          return false;
        }
      }

      return true;

    } catch (error) {
      console.error('Erro no middleware de permissão baseada em horário:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Erro interno de autorização',
        code: 'AUTHORIZATION_ERROR'
      }));
      return false;
    }
  };
}

// Função helper para criar middlewares de permissão específicos
export const createPermissionMiddleware = {
  // Permissões de workers
  workers: {
    read: () => permissionMiddleware('workers:read'),
    create: () => permissionMiddleware('workers:create'),
    update: () => permissionMiddleware('workers:update'),
    delete: () => permissionMiddleware('workers:delete'),
    manage: () => permissionMiddleware('workers:manage')
  },
  
  // Permissões de documentos
  documents: {
    read: () => permissionMiddleware('documents:read'),
    upload: () => permissionMiddleware('documents:upload'),
    download: () => permissionMiddleware('documents:download'),
    delete: () => permissionMiddleware('documents:delete'),
    manage: () => permissionMiddleware('documents:manage')
  },
  
  // Permissões de timesheet
  timesheet: {
    read: () => permissionMiddleware('timesheet:read'),
    create: () => permissionMiddleware('timesheet:create'),
    update: () => permissionMiddleware('timesheet:update'),
    delete: () => permissionMiddleware('timesheet:delete'),
    manage: () => permissionMiddleware('timesheet:manage')
  },
  
  // Permissões de backoffice
  backoffice: {
    access: () => permissionMiddleware('backoffice:access'),
    users: () => permissionMiddleware('backoffice:users'),
    manage: () => permissionMiddleware('backoffice:manage')
  }
};

// Exporta middlewares individuais e helpers
export default {
  permissionMiddleware,
  anyPermissionMiddleware,
  allPermissionsMiddleware,
  optionalPermissionMiddleware,
  adminOnlyMiddleware,
  backofficeAccessMiddleware,
  roleMiddleware,
  resourceOwnerMiddleware,
  timeBasedPermissionMiddleware,
  createPermissionMiddleware
};
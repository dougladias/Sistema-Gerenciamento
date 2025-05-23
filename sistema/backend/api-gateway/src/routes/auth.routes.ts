import { IncomingMessage, ServerResponse } from 'http';
import { AUTH_SERVICE_URL } from '../config/env';
import { forwardRequest } from '../middlewares/requestForwarder';
import { sendError } from '../middlewares/errorHandler';

/// Rotas do Auth Service
export async function handleAuthRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  parsedUrl: URL
): Promise<boolean> {
  // Normaliza o caminho removendo /api se existir
  const normalizedPath = path.startsWith('/api/') ? path.substring(4) : path;
  
  if (
    // Rotas de autenticação principais
    normalizedPath === '/auth/login' ||
    normalizedPath === '/auth/logout' ||
    normalizedPath === '/auth/refresh' ||
    normalizedPath === '/auth/validate' ||
    normalizedPath === '/auth/me' ||
    normalizedPath === '/auth/check-permission' ||
    normalizedPath === '/auth/status' ||
    normalizedPath === '/auth/info' ||
    normalizedPath.startsWith('/auth/') ||
    
    // Rotas de usuários
    normalizedPath === '/users' ||
    normalizedPath.startsWith('/users/') ||
    
    // Rotas do backoffice
    normalizedPath === '/backoffice/dashboard' ||
    normalizedPath === '/backoffice/users' ||
    normalizedPath === '/backoffice/roles' ||
    normalizedPath === '/backoffice/permissions' ||
    normalizedPath === '/backoffice/logs' ||
    normalizedPath === '/backoffice/reports' ||
    normalizedPath === '/backoffice/settings' ||
    normalizedPath === '/backoffice/initialize' ||
    normalizedPath === '/backoffice/stats' ||
    normalizedPath.startsWith('/backoffice/') ||
    
    // Rotas de usuário (perfil)
    normalizedPath === '/user/profile' ||
    normalizedPath === '/user/change-password' ||
    normalizedPath === '/user/permissions' ||
    normalizedPath === '/user/check-permission' ||
    normalizedPath === '/user/activity' ||
    normalizedPath === '/user/stats' ||
    normalizedPath === '/user/preferences' ||
    normalizedPath.startsWith('/user/')
  ) {
    console.log(`🔄 Encaminhando requisição para auth-service: ${path}`);

    // Usa o caminho normalizado (sem /api) para encaminhar ao serviço
    const targetUrl = new URL(normalizedPath, AUTH_SERVICE_URL);

    // Adiciona a query string original à URL de destino
    if (parsedUrl.search) {
      targetUrl.search = parsedUrl.search;
    }

    // Encaminha a requisição para o serviço de autenticação
    console.log(`🔐 URL final: ${targetUrl.toString()}`);
    await forwardRequest(req, res, targetUrl.toString(), sendError);
    return true;
  }

  return false;
}
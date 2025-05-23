import { IncomingMessage, ServerResponse } from 'http';
import { VISITOR_SERVICE_URL } from '../config/env';
import { forwardRequest } from '../middlewares/requestForwarder';
import { sendError } from '../middlewares/errorHandler';

// Rotas do Visitor Service
export async function handleVisitorRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  parsedUrl: URL
): Promise<boolean> {  
  // Normalizamos o caminho removendo /api se existir
  const normalizedPath = path.startsWith('/api/') ? path.substring(4) : path;
  
  if (
    // Rotas principais de visitantes
    normalizedPath === '/visitors' || 
    normalizedPath.startsWith('/visitors/') ||
    // Compatibilidade com diferentes formatos de URL
    path === '/api/visitors' ||
    path.startsWith('/api/visitors/') ||
    // Rotas de check-in e check-out
    path.includes('/check-in') ||
    path.includes('/check-out') ||
    // Rota para cadastrar novos visitantes
    (req.method === 'POST' && (path === '/visitors' || path === '/api/visitors'))
  ) {
    console.log(`🔄 Encaminhando requisição para visitor-service: ${path}`);

    // Determina a URL de destino para o serviço de visitantes
    const targetPath = path.startsWith('/api') ? path.replace(/^\/api/, '') : path;
    const targetUrl = new URL(targetPath, VISITOR_SERVICE_URL);

    // Adiciona a query string original à URL de destino
    if (parsedUrl.search) {
      targetUrl.search = parsedUrl.search;
    }

    // Encaminha a requisição para o serviço de visitantes
    console.log(`📦 URL final: ${targetUrl.toString()}`);
    await forwardRequest(req, res, targetUrl.toString(), sendError);
    return true;
  }

  return false;
}
import { IncomingMessage, ServerResponse } from 'http';
import { WORKER_SERVICE_URL } from '../config/env';
import { forwardRequest } from '../middlewares/requestForwarder';
import { sendError } from '../middlewares/errorHandler';

/// Rotas do Worker Service
export async function handleWorkerRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  parsedUrl: URL
): Promise<boolean> {  
  if (
    // Rotas principais de workers
    path === '/workers' || 
    path === '/api/workers' ||
    // Rota específica de worker por ID (sem incluir /files)
    (path.match(/^\/workers\/[^\/]+$/) || path.match(/^\/api\/workers\/[^\/]+$/)) ||
    // Rotas de registro de ponto (entries)
    (path.includes('/workers/') && path.endsWith('/entries')) ||
    // Outras rotas específicas de workers que não incluam 'files' ou 'upload'
    (path.includes('/workers/') && !path.includes('/files') && !path.includes('/upload'))
  ) {
    console.log(`🔄 Encaminhando requisição para worker-service (gestão de funcionários): ${path}`);

    // Determina a URL de destino para o serviço de worker
    const targetPath = path.startsWith('/api') ? path.replace(/^\/api/, '') : path;
    const targetUrl = new URL(targetPath, WORKER_SERVICE_URL);

    // Adiciona a query string original à URL de destino
    if (parsedUrl.search) {
      targetUrl.search = parsedUrl.search;
    }

    // Encaminha a requisição para o serviço de worker
    console.log(`📦 URL final: ${targetUrl.toString()}`);
    await forwardRequest(req, res, targetUrl.toString(), sendError);
    return true;
  }

  return false;
}
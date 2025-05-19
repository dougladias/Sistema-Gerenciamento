import { IncomingMessage, ServerResponse } from 'http';
import { WORKER_SERVICE_URL } from '../config/env';
import { forwardRequest } from '../middlewares/requestForwarder';
import { sendError } from '../middlewares/errorHandler';

/// Rotas do Log Service (parte do Worker Service)
export async function handleLogRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  parsedUrl: URL
): Promise<boolean> {  
  if (
    // Rotas de Time Sheet (registro de ponto)
    (path.includes('/workers/') && path.includes('/timesheet'))
  ) {
    console.log(`🔄 Encaminhando requisição para worker-service (registros de ponto): ${path}`);

    // Determina a URL de destino para o serviço de logs
    const targetPath = path.startsWith('/api') ? path.replace(/^\/api/, '') : path;
    const targetUrl = new URL(targetPath, WORKER_SERVICE_URL);

    // Adiciona a query string original à URL de destino
    if (parsedUrl.search) {
      targetUrl.search = parsedUrl.search;
    }

    // Encaminha a requisição para o serviço de logs
    console.log(`📦 URL final: ${targetUrl.toString()}`);
    await forwardRequest(req, res, targetUrl.toString(), sendError);
    return true;
  }

  return false;
}
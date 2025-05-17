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

    // Verifica se a requisição é uma pré-verificação CORS
  if (path.startsWith('/workers') || path.startsWith('/api')) {
    console.log(`🔄 Encaminhando requisição para worker-service: ${path}`);

    // Determina a URL de destino para o serviço de worker
    const targetPath = path.startsWith('/api') ? path.replace(/^\/api/, '') : path;
    const targetUrl = new URL(targetPath, WORKER_SERVICE_URL);

    // Adiciona a query string original à URL de destino
    if (parsedUrl.search) {
      targetUrl.search = parsedUrl.search;
    }

    // Adiciona os headers da requisição original
    console.log(`📦 URL final: ${targetUrl.toString()}`);
    await forwardRequest(req, res, targetUrl.toString(), sendError);
    return true;
  }

  return false;
}
import { IncomingMessage, ServerResponse } from 'http';
import { DOCUMENT_SERVICE_URL } from '../config/env';
import { forwardRequest } from '../middlewares/requestForwarder';
import { sendError } from '../middlewares/errorHandler';

/// Rotas do Document Service (parte do Worker Service)
export async function handleDocumentRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  parsedUrl: URL
): Promise<boolean> {  
  if (
    // Rotas de arquivos/documentos
    (path.includes('/workers/') && path.includes('/files')) ||
    // Rotas de upload
    (path.includes('/workers/') && path.includes('/upload'))
  ) {
    console.log(`🔄 Encaminhando requisição para worker-service (documentos): ${path}`);

    // Determina a URL de destino para o serviço de documentos
    const targetPath = path.startsWith('/api') ? path.replace(/^\/api/, '') : path;
    const targetUrl = new URL(targetPath, DOCUMENT_SERVICE_URL);

    // Adiciona a query string original à URL de destino
    if (parsedUrl.search) {
      targetUrl.search = parsedUrl.search;
    }

    // Encaminha a requisição para o serviço de documentos
    console.log(`📦 URL final: ${targetUrl.toString()}`);
    await forwardRequest(req, res, targetUrl.toString(), sendError);
    return true;
  }

  return false;
}
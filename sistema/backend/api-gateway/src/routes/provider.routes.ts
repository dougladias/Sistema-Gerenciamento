import { IncomingMessage, ServerResponse } from 'http';
import { PROVIDER_SERVICE_URL } from '../config/env';
import { forwardRequest } from '../middlewares/requestForwarder';
import { sendError } from '../middlewares/errorHandler';

// Rotas do Provider Service
export async function handleProviderRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  parsedUrl: URL
): Promise<boolean> {
  // Normalizamos o caminho removendo /api se existir
  const normalizedPath = path.startsWith('/api/') ? path.substring(4) : path;
  
  if (
    // Rotas principais de fornecedores
    normalizedPath === '/providers' ||
    normalizedPath.startsWith('/providers/')
  ) {
    console.log(`🔄 Encaminhando requisição para provider-service (fornecedores): ${path}`);
    
    // Usa o caminho normalizado (sem /api) para encaminhar ao serviço
    const targetUrl = new URL(normalizedPath, PROVIDER_SERVICE_URL);
    
    // Adiciona a query string original à URL de destino
    if (parsedUrl.search) {
      targetUrl.search = parsedUrl.search;
    }
    
    // Encaminha a requisição para o serviço de fornecedores
    console.log(`📦 URL final: ${targetUrl.toString()}`);
    await forwardRequest(req, res, targetUrl.toString(), sendError);
    return true;
  }
  
  return false;
}
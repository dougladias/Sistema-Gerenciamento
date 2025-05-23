import { IncomingMessage, ServerResponse } from 'http';
import { INVOICE_SERVICE_URL } from '../config/env';
import { forwardRequest } from '../middlewares/requestForwarder';
import { sendError } from '../middlewares/errorHandler';

/// Rotas do Invoice Service
export async function handleInvoiceRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  parsedUrl: URL
): Promise<boolean> {  
  // Normalizamos o caminho removendo /api se existir
  const normalizedPath = path.startsWith('/api/') ? path.substring(4) : path;
  
  if (
    // Rotas principais de notas fiscais
    normalizedPath === '/invoices' || 
    normalizedPath.startsWith('/invoices/') ||
    // Rota raiz do serviço de notas fiscais para health check
    normalizedPath === '/' && parsedUrl.hostname.includes(`${INVOICE_SERVICE_URL}`)
  ) {
    console.log(`🔄 Encaminhando requisição para invoice-service (notas fiscais): ${path}`);

    // Usa o caminho normalizado (sem /api) para encaminhar ao serviço
    const targetUrl = new URL(normalizedPath, INVOICE_SERVICE_URL);

    // Adiciona a query string original à URL de destino
    if (parsedUrl.search) {
      targetUrl.search = parsedUrl.search;
    }

    // Encaminha a requisição para o serviço de notas fiscais
    console.log(`📦 URL final: ${targetUrl.toString()}`);
    await forwardRequest(req, res, targetUrl.toString(), sendError);
    return true;
  }

  return false;
}
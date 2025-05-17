import { IncomingMessage, ServerResponse } from 'http';
import { TEMPLATE_SERVICE_URL } from '../config/env';
import { forwardRequest } from '../middlewares/requestForwarder';
import { sendError } from '../middlewares/errorHandler';

// Routes do Template Service
export async function handleTemplateRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  parsedUrl: URL
): Promise<boolean> {
  if (
    path === '/api/template' ||
    path === '/api/templates' ||
    path.startsWith('/template') ||
    path.startsWith('/templates') ||
    path.startsWith('/api/template/') ||
    path.startsWith('/api/templates/')
  ) {
    console.log(`🔄 Roteando requisição para template-service: ${path}`);

    // Determinar a URL de destino para o serviço de templates
    let targetPath;
    if (path === '/api/template') {
      targetPath = '/templates';
    } else if (path === '/api/templates') {
      targetPath = '/templates';
    } else if (path.startsWith('/template/')) {
      targetPath = '/templates/' + path.substring('/template/'.length);
    } else if (path.startsWith('/templates/')) {
      targetPath = path;
    } else if (path.startsWith('/api/template/')) {
      targetPath = '/templates/' + path.substring('/api/template/'.length);
    } else if (path.startsWith('/api/templates/')) {
      targetPath = '/templates/' + path.substring('/api/templates/'.length);
    } else {
      targetPath = path;
    }

    // Adiciona a query string original à URL de destino
    console.log(`🔄 Caminho mapeado para: ${targetPath}`);
    const targetUrl = new URL(targetPath, TEMPLATE_SERVICE_URL);

    // Adiciona a query string original à URL de destino
    if (parsedUrl.search) {
      targetUrl.search = parsedUrl.search;
    }

    // Encaminha a requisição para o serviço de templates
    console.log(`📦 URL final: ${targetUrl.toString()}`);
    await forwardRequest(req, res, targetUrl.toString(), sendError);
    return true;
  }

  return false;
}
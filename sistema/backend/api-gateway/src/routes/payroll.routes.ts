import { IncomingMessage, ServerResponse } from 'http';
import { PAYROLL_SERVICE_URL } from '../config/env';
import { forwardRequest } from '../middlewares/requestForwarder';
import { sendError } from '../middlewares/errorHandler';

/// Rotas do Payroll Service
export async function handlePayrollRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  parsedUrl: URL
): Promise<boolean> {  
  if (
    // Rotas principais de folha de pagamento
    path === '/payrolls' || 
    path === '/api/payrolls' ||
    path.startsWith('/payrolls/') ||
    path.startsWith('/api/payrolls/') ||
    // Rotas de holerites
    path === '/paystubs' ||
    path === '/api/paystubs' ||
    path.startsWith('/paystubs/') ||
    path.startsWith('/api/paystubs/') ||
    // Rotas relacionadas a funcionários específicos
    (path.includes('/workers/') && 
     (path.includes('/payrolls') || path.includes('/paystubs')))
  ) {
    console.log(`🔄 Encaminhando requisição para payroll-service (folha de pagamento): ${path}`);

    // Determina a URL de destino para o serviço de folha de pagamento
    const targetPath = path.startsWith('/api') ? path.replace(/^\/api/, '') : path;
    const targetUrl = new URL(targetPath, PAYROLL_SERVICE_URL);

    // Adiciona a query string original à URL de destino
    if (parsedUrl.search) {
      targetUrl.search = parsedUrl.search;
    }

    // Encaminha a requisição para o serviço de folha de pagamento
    console.log(`📦 URL final: ${targetUrl.toString()}`);
    await forwardRequest(req, res, targetUrl.toString(), sendError);
    return true;
  }

  return false;
}
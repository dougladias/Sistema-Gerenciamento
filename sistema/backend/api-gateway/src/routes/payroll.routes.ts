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
  // Normalizamos o caminho removendo /api se existir
  const normalizedPath = path.startsWith('/api/') ? path.substring(4) : path;
  
  if (
    // Rotas principais de folha de pagamento
    normalizedPath === '/payrolls' || 
    normalizedPath.startsWith('/payrolls/') || 
    // Rotas de holerites
    normalizedPath === '/payslips' || 
    normalizedPath.startsWith('/payslips/')
  ) {
    console.log(`🔄 Encaminhando requisição para payroll-service (folha de pagamento): ${path}`);

    // Usa o caminho normalizado (sem /api) para encaminhar ao serviço
    const targetUrl = new URL(normalizedPath, PAYROLL_SERVICE_URL);

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
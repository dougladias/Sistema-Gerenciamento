import { ServerResponse } from 'http';

/// Envia uma resposta de erro para o cliente
export function sendError(res: ServerResponse, statusCode: number, message: string): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(
    // Envia a mensagem de erro como JSON
    JSON.stringify({
      error: message,
      gateway: true,
      timestamp: new Date().toISOString(),
    })
  );
}
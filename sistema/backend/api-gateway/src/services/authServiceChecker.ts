import http from 'http';

// Verifica se o serviço de autenticação está disponível
export async function checkAuthService(
  host: string,
  port: number,
  path: string = '/health'
): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.request(
      {
        method: 'GET',
        hostname: host,
        port: port,
        path: path,
        timeout: 3000,
      },
      // Faz uma requisição GET para verificar se o serviço está disponível
      (res) => {
        resolve(res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 500);
        res.resume();
      }
    );
    // Se houver erro ou timeout, resolve como false
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}
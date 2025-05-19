import http from 'http';

// Verifica se o serviço de templates está disponível
export async function checkTemplateService(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const options = {
      method: 'GET',
      host: host,
      port: port,
      timeout: 2000, 
    };

    // Faz uma requisição GET para verificar se o serviço está disponível
    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200);
    });

    // Se houver erro ou timeout, resolve como false
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}
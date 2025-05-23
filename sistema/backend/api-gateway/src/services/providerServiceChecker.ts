import http from 'http';

export async function checkProviderService(
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
      (res) => {
        resolve(res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 500);
        res.resume();
      }
    );
    
    req.on('error', (err) => {
      console.log(`❌ Erro ao verificar serviço de Prestadores: ${err.message}`);
      resolve(false);
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.log('⏱️ Timeout ao verificar serviço de Prestadores');
      resolve(false);
    });
    
    req.end();
  });
}
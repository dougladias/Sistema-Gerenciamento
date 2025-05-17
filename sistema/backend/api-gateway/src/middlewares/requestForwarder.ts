import http, { IncomingMessage, ServerResponse } from 'http';
import https from 'https';

// Importa o módulo URL para manipulação de URLs
export async function forwardRequest(
  req: IncomingMessage,
  res: ServerResponse,
  targetUrl: string,
  sendError: (res: ServerResponse, statusCode: number, message: string) => void
): Promise<void> {
  return new Promise((resolve) => {
    // Armazenamos os chunks como Buffer para preservar dados binários
    const requestBody: Buffer[] = [];
    
    // Coletamos os dados do corpo da requisição
    req.on('data', (chunk: Buffer) => {
      requestBody.push(chunk);
    });

    // Quando o corpo da requisição terminar de ser lido
    req.on('end', () => {
      const bodyBuffer = Buffer.concat(requestBody);
      const parsedUrl = new URL(targetUrl);

      // Log para depuração
      console.log(`📤 Encaminhando requisição para ${targetUrl}`);
      console.log(`📤 Método: ${req.method}`);
      console.log(`📤 Content-Type: ${req.headers['content-type']}`);
      console.log(`📤 Tamanho do corpo: ${bodyBuffer.length} bytes`);

      // Tenta ler o conteúdo se for JSON para logging
      if (req.headers['content-type']?.includes('application/json') && bodyBuffer.length > 0) {
        try {
          const jsonBody = JSON.parse(bodyBuffer.toString('utf8'));
          console.log(`📤 Corpo JSON:`, jsonBody);
          
          // Se tem muitos dados base64, não loga tudo
          if (jsonBody.fileContent && typeof jsonBody.fileContent === 'string' && jsonBody.fileContent.length > 100) {
            console.log(`📤 fileContent base64 com ${jsonBody.fileContent.length} caracteres`);
          }
          // Se tem muitos dados binários, não loga tudo
        } catch (e) {
          console.log(`📤 Não foi possível fazer parse do corpo como JSON`);
        }
      }

      // Configuração da requisição para o serviço de destino
      const options: http.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        method: req.method,
        headers: {
          ...req.headers,
          host: parsedUrl.host,
        },
      };

      // Adiciona o Content-Length se não estiver presente
      if (!options.headers?.['content-length'] && bodyBuffer.length > 0) {
        options.headers = {
          ...options.headers,
          'content-length': String(bodyBuffer.length),
        };
      }

      // Se o serviço de destino for HTTPS, usamos o módulo https
      const protocol = parsedUrl.protocol === 'https:' ? https : http;

      // Faz a requisição para o serviço de destino
      const proxyReq = protocol.request(options, (proxyRes) => {
        console.log(`📥 Resposta do serviço: ${proxyRes.statusCode}`);
        
        // Coletamos a resposta para logar
        const responseBody: Buffer[] = [];
        
        // Coletamos os dados do corpo da resposta
        proxyRes.on('data', (chunk) => {
          responseBody.push(chunk);
        });
        
        // Quando a resposta terminar de ser lida
        proxyRes.on('end', () => {
          const responseBuffer = Buffer.concat(responseBody);
          
          // Tentamos ler a resposta se for JSON
          if (proxyRes.headers['content-type']?.includes('application/json')) {
            try {
              const jsonResponse = JSON.parse(responseBuffer.toString('utf8'));
              console.log(`📥 Resposta JSON:`, jsonResponse);

              // Se tem muitos dados base64, não loga tudo
            } catch (e) {
              console.log(`📥 Não foi possível fazer parse da resposta como JSON`);
            }
          }
          
          resolve();
        });
        
        // Passa a resposta para o cliente
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res);
      });

      // Se ocorrer um erro na requisição, loga e envia erro 502
      proxyReq.on('error', (error: NodeJS.ErrnoException) => {
        console.error(`❌ Erro ao comunicar com serviço (${targetUrl}):`, error);
        console.error(`❌ Detalhes: ${error.code} - ${error.message}`);

        // Mensagem de erro padrão
        let errorMsg = `Não foi possível conectar ao serviço`;
        if (error.code === 'ECONNREFUSED') {
          errorMsg = `O serviço não está rodando ou não está acessível em ${parsedUrl.host}:${parsedUrl.port}`;
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
          errorMsg = `Timeout ao conectar com o serviço em ${parsedUrl.host}:${parsedUrl.port}`;
        }

        // Envia a resposta de erro para o cliente
        sendError(res, 502, errorMsg);
        resolve();
      });

      // Escreve o corpo da requisição preservando o formato binário original
      if (bodyBuffer.length > 0 && req.method !== 'GET' && req.method !== 'HEAD') {
        proxyReq.write(bodyBuffer);
      }

      proxyReq.end();
    });
  });
}
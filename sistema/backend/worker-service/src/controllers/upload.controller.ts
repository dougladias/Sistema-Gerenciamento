import http from 'http';
import { workerRepository } from '../repositories/worker.repository';
import { connectToDatabase } from '../config/database';
import crypto from 'crypto';

// Função para ler o corpo da requisição
export async function readRequestBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    const body: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      body.push(chunk);
    });
    req.on('end', () => {
      const bodyString = Buffer.concat(body).toString();
      if (bodyString) {
        try {
          resolve(JSON.parse(bodyString));
        } catch (e) {
          resolve(bodyString);
        }
      } else {
        resolve({});
      }
    });
  });
}

// Rotas para upload de arquivos
export const uploadRoutes = [
  {
    method: 'POST',
    path: '/workers/:id/upload/base64',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const body = await readRequestBody(req);
        
        // Validar os dados do upload
        if (!body.data || !body.filename) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Dados incompletos. É necessário enviar data e filename' }));
          return;
        }
        
        // Decodificar base64
        let fileData;
        try {
          // Remover o cabeçalho data:image/png;base64, se existir
          const base64Data = body.data.replace(/^data:[^,]+;base64,/, '');
          fileData = Buffer.from(base64Data, 'base64');
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Formato de base64 inválido' }));
          return;
        }
        
        // Gerar nome único para o arquivo
        const timestamp = Date.now();
        const randomStr = crypto.randomBytes(8).toString('hex');
        const fileExt = body.filename.includes('.') 
          ? body.filename.substring(body.filename.lastIndexOf('.')) 
          : '';
        const fileName = `${timestamp}-${randomStr}${fileExt}`;
        
        // Determinar o mimetype
        let mimetype = body.mimetype || 'application/octet-stream';
        if (!body.mimetype) {
          // Tentar determinar pelo nome do arquivo
          if (fileExt === '.pdf') mimetype = 'application/pdf';
          else if (['.jpg', '.jpeg'].includes(fileExt)) mimetype = 'image/jpeg';
          else if (fileExt === '.png') mimetype = 'image/png';
          else if (['.doc', '.docx'].includes(fileExt)) mimetype = 'application/msword';
        }
        
        // Adicionar registro no banco de dados com o conteúdo binário
        const fileInfo = {
          filename: fileName,
          originalName: body.filename,
          mimetype: mimetype,
          size: fileData.length,
          content: fileData,  
          uploadDate: new Date(),
          description: Array.isArray(body.description) ? body.description.join(', ') : body.description || '',
          category: Array.isArray(body.category) ? body.category.join(', ') : body.category || 'geral'
        };
        
        // Adicionar o arquivo ao funcionário diretamente no banco
        const worker = await workerRepository.addFile(params.id, fileInfo);
        if (!worker) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Funcionário não encontrado' }));
          return;
        }
        
        // Não enviar o conteúdo binário na resposta para economizar largura de banda
        const { content, ...fileInfoWithoutContent } = fileInfo;
        
        // Responder com sucesso
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Arquivo enviado com sucesso',
          file: fileInfoWithoutContent
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Erro ao fazer upload do arquivo: ${(error as Error).message}` }));
      }
    }
  },
  {
    method: 'POST',
    path: '/workers/:id/upload/chunk',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        
        // Aqui implementamos um upload em blocos para arquivos maiores
        // Primeira, obtemos os metadados da cabeçalho
        const contentType = req.headers['content-type'] || 'application/octet-stream';
        const contentDisposition = req.headers['content-disposition'] || '';
        
        // Extrair nome do arquivo do cabeçalho Content-Disposition
        let originalName = 'arquivo';
        const filenameMatch = /filename="([^"]+)"/.exec(contentDisposition);
        if (filenameMatch && filenameMatch[1]) {
          originalName = filenameMatch[1];
        }
        
        // Ler o corpo como binário
        const chunks: Buffer[] = [];
        let totalLength = 0;
        
        // Adiciona o evento de erro
        req.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
          totalLength += chunk.length;
        });
        
        req.on('end', async () => {
          try {
            // Concatenar todos os chunks
            const buffer = Buffer.concat(chunks, totalLength);
            
            // Gerar nome único para o arquivo
            const timestamp = Date.now();
            const randomStr = crypto.randomBytes(8).toString('hex');
            const fileExt = originalName.includes('.') 
              ? originalName.substring(originalName.lastIndexOf('.')) 
              : '';
            const fileName = `${timestamp}-${randomStr}${fileExt}`;
            
            // Adicionar registro no banco de dados com o conteúdo binário
            const fileInfo = {
              filename: fileName,
              originalName: originalName,
              mimetype: contentType,
              size: buffer.length,
              content: buffer,  
              uploadDate: new Date(),
              description: Array.isArray(req.headers['description']) ? req.headers['description'].join(', ') : req.headers['description'] || '',
              category: Array.isArray(req.headers['category']) ? req.headers['category'].join(', ') : req.headers['category'] || 'geral'
            };
            
            // Adicionar o arquivo ao funcionário diretamente no banco
            const worker = await workerRepository.addFile(params.id, fileInfo);
            if (!worker) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Funcionário não encontrado' }));
              return;
            }
            
            // Não enviar o conteúdo binário na resposta
            const { content, ...fileInfoWithoutContent } = fileInfo;
            
            // Responder com sucesso
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
              message: 'Arquivo enviado com sucesso',
              file: fileInfoWithoutContent
            }));
            // Limpar os chunks após o upload
          } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Erro ao processar upload: ${(error as Error).message}` }));
          }
        });
        // Adiciona o evento de erro
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Erro ao iniciar upload: ${(error as Error).message}` }));
      }
    }
  }
];

export default uploadRoutes;
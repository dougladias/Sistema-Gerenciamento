import http from 'http';
import { workerRepository } from '../repositories/worker.repository';
import { connectToDatabase } from '../config/database';

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

// Definição das rotas relacionadas a documentos
export const documentRoutes = [
  {
    method: 'GET',
    path: '/workers/:id/files',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const worker = await workerRepository.findById(params.id);
        if (!worker) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Funcionário não encontrado' }));
          return;
        }
        
        // Retornar os metadados dos arquivos, sem o conteúdo binário
        const filesWithoutContent = worker.files?.map(file => {
          const { content, ...fileWithoutContent } = file;
          return fileWithoutContent;
        }) || [];
        
        // Ordenar os arquivos por data de upload
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(filesWithoutContent));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Erro ao buscar arquivos: ${(error as Error).message}` }));
      }
    }
  },
  {
    method: 'GET',
    path: '/workers/:id/files/:fileId',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const worker = await workerRepository.findById(params.id);
        if (!worker || !worker.files) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Funcionário não encontrado' }));
          return;
        }
        
        // Encontrar o arquivo específico
        const file = worker.files.find(f => f._id?.toString() === params.fileId);
        if (!file) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Arquivo não encontrado' }));
          return;
        }
        
        // Retornar os metadados do arquivo, sem o conteúdo binário
        const { content, ...fileWithoutContent } = file;
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(fileWithoutContent));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Erro ao buscar arquivo: ${(error as Error).message}` }));
      }
    }
  },
  {
    method: 'POST',
    path: '/workers/:id/files',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const body = await readRequestBody(req);
        
        // Validar os dados necessários
        if (!body.filename || !body.originalName || !body.mimetype || !body.content) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Dados incompletos. Forneça filename, originalName, mimetype e content (base64)'
          }));
          return;
        }
        
        // Decodificar o conteúdo Base64
        let fileContent;
        try {
          // Remover o cabeçalho data:image/png;base64, se existir
          const base64Data = body.content.replace(/^data:[^,]+;base64,/, '');
          fileContent = Buffer.from(base64Data, 'base64');
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Formato de base64 inválido' }));
          return;
        }
        
        // Gerar um nome único para o arquivo
        const file = {
          filename: body.filename,
          originalName: body.originalName,
          mimetype: body.mimetype,
          size: fileContent.length,
          content: fileContent,  // Conteúdo binário
          uploadDate: new Date(),
          description: body.description || '',
          category: body.category || 'geral'
        };
        
        // Adicionar o arquivo ao funcionário diretamente no banco
        const worker = await workerRepository.addFile(params.id, file);
        if (!worker) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Funcionário não encontrado' }));
          return;
        }
        
        // Retornar resposta sem o conteúdo binário
        const { content, ...fileResponse } = file;
        
        // Adicionar o arquivo ao funcionário
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Arquivo adicionado com sucesso',
          file: fileResponse
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Erro ao adicionar arquivo: ${(error as Error).message}` }));
      }
    }
  },
  {
    method: 'PUT',
    path: '/workers/:id/files/:fileId',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const body = await readRequestBody(req);
        
        // Permitir atualizar apenas descrição e categoria
        const updates = {
          description: body.description,
          category: body.category
        };
        
        // Verificar se o funcionário existe
        const worker = await workerRepository.updateFile(params.id, params.fileId, updates);
        if (!worker) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Funcionário ou arquivo não encontrado' }));
          return;
        }
        
        // Encontrar o arquivo atualizado
        const updatedFile = worker.files?.find(f => f._id?.toString() === params.fileId);
        if (updatedFile) {
          // Retornar o arquivo sem o conteúdo binário
          const { content, ...fileWithoutContent } = { ...updatedFile };
          
          // Adicionar o arquivo ao funcionário
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            message: 'Arquivo atualizado com sucesso',
            file: fileWithoutContent
          }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            message: 'Arquivo atualizado com sucesso'
          }));
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Erro ao atualizar arquivo: ${(error as Error).message}` }));
      }
    }
  },
  {
    method: 'DELETE',
    path: '/workers/:id/files/:fileId',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const worker = await workerRepository.removeFile(params.id, params.fileId);
        if (!worker) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Funcionário ou arquivo não encontrado' }));
          return;
        }
        
        // Retornar resposta sem o conteúdo binário
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Arquivo removido com sucesso'
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Erro ao remover arquivo: ${(error as Error).message}` }));
      }
    }
  },
  {
    method: 'GET',
    path: '/workers/:id/files/:fileId/download',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const worker = await workerRepository.findById(params.id);
        if (!worker || !worker.files) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Funcionário não encontrado' }));
          return;
        }
        
        // Encontrar o arquivo específico
        const file = worker.files.find(f => f._id?.toString() === params.fileId);
        if (!file) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Arquivo não encontrado' }));
          return;
        }
        
        // Verificar se temos o conteúdo binário
        if (!file.content || file.content.length === 0) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Conteúdo do arquivo não encontrado' }));
          return;
        }
        
        // Enviar o arquivo para download
        res.writeHead(200, {
          'Content-Type': file.mimetype,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(file.originalName)}"`
        });
        
        // Enviar o conteúdo binário
        res.end(file.content);
      } catch (error) {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Erro ao fazer download do arquivo: ${(error as Error).message}` }));
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/workers/:id/files/:fileId/view',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const worker = await workerRepository.findById(params.id);
        if (!worker || !worker.files) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Funcionário não encontrado' }));
          return;
        }
        
        // Encontrar o arquivo específico
        const file = worker.files.find(f => f._id?.toString() === params.fileId);
        if (!file) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Arquivo não encontrado' }));
          return;
        }
        
        // Verificar se temos o conteúdo binário
        if (!file.content || file.content.length === 0) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Conteúdo do arquivo não encontrado' }));
          return;
        }
        
        // Enviar o arquivo para visualização
        res.writeHead(200, {
          'Content-Type': file.mimetype,
          'Content-Disposition': `inline; filename="${encodeURIComponent(file.originalName)}"`
        });
        
        // Enviar o conteúdo binário
        res.end(file.content);
      } catch (error) {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `Erro ao visualizar o arquivo: ${(error as Error).message}` }));
        }
      }
    }
  }
];

export default documentRoutes;
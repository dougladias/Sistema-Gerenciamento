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

// Definição das rotas relacionadas a funcionários
export const workerRoutes = [
  {
    method: 'GET',
    path: '/workers',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        await connectToDatabase();
        const workers = await workerRepository.findAll();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(workers));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro ao buscar funcionários' }));
      }
    }
  },
  {
    method: 'GET',
    path: '/workers/:id',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const worker = await workerRepository.findById(params.id);
        if (!worker) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Funcionário não encontrado' }));
          return;
        }
        
        // Verifica se o funcionário tem arquivos
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(worker));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro ao buscar funcionário' }));
      }
    }
  },
  {
    method: 'POST',
    path: '/workers',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        await connectToDatabase();
        const body = await readRequestBody(req);
        const worker = await workerRepository.create(body);
        
        // Verifica se o funcionário foi criado com sucesso
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(worker));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Erro ao criar funcionário: ${(error as Error).message}` }));
      }
    }
  },
  {
    method: 'PUT',
    path: '/workers/:id',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const body = await readRequestBody(req);
        const worker = await workerRepository.update(params.id, body);
        
        // Verifica se o funcionário foi atualizado com sucesso
        if (!worker) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Funcionário não encontrado' }));
          return;
        }
        
        // Verifica se o funcionário tem arquivos
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(worker));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Erro ao atualizar funcionário: ${(error as Error).message}` }));
      }
    }
  },
  {
    method: 'DELETE',
    path: '/workers/:id',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const deleted = await workerRepository.delete(params.id);
        
        // Verifica se o funcionário foi excluído com sucesso
        if (!deleted) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Funcionário não encontrado' }));
          return;
        }
        
        // Verifica se o funcionário tem arquivos
        res.writeHead(204);
        res.end();
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Erro ao excluir funcionário' }));
      }
    }
  },
  {
    method: 'POST',
    path: '/workers/:id/entries',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const body = await readRequestBody(req);
        const worker = await workerRepository.addEntry(params.id, body);
        
        // Verifica se o funcionário foi atualizado com sucesso
        if (!worker) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Funcionário não encontrado' }));
          return;
        }
        
        // Verifica se o funcionário tem arquivos
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(worker));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Erro ao adicionar registro: ${(error as Error).message}` }));
      }
    }
  }
];

export default workerRoutes;
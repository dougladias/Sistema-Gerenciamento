import http from 'http';
import { logService } from '../services/timeSheet.service';
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

// Definição das rotas relacionadas a registro de ponto
export const logRoutes = [
  {
    method: 'GET',
    path: '/workers/:id/logs',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const logs = await logService.getLogs(params.id);
        
        // Verifica se o funcionário existe
        if (!logs) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Funcionário não encontrado' }));
          return;
        }
        
        // Ordenar logs por data (mais recente primeiro)
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(logs));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Erro ao buscar registros de ponto: ${(error as Error).message}` }));
      }
    }
  },
  {
    method: 'POST',
    path: '/workers/:id/logs',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const body = await readRequestBody(req);
        
        // Validar os dados do registro
        if (!body.entryTime && !body.leaveTime && body.absent !== true) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Dados inválidos. Forneça pelo menos um dos campos: entryTime, leaveTime ou absent' 
          }));
          return;
        }
        
        // Adicionar o registro via serviço
        const addedLog = await logService.addLog(params.id, body);
        
        // Verifica se o funcionário existe
        if (!addedLog) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Funcionário não encontrado' }));
          return;
        }
        
        // Responder com o registro adicionado
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Registro de ponto adicionado com sucesso',
          log: addedLog
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Erro ao adicionar registro de ponto: ${(error as Error).message}` }));
      }
    }
  },
  {
    method: 'GET',
    path: '/workers/:id/logs/:logId',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const log = await logService.getLog(params.id, params.logId);
        
        // Verifica se o registro existe
        if (!log) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Registro de ponto não encontrado' }));
          return;
        }
        
        // Responder com o registro encontrado
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(log));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Erro ao buscar registro de ponto: ${(error as Error).message}` }));
      }
    }
  },
  {
    method: 'PUT',
    path: '/workers/:id/logs/:logId',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const body = await readRequestBody(req);
        
        // Atualizar o registro via serviço
        const updatedLog = await logService.updateLog(params.id, params.logId, body);
        
        // Verifica se o registro existe
        if (!updatedLog) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Funcionário ou registro de ponto não encontrado' }));
          return;
        }
        
        // Responder com o registro atualizado
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Registro de ponto atualizado com sucesso',
          log: updatedLog
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Erro ao atualizar registro de ponto: ${(error as Error).message}` }));
      }
    }
  },
  {
    method: 'DELETE',
    path: '/workers/:id/logs/:logId',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const success = await logService.deleteLog(params.id, params.logId);
        
        // Verifica se o registro foi removido
        if (!success) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Funcionário ou registro de ponto não encontrado' }));
          return;
        }
        
        // Responder com sucesso
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          message: 'Registro de ponto removido com sucesso'
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Erro ao remover registro de ponto: ${(error as Error).message}` }));
      }
    }
  },
  {
    method: 'GET',
    path: '/workers/:id/logs/report',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        
        // Obter parâmetros de consulta
        const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
        const startDate = parsedUrl.searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const endDate = parsedUrl.searchParams.get('endDate') || new Date().toISOString();
        
        // Gerar relatório
        const report = await logService.getLogReport(params.id, startDate, endDate);
        
        // Verifica se o funcionário existe
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(report));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Erro ao gerar relatório: ${(error as Error).message}` }));
      }
    }
  }
];

export default logRoutes;
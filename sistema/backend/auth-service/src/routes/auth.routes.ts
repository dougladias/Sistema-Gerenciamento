import http from 'http';
import { authService } from '../services/auth.service';
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

// Definição das rotas relacionadas à autenticação
export const authRoutes = [
  {
    method: 'POST',
    path: '/auth/login',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        await connectToDatabase();
        const body = await readRequestBody(req);
        
        // Validar dados obrigatórios
        if (!body.email || !body.password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Email e senha são obrigatórios' }));
          return;
        }

        // Tentar fazer login
        const result = await authService.login(body.email, body.password);
        if (!result) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Credenciais inválidas' }));
          return;
        }

        // Login bem-sucedido
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Erro no login: ${(error as Error).message}` }));
      }
    }
  },
  {
    method: 'POST',
    path: '/auth/validate',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const body = await readRequestBody(req);
        
        // Validar token obrigatório
        if (!body.token) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Token é obrigatório' }));
          return;
        }

        // Validar o token
        const decoded = await authService.validateToken(body.token);
        if (!decoded) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Token inválido' }));
          return;
        }

        // Token válido
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ valid: true, user: decoded }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Erro na validação: ${(error as Error).message}` }));
      }
    }
  },
  {
    method: 'POST',
    path: '/auth/refresh',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const body = await readRequestBody(req);
        
        // Validar token obrigatório
        if (!body.token) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Token é obrigatório' }));
          return;
        }

        // Renovar o token
        const newToken = await authService.refreshToken(body.token);
        if (!newToken) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Token inválido para refresh' }));
          return;
        }

        // Token renovado com sucesso
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ token: newToken }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Erro no refresh: ${(error as Error).message}` }));
      }
    }
  },
  {
    method: 'POST',
    path: '/auth/logout',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        // Como JWT é stateless, o logout é apenas uma confirmação
        // A invalidação do token deve ser feita no cliente
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Logout realizado com sucesso' }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Erro no logout: ${(error as Error).message}` }));
      }
    }
  }
];

export default authRoutes;
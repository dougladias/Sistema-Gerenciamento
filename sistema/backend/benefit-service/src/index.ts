import http from 'http';
import { URL } from 'url';
import  connectDatabase  from './config/database';
import  benefitRoutes  from './routes/benefit.route';

// Configurações
const PORT = process.env.PORT || 3003;
const HOST = process.env.HOST || 'localhost';

// Função para processar parâmetros da URL
function extractParams(pattern: string, pathname: string): any {
  const patternParts = pattern.split('/');
  const pathnameParts = pathname.split('/');
  
  if (patternParts.length !== pathnameParts.length) {
    return null;
  }
  
  const params: any = {};
  
  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathnamePart = pathnameParts[i];
    
    if (patternPart.startsWith(':')) {
      // É um parâmetro
      const paramName = patternPart.slice(1);
      params[paramName] = pathnamePart;
    } else if (patternPart !== pathnamePart) {
      // Não é um match
      return null;
    }
  }
  
  return params;
}

// Função para encontrar rota correspondente
function findRoute(method: string, pathname: string) {
  for (const route of Array.isArray(benefitRoutes) ? benefitRoutes : []) {
    if (route.method === method) {
      // Verifica se é uma rota exata
      if (route.path === pathname) {
        return { route, params: {} };
      }
      
      // Verifica se é uma rota com parâmetros
      const params = extractParams(route.path, pathname);
      if (params !== null) {
        return { route, params };
      }
    }
  }
  return null;
}

// Servidor HTTP
const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const pathname = url.pathname;
    const method = req.method || 'GET';

    console.log(`${new Date().toISOString()} - ${method} ${pathname}`);

    // Encontrar rota correspondente
    const routeMatch = findRoute(method, pathname);
    
    if (routeMatch) {
      await routeMatch.route.handler(req, res, routeMatch.params);
    } else {
      // Rota não encontrada
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        message: 'Rota não encontrada',
        path: pathname,
        method: method
      }));
    }
  } catch (error: any) {
    console.error('Erro no servidor:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    }));
  }
});

// Inicializar servidor
async function startServer() {
  try {
    // Conectar ao banco de dados
    await connectDatabase();
    
    // Iniciar servidor HTTP
    server.listen(PORT, () => {
      console.log('🚀 Benefit Service iniciado com sucesso!');
      console.log(`📡 Servidor rodando em: http://${HOST}:${PORT}`);
      console.log(`📅 Iniciado em: ${new Date().toLocaleString('pt-BR')}`);
      console.log('📋 Rotas disponíveis:');
      if (Array.isArray(benefitRoutes)) {
        benefitRoutes.forEach((route: { method: string; path: string; handler: (req: http.IncomingMessage, res: http.ServerResponse, params: any) => Promise<void> }) => {
          console.log(`   ${route.method} ${route.path}`);
        });
      } else {
        console.error('❌ benefitRoutes não é um array de rotas.');
      }
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 Recebido SIGTERM, desligando servidor...');
      server.close(() => {
        console.log('✅ Servidor fechado com sucesso');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('🛑 Recebido SIGINT, desligando servidor...');
      server.close(() => {
        console.log('✅ Servidor fechado com sucesso');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Iniciar o servidor
startServer();
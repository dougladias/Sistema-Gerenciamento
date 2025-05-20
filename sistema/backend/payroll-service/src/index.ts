import http from 'http';
import { connectToDatabase } from './config/database';
import { payrollRoutes } from './routes/payroll.route';
import { payslipRoutes } from './routes/payslip.route';
import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Configurações do servidor
const HOST = process.env.PAYROLL_SERVICE_HOST || 'localhost';
const PORT = parseInt(process.env.PAYROLL_SERVICE_PORT || '4013');

// Todas as rotas
const allRoutes = [...payrollRoutes, ...payslipRoutes];

// Inicia o servidor
async function startServer() {
  try {
    // Conecta ao banco de dados
    await connectToDatabase();
    
    // Cria o servidor HTTP
    const server = http.createServer(async (req, res) => {
      // Configurações CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      // Responde ao preflight OPTIONS
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }
      
      // Verifica a rota
      const url = req.url || '/';
      const method = req.method || 'GET';
      
      // Extrair o caminho base sem parâmetros de consulta
      const urlObj = new URL(url, `http://${HOST}:${PORT}`);
      const path = urlObj.pathname; // Apenas o caminho sem query parameters
      
      // Rota de status/saúde da API
      if (path === '/health' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'OK', 
          service: 'Payroll Service',
          timestamp: new Date().toISOString()
        }));
        return;
      }
      
      // Encontra o handler correspondente
      let handled = false;
      
      for (const route of allRoutes) {
        if (route.method === method && routeToRegex(route.path).test(path)) { 
          const params = extractParams(route.path, path);
          try {
            // Passa a URL original para que o handler tenha acesso aos query parameters
            await route.handler(req, res, params);
          } catch (error) {
            console.error(`Erro não tratado na rota ${route.path}:`, error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Erro interno do servidor' }));
          }
          handled = true;
          break;
        }
      }
      
      // Se nenhuma rota foi encontrada
      if (!handled) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Rota não encontrada' }));
      }
    });
    
    // Inicia o servidor
    server.listen(PORT, HOST, () => {
      console.log(`🚀 Payroll Service iniciado em http://${HOST}:${PORT}`);
      console.log(`📝 Configuração: host=${HOST}, porta=${PORT}`);
      console.log(`🔍 Verificação de saúde: http://${HOST}:${PORT}/health`);
      
      // Exibe as rotas disponíveis
      console.log('\n📊 Endpoints disponíveis:');
      console.log(`GET /health - Verificação de saúde da API`);
      
      // Agrupa as rotas para uma melhor visualização
      console.log('\n🔹 Rotas de Folha de Pagamento:');
      payrollRoutes.forEach(route => {
        console.log(`${route.method.padEnd(6)} ${route.path}`);
      });
      
      console.log('\n🔹 Rotas de Holerites:');
      payslipRoutes.forEach(route => {
        console.log(`${route.method.padEnd(6)} ${route.path}`);
      });
    });
    
    // Tratamento de erro para o servidor
    server.on('error', (error) => {
      console.error(`❌ Erro no servidor:`, error);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
}

// Converte a rota para uma expressão regular
function routeToRegex(path: string): RegExp {
  const pattern = path
    .replace(/:\w+/g, '([^/]+)')  // Substitui :param por grupo de captura
    .replace(/\//g, '\\/');       // Escapa as barras
  return new RegExp(`^${pattern}$`);
}

// Extrai parâmetros da URL
function extractParams(routePath: string, url: string): Record<string, string> {
  const params: Record<string, string> = {};
  
  // Divide a rota e a URL em partes
  const routeParts = routePath.split('/');
  const urlParts = url.split('/');
  
  // Verifica se o número de partes é igual
  for (let i = 0; i < routeParts.length; i++) {
    if (routeParts[i].startsWith(':')) {
      const paramName = routeParts[i].substring(1);
      params[paramName] = urlParts[i];
    }
  }
  
  return params;
}

// Inicia o servidor
startServer();

// Tratamento de exceções não capturadas
process.on('uncaughtException', (error) => {
  console.error('❌ Exceção não capturada:', error);
  // Em produção, você pode notificar serviços de monitoramento aqui
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Rejeição não tratada em:', promise, 'razão:', reason);
  // Em produção, você pode notificar serviços de monitoramento aqui
});

// Tratamento de encerramento do processo
process.on('SIGINT', async () => {
  console.log('🛑 Payroll Service encerrando...');
  process.exit(0);
});
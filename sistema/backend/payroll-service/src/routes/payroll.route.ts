import http from 'http';
import { payrollService } from '../services/payroll.service';

// Função para ler o corpo da requisição
async function readRequestBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    const body: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      body.push(chunk);
    });
    // Quando o corpo da requisição termina de ser lido
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

// Rotas para folhas de pagamento
export const payrollRoutes = [
  // Criar nova folha de pagamento
  {
    method: 'POST',
    path: '/payrolls',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const body = await readRequestBody(req);
        
        // Verifica se os dados necessários estão presentes
        if (!body.month || !body.year) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Mês e ano são obrigatórios' }));
          return;
        }
        
        // Verifica se o mês e ano são válidos
        const payroll = await payrollService.createPayroll(
          parseInt(body.month), 
          parseInt(body.year)
        );
        
        // Retorna a folha de pagamento criada
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payroll));
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    }
  },
  
  // Listar folhas de pagamento
  {
    method: 'GET',
    path: '/payrolls',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        // Extrair parâmetros de query
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        
        // Verifica se os parâmetros são válidos
        const result = await payrollService.listPayrolls(page, limit);
        
        // Retorna a lista de folhas de pagamento
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    }
  },
  
  // Obter uma folha de pagamento
  {
    method: 'GET',
    path: '/payrolls/:id',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        const payroll = await payrollService.getPayrollById(params.id);
        
        // Verifica se a folha de pagamento foi encontrada
        if (!payroll) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Folha de pagamento não encontrada' }));
          return;
        }
        
        // Retorna a folha de pagamento
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payroll));
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    }
  },
  
  // Processar folha de pagamento
  {
    method: 'POST',
    path: '/payrolls/:id/process',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        const body = await readRequestBody(req);
        
        // Verifica se os dados de funcionários estão presentes
        if (!body.employees || !Array.isArray(body.employees) || body.employees.length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Dados de funcionários não fornecidos ou inválidos' }));
          return;
        }
        
        // Processa a folha de pagamento com os dados fornecidos
        const payroll = await payrollService.processPayroll(params.id, body.employees);
        
        // Verifica se a folha de pagamento foi encontrada
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payroll));
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    }
  },
  
  // Obter holerites de uma folha de pagamento
  {
    method: 'GET',
    path: '/payrolls/:id/payslips',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        const payslips = await payrollService.getPayslipsByPayrollId(params.id);
        
        // Verifica se os holerites foram encontrados
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payslips));
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    }
  },
  
  // Obter resumo da folha de pagamento
  {
    method: 'GET',
    path: '/payrolls/:id/summary',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        const summary = await payrollService.getPayrollSummary(params.id);
        
        // Verifica se o resumo foi encontrado
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(summary));
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    }
  }
];
import http from 'http';
import { payrollService } from '../services/payroll.service';
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

// Rota para a folha de pagamento
export const payrollRoutes = [
  {
    method: 'GET',
    path: '/payrolls',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        await connectToDatabase();
        
        // Analisar parâmetros de consulta para filtrar por mês/ano
        const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
        const month = parsedUrl.searchParams.get('month');
        const year = parsedUrl.searchParams.get('year');
        
        let payrolls;
        
        // Se mês e ano especificados, filtra por período
        if (month && year) {
          payrolls = await payrollService.getPayrollsByMonth(
            parseInt(month, 10), 
            parseInt(year, 10)
          );
        } else {
          // Caso contrário, busca todos os registros de payroll
          const PayrollModel = (await import('../models/payroll.model')).createPayrollModel();
          payrolls = await PayrollModel.find().sort({ year: -1, month: -1 }).exec();
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payrolls));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: `Erro ao buscar folhas de pagamento: ${(error as Error).message}` 
        }));
      }
    }
  },
  {
    method: 'GET',
    path: '/payrolls/:id',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const payroll = await payrollService.getPayroll(params.id);
        
        if (!payroll) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Folha de pagamento não encontrada' }));
          return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payroll));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: `Erro ao buscar folha de pagamento: ${(error as Error).message}` 
        }));
      }
    }
  },
  {
    method: 'GET',
    path: '/workers/:workerId/payrolls',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const payrolls = await payrollService.getPayrollsByWorker(params.workerId);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payrolls));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: `Erro ao buscar folhas de pagamento do funcionário: ${(error as Error).message}` 
        }));
      }
    }
  },
  {
    method: 'POST',
    path: '/workers/:workerId/payrolls',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const body = await readRequestBody(req);
        
        // Validação dos dados de entrada
        if (!body.month || !body.year) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Mês e ano são obrigatórios' }));
          return;
        }
        
        const month = parseInt(body.month, 10);
        const year = parseInt(body.year, 10);
        
        // Validação do mês
        if (month < 1 || month > 12) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Mês deve estar entre 1 e 12' }));
          return;
        }
        
        // Gera a folha de pagamento para o funcionário
        const payroll = await payrollService.generatePayrollForWorker(params.workerId, month, year);
        
        if (!payroll) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Não foi possível gerar a folha de pagamento. Verifique se o funcionário existe.' 
          }));
          return;
        }
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'Folha de pagamento gerada com sucesso',
          payroll
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: `Erro ao gerar folha de pagamento: ${(error as Error).message}` 
        }));
      }
    }
  },
  {
    method: 'POST',
    path: '/payrolls/batch',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        await connectToDatabase();
        const body = await readRequestBody(req);
        
        // Validação dos dados de entrada
        if (!body.month || !body.year) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Mês e ano são obrigatórios' }));
          return;
        }
        
        const month = parseInt(body.month, 10);
        const year = parseInt(body.year, 10);
        
        // Validação do mês
        if (month < 1 || month > 12) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Mês deve estar entre 1 e 12' }));
          return;
        }
        
        // Gera folhas de pagamento para todos os funcionários
        const payrolls = await payrollService.generatePayrollForAllWorkers(month, year);
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: `Folhas de pagamento geradas com sucesso: ${payrolls.length} funcionários processados`,
          count: payrolls.length
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: `Erro ao gerar folhas de pagamento em lote: ${(error as Error).message}` 
        }));
      }
    }
  },
  {
    method: 'PUT',
    path: '/payrolls/:id/status',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const body = await readRequestBody(req);
        
        // Validação dos dados de entrada
        if (!body.status) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Status é obrigatório' }));
          return;
        }
        
        let payroll = null;
        
        // Atualiza o status da folha de pagamento
        if (body.status === 'completed') {
          payroll = await payrollService.approvePayroll(params.id);
        } else if (body.status === 'canceled') {
          payroll = await payrollService.cancelPayroll(params.id);
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Status inválido. Use "completed" ou "canceled"' 
          }));
          return;
        }
        
        if (!payroll) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Folha de pagamento não encontrada' }));
          return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: `Status da folha de pagamento atualizado para ${body.status}`,
          payroll
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: `Erro ao atualizar status da folha de pagamento: ${(error as Error).message}` 
        }));
      }
    }
  },
  {
    method: 'POST',
    path: '/payrolls/:id/deductions',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const body = await readRequestBody(req);
        
        // Validação dos dados de entrada
        if (!body.name || !body.value || !body.type) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Nome, valor e tipo são obrigatórios para o desconto' 
          }));
          return;
        }
        
        // Adiciona o desconto à folha de pagamento
        const payrollRepo = (await import('../repositories/payroll.repository')).payrollRepository;
        const payroll = await payrollRepo.addDeduction(params.id, {
          name: body.name,
          value: parseFloat(body.value),
          type: body.type,
          description: body.description
        });
        
        if (!payroll) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Folha de pagamento não encontrada' }));
          return;
        }
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'Desconto adicionado com sucesso',
          payroll
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: `Erro ao adicionar desconto: ${(error as Error).message}` 
        }));
      }
    }
  },
  {
    method: 'POST',
    path: '/payrolls/:id/benefits',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const body = await readRequestBody(req);
        
        // Validação dos dados de entrada
        if (!body.name || !body.value || !body.type) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Nome, valor e tipo são obrigatórios para o benefício' 
          }));
          return;
        }
        
        // Adiciona o benefício à folha de pagamento
        const payrollRepo = (await import('../repositories/payroll.repository')).payrollRepository;
        const payroll = await payrollRepo.addBenefit(params.id, {
          name: body.name,
          value: parseFloat(body.value),
          type: body.type,
          description: body.description
        });
        
        if (!payroll) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Folha de pagamento não encontrada' }));
          return;
        }
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'Benefício adicionado com sucesso',
          payroll
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: `Erro ao adicionar benefício: ${(error as Error).message}` 
        }));
      }
    }
  },
  {
    method: 'POST',
    path: '/payrolls/:id/additionals',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const body = await readRequestBody(req);
        
        // Validação dos dados de entrada
        if (!body.name || !body.value || !body.type) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Nome, valor e tipo são obrigatórios para o adicional' 
          }));
          return;
        }
        
        // Adiciona o adicional à folha de pagamento
        const payrollRepo = (await import('../repositories/payroll.repository')).payrollRepository;
        const payroll = await payrollRepo.addAdditional(params.id, {
          name: body.name,
          value: parseFloat(body.value),
          type: body.type,
          description: body.description
        });
        
        if (!payroll) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Folha de pagamento não encontrada' }));
          return;
        }
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'Adicional adicionado com sucesso',
          payroll
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: `Erro ao adicionar adicional: ${(error as Error).message}` 
        }));
      }
    }
  },
  {
    method: 'DELETE',
    path: '/payrolls/:id/deductions/:deductionId',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        
        // Remove o desconto da folha de pagamento
        const payrollRepo = (await import('../repositories/payroll.repository')).payrollRepository;
        const payroll = await payrollRepo.removeDeduction(params.id, params.deductionId);
        
        if (!payroll) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Folha de pagamento ou desconto não encontrado' }));
          return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'Desconto removido com sucesso',
          payroll
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: `Erro ao remover desconto: ${(error as Error).message}` 
        }));
      }
    }
  },
  {
    method: 'DELETE',
    path: '/payrolls/:id/benefits/:benefitId',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        
        // Remove o benefício da folha de pagamento
        const payrollRepo = (await import('../repositories/payroll.repository')).payrollRepository;
        const payroll = await payrollRepo.removeBenefit(params.id, params.benefitId);
        
        if (!payroll) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Folha de pagamento ou benefício não encontrado' }));
          return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'Benefício removido com sucesso',
          payroll
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: `Erro ao remover benefício: ${(error as Error).message}` 
        }));
      }
    }
  },
  {
    method: 'DELETE',
    path: '/payrolls/:id/additionals/:additionalId',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        
        // Remove o adicional da folha de pagamento
        const payrollRepo = (await import('../repositories/payroll.repository')).payrollRepository;
        const payroll = await payrollRepo.removeAdditional(params.id, params.additionalId);
        
        if (!payroll) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Folha de pagamento ou adicional não encontrado' }));
          return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'Adicional removido com sucesso',
          payroll
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: `Erro ao remover adicional: ${(error as Error).message}` 
        }));
      }
    }
  },
  {
    method: 'POST',
    path: '/payrolls/:id/recalculate',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        
        // Recalcula a folha de pagamento
        const payroll = await payrollService.recalculatePayroll(params.id);
        
        if (!payroll) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Folha de pagamento não encontrada' }));
          return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'Folha de pagamento recalculada com sucesso',
          payroll
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: `Erro ao recalcular folha de pagamento: ${(error as Error).message}` 
        }));
      }
    }
  },
  {
    method: 'PUT',
    path: '/payrolls/:id/notes',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const body = await readRequestBody(req);
        
        // Validação dos dados de entrada
        if (!body.notes) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Observações são obrigatórias' }));
          return;
        }
        
        // Atualiza as observações da folha de pagamento
        const payrollRepo = (await import('../repositories/payroll.repository')).payrollRepository;
        const payroll = await payrollRepo.update(params.id, { notes: body.notes });
        
        if (!payroll) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Folha de pagamento não encontrada' }));
          return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'Observações atualizadas com sucesso',
          payroll
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: `Erro ao atualizar observações: ${(error as Error).message}` 
        }));
      }
    }
  }
];

export default payrollRoutes;
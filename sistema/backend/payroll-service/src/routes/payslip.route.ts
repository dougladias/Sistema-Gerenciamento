import http from 'http';
import * as fs from 'fs';
import { payrollService } from '../services/payroll.service';
import { PayslipModel } from '../models/payslip.model';

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

// Rotas para holerites
export const payslipRoutes = [
  // Simular/calcular um holerite (sem salvar no banco)
  {
    method: 'POST',
    path: '/payslips/calculate',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const body = await readRequestBody(req);
        
        // Verifica se os dados necessários estão presentes
        if (!body || !body.id || !body.name || !body.contractType || !body.baseSalary) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Dados insuficientes para cálculo do holerite' }));
          return;
        }
        
        // Importa dinamicamente o calculador
        const { calculateSalary } = await import('../utils/payroll.calculator');
        
        // Calcula o holerite
        const calculatedPayslip = calculateSalary(body);
        
        // Retorna o resultado
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(calculatedPayslip));
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    }
  },

  // Obter um holerite específico
  {
    method: 'GET',
    path: '/payslips/:id',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        const payslip = await PayslipModel.findById(params.id);
        
        // Verifica se o holerite foi encontrado
        if (!payslip) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Holerite não encontrado' }));
          return;
        }
        
        // Retorna o holerite encontrado
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payslip));
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    }
  },
  
  // Atualizar status do holerite
  {
    method: 'PATCH',
    path: '/payslips/:id/status',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        const body = await readRequestBody(req);
        
        // Verifica se o status foi fornecido
        if (!body.status) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Status não fornecido' }));
          return;
        }
        
        // Atualiza o status do holerite
        const payslip = await PayslipModel.findByIdAndUpdate(
          params.id, 
          { status: body.status },
          { new: true }
        );
        
        // Verifica se o holerite foi encontrado
        if (!payslip) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Holerite não encontrado' }));
          return;
        }
        
        // Retorna o holerite atualizado
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payslip));
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    }
  },
  
  // Buscar holerites por funcionário
  {
    method: 'GET',
    path: '/payslips/worker/:workerId',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        // Extrair parâmetros de query
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const month = url.searchParams.get('month');
        const year = url.searchParams.get('year');
        
        // Constrói a query
        const query: any = { workerId: params.workerId };
        
        // Adiciona mês e ano à query se fornecidos
        if (month) {
          query.month = parseInt(month);
        }
        
        // Adiciona ano à query se fornecido
        if (year) {
          query.year = parseInt(year);
        }
        
        // Busca os holerites
        const payslips = await PayslipModel.find(query)
          .sort({ year: -1, month: -1 });
        
        // Verifica se os holerites foram encontrados
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payslips));
      } catch (error: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    }
  },
  
  // Gerar PDF de um holerite
  {
    method: 'GET',
    path: '/payslips/:id/pdf',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        const filePath = await payrollService.generatePayslipPDF(params.id);
        
        // Define cabeçalhos para download
        res.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="holerite.pdf"`
        });
        
        // Envia o arquivo para o cliente
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
        // Limpa o arquivo após o download
        fileStream.on('end', () => {
          fs.unlink(filePath, (err) => {
            if (err) console.error('Erro ao excluir arquivo temporário:', err);
          });
        });
        // Encerra a resposta
      } catch (error: any) {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      }
    }
  },
  
  // Visualizar holerite (PDF inline)
  {
    method: 'GET',
    path: '/payslips/:id/view',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        const filePath = await payrollService.generatePayslipPDF(params.id);
        
        // Define cabeçalhos para visualização inline
        res.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline'
        });
        
        // Envia o arquivo para o cliente
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
        // Limpa o arquivo após o download
        fileStream.on('end', () => {
          fs.unlink(filePath, (err) => {
            if (err) console.error('Erro ao excluir arquivo temporário:', err);
          });
        });
        // Encerra a resposta
      } catch (error: any) {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: error.message }));
        }
      }
    }
  }
];
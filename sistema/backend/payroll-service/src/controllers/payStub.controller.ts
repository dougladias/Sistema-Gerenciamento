import http from 'http';
import { payStubService } from '../services/payStub.service';
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

// Função para obter o IP do cliente
function getClientIp(req: http.IncomingMessage): string {
  const xForwardedFor = req.headers['x-forwarded-for'] as string;
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  
  // @ts-ignore - TypeScript não reconhece a propriedade socket.remoteAddress
  return req.socket?.remoteAddress || req.connection?.remoteAddress || '0.0.0.0';
}

// Rotas para holerites
export const payStubRoutes = [
  {
    method: 'GET',
    path: '/paystubs',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        await connectToDatabase();
        
        // Analisar parâmetros de consulta para filtrar por mês/ano
        const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
        const month = parsedUrl.searchParams.get('month');
        const year = parsedUrl.searchParams.get('year');
        
        let payStubs;
        
        // Se mês e ano especificados, filtra por período
        if (month && year) {
          payStubs = await payStubService.getPayStubsByMonth(
            parseInt(month, 10), 
            parseInt(year, 10)
          );
        } else {
          // Caso contrário, busca todos os holerites
          const PayStubModel = (await import('../models/payStub.model')).createPayStubModel();
          payStubs = await PayStubModel.find().sort({ year: -1, month: -1 }).exec();
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payStubs));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: `Erro ao buscar holerites: ${(error as Error).message}` 
        }));
      }
    }
  },
  {
    method: 'GET',
    path: '/paystubs/:id',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const payStub = await payStubService.getPayStub(params.id);
        
        if (!payStub) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Holerite não encontrado' }));
          return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payStub));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: `Erro ao buscar holerite: ${(error as Error).message}` 
        }));
      }
    }
  },
  {
    method: 'GET',
    path: '/workers/:workerId/paystubs',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        const payStubs = await payStubService.getPayStubsByWorker(params.workerId);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(payStubs));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: `Erro ao buscar holerites do funcionário: ${(error as Error).message}` 
        }));
      }
    }
  },
  {
    method: 'POST',
    path: '/payrolls/:payrollId/paystubs',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        
        // Gera o holerite para a folha de pagamento
        const payStub = await payStubService.generatePayStub(params.payrollId);
        
        if (!payStub) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            error: 'Não foi possível gerar o holerite. Verifique se a folha de pagamento existe e está aprovada.' 
          }));
          return;
        }
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'Holerite gerado com sucesso',
          payStub
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: `Erro ao gerar holerite: ${(error as Error).message}` 
        }));
      }
    }
  },
  {
    method: 'POST',
    path: '/paystubs/batch',
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
        
        // Gera holerites para todas as folhas de pagamento do mês
        const payStubs = await payStubService.generatePayStubsForMonth(month, year);
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: `Holerites gerados com sucesso: ${payStubs.length} holerites processados`,
          count: payStubs.length
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: `Erro ao gerar holerites em lote: ${(error as Error).message}` 
        }));
      }
    }
  },
  {
    method: 'POST',
    path: '/paystubs/:id/sign',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        
        // Obtém o IP do cliente
        const ip = getClientIp(req);
        
        // Assina o holerite
        const payStub = await payStubService.signPayStub(params.id, ip);
        
        if (!payStub) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Holerite não encontrado' }));
          return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'Holerite assinado com sucesso',
          payStub
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: `Erro ao assinar holerite: ${(error as Error).message}` 
        }));
      }
    }
  },
  {
    method: 'POST',
    path: '/paystubs/:id/pdf',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        
        // Gera o PDF do holerite
        const pdfUrl = await payStubService.generatePdf(params.id);
        
        if (!pdfUrl) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Holerite não encontrado' }));
          return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'PDF do holerite gerado com sucesso',
          pdfUrl
        }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: `Erro ao gerar PDF do holerite: ${(error as Error).message}` 
        }));
      }
    }
  },
  {
    method: 'GET',
    path: '/paystubs/:id/pdf',
    handler: async (req: http.IncomingMessage, res: http.ServerResponse, params: any) => {
      try {
        await connectToDatabase();
        
        // Obtém o PDF do holerite
        const pdfBuffer = await payStubService.getPayStubPdf(params.id);
        
        if (!pdfBuffer) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'PDF do holerite não encontrado' }));
          return;
        }
        
        // Obtém o holerite para o nome do arquivo
        const payStub = await payStubService.getPayStub(params.id);
        const fileName = payStub 
          ? `holerite_${payStub.documentNumber.replace('-', '_')}.pdf`
          : `holerite_${params.id}.pdf`;
        
        // Configura os cabeçalhos para download do PDF
        res.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${fileName}"`,
          'Content-Length': pdfBuffer.length
        });
        
        // Envia o PDF
        res.end(pdfBuffer);
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          error: `Erro ao obter PDF do holerite: ${(error as Error).message}` 
        }));
      }
    }
  },
  {
    method: 'PUT',
    path: '/paystubs/:id/notes',
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
        
        // Atualiza as observações do holerite
        const payStubRepo = (await import('../repositories/payStub.repository')).payStubRepository;
        const payStub = await payStubRepo.update(params.id, { notes: body.notes });
        
        if (!payStub) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Holerite não encontrado' }));
          return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: 'Observações atualizadas com sucesso',
          payStub
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

export default payStubRoutes;
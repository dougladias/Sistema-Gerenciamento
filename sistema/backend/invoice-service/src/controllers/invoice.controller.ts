import http from 'http';
import { invoiceService } from '../services/invoice.service';
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

export class InvoiceController {
  // Lista todas as notas fiscais
  async getAllInvoices(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      await connectToDatabase();
      const invoices = await invoiceService.getAllInvoices();
      
      // Remove o conteúdo binário dos anexos
      const invoicesWithoutContent = invoices.map(invoice => {
        const invoiceObj = invoice.toObject();
        if (invoiceObj.attachment && invoiceObj.attachment.content) {
          const { content, ...attachmentWithoutContent } = invoiceObj.attachment;
          invoiceObj.attachment = attachmentWithoutContent;
        }
        return invoiceObj;
      });
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(invoicesWithoutContent));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao buscar notas fiscais: ${(error as Error).message}` }));
    }
  }

  // Busca uma nota fiscal por ID
  async getInvoiceById(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      await connectToDatabase();
      const invoice = await invoiceService.getInvoiceById(id);
      
      if (!invoice) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Nota fiscal não encontrada' }));
        return;
      }
      
      // Remove o conteúdo binário do anexo
      const invoiceObj = invoice.toObject();
      if (invoiceObj.attachment && invoiceObj.attachment.content) {
        const { content, ...attachmentWithoutContent } = invoiceObj.attachment;
        invoiceObj.attachment = attachmentWithoutContent;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(invoiceObj));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao buscar nota fiscal: ${(error as Error).message}` }));
    }
  }

  // Cria uma nova nota fiscal
  async createInvoice(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      await connectToDatabase();
      const body = await readRequestBody(req);
      
      // Cria a nota fiscal
      const invoice = await invoiceService.createInvoice(body);
      
      // Remove o conteúdo binário do anexo na resposta
      const invoiceObj = invoice.toObject();
      if (invoiceObj.attachment && invoiceObj.attachment.content) {
        const { content, ...attachmentWithoutContent } = invoiceObj.attachment;
        invoiceObj.attachment = attachmentWithoutContent;
      }
      
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(invoiceObj));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao criar nota fiscal: ${(error as Error).message}` }));
    }
  }

  // Atualiza uma nota fiscal
  async updateInvoice(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      await connectToDatabase();
      const body = await readRequestBody(req);
      
      // Atualiza a nota fiscal
      const invoice = await invoiceService.updateInvoice(id, body);
      
      if (!invoice) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Nota fiscal não encontrada' }));
        return;
      }
      
      // Remove o conteúdo binário do anexo na resposta
      const invoiceObj = invoice.toObject();
      if (invoiceObj.attachment && invoiceObj.attachment.content) {
        const { content, ...attachmentWithoutContent } = invoiceObj.attachment;
        invoiceObj.attachment = attachmentWithoutContent;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(invoiceObj));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao atualizar nota fiscal: ${(error as Error).message}` }));
    }
  }

  // Atualiza o status de uma nota fiscal
  async updateInvoiceStatus(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      await connectToDatabase();
      const body = await readRequestBody(req);
      
      if (!body.status) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Status é obrigatório' }));
        return;
      }
      
      // Valida o status
      if (!['pendente', 'pago', 'cancelado'].includes(body.status)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Status inválido. Use: pendente, pago ou cancelado' }));
        return;
      }
      
      // Atualiza o status
      const invoice = await invoiceService.updateInvoiceStatus(id, body.status);
      
      if (!invoice) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Nota fiscal não encontrada' }));
        return;
      }
      
      // Remove o conteúdo binário do anexo na resposta
      const invoiceObj = invoice.toObject();
      if (invoiceObj.attachment && invoiceObj.attachment.content) {
        const { content, ...attachmentWithoutContent } = invoiceObj.attachment;
        invoiceObj.attachment = attachmentWithoutContent;
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(invoiceObj));
    } catch (error) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao atualizar status: ${(error as Error).message}` }));
    }
  }

  // Remove uma nota fiscal
  async deleteInvoice(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      await connectToDatabase();
      const deleted = await invoiceService.deleteInvoice(id);
      
      if (!deleted) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Nota fiscal não encontrada' }));
        return;
      }
      
      res.writeHead(204);
      res.end();
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Erro ao excluir nota fiscal: ${(error as Error).message}` }));
    }
  }

  // Download do arquivo da nota fiscal
  async downloadInvoice(req: http.IncomingMessage, res: http.ServerResponse, id: string): Promise<void> {
    try {
      await connectToDatabase();
      const invoice = await invoiceService.getInvoiceById(id);
      
      if (!invoice || !invoice.attachment) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Nota fiscal ou anexo não encontrado' }));
        return;
      }
      
      // Verifica se temos o conteúdo binário
      if (!invoice.attachment.content || invoice.attachment.content.length === 0) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Conteúdo do arquivo não encontrado' }));
        return;
      }
      
      // Envia o arquivo para download
      res.writeHead(200, {
        'Content-Type': invoice.attachment.mimetype,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(invoice.attachment.originalName)}"`
      });
      
      // Envia o conteúdo binário
      res.end(invoice.attachment.content);
    } catch (error) {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Erro ao fazer download: ${(error as Error).message}` }));
      }
    }
  }
}

// Exporta uma instância única do controlador
export const invoiceController = new InvoiceController();
export default invoiceController;
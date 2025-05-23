import { IInvoice } from '../models/invoice.model';
import { invoiceRepository } from '../repositories/invoice.repository';
import crypto from 'crypto';
import path from 'path';

export class InvoiceService {
  // Gera um nome único para o arquivo
  private generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName);
    return `${timestamp}-${randomStr}${extension}`;
  }

  // Busca todas as notas fiscais
  async getAllInvoices(): Promise<IInvoice[]> {
    return invoiceRepository.findAll();
  }

  // Busca uma nota fiscal por ID
  async getInvoiceById(id: string): Promise<IInvoice | null> {
    return invoiceRepository.findById(id);
  }

  // Busca uma nota fiscal por número
  async getInvoiceByNumber(number: string): Promise<IInvoice | null> {
    return invoiceRepository.findByNumber(number);
  }

  // Cria uma nova nota fiscal
  async createInvoice(invoiceData: any): Promise<IInvoice> {
    // Valida campos obrigatórios
    this.validateBasicFields(invoiceData);
    
    // Processa o anexo se existir
    if (invoiceData.attachment && invoiceData.attachment.content) {
      // Decodifica base64
      const base64Data = invoiceData.attachment.content.replace(/^data:[^,]+;base64,/, '');
      const contentBuffer = Buffer.from(base64Data, 'base64');
      
      // Gera nome único para o arquivo
      const filename = this.generateUniqueFilename(invoiceData.attachment.originalName);
      
      invoiceData.attachment = {
        ...invoiceData.attachment,
        filename,
        content: contentBuffer,
        size: contentBuffer.length,
        uploadDate: new Date()
      };
    }
    
    // Cria a nota fiscal
    return invoiceRepository.create(invoiceData);
  }

  // Valida campos básicos da nota fiscal
  private validateBasicFields(invoice: any): void {
    if (!invoice.number) {
      throw new Error('Número da nota fiscal é obrigatório');
    }
    
    if (!invoice.date) {
      throw new Error('Data de emissão é obrigatória');
    }
    
    if (invoice.value === undefined || invoice.value <= 0) {
      throw new Error('Valor da nota fiscal deve ser maior que zero');
    }
    
    if (!invoice.description) {
      throw new Error('Descrição da nota fiscal é obrigatória');
    }
    
    if (!invoice.issuer) {
      throw new Error('Nome do emissor é obrigatório');
    }
    
    if (!invoice.recipient) {
      throw new Error('Nome do destinatário é obrigatório');
    }
    
    if (!invoice.attachment || !invoice.attachment.originalName || !invoice.attachment.content) {
      throw new Error('Arquivo da nota fiscal é obrigatório');
    }
  }

  // Atualiza uma nota fiscal
  async updateInvoice(id: string, updates: Partial<IInvoice>): Promise<IInvoice | null> {
    // Remove campos que não devem ser atualizados diretamente
    const { _id, attachment, ...updateData } = updates;
    
    return invoiceRepository.update(id, updateData);
  }

  // Atualiza o status de uma nota fiscal
  async updateInvoiceStatus(id: string, status: IInvoice['status']): Promise<IInvoice | null> {
    return invoiceRepository.updateStatus(id, status);
  }

  // Remove uma nota fiscal
  async deleteInvoice(id: string): Promise<boolean> {
    return invoiceRepository.delete(id);
  }
}

// Exporta uma instância única do serviço
export const invoiceService = new InvoiceService();
export default invoiceService;
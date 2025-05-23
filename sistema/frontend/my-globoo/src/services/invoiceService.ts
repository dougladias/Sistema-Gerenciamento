import apiService from './api';
import { Invoice, InvoiceCreate, InvoiceUpdate, InvoiceFilter, InvoiceStatus } from '../types/invoice';

// Serviço para gerenciar operações relacionadas a notas fiscais
export class InvoiceService {
  private baseEndpoint: string = '/api/invoices';

  // Obtém todas as notas fiscais
  async getAllInvoices(): Promise<Invoice[]> {
    return apiService.get<Invoice[]>(this.baseEndpoint);
  }

  // Obtém uma nota fiscal por ID
  async getInvoiceById(id: string): Promise<Invoice> {
    return apiService.get<Invoice>(`${this.baseEndpoint}/${id}`);
  }

  // Cria uma nova nota fiscal
  async createInvoice(data: InvoiceCreate): Promise<Invoice> {
    return apiService.post<Invoice>(this.baseEndpoint, data);
  }

  // Atualiza uma nota fiscal existente
  async updateInvoice(id: string, data: InvoiceUpdate): Promise<Invoice> {
    return apiService.put<Invoice>(`${this.baseEndpoint}/${id}`, data);
  }

  // Atualiza apenas o status de uma nota fiscal
  async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    return apiService.put<Invoice>(`${this.baseEndpoint}/${id}/status`, { status });
  }

  // Exclui uma nota fiscal
  async deleteInvoice(id: string): Promise<void> {
    return apiService.delete(`${this.baseEndpoint}/${id}`);
  }

  // Download do arquivo da nota fiscal
  async downloadInvoice(id: string): Promise<Blob> {
    try {
      return await apiService.downloadBlob(`${this.baseEndpoint}/${id}/download`);
    } catch (error) {
      console.error('Erro ao baixar nota fiscal:', error);
      throw new Error(`Falha ao baixar o arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Filtra notas fiscais
  async filterInvoices(filter: InvoiceFilter): Promise<Invoice[]> {
    // Constrói os parâmetros de consulta
    const params = new URLSearchParams();
    
    if (filter.startDate) {
      params.append('startDate', filter.startDate.toISOString());
    }
    
    if (filter.endDate) {
      params.append('endDate', filter.endDate.toISOString());
    }
    
    if (filter.status) {
      params.append('status', filter.status);
    }
    
    if (filter.issuer) {
      params.append('issuerDocument', filter.issuer);
    }
    
    if (filter.recipient) {
      params.append('recipientDocument', filter.recipient);
    }
    
    if (filter.minValue !== undefined) {
      params.append('minValue', filter.minValue.toString());
    }
    
    if (filter.maxValue !== undefined) {
      params.append('maxValue', filter.maxValue.toString());
    }
    
    // Constrói a URL com os parâmetros
    const endpoint = `${this.baseEndpoint}?${params.toString()}`;
    
    return apiService.get<Invoice[]>(endpoint);
  }
}

// Exporta uma instância do serviço
export const invoiceService = new InvoiceService();
export default invoiceService;
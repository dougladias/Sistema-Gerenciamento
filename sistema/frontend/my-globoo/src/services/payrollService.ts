import apiService from './api';
import { 
  Payroll, 
  Paystub, 
  PayrollCreate, 
  PayrollUpdate, 
  PaystubCreate, 
  PaystubUpdate,
  PayrollFilter,
  PaystubFilter 
} from '../types/payroll';

// Serviço para gerenciar operações relacionadas a folhas de pagamento e holerites
export class PayrollService {
  private basePayrollEndpoint: string = '/payrolls';
  private basePaystubEndpoint: string = '/paystubs';
  private baseWorkerEndpoint: string = '/workers';

  // ---- OPERAÇÕES DE FOLHA DE PAGAMENTO ----

  // Obtém todas as folhas de pagamento
  async getAllPayrolls(): Promise<Payroll[]> {
    return apiService.get<Payroll[]>(this.basePayrollEndpoint);
  }

  // Obtém folha de pagamento por ID
  async getPayrollById(id: string): Promise<Payroll> {
    return apiService.get<Payroll>(`${this.basePayrollEndpoint}/${id}`);
  }

  // Cria uma nova folha de pagamento
  async createPayroll(data: PayrollCreate): Promise<Payroll> {
    return apiService.post<Payroll>(this.basePayrollEndpoint, data);
  }

  // Atualiza uma folha de pagamento existente
  async updatePayroll(id: string, data: PayrollUpdate): Promise<Payroll> {
    return apiService.put<Payroll>(`${this.basePayrollEndpoint}/${id}`, data);
  }

  // Exclui uma folha de pagamento
  async deletePayroll(id: string): Promise<void> {
    return apiService.delete(`${this.basePayrollEndpoint}/${id}`);
  }

  // Filtra folhas de pagamento
  async filterPayrolls(filter: PayrollFilter): Promise<Payroll[]> {
    // Constrói a query string
    const params = new URLSearchParams();
    if (filter.month !== undefined) params.append('month', filter.month.toString());
    if (filter.year !== undefined) params.append('year', filter.year.toString());
    if (filter.status) params.append('status', filter.status);
    
    const queryString = params.toString();
    const endpoint = queryString 
      ? `${this.basePayrollEndpoint}?${queryString}` 
      : this.basePayrollEndpoint;
    
    return apiService.get<Payroll[]>(endpoint);
  }

  // Fecha uma folha de pagamento (muda status para 'closed')
  async closePayroll(id: string): Promise<Payroll> {
    return apiService.put<Payroll>(`${this.basePayrollEndpoint}/${id}/close`, {});
  }

  // Gera holerites para uma folha de pagamento
  async generatePaystubs(payrollId: string): Promise<Paystub[]> {
    return apiService.post<Paystub[]>(`${this.basePayrollEndpoint}/${payrollId}/generate-paystubs`, {});
  }

  // Obtém holerites associados a uma folha de pagamento
  async getPayrollPaystubs(payrollId: string): Promise<Paystub[]> {
    return apiService.get<Paystub[]>(`${this.basePayrollEndpoint}/${payrollId}/paystubs`);
  }

  // ---- OPERAÇÕES DE HOLERITE ----

  // Obtém todos os holerites
  async getAllPaystubs(): Promise<Paystub[]> {
    return apiService.get<Paystub[]>(this.basePaystubEndpoint);
  }

  // Obtém holerite por ID
  async getPaystubById(id: string): Promise<Paystub> {
    return apiService.get<Paystub>(`${this.basePaystubEndpoint}/${id}`);
  }

  // Cria um novo holerite
  async createPaystub(data: PaystubCreate): Promise<Paystub> {
    return apiService.post<Paystub>(this.basePaystubEndpoint, data);
  }

  // Atualiza um holerite existente
  async updatePaystub(id: string, data: PaystubUpdate): Promise<Paystub> {
    return apiService.put<Paystub>(`${this.basePaystubEndpoint}/${id}`, data);
  }

  // Exclui um holerite
  async deletePaystub(id: string): Promise<void> {
    return apiService.delete(`${this.basePaystubEndpoint}/${id}`);
  }

  // Filtra holerites
  async filterPaystubs(filter: PaystubFilter): Promise<Paystub[]> {
    // Constrói a query string
    const params = new URLSearchParams();
    if (filter.workerId) params.append('workerId', filter.workerId);
    if (filter.month !== undefined) params.append('month', filter.month.toString());
    if (filter.year !== undefined) params.append('year', filter.year.toString());
    if (filter.status) params.append('status', filter.status);
    
    const queryString = params.toString();
    const endpoint = queryString 
      ? `${this.basePaystubEndpoint}?${queryString}` 
      : this.basePaystubEndpoint;
    
    return apiService.get<Paystub[]>(endpoint);
  }

  // Aprova um holerite
  async approvePaystub(id: string): Promise<Paystub> {
    return apiService.put<Paystub>(`${this.basePaystubEndpoint}/${id}/approve`, {});
  }

  // Gera documento PDF para um holerite
  async generatePaystubDocument(id: string): Promise<Blob> {
    return apiService.get<Blob>(`${this.basePaystubEndpoint}/${id}/document`, {}, true);
  }

  // Download do PDF do holerite
  async downloadPaystub(id: string): Promise<Blob> {
    return apiService.downloadBlob(`${this.basePaystubEndpoint}/${id}/download`);
  }

  // ---- OPERAÇÕES RELACIONADAS A FUNCIONÁRIOS ----

  // Obtém todos os holerites de um funcionário
  async getWorkerPaystubs(workerId: string): Promise<Paystub[]> {
    return apiService.get<Paystub[]>(`${this.baseWorkerEndpoint}/${workerId}/paystubs`);
  }

  // Filtra holerites de um funcionário específico
  async filterWorkerPaystubs(
    workerId: string, 
    filter: Omit<PaystubFilter, 'workerId'>
  ): Promise<Paystub[]> {
    // Constrói a query string
    const params = new URLSearchParams();
    if (filter.month !== undefined) params.append('month', filter.month.toString());
    if (filter.year !== undefined) params.append('year', filter.year.toString());
    if (filter.status) params.append('status', filter.status);
    
    // Adiciona o ID do funcionário à query string
    const queryString = params.toString();
    const endpoint = queryString 
      ? `${this.baseWorkerEndpoint}/${workerId}/paystubs?${queryString}` 
      : `${this.baseWorkerEndpoint}/${workerId}/paystubs`;
    
    return apiService.get<Paystub[]>(endpoint);
  }
}

// Exporta uma instância do serviço
export const payrollService = new PayrollService();
export default payrollService;
import apiService from './api';
import { 
  Payroll, 
  Payslip, 
  PayrollCreate, 
  PayrollProcess, 
  PayrollSummary,
  PayslipCalculate,
  PayslipStatus
} from '../types/payroll';

// Serviço para gerenciar operações relacionadas à folha de pagamento
export class PayrollService {
  private baseEndpoint: string = '/api/payrolls';
  private payslipEndpoint: string = '/api/payslips';

  // Obtém todas as folhas de pagamento
  async getAllPayrolls(page: number = 1, limit: number = 10): Promise<{
    payrolls: Payroll[];
    total: number;
    page: number;
    pages: number;
  }> {
    return apiService.get<{
      payrolls: Payroll[];
      total: number;
      page: number;
      pages: number;
    }>(`${this.baseEndpoint}?page=${page}&limit=${limit}`);
  }

  // Obtém uma folha de pagamento por ID
  async getPayrollById(id: string): Promise<Payroll> {
    return apiService.get<Payroll>(`${this.baseEndpoint}/${id}`);
  }

  // Cria uma nova folha de pagamento
  async createPayroll(data: PayrollCreate): Promise<Payroll> {
    return apiService.post<Payroll>(this.baseEndpoint, data);
  }

  // Processa uma folha de pagamento
  async processPayroll(id: string, data: PayrollProcess): Promise<Payroll> {
    return apiService.post<Payroll>(`${this.baseEndpoint}/${id}/process`, data);
  }

  // Obtém os holerites de uma folha de pagamento
  async getPayslipsByPayrollId(payrollId: string): Promise<Payslip[]> {
    return apiService.get<Payslip[]>(`${this.baseEndpoint}/${payrollId}/payslips`);
  }

  // Obtém o resumo de uma folha de pagamento
  async getPayrollSummary(payrollId: string): Promise<PayrollSummary> {
    return apiService.get<PayrollSummary>(`${this.baseEndpoint}/${payrollId}/summary`);
  }

  // Obtém um holerite por ID
  async getPayslipById(id: string): Promise<Payslip> {
    return apiService.get<Payslip>(`${this.payslipEndpoint}/${id}`);
  }

  // Calcula um holerite (simulação)
  async calculatePayslip(data: PayslipCalculate): Promise<Payslip> {
    return apiService.post<Payslip>(`${this.payslipEndpoint}/calculate`, data);
  }

  // Atualiza o status de um holerite
  async updatePayslipStatus(id: string, status: PayslipStatus): Promise<Payslip> {
    return apiService.put<Payslip>(`${this.payslipEndpoint}/${id}/status`, { status });
  }

  // Busca holerites por funcionário
  async getPayslipsByWorker(workerId: string, month?: number, year?: number): Promise<Payslip[]> {
    let endpoint = `${this.payslipEndpoint}/worker/${workerId}`;
    
    // Adiciona parâmetros se fornecidos
    if (month || year) {
      const params = new URLSearchParams();
      if (month) params.append('month', month.toString());
      if (year) params.append('year', year.toString());
      endpoint += `?${params.toString()}`;
    }
    
    return apiService.get<Payslip[]>(endpoint);
  }

  // Download de PDF do holerite
  async downloadPayslipPDF(id: string): Promise<Blob> {
    try {
      return await apiService.downloadBlob(`${this.payslipEndpoint}/${id}/pdf`);
    } catch (error) {
      console.error('Erro ao baixar PDF do holerite:', error);
      throw new Error(`Falha ao baixar o arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Visualização de PDF do holerite
  async viewPayslipPDF(id: string): Promise<Blob> {
    try {
      return await apiService.downloadBlob(`${this.payslipEndpoint}/${id}/view`);
    } catch (error) {
      console.error('Erro ao visualizar PDF do holerite:', error);
      throw new Error(`Falha ao visualizar o arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
}

// Exporta uma instância do serviço
export const payrollService = new PayrollService();
export default payrollService;
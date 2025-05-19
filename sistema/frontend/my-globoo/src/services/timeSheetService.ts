import apiService from './api';
import { Entry } from '../types/worker';

export interface LogReport {
  totalDays: number;
  present: number;
  absent: number;
  logs: Entry[];
}

export class LogService {
  private baseEndpoint: string = '/workers';

  // Obtém todos os registros de ponto de um funcionário
  async getWorkerLogs(workerId: string): Promise<Entry[]> {
    return apiService.get<Entry[]>(`${this.baseEndpoint}/${workerId}/logs`);
  }

  // Obtém um registro de ponto específico pelo ID
  async getLogById(workerId: string, logId: string): Promise<Entry> {
    return apiService.get<Entry>(`${this.baseEndpoint}/${workerId}/logs/${logId}`);
  }

  // Adiciona um novo registro de ponto
  async addLog(workerId: string, logData: Partial<Entry>): Promise<Entry> {
    return apiService.post<Entry>(
      `${this.baseEndpoint}/${workerId}/logs`,
      logData
    );
  }

  // Atualiza informações de um registro de ponto
  async updateLog(
    workerId: string,
    logId: string,
    updates: Partial<Entry>
  ): Promise<Entry> {
    return apiService.put<Entry>(
      `${this.baseEndpoint}/${workerId}/logs/${logId}`,
      updates
    );
  }

  // Remove um registro de ponto
  async deleteLog(workerId: string, logId: string): Promise<void> {
    return apiService.delete(`${this.baseEndpoint}/${workerId}/logs/${logId}`);
  }

  // Gera relatório de ponto por período
  async getLogReport(workerId: string, startDate?: Date | string, endDate?: Date | string): Promise<LogReport> {
    let endpoint = `${this.baseEndpoint}/${workerId}/logs/report`;
    
    // Adiciona parâmetros de query se fornecidos
    if (startDate || endDate) {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', new Date(startDate).toISOString());
      if (endDate) params.append('endDate', new Date(endDate).toISOString());
      endpoint += `?${params.toString()}`;
    }
    
    // Faz a requisição para obter o relatório
    return apiService.get<LogReport>(endpoint);
  }

  // Filtra registros de ponto por período
  async filterLogsByDate(workerId: string, startDate: Date | string, endDate: Date | string): Promise<Entry[]> {
    // No backend não há endpoint específico para filtro, então vamos obter todos os logs e filtrar localmente
    const logs = await this.getWorkerLogs(workerId);
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Filtra os logs que estão dentro do intervalo de datas
    return logs.filter(log => {
      const logDate = log.date ? new Date(log.date) : null;
      if (!logDate) return false;
      return logDate >= start && logDate <= end;
    });
  }

  // Filtra registros por presença/ausência
  async filterLogsByAbsence(workerId: string, absent: boolean): Promise<Entry[]> {
    const logs = await this.getWorkerLogs(workerId);
    return logs.filter(log => log.absent === absent);
  }
}

// Exporta uma instância do serviço
export const logService = new LogService();
export default logService;
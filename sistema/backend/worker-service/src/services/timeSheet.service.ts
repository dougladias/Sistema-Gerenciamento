import { IEntry } from '../models/worker.model';
import { workerRepository } from '../repositories/worker.repository';

export class LogService {
  // Busca todos os registros de ponto de um funcionário
  async getLogs(workerId: string): Promise<IEntry[]> {
    const worker = await workerRepository.findById(workerId);
    if (!worker) return [];

    // Ordenar logs por data (mais recente primeiro)
    return [...(worker.logs || [])].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  }

  // Busca um registro de ponto específico
  async getLog(workerId: string, logId: string): Promise<IEntry | null> {
    const worker = await workerRepository.findById(workerId);
    if (!worker || !worker.logs) return null;

    return worker.logs.find(log => log._id?.toString() === logId) || null;
  }

  // Adiciona um novo registro de ponto
  async addLog(workerId: string, logData: {
    entryTime?: Date | string;
    leaveTime?: Date | string;
    absent?: boolean;
    date?: Date | string;
  }): Promise<IEntry | null> {
    try {
      // Verifica se o funcionário existe
      const worker = await workerRepository.findById(workerId);
      if (!worker) return null;

      // Prepara o objeto de entrada
      const entry: IEntry = {
        entryTime: logData.entryTime ? new Date(logData.entryTime) : undefined,
        leaveTime: logData.leaveTime ? new Date(logData.leaveTime) : undefined,
        absent: logData.absent || false,
        date: logData.date ? new Date(logData.date) : new Date(),
        createdAt: new Date()
      };

      // Adiciona o registro de ponto ao funcionário
      const updatedWorker = await workerRepository.addEntry(workerId, entry);
      if (!updatedWorker || !updatedWorker.logs) return null;

      // Retorna o registro de ponto adicionado
      return updatedWorker.logs[updatedWorker.logs.length - 1];
    } catch (error) {
      console.error('Erro ao adicionar registro de ponto:', error);
      throw error;
    }
  }

  // Atualiza um registro de ponto
  async updateLog(workerId: string, logId: string, updates: Partial<IEntry>): Promise<IEntry | null> {
    // Obtém o registro atual
    const currentLog = await this.getLog(workerId, logId);
    if (!currentLog) return null;

    // Prepara as atualizações
    const logUpdates: Partial<IEntry> = {
      entryTime: updates.entryTime !== undefined ? new Date(updates.entryTime) : undefined,
      leaveTime: updates.leaveTime !== undefined ? new Date(updates.leaveTime) : undefined,
      absent: updates.absent,
      date: updates.date !== undefined ? new Date(updates.date) : undefined
    };

    // Atualiza o registro de ponto no banco de dados
    const updatedWorker = await workerRepository.updateEntry(workerId, logId, logUpdates);
    if (!updatedWorker || !updatedWorker.logs) return null;

    // Retorna o registro de ponto atualizado
    return updatedWorker.logs.find(log => log._id?.toString() === logId) || null;
  }

  // Remove um registro de ponto
  async deleteLog(workerId: string, logId: string): Promise<boolean> {
    try {
      // Remove o registro de ponto
      const result = await workerRepository.removeEntry(workerId, logId);
      return result !== null;
    } catch (error) {
      console.error('Erro ao remover registro de ponto:', error);
      throw error;
    }
  }

  // Gera um relatório de ponto por período
  async getLogReport(workerId: string, startDate: Date | string, endDate: Date | string): Promise<any> {
    const worker = await workerRepository.findById(workerId);
    if (!worker || !worker.logs) return { totalDays: 0, present: 0, absent: 0, logs: [] };

    // Converte as datas de string para Date
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Filtra os logs pelo período
    const logsInPeriod = worker.logs.filter(log => {
      const logDate = log.date ? new Date(log.date) : null;
      if (!logDate) return false;
      return logDate >= start && logDate <= end;
    });

    // Calcula estatísticas
    const present = logsInPeriod.filter(log => !log.absent).length;
    const absent = logsInPeriod.filter(log => log.absent).length;

    // Retorna o relatório
    return {
      totalDays: logsInPeriod.length,
      present,
      absent,
      logs: logsInPeriod.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      })
    };
  }
}

// Exporta uma instância única do serviço
export const logService = new LogService();
export default logService;
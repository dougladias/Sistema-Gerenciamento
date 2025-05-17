import apiService from './api';
import { Worker, WorkerCreate, WorkerUpdate, WorkerFilter, WorkerFile } from '../types/worker';

// Serviço para gerenciar operações relacionadas a funcionários
export class WorkerService {
  private baseEndpoint: string = '/workers';

  // Obtém todos os funcionários
  async getAllWorkers(): Promise<Worker[]> {
    return apiService.get<Worker[]>(this.baseEndpoint);
  }

  // Obtém funcionário por ID
  async getWorkerById(id: string): Promise<Worker> {
    return apiService.get<Worker>(`${this.baseEndpoint}/${id}`);
  }

  // Obtém funcionário por CPF
  async createWorker(data: WorkerCreate): Promise<Worker> {
    return apiService.post<Worker>(this.baseEndpoint, data);
  }

  // Atualiza um funcionário existente
  async updateWorker(id: string, data: WorkerUpdate): Promise<Worker> {
    return apiService.put<Worker>(`${this.baseEndpoint}/${id}`, data);
  }

  // Exclui um funcionário
  async deleteWorker(id: string): Promise<void> {
    return apiService.delete(`${this.baseEndpoint}/${id}`);
  }

  // Adiciona um registro de entrada/saída para um funcionário
  async addEntry(workerId: string, entry: { entryTime?: Date; leaveTime?: Date; absent?: boolean }): Promise<Worker> {
    return apiService.post<Worker>(`${this.baseEndpoint}/${workerId}/entries`, entry);
  }

  // Adiciona um arquivo a um funcionário
  async addFile(
    workerId: string, 
    file: { 
      filename: string; 
      originalName: string; 
      mimetype: string; 
      size: number; 
      fileContent: string; 
      description?: string;
      category?: string;
    }
  ): Promise<Worker> {
    return apiService.post<Worker>(`${this.baseEndpoint}/${workerId}/files`, file);
  }

  // Atualiza informações de um arquivo
  async updateFile(
    workerId: string,
    fileId: string,
    updates: { description?: string; category?: string }
  ): Promise<Worker> {
    return apiService.put<Worker>(`${this.baseEndpoint}/${workerId}/files/${fileId}`, updates);
  }

  // Remove um arquivo
  async removeFile(workerId: string, fileId: string): Promise<Worker> {
    return apiService.delete<Worker>(`${this.baseEndpoint}/${workerId}/files/${fileId}`);
  }

  // Obtém os arquivos de um funcionário
  async getWorkerFiles(workerId: string): Promise<WorkerFile[]> {
    const worker = await this.getWorkerById(workerId);
    return worker.files || [];
  }

  /// Filtro de funcionários
  async filterWorkers(filter: WorkerFilter): Promise<Worker[]> {
    const workers = await this.getAllWorkers();
    
    return workers.filter(worker => {
      // Verifica cada critério de filtro
      if (filter.name && !worker.name.toLowerCase().includes(filter.name.toLowerCase())) {
        return false;
      }
      
      // Verifica se o departamento, cargo, status ou contrato correspondem
      if (filter.department && worker.department !== filter.department) {
        return false;
      }
      
      // Verifica se o cargo corresponde
      if (filter.role && worker.role !== filter.role) {
        return false;
      }
      
      // Verifica se o status corresponde
      if (filter.status && worker.status !== filter.status) {
        return false;
      }
      
      // Verifica se o contrato corresponde
      if (filter.contract && worker.contract !== filter.contract) {
        return false;
      }
      
      return true;
    });
  }
}

// Exporta uma instância do serviço
export const workerService = new WorkerService();
export default workerService;
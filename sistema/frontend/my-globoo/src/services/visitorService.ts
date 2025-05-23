import apiService from './api';
import {
  Visitor,
  VisitorCreate,
  VisitorUpdate,
  VisitorPhotoUpdate,
  VisitorFilter,
  VisitorStatus
} from '../types/visitor';

// Serviço para gerenciar operações relacionadas a visitantes
export class VisitorService {
  private baseEndpoint: string = '/api/visitors';

  // Obtém todos os visitantes (com filtros opcionais)
  async getAllVisitors(filter?: VisitorFilter): Promise<Visitor[]> {
    let endpoint = this.baseEndpoint;
    
    // Se houver filtros, adiciona como parâmetros de consulta
    if (filter) {
      const params = new URLSearchParams();
      
      if (filter.name) params.append('name', filter.name);
      if (filter.documentNumber) params.append('documentNumber', filter.documentNumber);
      if (filter.hostName) params.append('hostName', filter.hostName);
      if (filter.status) params.append('status', filter.status);
      
      if (filter.startDate) {
        params.append('startDate', typeof filter.startDate === 'string' 
          ? filter.startDate 
          : filter.startDate.toISOString());
      }
      
      if (filter.endDate) {
        params.append('endDate', typeof filter.endDate === 'string' 
          ? filter.endDate 
          : filter.endDate.toISOString());
      }
      
      endpoint += `?${params.toString()}`;
    }
    
    return apiService.get<Visitor[]>(endpoint);
  }

  // Obtém os visitantes atuais (que estão no prédio)
  async getCurrentVisitors(): Promise<Visitor[]> {
    return apiService.get<Visitor[]>(`${this.baseEndpoint}/current`);
  }

  // Obtém um visitante pelo ID
  async getVisitorById(id: string): Promise<Visitor> {
    return apiService.get<Visitor>(`${this.baseEndpoint}/${id}`);
  }

  // Cria um novo visitante
  async createVisitor(data: VisitorCreate): Promise<Visitor> {
    return apiService.post<Visitor>(this.baseEndpoint, data);
  }

  // Atualiza um visitante
  async updateVisitor(id: string, data: VisitorUpdate): Promise<Visitor> {
    return apiService.put<Visitor>(`${this.baseEndpoint}/${id}`, data);
  }

  // Atualiza a foto de um visitante
  async updateVisitorPhoto(id: string, photoData: VisitorPhotoUpdate): Promise<Visitor> {
    return apiService.put<Visitor>(`${this.baseEndpoint}/${id}/photo`, photoData);
  }

  // Atualiza o status de um visitante
  async updateVisitorStatus(id: string, status: VisitorStatus): Promise<Visitor> {
    return apiService.put<Visitor>(`${this.baseEndpoint}/${id}/status`, { status });
  }

  // Registra a entrada de um visitante
  async checkInVisitor(id: string): Promise<Visitor> {
    return apiService.post<Visitor>(`${this.baseEndpoint}/${id}/check-in`, {});
  }

  // Registra a saída de um visitante
  async checkOutVisitor(id: string): Promise<Visitor> {
    return apiService.post<Visitor>(`${this.baseEndpoint}/${id}/check-out`, {});
  }

  // Exclui um visitante
  async deleteVisitor(id: string): Promise<void> {
    return apiService.delete(`${this.baseEndpoint}/${id}`);
  }

  // Obtém a URL para a foto do visitante
  getVisitorPhotoUrl(id: string): string {
    return `${apiService.baseUrl}${this.baseEndpoint}/${id}/photo`;
  }

  // Converte uma imagem de File para Base64
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
}

// Exporta uma instância do serviço
export const visitorService = new VisitorService();
export default visitorService;
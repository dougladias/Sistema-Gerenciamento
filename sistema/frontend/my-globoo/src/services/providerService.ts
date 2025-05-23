import apiService from './api';
import {
  Provider,
  ProviderCreate,
  ProviderUpdate,
  ProviderPhotoUpdate,
  ProviderFilter,
  ProviderStatus
} from '../types/provider';

// Serviço para gerenciar operações relacionadas a fornecedores
export class ProviderService {
  private baseEndpoint: string = '/api/providers';

  // Obtém todos os fornecedores (com filtros opcionais)
  async getAllProviders(filter?: ProviderFilter): Promise<Provider[]> {
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
    
    return apiService.get<Provider[]>(endpoint);
  }

  // Obtém os fornecedores atuais (que estão no prédio)
  async getCurrentProviders(): Promise<Provider[]> {
    return apiService.get<Provider[]>(`${this.baseEndpoint}/current`);
  }

  // Obtém um fornecedor pelo ID
  async getProviderById(id: string): Promise<Provider> {
    return apiService.get<Provider>(`${this.baseEndpoint}/${id}`);
  }

  // Cria um novo fornecedor
  async createProvider(data: ProviderCreate): Promise<Provider> {
    return apiService.post<Provider>(this.baseEndpoint, data);
  }

  // Atualiza um fornecedor
  async updateProvider(id: string, data: ProviderUpdate): Promise<Provider> {
    return apiService.put<Provider>(`${this.baseEndpoint}/${id}`, data);
  }

  // Atualiza a foto de um fornecedor
  async updateProviderPhoto(id: string, photoData: ProviderPhotoUpdate): Promise<Provider> {
    return apiService.put<Provider>(`${this.baseEndpoint}/${id}/photo`, photoData);
  }

  // Atualiza o status de um fornecedor
  async updateProviderStatus(id: string, status: ProviderStatus): Promise<Provider> {
    return apiService.put<Provider>(`${this.baseEndpoint}/${id}/status`, { status });
  }

  // Registra a entrada de um fornecedor
  async checkInProvider(id: string): Promise<Provider> {
    return apiService.post<Provider>(`${this.baseEndpoint}/${id}/check-in`, {});
  }

  // Registra a saída de um fornecedor
  async checkOutProvider(id: string): Promise<Provider> {
    return apiService.post<Provider>(`${this.baseEndpoint}/${id}/check-out`, {});
  }

  // Exclui um fornecedor
  async deleteProvider(id: string): Promise<void> {
    return apiService.delete(`${this.baseEndpoint}/${id}`);
  }

  // Obtém a URL para a foto do fornecedor
  getProviderPhotoUrl(id: string): string {
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
export const providerService = new ProviderService();
export default providerService;
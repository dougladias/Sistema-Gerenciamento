import apiService from './api';
import { Template, TemplateCreate, TemplateUpdate, TemplateFilter } from '../types/template';

// Serviço para gerenciar operações relacionadas a templates
export class TemplateService {
  private baseEndpoint: string = '/api/templates';

  // Obtém todos os templates
  async getAllTemplates(): Promise<Template[]> {
    return apiService.get<Template[]>(this.baseEndpoint);
  }

  // Obtém template por ID
  async getTemplateById(id: string): Promise<Template> {
    return apiService.get<Template>(`${this.baseEndpoint}/${id}`);
  }

  // Obtém templates por tipo
  async getTemplatesByType(type: string): Promise<Template[]> {
    return apiService.get<Template[]>(`${this.baseEndpoint}/type/${encodeURIComponent(type)}`);
  }

  // Cria um novo template
  async createTemplate(data: TemplateCreate): Promise<Template> {
    return apiService.post<Template>(this.baseEndpoint, data);
  }

  // Atualiza um template existente
  async updateTemplate(id: string, data: TemplateUpdate): Promise<Template> {
    return apiService.put<Template>(`${this.baseEndpoint}/${id}`, data);
  }

  // Exclui um template
  async deleteTemplate(id: string): Promise<void> {
    return apiService.delete(`${this.baseEndpoint}/${id}`);
  }

  // Upload de arquivo de template
  async uploadTemplate(data: TemplateCreate): Promise<Template> {
    return apiService.post<Template>(this.baseEndpoint, data);
  }

  // Download de arquivo de template - nova abordagem sem headers problemáticos
  async downloadTemplate(id: string): Promise<Blob> {
    try {
      // Usando o novo método específico para download
      return await apiService.downloadBlob(`${this.baseEndpoint}/${id}/download`);
    } catch (error) {
      console.error('Erro ao baixar template:', error);
      throw new Error(`Falha ao baixar o arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Filtra templates
  async filterTemplates(filter: TemplateFilter): Promise<Template[]> {
    const templates = await this.getAllTemplates();
    
    return templates.filter(template => {
      // Filtra por nome
      if (filter.name && !template.name.toLowerCase().includes(filter.name.toLowerCase())) {
        return false;
      }
      
      // Filtra por tipo
      if (filter.type && template.type !== filter.type) {
        return false;
      }
      
      // Filtra por criador
      if (filter.createdBy && template.createdBy !== filter.createdBy) {
        return false;
      }
      
      return true;
    });
  }
}

// Exporta uma instância do serviço
export const templateService = new TemplateService();
export default templateService;
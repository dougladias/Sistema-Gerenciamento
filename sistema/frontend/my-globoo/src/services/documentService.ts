import apiService from './api';
import { WorkerFile } from '../types/worker';

// Serviço para gerenciar operações relacionadas a documentos
export class DocumentService {
  private baseEndpoint: string = '/workers';

  // Obtém todos os documentos de um funcionário
  async getWorkerDocuments(workerId: string): Promise<WorkerFile[]> {
    return apiService.get<WorkerFile[]>(`${this.baseEndpoint}/${workerId}/files`);
  }

  // Obtém um documento específico pelo ID
  async getDocumentById(workerId: string, fileId: string): Promise<WorkerFile> {
    return apiService.get<WorkerFile>(`${this.baseEndpoint}/${workerId}/files/${fileId}`);
  }

  // Upload de um novo documento
  async uploadDocument(
    workerId: string,
    documentData: {
      filename: string;
      originalName: string;
      mimetype: string;
      size: number;
      fileContent: string; // Base64
      description?: string;
      category?: string;
    }
  ): Promise<WorkerFile> {
    return apiService.post<WorkerFile>(
      `${this.baseEndpoint}/${workerId}/files`,
      documentData
    );
  }

  // Atualiza informações de um documento
  async updateDocument(
    workerId: string,
    fileId: string,
    updates: {
      description?: string;
      category?: string;
    }
    // Atualiza o arquivo
  ): Promise<WorkerFile> {
    return apiService.put<WorkerFile>(
      `${this.baseEndpoint}/${workerId}/files/${fileId}`,
      updates
    );
  }

  // Remove um documento
  async deleteDocument(workerId: string, fileId: string): Promise<void> {
    return apiService.delete(`${this.baseEndpoint}/${workerId}/files/${fileId}`);
  }

  // Download de um documento
  async downloadDocument(workerId: string, fileId: string): Promise<Blob> {
    try {
      return await apiService.downloadBlob(`${this.baseEndpoint}/${workerId}/files/${fileId}/download`);
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      throw new Error(`Falha ao baixar o arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Filtra documentos de um funcionário por categoria
  async filterDocumentsByCategory(workerId: string, category: string): Promise<WorkerFile[]> {
    const documents = await this.getWorkerDocuments(workerId);
    return documents.filter(doc => doc.category === category);
  }

  // Filtra documentos por tipo MIME
  async filterDocumentsByMimeType(workerId: string, mimeType: string): Promise<WorkerFile[]> {
    const documents = await this.getWorkerDocuments(workerId);
    return documents.filter(doc => doc.mimetype.includes(mimeType));
  }
}

// Exporta uma instância do serviço
export const documentService = new DocumentService();
export default documentService;
import { IProvider, ProviderStatus, DocumentType } from '../models/provider.model';
import { providerRepository, ProviderFilter } from '../repositories/provider.repository';
import crypto from 'crypto';

// Interface para criação de fornecedor com foto
export interface CreateProviderData {
  name: string;
  documentType: DocumentType;
  documentNumber: string;
  phone: string;
  email?: string;
  company?: string;
  reason: string;
  hostName: string;
  scheduledEntry?: Date | string;
  scheduledExit?: Date | string;
  notes?: string;
  photo?: {
    originalName: string;
    mimetype: string;
    size: number;
    content: string | Buffer; // Base64 ou Buffer
  };
}

// Interface para atualização de fornecedor
export type UpdateProviderData = Partial<Omit<CreateProviderData, 'photo'>>;

// Serviço de Fornecedores
export class ProviderService {
  // Gera um nome único para o arquivo
  private generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(8).toString('hex');
    const extension = originalName.includes('.') 
      ? originalName.substring(originalName.lastIndexOf('.')) 
      : '.jpg';
    return `${timestamp}-${randomStr}${extension}`;
  }

  // Processa o conteúdo da foto (converte base64 para Buffer se necessário)
  private processPhotoContent(content: string | Buffer): Buffer {
    if (typeof content === 'string') {
      // Remove o prefixo de data URL se estiver presente
      const base64Data = content.replace(/^data:[^,]+;base64,/, '');
      return Buffer.from(base64Data, 'base64');
    }
    return content;
  }

  // Busca todos os fornecedores (com filtros opcionais)
  async getAllProviders(filter?: ProviderFilter): Promise<IProvider[]> {
    return providerRepository.findAll(filter);
  }

  // Busca um fornecedor pelo ID
  async getProviderById(id: string): Promise<IProvider | null> {
    return providerRepository.findById(id);
  }

  // Busca um fornecedor pelo número do documento
  async getProviderByDocumentNumber(documentNumber: string): Promise<IProvider | null> {
    return providerRepository.findByDocumentNumber(documentNumber);
  }

  // Cria um novo fornecedor
  async createProvider(providerData: CreateProviderData): Promise<IProvider> {
    // Validações básicas
    this.validateProviderData(providerData);
    
    // Prepara os dados do fornecedor
    const providerToCreate: any = {
      ...providerData,
      status: ProviderStatus.EXPECTED
    };
    
    // Converte as datas de string para Date se necessário
    if (providerData.scheduledEntry) {
      providerToCreate.scheduledEntry = new Date(providerData.scheduledEntry);
    }
    
    if (providerData.scheduledExit) {
      providerToCreate.scheduledExit = new Date(providerData.scheduledExit);
    }
    
    // Processa a foto se fornecida
    if (providerData.photo) {
      const contentBuffer = this.processPhotoContent(providerData.photo.content);
      const filename = this.generateUniqueFilename(providerData.photo.originalName);
      
      providerToCreate.photo = {
        filename,
        originalName: providerData.photo.originalName,
        mimetype: providerData.photo.mimetype,
        size: contentBuffer.length,
        content: contentBuffer,
        uploadDate: new Date()
      };
    }
    
    // Cria o fornecedor no banco de dados
    return providerRepository.create(providerToCreate);
  }

  // Valida os dados do fornecedor
  private validateProviderData(data: CreateProviderData): void {
    if (!data.name || data.name.trim() === '') {
      throw new Error('Nome do fornecedor é obrigatório');
    }
    
    if (!data.documentNumber || data.documentNumber.trim() === '') {
      throw new Error('Número do documento é obrigatório');
    }
    
    if (!data.phone || data.phone.trim() === '') {
      throw new Error('Telefone é obrigatório');
    }
    
    if (!data.reason || data.reason.trim() === '') {
      throw new Error('Motivo da visita é obrigatório');
    }
    
    if (!data.hostName || data.hostName.trim() === '') {
      throw new Error('Nome do anfitrião é obrigatório');
    }
    
    // Validação de email (opcional)
    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error('Email inválido');
    }
    
    // Validação de datas
    if (data.scheduledEntry && data.scheduledExit) {
      const entryDate = new Date(data.scheduledEntry);
      const exitDate = new Date(data.scheduledExit);
      
      if (exitDate < entryDate) {
        throw new Error('A data de saída não pode ser anterior à data de entrada');
      }
    }
  }

  // Valida formato de email
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Atualiza um fornecedor
  async updateProvider(id: string, updates: UpdateProviderData): Promise<IProvider | null> {
    // Validações básicas para os campos fornecidos
    if (updates.email && !this.isValidEmail(updates.email)) {
      throw new Error('Email inválido');
    }
    
    // Converte datas de string para Date se necessário
    const updatesToApply: any = { ...updates };
    
    if (updates.scheduledEntry) {
      updatesToApply.scheduledEntry = new Date(updates.scheduledEntry);
    }
    
    if (updates.scheduledExit) {
      updatesToApply.scheduledExit = new Date(updates.scheduledExit);
    }
    
    // Atualiza o fornecedor no banco de dados
    return providerRepository.update(id, updatesToApply);
  }

  // Atualiza a foto de um fornecedor
  async updateProviderPhoto(
    id: string, 
    photoData: {
      originalName: string;
      mimetype: string;
      size: number;
      content: string | Buffer;
    }
  ): Promise<IProvider | null> {
    // Processa o conteúdo da foto
    const contentBuffer = this.processPhotoContent(photoData.content);
    const filename = this.generateUniqueFilename(photoData.originalName);
    
    // Cria o objeto de foto
    const photo = {
      filename,
      originalName: photoData.originalName,
      mimetype: photoData.mimetype,
      size: contentBuffer.length,
      content: contentBuffer,
      uploadDate: new Date()
    };
    
    // Atualiza a foto no banco de dados
    return providerRepository.update(id, { photo });
  }

  // Remove um fornecedor
  async deleteProvider(id: string): Promise<boolean> {
    return providerRepository.delete(id);
  }

  // Atualiza o status de um fornecedor
  async updateProviderStatus(id: string, status: ProviderStatus): Promise<IProvider | null> {
    return providerRepository.updateStatus(id, status);
  }

  // Registra a entrada de um fornecedor
  async checkInProvider(id: string): Promise<IProvider | null> {
    return providerRepository.checkIn(id);
  }

  // Registra a saída de um fornecedor
  async checkOutProvider(id: string): Promise<IProvider | null> {
    return providerRepository.checkOut(id);
  }

  // Busca fornecedores por intervalo de datas
  async getProvidersByDateRange(startDate: Date | string, endDate: Date | string): Promise<IProvider[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return providerRepository.findByDateRange(start, end);
  }

  // Busca fornecedores atualmente no prédio
  async getCurrentProviders(): Promise<IProvider[]> {
    return providerRepository.findCurrentProviders();
  }
}

// Exporta uma instância única do serviço
export const providerService = new ProviderService();
export default providerService;
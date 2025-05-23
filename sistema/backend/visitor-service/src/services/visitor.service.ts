import { IVisitor, VisitorStatus, DocumentType } from '../models/visitor.model';
import { visitorRepository, VisitorFilter } from '../repositories/visitor.repository';
import crypto from 'crypto';

// Interface para criação de visitante com foto
export interface CreateVisitorData {
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

// Interface para atualização de visitante
export type UpdateVisitorData = Partial<Omit<CreateVisitorData, 'photo'>>;

// Serviço de Visitantes
export class VisitorService {
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

  // Busca todos os visitantes (com filtros opcionais)
  async getAllVisitors(filter?: VisitorFilter): Promise<IVisitor[]> {
    return visitorRepository.findAll(filter);
  }

  // Busca um visitante pelo ID
  async getVisitorById(id: string): Promise<IVisitor | null> {
    return visitorRepository.findById(id);
  }

  // Busca um visitante pelo número do documento
  async getVisitorByDocumentNumber(documentNumber: string): Promise<IVisitor | null> {
    return visitorRepository.findByDocumentNumber(documentNumber);
  }

  // Cria um novo visitante
  async createVisitor(visitorData: CreateVisitorData): Promise<IVisitor> {
    // Validações básicas
    this.validateVisitorData(visitorData);
    
    // Prepara os dados do visitante
    const visitorToCreate: any = {
      ...visitorData,
      status: VisitorStatus.EXPECTED
    };
    
    // Converte as datas de string para Date se necessário
    if (visitorData.scheduledEntry) {
      visitorToCreate.scheduledEntry = new Date(visitorData.scheduledEntry);
    }
    
    if (visitorData.scheduledExit) {
      visitorToCreate.scheduledExit = new Date(visitorData.scheduledExit);
    }
    
    // Processa a foto se fornecida
    if (visitorData.photo) {
      const contentBuffer = this.processPhotoContent(visitorData.photo.content);
      const filename = this.generateUniqueFilename(visitorData.photo.originalName);
      
      visitorToCreate.photo = {
        filename,
        originalName: visitorData.photo.originalName,
        mimetype: visitorData.photo.mimetype,
        size: contentBuffer.length,
        content: contentBuffer,
        uploadDate: new Date()
      };
    }
    
    // Cria o visitante no banco de dados
    return visitorRepository.create(visitorToCreate);
  }

  // Valida os dados do visitante
  private validateVisitorData(data: CreateVisitorData): void {
    if (!data.name || data.name.trim() === '') {
      throw new Error('Nome do visitante é obrigatório');
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

  // Atualiza um visitante
  async updateVisitor(id: string, updates: UpdateVisitorData): Promise<IVisitor | null> {
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
    
    // Atualiza o visitante no banco de dados
    return visitorRepository.update(id, updatesToApply);
  }

  // Atualiza a foto de um visitante
  async updateVisitorPhoto(
    id: string, 
    photoData: {
      originalName: string;
      mimetype: string;
      size: number;
      content: string | Buffer;
    }
  ): Promise<IVisitor | null> {
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
    return visitorRepository.update(id, { photo });
  }

  // Remove um visitante
  async deleteVisitor(id: string): Promise<boolean> {
    return visitorRepository.delete(id);
  }

  // Atualiza o status de um visitante
  async updateVisitorStatus(id: string, status: VisitorStatus): Promise<IVisitor | null> {
    return visitorRepository.updateStatus(id, status);
  }

  // Registra a entrada de um visitante
  async checkInVisitor(id: string): Promise<IVisitor | null> {
    return visitorRepository.checkIn(id);
  }

  // Registra a saída de um visitante
  async checkOutVisitor(id: string): Promise<IVisitor | null> {
    return visitorRepository.checkOut(id);
  }

  // Busca visitantes por intervalo de datas
  async getVisitorsByDateRange(startDate: Date | string, endDate: Date | string): Promise<IVisitor[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return visitorRepository.findByDateRange(start, end);
  }

  // Busca visitantes atualmente no prédio
  async getCurrentVisitors(): Promise<IVisitor[]> {
    return visitorRepository.findCurrentVisitors();
  }
}

// Exporta uma instância única do serviço
export const visitorService = new VisitorService();
export default visitorService;
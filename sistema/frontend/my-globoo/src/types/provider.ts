// Tipos de documento disponíveis
export enum DocumentType {
  RG = "rg",
  CPF = "cpf",
  CNH = "cnh",
  PASSPORT = "passport",
  OTHER = "other"
}

// Status do fornecedor
export enum ProviderStatus {
  EXPECTED = "expected",        // Agendado
  CHECKED_IN = "checked-in",    // Entrou
  CHECKED_OUT = "checked-out",  // Saiu
  CANCELLED = "cancelled"       // Cancelado
}

// Interface para foto do fornecedor
export interface ProviderPhoto {
  _id?: string;
  filename: string;             // Nome do arquivo no sistema
  originalName: string;         // Nome original do arquivo
  mimetype: string;             // Tipo MIME do arquivo
  size: number;                 // Tamanho em bytes
  uploadDate: Date;             // Data de upload
  content?: string;             // Conteúdo em Base64 (opcional)
}

// Interface do fornecedor
export interface Provider {
  _id?: string;
  name: string;
  documentType: DocumentType;
  documentNumber: string;
  phone: string;
  email?: string;
  company?: string;
  reason: string;
  hostName: string;
  scheduledEntry?: Date;
  scheduledExit?: Date;
  actualEntry?: Date;
  actualExit?: Date;
  status: ProviderStatus;
  notes?: string;
  photo?: ProviderPhoto;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface para criação de fornecedor
export interface ProviderCreate {
  name: string;
  documentType: DocumentType;
  documentNumber: string;
  phone: string;
  email?: string;
  company?: string;
  status: ProviderStatus;
  reason: string;
  hostName: string;
  scheduledEntry?: Date | string;
  scheduledExit?: Date | string;
  notes?: string;
  photo?: {
    originalName: string;
    mimetype: string;
    size: number;
    content: string; // Base64
  };
}

// Interface para atualização de fornecedor
export type ProviderUpdate = Partial<Omit<ProviderCreate, 'photo'>>;

// Interface para atualização de foto
export interface ProviderPhotoUpdate {
  originalName: string;
  mimetype: string;
  size: number;
  content: string; // Base64
}

// Interface para filtros de busca de fornecedores
export interface ProviderFilter {
  name?: string;
  documentNumber?: string;
  status?: ProviderStatus;
  hostName?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}
// Tipos de documento disponíveis
export enum DocumentType {
  RG = "rg",
  CPF = "cpf",
  CNH = "cnh",
  PASSPORT = "passport",
  OTHER = "other"
}

// Status do visitante
export enum VisitorStatus {
  EXPECTED = "expected",      
  CHECKED_IN = "checked-in",  
  CHECKED_OUT = "checked-out", 
  CANCELLED = "cancelled"     
}

// Interface para foto do visitante
export interface VisitorPhoto {
  _id?: string;
  filename: string;          
  originalName: string;      
  mimetype: string;          
  size: number;              
  uploadDate: Date;          
  content?: string;          
}

// Interface do visitante
export interface Visitor {
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
  status: VisitorStatus;
  notes?: string;
  photo?: VisitorPhoto;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface para criação de visitante
export interface VisitorCreate {
  name: string;
  documentType: DocumentType;
  documentNumber: string;
  phone: string;
  email?: string;
  company?: string;
  status: VisitorStatus; 
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

// Interface para atualização de visitante
export type VisitorUpdate = Partial<Omit<VisitorCreate, 'photo'>>;

// Interface para atualização de foto
export interface VisitorPhotoUpdate {
  originalName: string;
  mimetype: string;
  size: number;
  content: string; // Base64
}

// Interface para filtros de busca de visitantes
export interface VisitorFilter {
  name?: string;
  documentNumber?: string;
  status?: VisitorStatus;
  hostName?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}
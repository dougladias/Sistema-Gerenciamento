// Tipos de documento disponíveis
export enum DocumentType {
  WORK_CONTRACT = "Contrato de Trabalho",
  MEDICAL_CERTIFICATE = "Atestado Médico",
  ADMISSION_DOCUMENT = "Documento de Admissão",
  DISMISSAL_DOCUMENT = "Documento de Demissão",
  CERTIFICATE = "Certificado",
  OTHER = "Outros"
}

// Interface para o Template
export interface Template {
  _id?: string;
  name: string;
  type: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  format: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

// Interface para criação de Template
export interface TemplateCreate {
  name: string;
  type: string;
  description: string;
  createdBy: string;
  format: string;
  fileData: string; // Base64
  fileName: string;
  fileSize: number;
  mimeType: string;
}

// Interface para atualização de Template
export interface TemplateUpdate {
  name?: string;
  type?: string;
  description?: string;
  format?: string;
  fileData?: string; 
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
}

// Interface para filtros de busca de Templates
export interface TemplateFilter {
  name?: string;
  type?: string;
  createdBy?: string;
}
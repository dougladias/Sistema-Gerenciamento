// Enums para status da nota fiscal
export enum InvoiceStatus {
  PENDING = 'pendente',
  PAID = 'pago',
  CANCELED = 'cancelado'
}

// Interface para anexo de nota fiscal
export interface InvoiceAttachment {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  uploadDate: Date;
  _id?: string;
  content?: string; 
}

// Interface da nota fiscal
export interface Invoice {
  _id?: string;
  number: string;
  date: Date;
  value: number;
  description: string;
  status: InvoiceStatus;
  issuer: string;
  recipient: string;
  attachment: InvoiceAttachment;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface para criação de nota fiscal
export interface InvoiceCreate {
  number: string;
  date: Date;
  value: number;
  description: string;
  status: InvoiceStatus;
  issuer: string;
  recipient: string;
  attachment: {
    originalName: string;
    mimetype: string;
    size: number;
    content: string; 
  };
}

// Interface para atualização de nota fiscal
export interface InvoiceUpdate {
  number?: string;
  date?: Date;
  value?: number;
  description?: string;
  status?: InvoiceStatus;
  issuer?: string;
  recipient?: string;
}

// Interface para filtros de busca de notas fiscais
export interface InvoiceFilter {
  startDate?: Date;
  endDate?: Date;
  status?: InvoiceStatus;
  issuer?: string;
  recipient?: string;
  minValue?: number;
  maxValue?: number;
}
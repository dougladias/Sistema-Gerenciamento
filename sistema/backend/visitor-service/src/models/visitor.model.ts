import mongoose, { Schema, Document } from "mongoose";

// Interface para foto do visitante
export interface IVisitorPhoto {
  filename: string;          // Nome do arquivo no sistema
  originalName: string;      // Nome original do arquivo
  mimetype: string;          // Tipo MIME do arquivo
  size: number;              // Tamanho em bytes
  content: Buffer;           // Conteúdo binário (a foto)
  uploadDate: Date;          // Data de upload
}

// Enum para o tipo de documento
export enum DocumentType {
  RG = "rg",
  CPF = "cpf",
  CNH = "cnh",
  PASSPORT = "passport",
  OTHER = "other"
}

// Enum para o status do visitante
export enum VisitorStatus {
  EXPECTED = "expected",      // Agendado
  CHECKED_IN = "checked-in",  // Entrou
  CHECKED_OUT = "checked-out", // Saiu
  CANCELLED = "cancelled"     // Cancelado
}

// Interface para o visitante
export interface IVisitor extends Document {
  name: string;                // Nome completo
  documentType: DocumentType;  // Tipo de documento
  documentNumber: string;      // Número do documento
  phone: string;               // Telefone
  email?: string;              // Email (opcional)
  company?: string;            // Empresa (opcional)
  reason: string;              // Motivo da visita
  hostName: string;            // Nome do anfitrião
  scheduledEntry?: Date;       // Data/hora agendada para entrada
  scheduledExit?: Date;        // Data/hora agendada para saída
  actualEntry?: Date;          // Data/hora real de entrada
  actualExit?: Date;           // Data/hora real de saída
  status: VisitorStatus;       // Status do visitante
  notes?: string;              // Observações
  photo?: IVisitorPhoto;       // Foto do visitante
  createdAt: Date;             // Data de criação do registro
  updatedAt: Date;             // Data de atualização do registro
}

// Schema para visitantes
const VisitorSchema = new Schema<IVisitor>(
  {
    name: { type: String, required: true },
    documentType: { 
      type: String, 
      required: true, 
      enum: Object.values(DocumentType),
      default: DocumentType.RG
    },
    documentNumber: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    company: { type: String },
    reason: { type: String, required: true },
    hostName: { type: String, required: true },
    scheduledEntry: { type: Date },
    scheduledExit: { type: Date },
    actualEntry: { type: Date },
    actualExit: { type: Date },
    status: { 
      type: String, 
      required: true, 
      enum: Object.values(VisitorStatus),
      default: VisitorStatus.EXPECTED
    },
    notes: { type: String },
    photo: {
      filename: { type: String },
      originalName: { type: String },
      mimetype: { type: String },
      size: { type: Number },
      content: { type: Buffer },
      uploadDate: { type: Date }
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Índices para melhorar a performance das consultas
VisitorSchema.index({ name: 1 });
VisitorSchema.index({ documentNumber: 1 });
VisitorSchema.index({ status: 1 });
VisitorSchema.index({ hostName: 1 });
VisitorSchema.index({ scheduledEntry: 1 });
VisitorSchema.index({ actualEntry: 1 });

// Função para criar o modelo Visitor
export const createVisitorModel = () => {
  return mongoose.models.Visitor || mongoose.model<IVisitor>("Visitor", VisitorSchema);
};

export default createVisitorModel;
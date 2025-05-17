import mongoose, { Schema, Document } from "mongoose";

// Enumeração dos tipos de documentos
export enum DocumentType {
  WORK_CONTRACT = "Contrato de Trabalho",
  MEDICAL_CERTIFICATE = "Atestado Médico",
  ADMISSION_DOCUMENT = "Documento de Admissão",
  DISMISSAL_DOCUMENT = "Documento de Demissão",
  CERTIFICATE = "Certificado",
  OTHER = "Outros"
}

// Interface para o documento Template
export interface ITemplate extends Document {
  name: string;
  type: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  format: string;
  fileData: Buffer; 
  fileName: string;
  fileSize: number;
  mimeType: string;
}

// Schema do Template
const TemplateSchema = new Schema<ITemplate>(
  {
    name: { type: String, required: true },
    type: { 
      type: String, 
      required: true,
      enum: Object.values(DocumentType),
      default: DocumentType.OTHER
    },
    // Adicionando o campo description
    description: { type: String, required: true },
    createdBy: { type: String, required: true },
    format: { type: String, required: true },
    fileData: { type: Buffer, required: true }, 
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Criar índices para melhorar a performance das consultas
TemplateSchema.index({ name: 1 });
TemplateSchema.index({ type: 1 });
TemplateSchema.index({ createdAt: -1 });

// Função para criar o modelo Template
export const createTemplateModel = () => {
  return mongoose.models.Template || mongoose.model<ITemplate>("Template", TemplateSchema);
};

// Exportando o modelo e o schema
export default createTemplateModel;
export { TemplateSchema };
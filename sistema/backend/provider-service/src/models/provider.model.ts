import mongoose, { Schema, Document } from "mongoose";

// Interface para foto do fornecedor
export interface IProviderPhoto {
  filename: string;          
  originalName: string;      
  mimetype: string;          
  size: number;              
  content: Buffer;          
  uploadDate: Date;          
}

// Enum para o tipo de documento
export enum DocumentType {
  RG = "rg",
  CPF = "cpf",
  CNH = "cnh",
  PASSPORT = "passport",
  OTHER = "other"
}

// Enum para o status do fornecedor
export enum ProviderStatus {
  EXPECTED = "expected",      
  CHECKED_IN = "checked-in",  
  CHECKED_OUT = "checked-out", 
  CANCELLED = "cancelled"     
}

// Interface para o fornecedor
export interface IProvider extends Document {
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
  photo?: IProviderPhoto;     
  createdAt: Date;             
  updatedAt: Date;             
}

// Schema para fornecedores
const ProviderSchema = new Schema<IProvider>(
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
      enum: Object.values(ProviderStatus),
      default: ProviderStatus.EXPECTED
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
ProviderSchema.index({ name: 1 });
ProviderSchema.index({ documentNumber: 1 });
ProviderSchema.index({ status: 1 });
ProviderSchema.index({ hostName: 1 });
ProviderSchema.index({ scheduledEntry: 1 });
ProviderSchema.index({ actualEntry: 1 });

// Função para criar o modelo Provider
export const createProviderModel = () => {
  return mongoose.models.Provider || mongoose.model<IProvider>("Provider", ProviderSchema);
};

export default createProviderModel;
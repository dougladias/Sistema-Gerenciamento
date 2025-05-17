import mongoose, { Schema, Document } from "mongoose";

// Interface para logs de entrada/saída
export interface IEntry {
  entryTime?: Date;
  leaveTime?: Date;
  absent?: boolean;
  date?: Date;
  createdAt?: Date;
}

// Interface para arquivos
export interface IFile {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  uploadDate: Date;
  description?: string;
  category?: string;
}

// Interface para o documento Worker
export interface IWorker extends Document {
  name: string;
  cpf: string;
  nascimento: Date | string;
  admissao: Date | string;
  salario: string;
  ajuda?: string;
  numero: string;
  email: string;
  address: string;
  contract: "CLT" | "PJ";
  role: string;
  department: string;
  status?: "active" | "inactive" | "other";
  logs: IEntry[];
  files?: IFile[];
  createdAt: Date;
  updatedAt: Date;
}

// Schema do Workers
const WorkerSchema = new Schema<IWorker>(
  {
    name: { type: String, required: true },
    cpf: { type: String, required: true, unique: true },
    nascimento: { type: String, required: true },
    admissao: { type: String, required: true },
    salario: { type: String, required: true },
    ajuda: { type: String },
    numero: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    contract: {
      type: String,
      required: true,
      enum: ["CLT", "PJ"],
    },
    role: { type: String, required: true },
    department: {
      type: String,
      required: true,
      default: "Geral",
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive", "other"],
    },
    logs: [
      {
        entryTime: { type: Date },
        leaveTime: { type: Date },
        absent: { type: Boolean, default: false },
        date: { type: Date, default: Date.now },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    files: [
      {
        filename: { type: String, required: true },
        originalName: { type: String, required: true },
        mimetype: { type: String, required: true },
        size: { type: Number, required: true },
        path: { type: String, required: true },
        uploadDate: { type: Date, default: Date.now },
        description: { type: String },
        category: { type: String },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Criar índices para melhorar a performance das consultas
WorkerSchema.index({ name: 1 });
WorkerSchema.index({ department: 1 });
WorkerSchema.index({ status: 1 });

// Função para criar o modelo Worker
export const createWorkerModel = () => {
  return mongoose.models.Worker || mongoose.model<IWorker>("Worker", WorkerSchema);
};

export default createWorkerModel;
export { WorkerSchema };
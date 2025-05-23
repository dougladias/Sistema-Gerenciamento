import mongoose, { Schema, Document } from "mongoose";

// Interface para nota fiscal
export interface IInvoice extends Document {
  number: string;              // Número da nota fiscal
  date: Date;                  // Data de emissão
  value: number;               // Valor total
  description: string;         // Descrição da nota fiscal
  status: "pendente" | "pago" | "cancelado"; // Status
  issuer: string;              // Nome do emissor
  recipient: string;           // Nome do destinatário
  attachment: {                // Arquivo da nota fiscal
    filename: string;          // Nome do arquivo no sistema
    originalName: string;      // Nome original do arquivo
    mimetype: string;          // Tipo MIME do arquivo
    size: number;              // Tamanho em bytes
    content: Buffer;           // Conteúdo binário
    uploadDate: Date;          // Data de upload
  };
  createdAt: Date;
  updatedAt: Date;
}

// Schema para notas fiscais
const InvoiceSchema = new Schema<IInvoice>(
  {
    number: { type: String, required: true, unique: true },
    date: { type: Date, required: true },
    value: { type: Number, required: true },
    description: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ["pendente", "pago", "cancelado"],
      default: "pendente",
    },
    issuer: { type: String, required: true },
    recipient: { type: String, required: true },
    attachment: {
      filename: { type: String, required: true },
      originalName: { type: String, required: true },
      mimetype: { type: String, required: true },
      size: { type: Number, required: true },
      content: { type: Buffer, required: true },
      uploadDate: { type: Date, default: Date.now },
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indices para melhorar a performance das consultas
// Note: removi o índice duplicado para 'number', pois ele já está como unique:true na definição do schema
InvoiceSchema.index({ date: 1 });
InvoiceSchema.index({ status: 1 });

// Função para criar o modelo Invoice
export const createInvoiceModel = () => {
  return mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", InvoiceSchema);
};

export default createInvoiceModel;
import mongoose, { Schema, Document } from "mongoose";

// Interface para o documento PayStub (Holerite)
export interface IPayStub extends Document {
  payrollId: mongoose.Types.ObjectId | string;
  workerId: mongoose.Types.ObjectId | string;
  workerName: string;
  month: number;
  year: number;
  documentNumber: string; // Número do documento (ex: 2024050001)
  issueDate: Date; // Data de emissão
  baseGrossSalary: number;
  totalDeductions: number;
  totalBenefits: number;
  totalAdditionals: number;
  netSalary: number;
  deductions: Array<{
    name: string;
    value: number;
    type: "percentage" | "fixed";
    calculatedValue: number;
  }>;
  benefits: Array<{
    name: string;
    value: number;
    type: "percentage" | "fixed";
    calculatedValue: number;
  }>;
  additionals: Array<{
    name: string;
    value: number;
    type: "percentage" | "fixed";
    calculatedValue: number;
  }>;
  signedByEmployee: boolean;
  signatureDate?: Date;
  signatureIp?: string;
  signatureToken?: string;
  notes?: string;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema do PayStub
const PayStubSchema = new Schema<IPayStub>(
  {
    payrollId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Payroll', 
      required: true 
    },
    workerId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Worker', 
      required: true 
    },
    workerName: { 
      type: String, 
      required: true 
    },
    month: { 
      type: Number, 
      required: true, 
      min: 1, 
      max: 12 
    },
    year: { 
      type: Number, 
      required: true 
    },
    documentNumber: { 
      type: String, 
      required: true,
      unique: true
    },
    issueDate: { 
      type: Date, 
      required: true,
      default: Date.now
    },
    baseGrossSalary: { 
      type: Number, 
      required: true 
    },
    totalDeductions: { 
      type: Number, 
      required: true 
    },
    totalBenefits: { 
      type: Number, 
      required: true 
    },
    totalAdditionals: { 
      type: Number, 
      required: true 
    },
    netSalary: { 
      type: Number, 
      required: true 
    },
    deductions: [
      {
        name: { type: String, required: true },
        value: { type: Number, required: true },
        type: { 
          type: String, 
          required: true, 
          enum: ["percentage", "fixed"] 
        },
        calculatedValue: { type: Number, required: true }
      }
    ],
    benefits: [
      {
        name: { type: String, required: true },
        value: { type: Number, required: true },
        type: { 
          type: String, 
          required: true, 
          enum: ["percentage", "fixed"] 
        },
        calculatedValue: { type: Number, required: true }
      }
    ],
    additionals: [
      {
        name: { type: String, required: true },
        value: { type: Number, required: true },
        type: { 
          type: String, 
          required: true, 
          enum: ["percentage", "fixed"] 
        },
        calculatedValue: { type: Number, required: true }
      }
    ],
    signedByEmployee: { 
      type: Boolean, 
      default: false 
    },
    signatureDate: { 
      type: Date 
    },
    signatureIp: { 
      type: String 
    },
    signatureToken: { 
      type: String 
    },
    notes: { 
      type: String 
    },
    pdfUrl: { 
      type: String 
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Criar índices para melhorar a performance das consultas
PayStubSchema.index({ payrollId: 1 });
PayStubSchema.index({ workerId: 1 });
PayStubSchema.index({ month: 1, year: 1 });
PayStubSchema.index({ documentNumber: 1 }, { unique: true });
PayStubSchema.index({ workerId: 1, month: 1, year: 1 }, { unique: true });

// Função para criar o modelo PayStub
export const createPayStubModel = () => {
  return mongoose.models.PayStub || mongoose.model<IPayStub>("PayStub", PayStubSchema);
};

// Exportar o modelo PayStub
export default createPayStubModel;
export { PayStubSchema };
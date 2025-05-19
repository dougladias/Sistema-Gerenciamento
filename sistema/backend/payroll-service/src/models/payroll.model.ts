import mongoose, { Schema, Document } from "mongoose";

// Interface para descontos
export interface IDeduction {
  _id?: string;
  name: string;
  value: number;
  type: "percentage" | "fixed";
  description?: string;
}

// Interface para benefícios
export interface IBenefit {
  _id?: string;
  name: string;
  value: number;
  type: "percentage" | "fixed";
  description?: string;
}

// Interface para pagamentos adicionais (horas extras, bônus, etc.)
export interface IAdditional {
  _id?: string;
  name: string;
  value: number;
  type: "percentage" | "fixed";
  description?: string;
}

// Interface para o documento Payroll
export interface IPayroll extends Document {
  workerId: mongoose.Types.ObjectId | string;
  workerName: string; // Para facilitar consultas sem join
  month: number; // Mês do pagamento (1-12)
  year: number; // Ano do pagamento
  baseGrossSalary: number; // Salário base bruto
  totalDeductions: number; // Total de descontos
  totalBenefits: number; // Total de benefícios
  totalAdditionals: number; // Total de adicionais
  netSalary: number; // Salário líquido
  deductions: IDeduction[]; // Lista de descontos (INSS, IRRF, etc.)
  benefits: IBenefit[]; // Lista de benefícios (VR, VT, etc.)
  additionals: IAdditional[]; // Lista de adicionais (horas extras, etc.)
  status: "draft" | "processing" | "completed" | "canceled";
  paymentDate?: Date; // Data efetiva de pagamento
  generatedDate: Date; // Data de geração do registro
  updatedDate?: Date; // Data da última atualização
  notes?: string; // Observações adicionais
}

// Schema do Payroll
const PayrollSchema = new Schema<IPayroll>(
  {
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
    baseGrossSalary: { 
      type: Number, 
      required: true 
    },
    totalDeductions: { 
      type: Number, 
      required: true, 
      default: 0 
    },
    totalBenefits: { 
      type: Number, 
      required: true, 
      default: 0 
    },
    totalAdditionals: { 
      type: Number, 
      required: true, 
      default: 0 
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
        description: { type: String }
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
        description: { type: String }
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
        description: { type: String }
      }
    ],
    status: {
      type: String,
      required: true,
      enum: ["draft", "processing", "completed", "canceled"],
      default: "draft"
    },
    paymentDate: { 
      type: Date 
    },
    generatedDate: { 
      type: Date, 
      default: Date.now 
    },
    updatedDate: { 
      type: Date 
    },
    notes: { 
      type: String 
    }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Criar índices para melhorar a performance das consultas
PayrollSchema.index({ workerId: 1 });
PayrollSchema.index({ workerName: 1 });
PayrollSchema.index({ month: 1, year: 1 });
PayrollSchema.index({ status: 1 });
PayrollSchema.index({ workerId: 1, month: 1, year: 1 }, { unique: true });

// Função para criar o modelo Payroll
export const createPayrollModel = () => {
  return mongoose.models.Payroll || mongoose.model<IPayroll>("Payroll", PayrollSchema);
};

// Exportar o modelo Payroll
export default createPayrollModel;
export { PayrollSchema };
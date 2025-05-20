import mongoose, { Schema, Document } from 'mongoose';

// Definição do tipo de funcionário
export enum PayrollStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  COMPLETED = 'completed'
}

// Definição da interface para a folha de pagamento
export interface IPayroll extends Document {
  month: number;
  year: number;
  status: PayrollStatus;
  processedAt?: Date;
  totalGrossSalary: number;
  totalDiscounts: number;
  totalNetSalary: number;
  employeeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Definição do esquema para a folha de pagamento
const PayrollSchema = new Schema({
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true },
  status: {
    type: String,
    enum: Object.values(PayrollStatus),
    default: PayrollStatus.DRAFT
  },
  // Data de processamento
  processedAt: { type: Date },
  totalGrossSalary: { type: Number, default: 0 },
  totalDiscounts: { type: Number, default: 0 },
  totalNetSalary: { type: Number, default: 0 },
  employeeCount: { type: Number, default: 0 }
}, { timestamps: true });

// Índice composto para busca por mês/ano
PayrollSchema.index({ month: 1, year: 1 }, { unique: true });

export const PayrollModel = mongoose.model<IPayroll>('Payroll', PayrollSchema);
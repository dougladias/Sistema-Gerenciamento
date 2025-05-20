import mongoose, { Schema, Document } from 'mongoose';

// Definição do tipo de funcionário
export enum EmployeeType {
  CLT = 'CLT',
  CNPJ = 'CNPJ'
}

// Definição do status do holerite
export enum PayslipStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  PAID = 'paid'
}

// Definição da interface para o holerite
export interface IDeduction {
  type: string;
  description?: string;
  value: number;
}

// Definição da interface para o holerite
export interface IBenefit {
  type: string;
  description?: string;
  value: number;
}

// Definição da interface para o holerite
export interface IPayslip extends Document {
  payrollId: mongoose.Types.ObjectId;
  workerId: string;
  employeeType: EmployeeType;
  name: string;
  position: string;
  department: string;
  baseSalary: number;
  benefits: IBenefit[];
  deductions: IDeduction[];
  totalDeductions: number;
  netSalary: number;
  status: PayslipStatus;
  paymentDate?: Date;
  month: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

// Definição do esquema para o holerite
const DeductionSchema = new Schema({
  type: { type: String, required: true },
  description: String,
  value: { type: Number, required: true }
}, { _id: false });

// Definição do esquema para o holerite
const BenefitSchema = new Schema({
  type: { type: String, required: true },
  description: String,
  value: { type: Number, required: true }
}, { _id: false });

// Definição do esquema para o holerite
const PayslipSchema = new Schema({
  payrollId: { type: Schema.Types.ObjectId, ref: 'Payroll', required: true },
  workerId: { type: String, required: true },
  employeeType: {
    type: String,
    enum: Object.values(EmployeeType),
    required: true
  },

  // Informações do funcionário
  name: { type: String, required: true },
  position: { type: String, required: true },
  department: { type: String, required: true },
  baseSalary: { type: Number, required: true },
  benefits: [BenefitSchema],
  deductions: [DeductionSchema],
  totalDeductions: { type: Number, required: true },
  netSalary: { type: Number, required: true },
  status: {
    type: String,
    enum: Object.values(PayslipStatus),
    default: PayslipStatus.PENDING
  },
  // Data de pagamento
  paymentDate: Date,
  month: { type: Number, required: true },
  year: { type: Number, required: true }
}, { timestamps: true });

// Índices para otimização
PayslipSchema.index({ payrollId: 1 });
PayslipSchema.index({ workerId: 1, month: 1, year: 1 }, { unique: true });

export const PayslipModel = mongoose.model<IPayslip>('Payslip', PayslipSchema);
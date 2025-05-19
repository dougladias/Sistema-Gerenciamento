
// Interface para Holerite (Paystub)
export interface Paystub {
  _id?: string;
  workerId: string;
  month: number;
  year: number;
  issueDate: Date;
  grossAmount: number;
  netAmount: number;
  deductions: Deduction[];
  benefits: Benefit[];
  status: PaystubStatus;
  document?: string; 
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface para Folha de Pagamento (Payroll)
export interface Payroll {
  _id?: string;
  month: number;
  year: number;
  closingDate: Date;
  totalGrossAmount: number;
  totalNetAmount: number;
  totalDeductions: number;
  workerCount: number;
  status: PayrollStatus;
  paystubs?: string[]; // Array de IDs de holerites
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface para Dedução
export interface Deduction {
  description: string;
  amount: number;
  percentage?: number;
}

// Interface para Benefício
export interface Benefit {
  description: string;
  amount: number;
}

// Status da Folha de Pagamento
export type PayrollStatus = 'draft' | 'processing' | 'closed' | 'paid';

// Status do Holerite
export type PaystubStatus = 'pending' | 'approved' | 'delivered';

// Interface para criação de Holerite
export type PaystubCreate = Omit<Paystub, '_id' | 'createdAt' | 'updatedAt'>;

// Interface para atualização de Holerite
export type PaystubUpdate = Partial<Paystub>;

// Interface para criação de Folha de Pagamento
export type PayrollCreate = Omit<Payroll, '_id' | 'createdAt' | 'updatedAt'>;

// Interface para atualização de Folha de Pagamento
export type PayrollUpdate = Partial<Payroll>;

// Interface para filtros de busca de Holerites
export interface PaystubFilter {
  workerId?: string;
  month?: number;
  year?: number;
  status?: PaystubStatus;
}

// Interface para filtros de busca de Folhas de Pagamento
export interface PayrollFilter {
  month?: number;
  year?: number;
  status?: PayrollStatus;
}
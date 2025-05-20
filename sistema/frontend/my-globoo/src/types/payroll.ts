// Enums para status da folha de pagamento
export enum PayrollStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  COMPLETED = 'completed'
}

// Enums para status do holerite
export enum PayslipStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  PAID = 'paid'
}

// Enums para tipo de funcionário
export enum EmployeeType {
  CLT = 'CLT',
  PJ = 'PJ'
}

// Interface para deduções no holerite
export interface IDeduction {
  type: string;
  description?: string;
  value: number;
}

// Interface para benefícios no holerite
export interface IBenefit {
  type: string;
  description?: string;
  value: number;
}

// Interface da folha de pagamento
export interface Payroll {
  _id?: string;
  month: number;
  year: number;
  status: PayrollStatus;
  processedAt?: Date;
  totalGrossSalary: number;
  totalDiscounts: number;
  totalNetSalary: number;
  employeeCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface do holerite
export interface Payslip {
  _id?: string;
  payrollId: string;
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
  createdAt?: Date;
  updatedAt?: Date;
}

// Interface para criação de folha de pagamento
export interface PayrollCreate {
  month: number;
  year: number;
}

// Interface para processamento de folha de pagamento
export interface PayrollProcess {
  employees: {
    id: string;
    name: string;
    position: string;
    department: string;
    contractType: EmployeeType;
    baseSalary: number;
    benefits?: Partial<IBenefit>[];
    deductions?: Partial<IDeduction>[];
    dependents?: number;
  }[];
}

// Interface para sumário da folha de pagamento
export interface PayrollSummary {
  payroll: Payroll;
  departmentSummary: {
    [key: string]: {
      count: number;
      totalGrossSalary: number;
      totalDeductions: number;
      totalNetSalary: number;
    };
  };
  employeeTypeSummary: {
    [key: string]: {
      count: number;
      totalGrossSalary: number;
      totalDeductions: number;
      totalNetSalary: number;
    };
  };
  payslipCount: number;
}

// Interface para cálculo de holerite (simulação)
export interface PayslipCalculate {
  id: string;
  name: string;
  position: string;
  department: string;
  contractType: EmployeeType;
  baseSalary: number;
  benefits?: Partial<IBenefit>[];
  deductions?: Partial<IDeduction>[];
  dependents?: number;
}

// Interface para filtros de busca de folha de pagamento
export interface PayrollFilter {
  month?: number;
  year?: number;
  status?: PayrollStatus;
}
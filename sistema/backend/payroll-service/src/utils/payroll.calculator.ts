import { EmployeeType, IBenefit, IDeduction } from '../models/payslip.model';

// Importa o modelo de funcionário
export interface IEmployeeData {
  id: string;
  name: string;
  position: string;
  department: string;
  contractType: EmployeeType;
  baseSalary: number;
  benefits?: Partial<IBenefit>[];
  deductions?: Partial<IDeduction>[];
  dependents?: number;
  otherIncome?: number;
}

// Definição do tipo de funcionário
export interface ISalaryCalculation {
  workerId: string;
  name: string;
  position: string;
  department: string;
  employeeType: EmployeeType;
  baseSalary: number;
  benefits: IBenefit[];
  deductions: IDeduction[];
  totalBenefits: number;
  totalDeductions: number;
  netSalary: number;
  fgts?: number;
}

// Tabela de contribuição do INSS para 2025 (Atualizar conforme necessário)
// https://www.gov.br/pt-br/servicos/consultar-tabela-de-contribuicao-do-inss
export const calculateINSS = (salary: number): number => {
  if (salary <= 1518.00) {
    return salary * 0.075;
  } else if (salary <= 2793.88) {
    return 113.85 + ((salary - 1518.01) * 0.09);
  } else if (salary <= 4190.83) {
    return 228.68 + ((salary - 2793.89) * 0.12);
  } else if (salary <= 8157.41) {
    return 396.31 + ((salary - 4190.84) * 0.14);
  } else {
    return 951.63; 
  }
};

// Cálculo do IRRF para 2025 (Atualizar conforme necessário)
// https://www.gov.br/pt-br/servicos/consultar-tabela-de-imposto-de-renda
export const calculateIRRF = (baseSalary: number, inssValue: number, dependents: number = 0): number => {
  // Se o salário bruto for até R$ 3.036,00, é isento de IRRF
  if (baseSalary <= 3036.00) {
    return 0;
  }
  
  // Valor por dependente
  const dependentDeduction = 189.59 * dependents;
  
  // Desconto simplificado
  const descontoSimplificado = 607.20;
  
  // Base de cálculo é salário menos INSS, dependentes e desconto simplificado
  const baseCalculo = baseSalary - inssValue - dependentDeduction - descontoSimplificado;
  
  // Verifica faixas de tributação com base no valor já com desconto simplificado
  if (baseCalculo <= 2428.80) {
    return 0; // Isento
  } else if (baseCalculo <= 2826.65) {
    return Math.max((baseCalculo * 0.075) - 182.16, 0);
  } else if (baseCalculo <= 3751.05) {
    return Math.max((baseCalculo * 0.15) - 394.16, 0);
  } else if (baseCalculo <= 4664.68) {
    return Math.max((baseCalculo * 0.225) - 675.49, 0);
  } else {
    return Math.max((baseCalculo * 0.275) - 908.73, 0);
  }
};

// Cálculo do FGTS
export const calculateFGTS = (baseSalary: number): number => {
  return baseSalary * 0.08;
};

// Calcula descontos e benefícios para um funcionário CLT
export const calculateCLTEmployee = (employee: IEmployeeData): ISalaryCalculation => {
  const baseSalary = employee.baseSalary || 0;
  const dependents = employee.dependents || 0;
  
  // Calcular INSS
  const inssValue = calculateINSS(baseSalary);
  
  // Calcular IRRF
  const irrfValue = calculateIRRF(baseSalary, inssValue, dependents);
  
  // Calcular FGTS (não é desconto do empregado)
  const fgtsValue = calculateFGTS(baseSalary);
  
  // Processar benefícios fornecidos
  const benefits: IBenefit[] = (employee.benefits || []).map(benefit => ({
    type: benefit.type || 'Outros',
    description: benefit.description || benefit.type || 'Benefício',
    value: benefit.value || 0
  }));
  
  // Calcular total de benefícios
  const totalBenefits = benefits.reduce((total, benefit) => total + benefit.value, 0);
  
  // Montar deduções obrigatórias
  const deductions: IDeduction[] = [
    { type: 'INSS', description: 'INSS', value: inssValue },
    { type: 'IRRF', description: 'Imposto de Renda', value: irrfValue }
  ];
  
  // Adicionar outros descontos se houver
  if (employee.deductions && employee.deductions.length > 0) {
    employee.deductions.forEach(deduction => {
      if (deduction.type && deduction.value) {
        deductions.push({
          type: deduction.type,
          description: deduction.description || deduction.type,
          value: deduction.value
        });
      }
    });
  }
  
  // Calcular total de descontos
  const totalDeductions = deductions.reduce((total, deduction) => total + deduction.value, 0);
  
  // Calcular salário líquido
  const netSalary = baseSalary - totalDeductions;
  
  return {
    workerId: employee.id,
    name: employee.name,
    position: employee.position,
    department: employee.department,
    employeeType: employee.contractType,
    baseSalary,
    benefits,
    deductions,
    totalBenefits,
    totalDeductions,
    netSalary,
    fgts: fgtsValue // Não é desconto, mas é calculado
  };
};

// Calcula descontos e benefícios para um prestador de serviços (CNPJ)
export const calculateCNPJProvider = (employee: IEmployeeData): ISalaryCalculation => {
  const baseSalary = employee.baseSalary || 0;
  
  // Processar benefícios fornecidos
  const benefits: IBenefit[] = (employee.benefits || []).map(benefit => ({
    type: benefit.type || 'Outros',
    description: benefit.description || benefit.type || 'Benefício',
    value: benefit.value || 0
  }));
  
  // Calcular total de benefícios
  const totalBenefits = benefits.reduce((total, benefit) => total + benefit.value, 0);
  
  // Para CNPJ, geralmente não há descontos de INSS e IRRF na fonte
  // Mas pode haver ISS ou IR retido, dependendo do serviço e valor
  const deductions: IDeduction[] = [];
  
  // Adicionar outros descontos se houver
  if (employee.deductions && employee.deductions.length > 0) {
    employee.deductions.forEach(deduction => {
      if (deduction.type && deduction.value) {
        deductions.push({
          type: deduction.type,
          description: deduction.description || deduction.type,
          value: deduction.value
        });
      }
    });
  }
  
  // Calcular total de descontos
  const totalDeductions = deductions.reduce((total, deduction) => total + deduction.value, 0);
  
  // Calcular valor líquido
  const netSalary = baseSalary - totalDeductions;
  
  // Retornar os dados do prestador de serviços
  return {
    workerId: employee.id,
    name: employee.name,
    position: employee.position,
    department: employee.department,
    employeeType: employee.contractType,
    baseSalary,
    benefits,
    deductions,
    totalBenefits,
    totalDeductions,
    netSalary
  };
};

// Função principal para calcular o salário
export const calculateSalary = (employee: IEmployeeData): ISalaryCalculation => {
  if (employee.contractType === EmployeeType.CLT) {
    return calculateCLTEmployee(employee);
  } else {
    return calculateCNPJProvider(employee);
  }
};

// Exporta todas as funções
export default {
  calculateINSS,
  calculateIRRF,
  calculateFGTS,
  calculateCLTEmployee,
  calculateCNPJProvider,
  calculateSalary
};
import { IPayroll } from '../models/payroll.model';
import { payrollRepository } from '../repositories/payroll.repository';
import { connectToDatabase } from '../config/database';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config();

// URL do serviço de workers
const WORKER_SERVICE_URL = process.env.WORKER_SERVICE_URL || 'http://localhost:4015';

// Interface para o serviço de Payroll
export interface IPayrollService {
  calculatePayroll(workerId: string, month: number, year: number): Promise<IPayroll | null>;
  generatePayrollForWorker(workerId: string, month: number, year: number): Promise<IPayroll | null>;
  generatePayrollForAllWorkers(month: number, year: number): Promise<IPayroll[]>;
  approvePayroll(payrollId: string): Promise<IPayroll | null>;
  cancelPayroll(payrollId: string): Promise<IPayroll | null>;
  getPayroll(payrollId: string): Promise<IPayroll | null>;
  getPayrollsByWorker(workerId: string): Promise<IPayroll[]>;
  getPayrollsByMonth(month: number, year: number): Promise<IPayroll[]>;
  recalculatePayroll(payrollId: string): Promise<IPayroll | null>;
}

export class PayrollService implements IPayrollService {
  
  // Calcula os valores da folha de pagamento com base nos dados do funcionário
  async calculatePayroll(workerId: string, month: number, year: number): Promise<IPayroll | null> {
    try {
      await connectToDatabase();

      // Usando o fetch para buscar os dados do worker-service
      const response = await fetch(`${WORKER_SERVICE_URL}/workers/${workerId}`);

      if (!response.ok) {
        console.error(`Erro ao buscar dados do funcionário: ${response.status} - ${await response.text()}`);
        return null;
      }

      const worker = await response.json();

      if (!worker) {
        console.error(`Funcionário não encontrado: ${workerId}`);
        return null;
      }

      // Calcula o salário base, considerando que o valor pode estar em diferentes formatos
      let baseGrossSalary = 0;
      if (typeof worker.salario === 'number') {
        baseGrossSalary = worker.salario;
      } else if (typeof worker.salario === 'string') {
        // Remove caracteres não numéricos, exceto ponto e vírgula
        baseGrossSalary = parseFloat(worker.salario.replace(/[^\d,.-]/g, '')
          .replace(',', '.'));
      }

      if (isNaN(baseGrossSalary)) {
        console.error(`Salário do funcionário em formato inválido: ${worker.salario}`);
        return null;
      }

      // Busca a folha existente ou cria uma nova
      let payroll: IPayroll | null = await payrollRepository.findByWorkerAndMonth(workerId, month, year);

      if (payroll && payroll._id) {
        // Se já existe, atualiza o salário base
        payroll = await payrollRepository.update(payroll._id.toString(), {
          baseGrossSalary
        });
      } else {
        // Se não existe, cria uma nova folha de pagamento
        const newPayroll: Partial<IPayroll> = {
          workerId,
          workerName: worker.name,
          month,
          year,
          baseGrossSalary,
          totalDeductions: 0,
          totalBenefits: 0,
          totalAdditionals: 0,
          netSalary: baseGrossSalary,
          deductions: [],
          benefits: [],
          additionals: [],
          status: "draft",
          generatedDate: new Date()
        };
        
        payroll = await payrollRepository.create(newPayroll as IPayroll);
      }

      // Adiciona descontos padrão se for uma nova folha
      if (payroll && payroll.deductions.length === 0 && payroll._id) {
        // Adiciona INSS com base no salário
        await payrollRepository.addDeduction(payroll._id.toString(), {
          name: "INSS",
          value: 7.5, // Valor padrão para simplificar
          type: "percentage",
          description: "Contribuição para o INSS"
        });

        // Adiciona IRRF com base no salário
        await payrollRepository.addDeduction(payroll._id.toString(), {
          name: "IRRF",
          value: 5, // Valor padrão para simplificar
          type: "percentage",
          description: "Imposto de Renda Retido na Fonte"
        });

        // Adiciona FGTS (não é um desconto para o trabalhador, mas é calculado)
        await payrollRepository.addAdditional(payroll._id.toString(), {
          name: "FGTS",
          value: 8,
          type: "percentage",
          description: "Fundo de Garantia do Tempo de Serviço"
        });
      }

      // Adiciona benefícios padrão se for um novo payroll e o trabalhador tem ajuda
      if (payroll && payroll.benefits.length === 0 && worker.ajuda && payroll._id) {
        let valeAlimentacao = 0;
        
        // Determina o valor do benefício
        if (typeof worker.ajuda === 'number') {
          valeAlimentacao = worker.ajuda;
        } else if (typeof worker.ajuda === 'string') {
          valeAlimentacao = parseFloat(worker.ajuda.replace(/[^\d,.-]/g, '')
            .replace(',', '.'));
        }

        if (!isNaN(valeAlimentacao) && valeAlimentacao > 0) {
          await payrollRepository.addBenefit(payroll._id.toString(), {
            name: "Vale Alimentação",
            value: valeAlimentacao,
            type: "fixed",
            description: "Vale Alimentação mensal"
          });
        }
      }

      // Recalcula os valores finais
      if (payroll && payroll._id) {
        return await payrollRepository.recalculate(payroll._id.toString());
      }
      return null;
    } catch (error) {
      console.error('Erro ao calcular folha de pagamento:', error);
      return null;
    }
  }

  // Gera a folha de pagamento para um funcionário específico
  async generatePayrollForWorker(workerId: string, month: number, year: number): Promise<IPayroll | null> {
    try {
      // Calcula ou atualiza a folha
      const payroll = await this.calculatePayroll(workerId, month, year);

      if (payroll && payroll._id) {
        // Atualiza o status para processing
        return await payrollRepository.setStatus(payroll._id.toString(), "processing");
      }

      return null;
    } catch (error) {
      console.error('Erro ao gerar folha de pagamento:', error);
      return null;
    }
  }

  // Gera a folha de pagamento para todos os funcionários
  async generatePayrollForAllWorkers(month: number, year: number): Promise<IPayroll[]> {
    try {
      // Busca todos os funcionários
      const response = await fetch(`${WORKER_SERVICE_URL}/workers`);

      if (!response.ok) {
        console.error(`Erro ao buscar funcionários: ${response.status} - ${await response.text()}`);
        return [];
      }

      const workers = await response.json();
      const results: IPayroll[] = [];

      // Gera a folha para cada funcionário
      for (const worker of workers) {
        const payroll = await this.generatePayrollForWorker(worker._id, month, year);
        if (payroll) {
          results.push(payroll);
        }
      }

      return results;
    } catch (error) {
      console.error('Erro ao gerar folha de pagamento para todos:', error);
      return [];
    }
  }

  // Aprova uma folha de pagamento
  async approvePayroll(payrollId: string): Promise<IPayroll | null> {
    try {
      // Recalcula a folha antes de aprovar
      await payrollRepository.recalculate(payrollId);

      // Define o status como completed
      return await payrollRepository.setStatus(payrollId, "completed");
    } catch (error) {
      console.error('Erro ao aprovar folha de pagamento:', error);
      return null;
    }
  }

  // Cancela uma folha de pagamento
  async cancelPayroll(payrollId: string): Promise<IPayroll | null> {
    try {
      return await payrollRepository.setStatus(payrollId, "canceled");
    } catch (error) {
      console.error('Erro ao cancelar folha de pagamento:', error);
      return null;
    }
  }

  // Obtém uma folha de pagamento pelo ID
  async getPayroll(payrollId: string): Promise<IPayroll | null> {
    try {
      return await payrollRepository.findById(payrollId);
    } catch (error) {
      console.error('Erro ao obter folha de pagamento:', error);
      return null;
    }
  }

  // Obtém todas as folhas de pagamento de um funcionário
  async getPayrollsByWorker(workerId: string): Promise<IPayroll[]> {
    try {
      return await payrollRepository.findByWorker(workerId);
    } catch (error) {
      console.error('Erro ao obter folhas de pagamento do funcionário:', error);
      return [];
    }
  }

  // Obtém todas as folhas de pagamento de um mês específico
  async getPayrollsByMonth(month: number, year: number): Promise<IPayroll[]> {
    try {
      return await payrollRepository.findByMonth(month, year);
    } catch (error) {
      console.error('Erro ao obter folhas de pagamento do mês:', error);
      return [];
    }
  }

  // Recalcula uma folha de pagamento
  async recalculatePayroll(payrollId: string): Promise<IPayroll | null> {
    try {
      return await payrollRepository.recalculate(payrollId);
    } catch (error) {
      console.error('Erro ao recalcular folha de pagamento:', error);
      return null;
    }
  }

  // Métodos auxiliares para cálculos

  // Calcula a alíquota do INSS com base no salário
  private calculateInssRate(salary: number): number {
    // Tabela de faixas e alíquotas do INSS 2025
    const inssTable = [
      { limit: 1518.00, rate: 0.075 }, // Faixa 1: até R$ 1.518,00
      { limit: 2793.88, rate: 0.09 },  // Faixa 2: de R$ 1.518,01 a R$ 2.793,88
      { limit: 4190.83, rate: 0.12 },  // Faixa 3: de R$ 2.793,89 a R$ 4.190,83
      { limit: Infinity, rate: 0.14 }  // Faixa 4: acima de R$ 4.190,83
    ];

    let totalContribution = 0;
    let previousLimit = 0;

    for (const faixa of inssTable) {
      if (salary > faixa.limit) {
        totalContribution += (faixa.limit - previousLimit) * faixa.rate;
        previousLimit = faixa.limit;
      } else {
        totalContribution += (salary - previousLimit) * faixa.rate;
        break;
      }
    }

    return parseFloat((totalContribution / salary * 100).toFixed(2)); // Retorna a taxa em porcentagem
  }

  // Calcula o IRRF com base na tabela de 2025
  private calculateIrrfRate(salary: number): number {
    // Tabela IRRF 2025
    const irrfTable = [
      { limit: 3036.00, rate: 0, deduction: 0 }, // Isento
      { limit: 3533.31, rate: 0.075, deduction: 182.16 },
      { limit: 4688.85, rate: 0.15, deduction: 394.16 },
      { limit: 5830.85, rate: 0.225, deduction: 675.49 },
      { limit: Infinity, rate: 0.275, deduction: 908.73 }
    ];

    let rate = 0;

    for (const faixa of irrfTable) {
      if (salary <= faixa.limit) {
        rate = faixa.rate * 100; // Converte para porcentagem
        break;
      }
    }

    return parseFloat(rate.toFixed(2));
  }
}

// Exporta uma instância única do serviço
export const payrollService = new PayrollService();
export default payrollService;
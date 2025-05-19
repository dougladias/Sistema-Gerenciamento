import { IPayroll } from '../models/payroll.model';
import { payrollRepository } from '../repositories/payroll.repository';
import { connectToDatabase } from '../config/database';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente
dotenv.config();

// URL do serviço de workers
const WORKER_SERVICE_URL = process.env.WORKER_SERVICE_URL || 'http://localhost:4015';

// Exemplo de uso da URL para buscar funcionários
export async function fetchWorkers() {
  const response = await fetch(`${WORKER_SERVICE_URL}/workers`);
  return response.json();
}

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
  generatePayrollForWorker(workerId: string, month: number, year: number): Promise<IPayroll | null> {
    throw new Error('Method not implemented.');
  }
  generatePayrollForAllWorkers(month: number, year: number): Promise<IPayroll[]> {
    throw new Error('Method not implemented.');
  }
  approvePayroll(payrollId: string): Promise<IPayroll | null> {
    throw new Error('Method not implemented.');
  }
  cancelPayroll(payrollId: string): Promise<IPayroll | null> {
    throw new Error('Method not implemented.');
  }
  getPayroll(payrollId: string): Promise<IPayroll | null> {
    throw new Error('Method not implemented.');
  }
  getPayrollsByWorker(workerId: string): Promise<IPayroll[]> {
    throw new Error('Method not implemented.');
  }
  getPayrollsByMonth(month: number, year: number): Promise<IPayroll[]> {
    throw new Error('Method not implemented.');
  }
  recalculatePayroll(payrollId: string): Promise<IPayroll | null> {
    throw new Error('Method not implemented.');
  }
  
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
      let payroll = await payrollRepository.findByWorkerAndMonth(workerId, month, year) as (IPayroll & { _id: string }) | null;

      if (payroll) {
        // Se já existe, atualiza o salário base
        payroll = await payrollRepository.update(String((payroll as IPayroll & { _id: string })._id), {
          baseGrossSalary
        }) as (IPayroll & { _id: string }) | null;
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
        
        payroll = await payrollRepository.create(newPayroll as IPayroll) as IPayroll & { _id: string };
      }

      // Adiciona descontos padrão se for uma nova folha
      if (payroll && payroll.deductions.length === 0) {
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
      if (payroll && payroll.benefits.length === 0 && worker.ajuda) {
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
      if (payroll) {
        return await payrollRepository.recalculate(payroll._id.toString());
      } else {
        console.error('Erro: payroll é null ao tentar recalcular.');
        return null;
      }
    } catch (error) {
      console.error('Erro ao calcular folha de pagamento:', error);
      return null;
    }
  }

  // Resto dos métodos continua igual...
}

// Exporta uma instância única do serviço
export const payrollService = new PayrollService();
export default payrollService;
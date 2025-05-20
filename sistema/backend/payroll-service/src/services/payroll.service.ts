import { PayrollModel, IPayroll, PayrollStatus } from '../models/payroll.model';
import { PayslipModel, IPayslip, PayslipStatus } from '../models/payslip.model';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';

export class PayrollService {
  // Cria uma nova folha de pagamento
  async createPayroll(month: number, year: number): Promise<IPayroll> {
    // Verifica se já existe uma folha para o mês/ano
    const existing = await PayrollModel.findOne({ month, year });
    if (existing) {
      throw new Error(`Folha de pagamento para ${month}/${year} já existe`);
    }

    // Cria nova folha
    const payroll = new PayrollModel({
      month,
      year,
      status: PayrollStatus.DRAFT,
      totalGrossSalary: 0,
      totalDiscounts: 0,
      totalNetSalary: 0,
      employeeCount: 0
    });

    // Salva no banco
    return await payroll.save();
  }

  // Lista todas as folhas de pagamento
  async listPayrolls(page: number = 1, limit: number = 10): Promise<{
    payrolls: IPayroll[];
    total: number;
    page: number;
    pages: number;
  }> {
    // Valida os parâmetros
    const skip = (page - 1) * limit;
    const total = await PayrollModel.countDocuments();
    const payrolls = await PayrollModel.find()
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(limit);

    // Verifica se há folhas de pagamento
    return {
      payrolls,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  // Busca uma folha de pagamento pelo ID
  async getPayrollById(id: string): Promise<IPayroll | null> {
    return await PayrollModel.findById(id);
  }

  // Processa uma folha de pagamento com dados de funcionários
  async processPayroll(payrollId: string, employees: any[]): Promise<IPayroll | null> {
    const payroll = await PayrollModel.findById(payrollId);
    if (!payroll) {
      throw new Error('Folha de pagamento não encontrada');
    }

    // Verifica se a folha já foi processada
    if (payroll.status === PayrollStatus.COMPLETED) {
      throw new Error('Folha de pagamento já processada');
    }

    // Importa dinamicamente o calculador apenas quando necessário
    const { calculateSalary } = await import('../utils/payroll.calculator');

    // Atualiza status para processando
    payroll.status = PayrollStatus.PROCESSING;
    await payroll.save();

    // Verifica se os dados de funcionários estão presentes
    try {
      let totalGrossSalary = 0;
      let totalDiscounts = 0;
      let totalNetSalary = 0;

      // Calcula os holerites para cada funcionário
      const calculatedPayslips = employees.map(employee => {
        // Calcula os valores do holerite
        const calculated = calculateSalary(employee);
        
        // Retorna objeto no formato do modelo
        return {
          payrollId: payroll._id,
          workerId: calculated.workerId,
          employeeType: calculated.employeeType,
          name: calculated.name,
          position: calculated.position,
          department: calculated.department,
          baseSalary: calculated.baseSalary,
          benefits: calculated.benefits,
          deductions: calculated.deductions,
          totalDeductions: calculated.totalDeductions,
          netSalary: calculated.netSalary,
          status: PayslipStatus.PROCESSED,
          month: payroll.month,
          year: payroll.year
        };
      });

      // Calcula totais
      calculatedPayslips.forEach(p => {
        totalGrossSalary += p.baseSalary;
        totalDiscounts += p.totalDeductions;
        totalNetSalary += p.netSalary;
      });

      // Salva os holerites no banco
      await PayslipModel.insertMany(calculatedPayslips);

      // Atualiza a folha com os totais
      payroll.status = PayrollStatus.COMPLETED;
      payroll.processedAt = new Date();
      payroll.totalGrossSalary = totalGrossSalary;
      payroll.totalDiscounts = totalDiscounts;
      payroll.totalNetSalary = totalNetSalary;
      payroll.employeeCount = calculatedPayslips.length;

      return await payroll.save();
    } catch (error) {
      // Reverte para o status de rascunho em caso de erro
      payroll.status = PayrollStatus.DRAFT;
      await payroll.save();
      throw error;
    }
  }

  // Obtém os holerites de uma folha de pagamento
  async getPayslipsByPayrollId(payrollId: string): Promise<IPayslip[]> {
    return await PayslipModel.find({ payrollId });
  }

  // Obtém resumo por departamento e tipo de funcionário
  async getPayrollSummary(payrollId: string): Promise<any> {
    const payroll = await PayrollModel.findById(payrollId);
    if (!payroll) {
      throw new Error('Folha de pagamento não encontrada');
    }

    // Verifica se a folha já foi processada
    const payslips = await PayslipModel.find({ payrollId });
    if (!payslips.length) {
      throw new Error('Esta folha de pagamento não possui holerites');
    }

    // Agrupa por departamento
    const departmentSummary: Record<string, {
      count: number;
      totalGrossSalary: number;
      totalDeductions: number;
      totalNetSalary: number;
    }> = {};

    // Agrupa por tipo de contratação
    const employeeTypeSummary: Record<string, {
      count: number;
      totalGrossSalary: number;
      totalDeductions: number;
      totalNetSalary: number;
    }> = {};

    // Processa cada holerite
    payslips.forEach(payslip => {
      // Agrupa por departamento
      const dept = payslip.department;
      if (!departmentSummary[dept]) {
        departmentSummary[dept] = {
          count: 0,
          totalGrossSalary: 0,
          totalDeductions: 0,
          totalNetSalary: 0
        };
      }
      
      // Atualiza os totais do departamento
      departmentSummary[dept].count += 1;
      departmentSummary[dept].totalGrossSalary += payslip.baseSalary;
      departmentSummary[dept].totalDeductions += payslip.totalDeductions;
      departmentSummary[dept].totalNetSalary += payslip.netSalary;
      
      // Agrupa por tipo de contratação
      const type = payslip.employeeType;
      if (!employeeTypeSummary[type]) {
        employeeTypeSummary[type] = {
          count: 0,
          totalGrossSalary: 0,
          totalDeductions: 0,
          totalNetSalary: 0
        };
      }
      
      // Atualiza os totais do tipo de contratação
      employeeTypeSummary[type].count += 1;
      employeeTypeSummary[type].totalGrossSalary += payslip.baseSalary;
      employeeTypeSummary[type].totalDeductions += payslip.totalDeductions;
      employeeTypeSummary[type].totalNetSalary += payslip.netSalary;
    });

    // Retorna o resumo
    return {
      payroll,
      departmentSummary,
      employeeTypeSummary,
      payslipCount: payslips.length
    };
  }

  // Gera o PDF de um holerite
  async generatePayslipPDF(payslipId: string): Promise<string> {
    const payslip = await PayslipModel.findById(payslipId);
    if (!payslip) {
      throw new Error('Holerite não encontrado');
    }

    // Verifica se a folha de pagamento existe
    const payroll = await PayrollModel.findById(payslip.payrollId);
    if (!payroll) {
      throw new Error('Folha de pagamento não encontrada');
    }

    // Cria diretório temporário se não existir
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Caminho do arquivo
    const filePath = path.join(tempDir, `holerite_${payslip.workerId}_${payslip.month}_${payslip.year}.pdf`);

    // Cria o PDF
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);

    // Pipe do PDF para o arquivo
    doc.pipe(stream);

    // Adiciona conteúdo ao PDF
    doc.fontSize(18).text('HOLERITE', { align: 'center' });
    doc.moveDown();
    
    // Período
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    doc.fontSize(12).text(`Referente a: ${months[payslip.month - 1]}/${payslip.year}`, { align: 'center' });
    doc.moveDown();

    // Informações do funcionário
    doc.fontSize(14).text('Informações do Funcionário');
    doc.fontSize(10);
    doc.text(`Nome: ${payslip.name}`);
    doc.text(`Cargo: ${payslip.position}`);
    doc.text(`Departamento: ${payslip.department}`);
    doc.text(`Tipo de Contratação: ${payslip.employeeType}`);
    doc.moveDown();

    // Informações salariais
    doc.fontSize(14).text('Informações Salariais');
    doc.fontSize(10);
    doc.text(`Salário Base: R$ ${payslip.baseSalary.toFixed(2)}`);
    
    // Benefícios
    if (payslip.benefits && payslip.benefits.length > 0) {
      doc.moveDown();
      doc.fontSize(12).text('Benefícios:');
      payslip.benefits.forEach(benefit => {
        doc.fontSize(10).text(`- ${benefit.description || benefit.type}: R$ ${benefit.value.toFixed(2)}`);
      });
    }
    
    // Deduções
    if (payslip.deductions && payslip.deductions.length > 0) {
      doc.moveDown();
      doc.fontSize(12).text('Descontos:');
      payslip.deductions.forEach(deduction => {
        doc.fontSize(10).text(`- ${deduction.description || deduction.type}: R$ ${deduction.value.toFixed(2)}`);
      });
    }
    
    // Resumo
    doc.moveDown();
    doc.fontSize(12).text('Resumo:');
    doc.fontSize(10);
    doc.text(`Total de Descontos: R$ ${payslip.totalDeductions.toFixed(2)}`);
    doc.text(`Salário Líquido: R$ ${payslip.netSalary.toFixed(2)}`);
    
    // Rodapé
    doc.moveDown(2);
    doc.fontSize(8).text('Este documento é uma demonstração de pagamento. Para mais informações, entre em contato com o RH.', { align: 'center' });

    // Finaliza o PDF
    doc.end();

    // Retorna uma Promise que será resolvida quando o stream terminar
    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  }
}

// Cria uma instância do serviço
export const payrollService = new PayrollService();
import { PayrollModel, IPayroll, PayrollStatus } from '../models/payroll.model';
import { PayslipModel, IPayslip, PayslipStatus } from '../models/payslip.model';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import calculatePayslip from '../utils/payroll.calculator';
import mongoose from 'mongoose';

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

  // Processa uma folha de pagamento com suporte a reprocessamento
  async processPayroll(payrollId: string, employees: any[]) {
    try {
      // Validar o ID da folha de pagamento
      if (!mongoose.Types.ObjectId.isValid(payrollId)) {
        throw new Error('ID da folha de pagamento inválido');
      }

      // Encontrar a folha de pagamento
      const payroll = await PayrollModel.findById(payrollId);
      if (!payroll) {
        throw new Error('Folha de pagamento não encontrada');
      }

      // Verificar se a folha já foi processada - remover essa verificação ou modificar
      // Se já foi processada, vamos reprocessar
      let isReprocessing = false;
      if (payroll.status === PayrollStatus.COMPLETED || payroll.processedAt) {
        isReprocessing = true;
        console.log(`Reprocessando folha de pagamento ${payrollId}`);
      }

      // Iniciar processamento
      payroll.status = PayrollStatus.PROCESSING;
      await payroll.save();

      // Se estamos reprocessando, excluir os holerites anteriores
      if (isReprocessing) {
        await PayslipModel.deleteMany({ payrollId: payrollId });
      }

      // Variáveis para armazenar totais
      let totalGrossSalary = 0;
      let totalDiscounts = 0;
      let totalNetSalary = 0;
      let employeeCount = 0;

      // Processar cada funcionário
      const payslips = [];
      for (const employee of employees) {
        // ADICIONAR AQUI: Verificação se o ID existe
        if (!employee.id) {
          console.warn(`Aviso: Funcionário sem ID válido. Nome: ${employee.name}, Tipo: ${employee.contractType}`);
          continue; // Pula este funcionário e continua com o próximo
        }

        try {
          // Calcular o holerite
          let payslipData;
          // Determine which calculation function to use based on contract type
          switch (employee.contractType) {
            case 'CLT':
              payslipData = calculatePayslip.calculateCLTEmployee(employee);
              break;
            case 'PJ':
              payslipData = calculatePayslip.calculateCNPJProvider(employee);
              break;
            default:
              console.error(`Unsupported contract type: ${employee.contractType} for employee ${employee.name} (ID: ${employee.id})`);
              throw new Error(`Unsupported contract type: ${employee.contractType}`);
          }
          
          // Verificar se grossSalary existe e é um número válido
          const grossSalary = (payslipData as any).grossSalary || payslipData.baseSalary || 0;
          if (isNaN(grossSalary)) {
            console.warn(`Aviso: Salário bruto inválido para ${employee.name}. Usando salário base.`);
          }
          
          // Garantir que todos os valores sejam números válidos
          const validGrossSalary = isNaN(grossSalary) ? employee.baseSalary || 0 : grossSalary;
          const validTotalDeductions = isNaN(payslipData.totalDeductions) ? 0 : payslipData.totalDeductions;
          const validNetSalary = isNaN(payslipData.netSalary) ? (validGrossSalary - validTotalDeductions) : payslipData.netSalary;
          
          // Criar o holerite no banco de dados
          const payslip = await PayslipModel.create({
            payrollId,
            workerId: employee.id,
            name: employee.name,
            position: employee.position,
            department: employee.department,
            employeeType: employee.contractType === 'PJ' ? 'CLT' : employee.contractType, // Forçando tipo compatível temporariamente
            // Mesmo criando como CLT, podemos filtrar no frontend pelo tipo real que virá de outro campo
            month: payroll.month,
            year: payroll.year,
            baseSalary: payslipData.baseSalary,
            benefits: payslipData.benefits || [],
            deductions: payslipData.deductions || [],
            grossSalary: validGrossSalary, // Usar o valor validado
            totalDeductions: validTotalDeductions, // Usar o valor validado
            netSalary: validNetSalary, // Usar o valor validado
            status: PayslipStatus.PROCESSED
          });
          
          payslips.push(payslip);
          
          // Adicionar aos totais com validação mais robusta
          if (!isNaN(validGrossSalary)) {
            totalGrossSalary += validGrossSalary;
          }
          if (!isNaN(validTotalDeductions)) {
            totalDiscounts += validTotalDeductions;
          }
          if (!isNaN(validNetSalary)) {
            totalNetSalary += validNetSalary;
          }
          employeeCount++;
          
        } catch (employeeError) {
          console.error(`Erro ao processar funcionário ${employee.name}:`, employeeError);
          // Continua com o próximo funcionário
          continue;
        }
      }

      // Garantir que todos os totais sejam números válidos antes de salvar
      try {
        payroll.status = PayrollStatus.COMPLETED;
        payroll.processedAt = new Date();
        // Validação extra para garantir que não haja NaN
        payroll.totalGrossSalary = Number(isNaN(totalGrossSalary) ? 0 : totalGrossSalary.toFixed(2));
        payroll.totalDiscounts = Number(isNaN(totalDiscounts) ? 0 : totalDiscounts.toFixed(2));
        payroll.totalNetSalary = Number(isNaN(totalNetSalary) ? 0 : totalNetSalary.toFixed(2));
        payroll.employeeCount = employeeCount;
        
        // Salvar com tratamento de erro
        const savedPayroll = await payroll.save();
        return savedPayroll;
      } catch (saveError: any) {
        console.error('Erro ao salvar folha processada:', saveError);
        throw new Error(`Erro ao finalizar folha de pagamento: ${saveError.message}`);
      }
    } catch (error) {
      console.error('Erro ao processar folha de pagamento:', error);
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
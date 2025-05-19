import { IPayStub } from '../models/payStub.model';
import { payStubRepository } from '../repositories/payStub.repository';
import { payrollRepository } from '../repositories/payroll.repository';
import { connectToDatabase } from '../config/database';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Diretório para armazenar os PDFs
const PDF_DIR = path.resolve(__dirname, '../../storage/pdfs');

// Cria o diretório se não existir
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

// Interface para o serviço de PayStub
export interface IPayStubService {
  generatePayStub(payrollId: string): Promise<IPayStub | null>;
  generatePayStubsForMonth(month: number, year: number): Promise<IPayStub[]>;
  getPayStub(payStubId: string): Promise<IPayStub | null>;
  getPayStubsByWorker(workerId: string): Promise<IPayStub[]>;
  getPayStubsByMonth(month: number, year: number): Promise<IPayStub[]>;
  signPayStub(payStubId: string, ip: string): Promise<IPayStub | null>;
  generatePdf(payStubId: string): Promise<string | null>;
  getPayStubPdf(payStubId: string): Promise<Buffer | null>;
}

export class PayStubService implements IPayStubService {
  // Gera um holerite a partir de uma folha de pagamento
  async generatePayStub(payrollId: string): Promise<IPayStub | null> {
    try {
      await connectToDatabase();
      
      // Verifica se já existe um holerite para esta folha de pagamento
      const existingPayStub = await payStubRepository.findByPayroll(payrollId);
      if (existingPayStub) {
        return existingPayStub;
      }
      
      // Busca a folha de pagamento
      const payroll = await payrollRepository.findById(payrollId);
      if (!payroll) {
        console.error(`Folha de pagamento não encontrada: ${payrollId}`);
        return null;
      }
      
      // Verifica se a folha está com status "completed"
      if (payroll.status !== "completed") {
        console.error(`Folha de pagamento não está aprovada: ${payrollId}`);
        return null;
      }
      
      // Preparar os dados de deduções, benefícios e adicionais com valores calculados
      const deductions = payroll.deductions.map(d => ({
        name: d.name,
        value: d.value,
        type: d.type,
        calculatedValue: d.type === "percentage" 
          ? (payroll.baseGrossSalary * d.value / 100) 
          : d.value
      }));
      
      const benefits = payroll.benefits.map(b => ({
        name: b.name,
        value: b.value,
        type: b.type,
        calculatedValue: b.type === "percentage" 
          ? (payroll.baseGrossSalary * b.value / 100) 
          : b.value
      }));
      
      const additionals = payroll.additionals.map(a => ({
        name: a.name,
        value: a.value,
        type: a.type,
        calculatedValue: a.type === "percentage" 
          ? (payroll.baseGrossSalary * a.value / 100) 
          : a.value
      }));
      
      // Criar o holerite
      const payStub = await payStubRepository.create({
        payrollId: payroll._id,
        workerId: payroll.workerId.toString(),
        workerName: payroll.workerName,
        month: payroll.month,
        year: payroll.year,
        documentNumber: '', // Será gerado pelo repositório
        issueDate: new Date(),
        baseGrossSalary: payroll.baseGrossSalary,
        totalDeductions: payroll.totalDeductions,
        totalBenefits: payroll.totalBenefits,
        totalAdditionals: payroll.totalAdditionals,
        netSalary: payroll.netSalary,
        deductions,
        benefits,
        additionals,
        signedByEmployee: false,
        notes: payroll.notes
      } as IPayStub);
      
      // Retorna o holerite criado
      return payStub;
    } catch (error) {
      console.error('Erro ao gerar holerite:', error);
      return null;
    }
  }

  // Gera holerites para todas as folhas de pagamento de um mês
  async generatePayStubsForMonth(month: number, year: number): Promise<IPayStub[]> {
    try {
      await connectToDatabase();
      
      // Busca todas as folhas de pagamento aprovadas do mês
      const payrolls = await payrollRepository.findByMonth(month, year);
      const approvedPayrolls = payrolls.filter(p => p.status === "completed");
      
      const results: IPayStub[] = [];
      
      // Gera um holerite para cada folha aprovada
      for (const payroll of approvedPayrolls) {
        const payStub = await this.generatePayStub((payroll._id as any).toString());
        if (payStub) {
          results.push(payStub);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Erro ao gerar holerites do mês:', error);
      return [];
    }
  }

  // Obtém um holerite pelo ID
  async getPayStub(payStubId: string): Promise<IPayStub | null> {
    try {
      return await payStubRepository.findById(payStubId);
    } catch (error) {
      console.error('Erro ao obter holerite:', error);
      return null;
    }
  }

  // Obtém todos os holerites de um funcionário
  async getPayStubsByWorker(workerId: string): Promise<IPayStub[]> {
    try {
      return await payStubRepository.findByWorker(workerId);
    } catch (error) {
      console.error('Erro ao obter holerites do funcionário:', error);
      return [];
    }
  }

  // Obtém todos os holerites de um mês específico
  async getPayStubsByMonth(month: number, year: number): Promise<IPayStub[]> {
    try {
      return await payStubRepository.findByMonth(month, year);
    } catch (error) {
      console.error('Erro ao obter holerites do mês:', error);
      return [];
    }
  }

  // Marca um holerite como assinado pelo funcionário
  async signPayStub(payStubId: string, ip: string): Promise<IPayStub | null> {
    try {
      // Gera um token de assinatura
      const token = this.generateSignatureToken();
      
      // Atualiza o holerite com a assinatura
      return await payStubRepository.markAsSigned(payStubId, ip, token);
    } catch (error) {
      console.error('Erro ao assinar holerite:', error);
      return null;
    }
  }

  // Gera um arquivo PDF para o holerite
  async generatePdf(payStubId: string): Promise<string | null> {
    try {
      const payStub = await payStubRepository.findById(payStubId);
      if (!payStub) {
        return null;
      }
      
      // Gera um PDF básico (na implementação real, você usaria PDFKit ou similar)
      const pdfFileName = `holerite_${payStub.documentNumber.replace('-', '_')}.pdf`;
      const pdfPath = path.join(PDF_DIR, pdfFileName);
      
      // Conteúdo básico do PDF
      const pdfContent = this.generateBasicPdfContent(payStub);
      
      // Salva o arquivo
      fs.writeFileSync(pdfPath, pdfContent);
      
      // URL relativa para acessar o PDF
      const pdfUrl = `/storage/pdfs/${pdfFileName}`;
      
      // Atualiza o URL do PDF no holerite
      await payStubRepository.updatePdfUrl(payStubId, pdfUrl);
      
      return pdfUrl;
    } catch (error) {
      console.error('Erro ao gerar PDF do holerite:', error);
      return null;
    }
  }

  // Obtém o PDF do holerite
  async getPayStubPdf(payStubId: string): Promise<Buffer | null> {
    try {
      const payStub = await payStubRepository.findById(payStubId);
      if (!payStub || !payStub.pdfUrl) {
        return null;
      }
      
      // Extrai o nome do arquivo do URL
      const fileName = path.basename(payStub.pdfUrl);
      const pdfPath = path.join(PDF_DIR, fileName);
      
      // Verifica se o arquivo existe
      if (!fs.existsSync(pdfPath)) {
        // Se não existir, gera novamente
        await this.generatePdf(payStubId);
        
        // Tenta ler novamente
        if (fs.existsSync(pdfPath)) {
          return fs.readFileSync(pdfPath);
        } else {
          return Buffer.from('PDF não encontrado');
        }
      }
      
      // Lê o arquivo
      return fs.readFileSync(pdfPath);
    } catch (error) {
      console.error('Erro ao obter PDF do holerite:', error);
      return null;
    }
  }

  // Método para gerar conteúdo básico de PDF (simulado)
  private generateBasicPdfContent(payStub: IPayStub): Buffer {
    // Aqui você implementaria a geração real do PDF com PDFKit
    // Este é apenas um exemplo simples que cria texto simulando um PDF
    
    const content = `
      HOLERITE - ${payStub.documentNumber}
      ===============================
      
      Funcionário: ${payStub.workerName}
      Mês/Ano: ${payStub.month}/${payStub.year}
      
      Salário Base: R$ ${payStub.baseGrossSalary.toFixed(2)}
      
      DESCONTOS:
      ${payStub.deductions.map(d => `- ${d.name}: R$ ${d.calculatedValue.toFixed(2)}`).join('\n')}
      
      BENEFÍCIOS:
      ${payStub.benefits.map(b => `- ${b.name}: R$ ${b.calculatedValue.toFixed(2)}`).join('\n')}
      
      ADICIONAIS:
      ${payStub.additionals.map(a => `- ${a.name}: R$ ${a.calculatedValue.toFixed(2)}`).join('\n')}
      
      Total Descontos: R$ ${payStub.totalDeductions.toFixed(2)}
      Total Benefícios: R$ ${payStub.totalBenefits.toFixed(2)}
      Total Adicionais: R$ ${payStub.totalAdditionals.toFixed(2)}
      
      Salário Líquido: R$ ${payStub.netSalary.toFixed(2)}
      
      Data de Emissão: ${payStub.issueDate.toLocaleDateString()}
      
      ${payStub.signedByEmployee ? `
      ASSINADO ELETRONICAMENTE EM ${payStub.signatureDate?.toLocaleDateString()}
      IP: ${payStub.signatureIp}
      ` : ''}
    `;
    
    return Buffer.from(content);
  }

  // Método privado para gerar um token de assinatura
  private generateSignatureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Exporta uma instância única do serviço
export const payStubService = new PayStubService();
export default payStubService;
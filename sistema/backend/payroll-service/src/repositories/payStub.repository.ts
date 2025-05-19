import { connectToDatabase } from '../config/database';
import { IPayStub, createPayStubModel } from '../models/payStub.model';

// Interface para o repositório de PayStub
export interface IPayStubRepository {
  findAll(): Promise<IPayStub[]>;
  findById(id: string): Promise<IPayStub | null>;
  findByWorker(workerId: string): Promise<IPayStub[]>;
  findByWorkerAndMonth(workerId: string, month: number, year: number): Promise<IPayStub | null>;
  findByMonth(month: number, year: number): Promise<IPayStub[]>;
  findByPayroll(payrollId: string): Promise<IPayStub | null>;
  findByDocumentNumber(documentNumber: string): Promise<IPayStub | null>;
  create(payStub: Omit<IPayStub, '_id'>): Promise<IPayStub>;
  update(id: string, payStub: Partial<IPayStub>): Promise<IPayStub | null>;
  delete(id: string): Promise<boolean>;
  markAsSigned(id: string, ip: string, token: string): Promise<IPayStub | null>;
  updatePdfUrl(id: string, pdfUrl: string): Promise<IPayStub | null>;
}

// Implementação do repositório de PayStub
export class PayStubRepository implements IPayStubRepository {
  
  // Encontra todos os holerites
  async findAll(): Promise<IPayStub[]> {
    await connectToDatabase();
    const PayStubModel = createPayStubModel();
    return PayStubModel.find().sort({ year: -1, month: -1 }).exec();
  }

  // Encontra um holerite pelo ID
  async findById(id: string): Promise<IPayStub | null> {
    await connectToDatabase();
    const PayStubModel = createPayStubModel();
    return PayStubModel.findById(id).exec();
  }

  // Encontra holerites por ID de funcionário
  async findByWorker(workerId: string): Promise<IPayStub[]> {
    await connectToDatabase();
    const PayStubModel = createPayStubModel();
    return PayStubModel.find({ workerId }).sort({ year: -1, month: -1 }).exec();
  }

  // Encontra holerite específico de um funcionário por mês e ano
  async findByWorkerAndMonth(workerId: string, month: number, year: number): Promise<IPayStub | null> {
    await connectToDatabase();
    const PayStubModel = createPayStubModel();
    return PayStubModel.findOne({ workerId, month, year }).exec();
  }

  // Encontra holerites por mês e ano
  async findByMonth(month: number, year: number): Promise<IPayStub[]> {
    await connectToDatabase();
    const PayStubModel = createPayStubModel();
    return PayStubModel.find({ month, year }).sort({ workerName: 1 }).exec();
  }

  // Encontra holerite por ID de folha de pagamento
  async findByPayroll(payrollId: string): Promise<IPayStub | null> {
    await connectToDatabase();
    const PayStubModel = createPayStubModel();
    return PayStubModel.findOne({ payrollId }).exec();
  }

  // Encontra holerite por número do documento
  async findByDocumentNumber(documentNumber: string): Promise<IPayStub | null> {
    await connectToDatabase();
    const PayStubModel = createPayStubModel();
    return PayStubModel.findOne({ documentNumber }).exec();
  }

  // Cria um novo holerite
  async create(payStub: Omit<IPayStub, '_id'>): Promise<IPayStub> {
    await connectToDatabase();
    const PayStubModel = createPayStubModel();
    
    // Gera um número de documento único se não for fornecido
    if (!payStub.documentNumber) {
      const documentNumber = await this.generateDocumentNumber(payStub.month, payStub.year);
      payStub.documentNumber = documentNumber;
    }
    
    const newPayStub = new PayStubModel(payStub);
    return newPayStub.save();
  }

  // Atualiza um holerite pelo ID
  async update(id: string, payStub: Partial<IPayStub>): Promise<IPayStub | null> {
    await connectToDatabase();
    const PayStubModel = createPayStubModel();
    
    return PayStubModel.findByIdAndUpdate(
      id,
      { $set: payStub },
      { new: true }
    ).exec();
  }

  // Exclui um holerite pelo ID
  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const PayStubModel = createPayStubModel();
    const result = await PayStubModel.findByIdAndDelete(id).exec();
    return result !== null;
  }

  // Marca um holerite como assinado
  async markAsSigned(id: string, ip: string, token: string): Promise<IPayStub | null> {
    await connectToDatabase();
    const PayStubModel = createPayStubModel();
    
    return PayStubModel.findByIdAndUpdate(
      id,
      { 
        $set: { 
          signedByEmployee: true,
          signatureDate: new Date(),
          signatureIp: ip,
          signatureToken: token
        } 
      },
      { new: true }
    ).exec();
  }

  // Atualiza a URL do PDF de um holerite
  async updatePdfUrl(id: string, pdfUrl: string): Promise<IPayStub | null> {
    await connectToDatabase();
    const PayStubModel = createPayStubModel();
    
    return PayStubModel.findByIdAndUpdate(
      id,
      { $set: { pdfUrl } },
      { new: true }
    ).exec();
  }

  // Método privado para gerar um número de documento único
  private async generateDocumentNumber(month: number, year: number): Promise<string> {
    const PayStubModel = createPayStubModel();
    
    // Conta quantos holerites já existem para este mês/ano
    const count = await PayStubModel.countDocuments({ month, year }).exec();
    
    // Formata o número sequencial com zeros à esquerda (00001, 00002, etc.)
    const sequence = (count + 1).toString().padStart(5, '0');
    
    // Formata o mês com dois dígitos (01, 02, ... 12)
    const monthFormatted = month.toString().padStart(2, '0');
    
    // Gera o número do documento (exemplo: 202405-00001)
    return `${year}${monthFormatted}-${sequence}`;
  }
}

// Exporta uma instância única do repositório
export const payStubRepository = new PayStubRepository();
export default payStubRepository;
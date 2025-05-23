import { connectToDatabase } from '../config/database';
import { IInvoice, createInvoiceModel } from '../models/invoice.model';

export class InvoiceRepository {
  
  // Busca todas as notas fiscais
  async findAll(): Promise<IInvoice[]> {
    await connectToDatabase();
    const InvoiceModel = createInvoiceModel();
    return InvoiceModel.find().sort({ date: -1 }).exec();
  }

  // Busca uma nota fiscal pelo ID
  async findById(id: string): Promise<IInvoice | null> {
    await connectToDatabase();
    const InvoiceModel = createInvoiceModel();
    return InvoiceModel.findById(id).exec();
  }

  // Busca uma nota fiscal pelo número
  async findByNumber(number: string): Promise<IInvoice | null> {
    await connectToDatabase();
    const InvoiceModel = createInvoiceModel();
    return InvoiceModel.findOne({ number }).exec();
  }

  // Cria uma nova nota fiscal
  async create(invoice: Omit<IInvoice, '_id'>): Promise<IInvoice> {
    await connectToDatabase();
    const InvoiceModel = createInvoiceModel();
    const newInvoice = new InvoiceModel(invoice);
    return newInvoice.save();
  }

  // Atualiza uma nota fiscal
  async update(id: string, invoice: Partial<IInvoice>): Promise<IInvoice | null> {
    await connectToDatabase();
    const InvoiceModel = createInvoiceModel();
    return InvoiceModel.findByIdAndUpdate(
      id,
      { $set: invoice },
      { new: true }
    ).exec();
  }

  // Remove uma nota fiscal
  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const InvoiceModel = createInvoiceModel();
    const result = await InvoiceModel.findByIdAndDelete(id).exec();
    return result !== null;
  }

  // Atualiza o status de uma nota fiscal
  async updateStatus(id: string, status: IInvoice['status']): Promise<IInvoice | null> {
    await connectToDatabase();
    const InvoiceModel = createInvoiceModel();
    return InvoiceModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    ).exec();
  }
}

// Exporta uma instância única do repositório
export const invoiceRepository = new InvoiceRepository();
export default invoiceRepository;
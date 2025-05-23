import { connectToDatabase } from '../config/database';
import { IProvider, createProviderModel, ProviderStatus } from '../models/provider.model';

// Interface para filtros de fornecedores
export interface ProviderFilter {
  name?: string;
  documentNumber?: string;
  status?: ProviderStatus;
  hostName?: string;
  startDate?: Date;
  endDate?: Date;
}

// Interface para o repositório de Fornecedores
export interface IProviderRepository {
  findAll(filter?: ProviderFilter): Promise<IProvider[]>;
  findById(id: string): Promise<IProvider | null>;
  findByDocumentNumber(documentNumber: string): Promise<IProvider | null>;
  create(provider: Omit<IProvider, '_id'>): Promise<IProvider>;
  update(id: string, provider: Partial<IProvider>): Promise<IProvider | null>;
  delete(id: string): Promise<boolean>;
  updateStatus(id: string, status: ProviderStatus, updateData?: Partial<IProvider>): Promise<IProvider | null>;
  checkIn(id: string): Promise<IProvider | null>;
  checkOut(id: string): Promise<IProvider | null>;
  findByDateRange(startDate: Date, endDate: Date): Promise<IProvider[]>;
  findCurrentProviders(): Promise<IProvider[]>;
}

// Implementação do repositório de Fornecedores
export class ProviderRepository implements IProviderRepository {
  
  // Encontra todos os fornecedores com filtros opcionais
  async findAll(filter?: ProviderFilter): Promise<IProvider[]> {
    await connectToDatabase();
    const ProviderModel = createProviderModel();
    
    // Constrói o objeto de consulta com base nos filtros fornecidos
    const query: any = {};
    
    if (filter) {
      // Filtro por nome (pesquisa parcial case-insensitive)
      if (filter.name) {
        query.name = { $regex: filter.name, $options: 'i' };
      }
      
      // Filtro por número de documento
      if (filter.documentNumber) {
        query.documentNumber = filter.documentNumber;
      }
      
      // Filtro por status
      if (filter.status) {
        query.status = filter.status;
      }
      
      // Filtro por nome do anfitrião
      if (filter.hostName) {
        query.hostName = { $regex: filter.hostName, $options: 'i' };
      }
      
      // Filtro por intervalo de datas (entrada agendada)
      if (filter.startDate && filter.endDate) {
        query.scheduledEntry = {
          $gte: filter.startDate,
          $lte: filter.endDate
        };
      } else if (filter.startDate) {
        query.scheduledEntry = { $gte: filter.startDate };
      } else if (filter.endDate) {
        query.scheduledEntry = { $lte: filter.endDate };
      }
    }
    
    // Executa a consulta, ordenando por data de entrada agendada (mais recente primeiro)
    return ProviderModel.find(query).sort({ scheduledEntry: -1 }).exec();
  }

  // Busca um fornecedor pelo ID
  async findById(id: string): Promise<IProvider | null> {
    await connectToDatabase();
    const ProviderModel = createProviderModel();
    return ProviderModel.findById(id).exec();
  }

  // Busca um fornecedor pelo número do documento
  async findByDocumentNumber(documentNumber: string): Promise<IProvider | null> {
    await connectToDatabase();
    const ProviderModel = createProviderModel();
    return ProviderModel.findOne({ documentNumber }).exec();
  }

  // Cria um novo fornecedor
  async create(provider: Omit<IProvider, '_id'>): Promise<IProvider> {
    await connectToDatabase();
    const ProviderModel = createProviderModel();
    const newProvider = new ProviderModel(provider);
    return newProvider.save();
  }

  // Atualiza um fornecedor existente
  async update(id: string, provider: Partial<IProvider>): Promise<IProvider | null> {
    await connectToDatabase();
    const ProviderModel = createProviderModel();
    return ProviderModel.findByIdAndUpdate(
      id,
      { $set: provider },
      { new: true }
    ).exec();
  }

  // Remove um fornecedor
  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const ProviderModel = createProviderModel();
    const result = await ProviderModel.findByIdAndDelete(id).exec();
    return result !== null;
  }

  // Atualiza o status de um fornecedor
  async updateStatus(id: string, status: ProviderStatus, updateData?: Partial<IProvider>): Promise<IProvider | null> {
    await connectToDatabase();
    const ProviderModel = createProviderModel();
    
    // Combina o novo status com quaisquer dados adicionais
    const updates = {
      status,
      ...(updateData || {})
    };
    
    return ProviderModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).exec();
  }

  // Registra a entrada de um fornecedor
  async checkIn(id: string): Promise<IProvider | null> {
    const actualEntry = new Date();
    return this.updateStatus(id, ProviderStatus.CHECKED_IN, { actualEntry });
  }

  // Registra a saída de um fornecedor
  async checkOut(id: string): Promise<IProvider | null> {
    const actualExit = new Date();
    return this.updateStatus(id, ProviderStatus.CHECKED_OUT, { actualExit });
  }

  // Busca fornecedores por intervalo de datas (entrada agendada)
  async findByDateRange(startDate: Date, endDate: Date): Promise<IProvider[]> {
    await connectToDatabase();
    const ProviderModel = createProviderModel();
    
    return ProviderModel.find({
      scheduledEntry: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ scheduledEntry: 1 }).exec();
  }

  // Busca fornecedores atualmente no prédio (com entrada registrada, mas sem saída)
  async findCurrentProviders(): Promise<IProvider[]> {
    await connectToDatabase();
    const ProviderModel = createProviderModel();
    
    return ProviderModel.find({
      status: ProviderStatus.CHECKED_IN,
      actualEntry: { $ne: null }
    }).sort({ actualEntry: 1 }).exec();
  }
}

// Exporta uma instância única do repositório
export const providerRepository = new ProviderRepository();
export default providerRepository;
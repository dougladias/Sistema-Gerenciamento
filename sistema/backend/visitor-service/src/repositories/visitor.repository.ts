import { connectToDatabase } from '../config/database';
import { IVisitor, createVisitorModel, VisitorStatus } from '../models/visitor.model';

// Interface para filtros de visitantes
export interface VisitorFilter {
  name?: string;
  documentNumber?: string;
  status?: VisitorStatus;
  hostName?: string;
  startDate?: Date;
  endDate?: Date;
}

// Interface para o repositório de Visitantes
export interface IVisitorRepository {
  findAll(filter?: VisitorFilter): Promise<IVisitor[]>;
  findById(id: string): Promise<IVisitor | null>;
  findByDocumentNumber(documentNumber: string): Promise<IVisitor | null>;
  create(visitor: Omit<IVisitor, '_id'>): Promise<IVisitor>;
  update(id: string, visitor: Partial<IVisitor>): Promise<IVisitor | null>;
  delete(id: string): Promise<boolean>;
  updateStatus(id: string, status: VisitorStatus, updateData?: Partial<IVisitor>): Promise<IVisitor | null>;
  checkIn(id: string): Promise<IVisitor | null>;
  checkOut(id: string): Promise<IVisitor | null>;
  findByDateRange(startDate: Date, endDate: Date): Promise<IVisitor[]>;
  findCurrentVisitors(): Promise<IVisitor[]>;
}

// Implementação do repositório de Visitantes
export class VisitorRepository implements IVisitorRepository {
  
  // Encontra todos os visitantes com filtros opcionais
  async findAll(filter?: VisitorFilter): Promise<IVisitor[]> {
    await connectToDatabase();
    const VisitorModel = createVisitorModel();
    
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
    return VisitorModel.find(query).sort({ scheduledEntry: -1 }).exec();
  }

  // Busca um visitante pelo ID
  async findById(id: string): Promise<IVisitor | null> {
    await connectToDatabase();
    const VisitorModel = createVisitorModel();
    return VisitorModel.findById(id).exec();
  }

  // Busca um visitante pelo número do documento
  async findByDocumentNumber(documentNumber: string): Promise<IVisitor | null> {
    await connectToDatabase();
    const VisitorModel = createVisitorModel();
    return VisitorModel.findOne({ documentNumber }).exec();
  }

  // Cria um novo visitante
  async create(visitor: Omit<IVisitor, '_id'>): Promise<IVisitor> {
    await connectToDatabase();
    const VisitorModel = createVisitorModel();
    const newVisitor = new VisitorModel(visitor);
    return newVisitor.save();
  }

  // Atualiza um visitante existente
  async update(id: string, visitor: Partial<IVisitor>): Promise<IVisitor | null> {
    await connectToDatabase();
    const VisitorModel = createVisitorModel();
    return VisitorModel.findByIdAndUpdate(
      id,
      { $set: visitor },
      { new: true }
    ).exec();
  }

  // Remove um visitante
  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const VisitorModel = createVisitorModel();
    const result = await VisitorModel.findByIdAndDelete(id).exec();
    return result !== null;
  }

  // Atualiza o status de um visitante
  async updateStatus(id: string, status: VisitorStatus, updateData?: Partial<IVisitor>): Promise<IVisitor | null> {
    await connectToDatabase();
    const VisitorModel = createVisitorModel();
    
    // Combina o novo status com quaisquer dados adicionais
    const updates = {
      status,
      ...(updateData || {})
    };
    
    return VisitorModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).exec();
  }

  // Registra a entrada de um visitante
  async checkIn(id: string): Promise<IVisitor | null> {
    const actualEntry = new Date();
    return this.updateStatus(id, VisitorStatus.CHECKED_IN, { actualEntry });
  }

  // Registra a saída de um visitante
  async checkOut(id: string): Promise<IVisitor | null> {
    const actualExit = new Date();
    return this.updateStatus(id, VisitorStatus.CHECKED_OUT, { actualExit });
  }

  // Busca visitantes por intervalo de datas (entrada agendada)
  async findByDateRange(startDate: Date, endDate: Date): Promise<IVisitor[]> {
    await connectToDatabase();
    const VisitorModel = createVisitorModel();
    
    return VisitorModel.find({
      scheduledEntry: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ scheduledEntry: 1 }).exec();
  }

  // Busca visitantes atualmente no prédio (com entrada registrada, mas sem saída)
  async findCurrentVisitors(): Promise<IVisitor[]> {
    await connectToDatabase();
    const VisitorModel = createVisitorModel();
    
    return VisitorModel.find({
      status: VisitorStatus.CHECKED_IN,
      actualEntry: { $ne: null }
    }).sort({ actualEntry: 1 }).exec();
  }
}

// Exporta uma instância única do repositório
export const visitorRepository = new VisitorRepository();
export default visitorRepository;
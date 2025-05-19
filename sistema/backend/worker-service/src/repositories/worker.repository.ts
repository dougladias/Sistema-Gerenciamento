import { connectToDatabase } from '../config/database';
import { IWorker, createWorkerModel, IFile, IEntry } from '../models/worker.model';


// Interface para o repositório de Workers
export interface IWorkerRepository {
  findAll(): Promise<IWorker[]>;
  findById(id: string): Promise<IWorker | null>;
  findByEmail(email: string): Promise<IWorker | null>;
  findByCpf(cpf: string): Promise<IWorker | null>;
  create(worker: Omit<IWorker, '_id'>): Promise<IWorker>;
  update(id: string, worker: Partial<IWorker>): Promise<IWorker | null>;
  delete(id: string): Promise<boolean>;
  addEntry(workerId: string, entry: Partial<IEntry>): Promise<IWorker | null>;
  updateEntry(workerId: string, logId: string, updates: Partial<IEntry>): Promise<IWorker | null>;
  removeEntry(workerId: string, logId: string): Promise<IWorker | null>;
  addFile(workerId: string, file: IFile): Promise<IWorker | null>;
  updateFile(workerId: string, fileId: string, updates: Partial<IFile>): Promise<IWorker | null>;
  removeFile(workerId: string, fileId: string): Promise<IWorker | null>;
}


// Implementação do repositório de Workers
export class WorkerRepository implements IWorkerRepository {
  
  // Encontra todos os funcionários   
  async findAll(): Promise<IWorker[]> {
    await connectToDatabase();
    const WorkerModel = createWorkerModel();
    return WorkerModel.find().sort({ name: 1 }).exec();
  }

  
  // Encontra um funcionário pelo ID  
  async findById(id: string): Promise<IWorker | null> {
    await connectToDatabase();
    const WorkerModel = createWorkerModel();
    return WorkerModel.findById(id).exec();
  }

  
  // Encontra um funcionário pelo email   
  async findByEmail(email: string): Promise<IWorker | null> {
    await connectToDatabase();
    const WorkerModel = createWorkerModel();
    return WorkerModel.findOne({ email }).exec();
  }

  // Encontra um funcionário pelo CPF
  async findByCpf(cpf: string): Promise<IWorker | null> {
    await connectToDatabase();
    const WorkerModel = createWorkerModel();
    return WorkerModel.findOne({ cpf }).exec();
  }

 // Cria um novo funcionário
  async create(worker: Omit<IWorker, '_id'>): Promise<IWorker> {
    await connectToDatabase();
    const WorkerModel = createWorkerModel();
    const newWorker = new WorkerModel(worker);
    return newWorker.save();
  }

 // Atualiza um funcionário pelo ID
  async update(id: string, worker: Partial<IWorker>): Promise<IWorker | null> {
    await connectToDatabase();
    const WorkerModel = createWorkerModel();
    return WorkerModel.findByIdAndUpdate(
      id,
      { $set: worker },
      { new: true }
    ).exec();
  }

  // Exclui um funcionário pelo ID
  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const WorkerModel = createWorkerModel();
    const result = await WorkerModel.findByIdAndDelete(id).exec();
    return result !== null;
  }

  // Adiciona um registro de entrada/saída para o funcionário
  async addEntry(
    workerId: string, 
    entry: Partial<IEntry>
  ): Promise<IWorker | null> {
    await connectToDatabase();
    const WorkerModel = createWorkerModel();
    
    // Configura campos padrão se não fornecidos
    const entryData = {
      ...entry,
      date: entry.date || new Date(),
      createdAt: new Date()
    };
    
    // Adiciona o registro de entrada/saída ao funcionário
    return WorkerModel.findByIdAndUpdate(
      workerId,
      { $push: { logs: entryData } },
      { new: true }
    ).exec();
  }

  // Atualiza um registro de ponto
  async updateEntry(workerId: string, logId: string, updates: Partial<IEntry>): Promise<IWorker | null> {
    await connectToDatabase();
    const WorkerModel = createWorkerModel();
    
    // Primeiro obter o trabalhador para verificar se o log existe
    const worker = await this.findById(workerId);
    if (!worker) return null;
    
    // Encontrar o índice do log
    const logIndex = worker.logs.findIndex(log => log._id?.toString() === logId);
    if (logIndex === -1) return null;
    
    // Preparar o caminho para cada campo que pode ser atualizado
    const updateFields: any = {};
    
    // Atualizar os campos de entrada/saída
    if (updates.entryTime !== undefined) {
      updateFields[`logs.${logIndex}.entryTime`] = updates.entryTime;
    }
    
    // Atualizar os campos de saída
    if (updates.leaveTime !== undefined) {
      updateFields[`logs.${logIndex}.leaveTime`] = updates.leaveTime;
    }
    
    // Atualizar os campos de ausência
    if (updates.absent !== undefined) {
      updateFields[`logs.${logIndex}.absent`] = updates.absent;
    }
    
    // Atualizar a data
    if (updates.date !== undefined) {
      updateFields[`logs.${logIndex}.date`] = updates.date;
    }
    
    // Atualizar os campos específicos
    return WorkerModel.findByIdAndUpdate(
      workerId,
      { $set: updateFields },
      { new: true }
    ).exec();
  }

  // Remove um registro de ponto
  async removeEntry(workerId: string, logId: string): Promise<IWorker | null> {
    await connectToDatabase();
    const WorkerModel = createWorkerModel();
    return WorkerModel.findByIdAndUpdate(
      workerId,
      { $pull: { logs: { _id: logId } } },
      { new: true }
    ).exec();
  }

  // Adiciona um arquivo ao funcionário
  async addFile(workerId: string, file: IFile): Promise<IWorker | null> {
    await connectToDatabase();
    const WorkerModel = createWorkerModel();
    return WorkerModel.findByIdAndUpdate(
      workerId,
      { $push: { files: file } },
      { new: true }
    ).exec();
  }

  // Atualiza um arquivo do funcionário
  async updateFile(workerId: string, fileId: string, updates: Partial<IFile>): Promise<IWorker | null> {
    await connectToDatabase();
    const WorkerModel = createWorkerModel();
    return WorkerModel.findOneAndUpdate(
      { _id: workerId, 'files._id': fileId },
      { $set: { 
          'files.$.description': updates.description,
          'files.$.category': updates.category
        } 
      },
      { new: true }
    ).exec();
  }

  // Remove um arquivo do funcionário
  async removeFile(workerId: string, fileId: string): Promise<IWorker | null> {
    await connectToDatabase();
    const WorkerModel = createWorkerModel();
    return WorkerModel.findByIdAndUpdate(
      workerId,
      { $pull: { files: { _id: fileId } } },
      { new: true }
    ).exec();
  }
}

// Exporta uma instância única do repositório
export const workerRepository = new WorkerRepository();
export default workerRepository;
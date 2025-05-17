import { connectToDatabase } from '../config/database';
import { IWorker, createWorkerModel, IFile } from '../models/worker.model';


// Interface para o repositório de Workers
export interface IWorkerRepository {
  findAll(): Promise<IWorker[]>;
  findById(id: string): Promise<IWorker | null>;
  findByEmail(email: string): Promise<IWorker | null>;
  findByCpf(cpf: string): Promise<IWorker | null>;
  create(worker: Omit<IWorker, '_id'>): Promise<IWorker>;
  update(id: string, worker: Partial<IWorker>): Promise<IWorker | null>;
  delete(id: string): Promise<boolean>;
  addEntry(workerId: string, entry: { entryTime?: Date; leaveTime?: Date; absent?: boolean }): Promise<IWorker | null>;
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
    entry: { entryTime?: Date; leaveTime?: Date; absent?: boolean }
  ): Promise<IWorker | null> {
    await connectToDatabase();
    const WorkerModel = createWorkerModel();
    
    // Verifica se o registro de entrada/saída já existe
    const entryData = {
      ...entry,
      date: new Date(),
      createdAt: new Date()
    };
    
    // Adiciona o registro de entrada/saída ao funcionário
    return WorkerModel.findByIdAndUpdate(
      workerId,
      { $push: { logs: entryData } },
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
      { _id: workerId, "files._id": fileId },
      { $set: { "files.$": updates } },
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
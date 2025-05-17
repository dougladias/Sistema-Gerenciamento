import { IFile } from '../models/worker.model';
import { workerRepository } from '../repositories/worker.repository';
import crypto from 'crypto';
import path from 'path';

export class DocumentService {
 
  // Gera um nome único para o arquivo
  private generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomStr = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName);
    return `${timestamp}-${randomStr}${extension}`;
  }

  // Obtém um documento específico
  async getDocument(workerId: string, documentId: string): Promise<IFile | null> {
    const worker = await workerRepository.findById(workerId);
    if (!worker || !worker.files) return null;

    return worker.files.find(file => file._id?.toString() === documentId) || null;
  }

  // Adiciona um novo documento
  async addDocument(workerId: string, document: {
    data: Buffer | string,
    originalName: string,
    mimetype: string,
    size: number,
    description?: string,
    category?: string
  }): Promise<IFile | null> {
    try {
      // Verifica se o funcionário existe
      const worker = await workerRepository.findById(workerId);
      if (!worker) return null;

      // Processa dados binários
      let contentBuffer: Buffer;
      if (typeof document.data === 'string') {
        // Se for Base64, decodifica
        const base64Data = document.data.replace(/^data:[^,]+;base64,/, '');
        contentBuffer = Buffer.from(base64Data, 'base64');
      } else {
        contentBuffer = document.data;
      }

      // Gera um nome único para o arquivo
      const filename = this.generateUniqueFilename(document.originalName);

      // Cria o objeto de arquivo (sem salvar fisicamente)
      const fileDoc: IFile = {
        filename: filename,
        originalName: document.originalName,
        mimetype: document.mimetype,
        size: contentBuffer.length,
        content: contentBuffer,
        uploadDate: new Date(),
        description: document.description,
        category: document.category
      };

      // Adiciona o arquivo ao funcionário diretamente no banco
      const updatedWorker = await workerRepository.addFile(workerId, fileDoc);
      if (!updatedWorker || !updatedWorker.files) return null;

      // Retorna o arquivo adicionado
      return updatedWorker.files[updatedWorker.files.length - 1];
    } catch (error) {
      console.error('Erro ao adicionar documento:', error);
      throw error;
    }
  }

  // Atualiza informações de um documento
  async updateDocument(workerId: string, documentId: string, updates: Partial<IFile>): Promise<IFile | null> {
    // Obtém o documento atual
    const currentDoc = await this.getDocument(workerId, documentId);
    if (!currentDoc) return null;

    // Apenas permite atualizar certos campos
    const allowedUpdates: Partial<IFile> = {
      description: updates.description,
      category: updates.category
    };

    // Atualiza o documento no banco de dados
    const updatedWorker = await workerRepository.updateFile(workerId, documentId, allowedUpdates);
    if (!updatedWorker || !updatedWorker.files) return null;

    // Retorna o documento atualizado
    return updatedWorker.files.find(file => file._id?.toString() === documentId) || null;
  }

  // Remove um documento
  async deleteDocument(workerId: string, documentId: string): Promise<boolean> {
    try {
      // Apenas remove a referência do banco de dados
      const result = await workerRepository.removeFile(workerId, documentId);
      return result !== null;
    } catch (error) {
      console.error('Erro ao remover documento:', error);
      throw error;
    }
  }

  // Busca documentos por categoria
  async getDocumentsByCategory(workerId: string, category: string): Promise<IFile[]> {
    const worker = await workerRepository.findById(workerId);
    if (!worker || !worker.files) return [];

    return worker.files.filter(file => file.category === category);
  }
}

export default DocumentService;
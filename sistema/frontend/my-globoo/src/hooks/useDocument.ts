import { useState, useCallback } from 'react';
import { WorkerFile } from '@/types/worker';
import documentService from '@/services/documentService';

// Hook personalizado para gerenciar documentos
export const useDocument = () => {
  // Estados
  const [documents, setDocuments] = useState<WorkerFile[]>([]);
  const [currentDocument, setCurrentDocument] = useState<WorkerFile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Busca todos os documentos de um funcionário
  const fetchWorkerDocuments = useCallback(async (workerId: string) => {
    setLoading(true);
    setError(null);
    
    // Limpa o documento atual
    try {
      const data = await documentService.getWorkerDocuments(workerId);
      setDocuments(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar documentos';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca um documento específico
  const fetchDocumentById = useCallback(async (workerId: string, fileId: string) => {
    setLoading(true);
    setError(null);
    
    // Limpa o documento atual
    try {
      const data = await documentService.getDocumentById(workerId, fileId);
      setCurrentDocument(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar documento';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload de documento
  const uploadDocument = useCallback(async (
    workerId: string,
    documentData: {
      filename: string;
      originalName: string;
      mimetype: string;
      size: number;
      fileContent: string;
      description?: string;
      category?: string;
    }
  ) => {
    setLoading(true);
    setError(null);
    
    // Limpa o documento atual
    try {
      const newDocument = await documentService.uploadDocument(workerId, documentData);
      setDocuments(prev => [...prev, newDocument]);
      return newDocument;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao fazer upload do documento';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualiza um documento
  const updateDocument = useCallback(async (
    workerId: string,
    fileId: string,
    updates: {
      description?: string;
      category?: string;
    }
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedDocument = await documentService.updateDocument(workerId, fileId, updates);
      
      // Atualiza o documento atual se for o mesmo
      if (currentDocument && currentDocument._id === fileId) {
        setCurrentDocument(updatedDocument);
      }
      
      // Atualiza a lista de documentos
      setDocuments(prev => 
        prev.map(doc => 
          doc._id === fileId ? updatedDocument : doc
        )
      );
      
      return updatedDocument;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao atualizar documento';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentDocument]);

  // Exclui um documento
  const deleteDocument = useCallback(async (workerId: string, fileId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await documentService.deleteDocument(workerId, fileId);
      
      // Remove o documento da lista
      setDocuments(prev => prev.filter(doc => doc._id !== fileId));
      
      // Limpa o documento atual se for o mesmo
      if (currentDocument && currentDocument._id === fileId) {
        setCurrentDocument(null);
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao excluir documento';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentDocument]);

  // Download de documento
  const downloadDocument = useCallback(async (workerId: string, fileId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const blob = await documentService.downloadDocument(workerId, fileId);
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao fazer download do documento';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtra documentos por categoria
  const filterDocumentsByCategory = useCallback(async (workerId: string, category: string) => {
    setLoading(true);
    setError(null);
    
    // Limpa o documento atual
    try {
      const filteredDocuments = await documentService.filterDocumentsByCategory(workerId, category);
      setDocuments(filteredDocuments);
      return filteredDocuments;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao filtrar documentos';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtra documentos por tipo MIME
  const filterDocumentsByMimeType = useCallback(async (workerId: string, mimeType: string) => {
    setLoading(true);
    setError(null);
    
    // Limpa o documento atual
    try {
      const filteredDocuments = await documentService.filterDocumentsByMimeType(workerId, mimeType);
      setDocuments(filteredDocuments);
      return filteredDocuments;
    } catch (err) {
      // Verifica se o erro é uma instância de Error
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao filtrar documentos';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Limpa o erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estados
    documents,
    currentDocument,
    loading,
    error,
    
    // Funções
    fetchWorkerDocuments,
    fetchDocumentById,
    uploadDocument,
    updateDocument,
    deleteDocument,
    downloadDocument,
    filterDocumentsByCategory,
    filterDocumentsByMimeType,
    clearError,
    
    // Utilitários
    setCurrentDocument
  };
};

export default useDocument;
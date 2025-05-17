import { useState, useCallback } from 'react';
import { Worker, WorkerCreate, WorkerUpdate, WorkerFilter } from '@/types/worker';
import workerService from '@/services/workerService';

// Hook para gerenciar funcionários
export const useWorker = () => {
  // Estados
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [currentWorker, setCurrentWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

 // Funções para manipulação de funcionários
  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Limpa o estado de erro antes de buscar os funcionários
    try {
      const data = await workerService.getAllWorkers();
      setWorkers(data);
      return data;
    } catch (err) {

      // Verifica se o erro é uma instância de Error e obtém a mensagem
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar funcionários';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

 // Função para buscar um funcionário por ID
  const fetchWorkerById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    // Limpa o estado de erro antes de buscar o funcionário
    try {
      const data = await workerService.getWorkerById(id);
      setCurrentWorker(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar funcionário';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para criar um novo funcionário
  const createWorker = useCallback(async (data: WorkerCreate) => {
    setLoading(true);
    setError(null);
    
    // Limpa o estado de erro antes de criar o funcionário
    try {
      const newWorker = await workerService.createWorker(data);
      setWorkers(prev => [...prev, newWorker]);
      return newWorker;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao criar funcionário';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para atualizar um funcionário
  const updateWorker = useCallback(async (id: string, data: WorkerUpdate) => {
    setLoading(true);
    setError(null);
    
    // Limpa o estado de erro antes de atualizar o funcionário
    try {
      const updatedWorker = await workerService.updateWorker(id, data);
      
      // Atualiza o worker atual se for o mesmo
      if (currentWorker && currentWorker._id === id) {
        setCurrentWorker(updatedWorker);
      }
      
      // Atualiza a lista de workers
      setWorkers(prev => 
        prev.map(worker => 
          worker._id === id ? updatedWorker : worker
        )
      );
      
      // Retorna o funcionário atualizado
      return updatedWorker;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao atualizar funcionário';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentWorker]);

  // Função para excluir um funcionário
  const deleteWorker = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    // Limpa o estado de erro antes de excluir o funcionário
    try {
      await workerService.deleteWorker(id);
      
      // Remove o worker da lista
      setWorkers(prev => prev.filter(worker => worker._id !== id));
      
      // Limpa o worker atual se for o mesmo
      if (currentWorker && currentWorker._id === id) {
        setCurrentWorker(null);
      }
      
      // Retorna true se a exclusão foi bem-sucedida
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao excluir funcionário';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentWorker]);

  // Função para adicionar um registro de entrada/saída
  const addEntry = useCallback(async (
    workerId: string, 
    entry: { entryTime?: Date; leaveTime?: Date; absent?: boolean }
  ) => {
    setLoading(true);
    setError(null);
    
    // Limpa o estado de erro antes de adicionar o registro
    try {
      const updatedWorker = await workerService.addEntry(workerId, entry);
      
      // Atualiza o worker atual se for o mesmo
      if (currentWorker && currentWorker._id === workerId) {
        setCurrentWorker(updatedWorker);
      }
      
      // Atualiza a lista de workers
      setWorkers(prev => 
        prev.map(worker => 
          worker._id === workerId ? updatedWorker : worker
        )
      );
      
      // Retorna o funcionário atualizado
      return updatedWorker;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao adicionar registro';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentWorker]);

  // Função para filtrar funcionários
  const filterWorkers = useCallback(async (filter: WorkerFilter) => {
    setLoading(true);
    setError(null);
    
    // Limpa o estado de erro antes de filtrar os funcionários
    try {
      const filteredWorkers = await workerService.filterWorkers(filter);
      setWorkers(filteredWorkers);
      return filteredWorkers;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao filtrar funcionários';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para adicionar um arquivo
  const addFile = useCallback(
    async (
      workerId: string,
      file: {
        filename: string;
        originalName: string;
        mimetype: string;
        size: number;
        fileContent: string; // Base64
        description?: string;
        category?: string;
      }
    ) => {
      setLoading(true);
      setError(null);

      try {
        const updatedWorker = await workerService.addFile(workerId, file);
        setWorkers((prev) =>
          prev.map((worker) => (worker._id === workerId ? updatedWorker : worker))
        );
        return updatedWorker;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao adicionar arquivo';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Função para atualizar informações de um arquivo
  const updateFile = useCallback(
    async (workerId: string, fileId: string, updates: { description?: string; category?: string }) => {
      setLoading(true);
      setError(null);

      try {
        const updatedWorker = await workerService.updateFile(workerId, fileId, updates);
        setWorkers((prev) =>
          prev.map((worker) => (worker._id === workerId ? updatedWorker : worker))
        );
        return updatedWorker;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar arquivo';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Função para remover um arquivo
  const removeFile = useCallback(
    async (workerId: string, fileId: string) => {
      setLoading(true);
      setError(null);

      try {
        const updatedWorker = await workerService.removeFile(workerId, fileId);
        setWorkers((prev) =>
          prev.map((worker) => (worker._id === workerId ? updatedWorker : worker))
        );
        return updatedWorker;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao remover arquivo';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Função para obter arquivos de um funcionário
  const getWorkerFiles = useCallback(
    async (workerId: string) => {
      setLoading(true);
      setError(null);

      try {
        const files = await workerService.getWorkerFiles(workerId);
        return files;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar arquivos';
        setError(errorMessage);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Limpa erros
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estados
    workers,
    currentWorker,
    loading,
    error,
    
    // Funções
    fetchWorkers,
    fetchWorkerById,
    createWorker,
    updateWorker,
    deleteWorker,
    addEntry,
    filterWorkers,
    addFile,
    updateFile,
    removeFile,
    getWorkerFiles,
    clearError,
    
    // Utilitários
    setCurrentWorker
  };
};

export default useWorker;
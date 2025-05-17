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
    clearError,
    
    // Utilitários
    setCurrentWorker
  };
};

export default useWorker;
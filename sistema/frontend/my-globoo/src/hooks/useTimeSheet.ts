import { useState, useCallback } from 'react';
import { Entry } from '@/types/worker';
import logService, { LogReport } from '@/services/timeSheetService';

// Hook personalizado para gerenciar logs (registros de ponto)
export const useLog = () => {
  // Estados
  const [logs, setLogs] = useState<Entry[]>([]);
  const [currentLog, setCurrentLog] = useState<Entry | null>(null);
  const [logReport, setLogReport] = useState<LogReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Busca todos os logs de um funcionário
  const fetchWorkerLogs = useCallback(async (workerId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await logService.getWorkerLogs(workerId);
      setLogs(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar registros de ponto';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca um log específico
  const fetchLogById = useCallback(async (workerId: string, logId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await logService.getLogById(workerId, logId);
      setCurrentLog(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar registro de ponto';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Adiciona um novo log
  const addLog = useCallback(async (
    workerId: string,
    logData: Partial<Entry>
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const newLog = await logService.addLog(workerId, logData);
      setLogs(prev => [...prev, newLog]);
      return newLog;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao adicionar registro de ponto';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualiza um log
  const updateLog = useCallback(async (
    workerId: string,
    logId: string,
    updates: Partial<Entry>
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedLog = await logService.updateLog(workerId, logId, updates);
      
      // Atualiza o log atual se for o mesmo
      if (currentLog && currentLog._id === logId) {
        setCurrentLog(updatedLog);
      }
      
      // Atualiza a lista de logs
      setLogs(prev => 
        prev.map(log => 
          log._id === logId ? updatedLog : log
        )
      );
      
      return updatedLog;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao atualizar registro de ponto';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentLog]);

  // Exclui um log
  const deleteLog = useCallback(async (workerId: string, logId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await logService.deleteLog(workerId, logId);
      
      // Remove o log da lista
      setLogs(prev => prev.filter(log => log._id !== logId));
      
      // Limpa o log atual se for o mesmo
      if (currentLog && currentLog._id === logId) {
        setCurrentLog(null);
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao excluir registro de ponto';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentLog]);

  // Gera relatório de ponto
  const getLogReport = useCallback(async (
    workerId: string,
    startDate?: Date | string,
    endDate?: Date | string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const report = await logService.getLogReport(workerId, startDate, endDate);
      setLogReport(report);
      return report;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao gerar relatório';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtra logs por data
  const filterLogsByDate = useCallback(async (
    workerId: string,
    startDate: Date | string,
    endDate: Date | string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const filteredLogs = await logService.filterLogsByDate(workerId, startDate, endDate);
      setLogs(filteredLogs);
      return filteredLogs;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao filtrar registros';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtra logs por ausência
  const filterLogsByAbsence = useCallback(async (
    workerId: string,
    absent: boolean
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const filteredLogs = await logService.filterLogsByAbsence(workerId, absent);
      setLogs(filteredLogs);
      return filteredLogs;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao filtrar registros';
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
    logs,
    currentLog,
    logReport,
    loading,
    error,
    
    // Funções
    fetchWorkerLogs,
    fetchLogById,
    addLog,
    updateLog,
    deleteLog,
    getLogReport,
    filterLogsByDate,
    filterLogsByAbsence,
    clearError,
    
    // Utilitários
    setCurrentLog
  };
};

export default useLog;
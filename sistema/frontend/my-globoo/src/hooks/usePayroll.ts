import { useState, useCallback } from 'react';
import { 
  Payroll, 
  Paystub, 
  PayrollCreate, 
  PayrollUpdate, 
  PaystubCreate, 
  PaystubUpdate,
  PayrollFilter,
  PaystubFilter 
} from '@/types/payroll';
import payrollService from '@/services/payrollService';

// Hook personalizado para gerenciar folhas de pagamento e holerites
export const usePayroll = () => {
  // Estados para folhas de pagamento
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [currentPayroll, setCurrentPayroll] = useState<Payroll | null>(null);
  
  // Estados para holerites
  const [paystubs, setPaystubs] = useState<Paystub[]>([]);
  const [currentPaystub, setCurrentPaystub] = useState<Paystub | null>(null);
  
  // Estados comuns
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ---- OPERAÇÕES DE FOLHA DE PAGAMENTO ----

  // Busca todas as folhas de pagamento
  const fetchAllPayrolls = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await payrollService.getAllPayrolls();
      setPayrolls(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar folhas de pagamento';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca uma folha de pagamento por ID
  const fetchPayrollById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await payrollService.getPayrollById(id);
      setCurrentPayroll(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar folha de pagamento';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cria uma nova folha de pagamento
  const createPayroll = useCallback(async (data: PayrollCreate) => {
    setLoading(true);
    setError(null);
    
    try {
      const newPayroll = await payrollService.createPayroll(data);
      setPayrolls(prev => [...prev, newPayroll]);
      return newPayroll;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao criar folha de pagamento';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualiza uma folha de pagamento
  const updatePayroll = useCallback(async (id: string, data: PayrollUpdate) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedPayroll = await payrollService.updatePayroll(id, data);
      
      // Atualiza a folha atual se for a mesma
      if (currentPayroll && currentPayroll._id === id) {
        setCurrentPayroll(updatedPayroll);
      }
      
      // Atualiza a lista de folhas
      setPayrolls(prev => 
        prev.map(payroll => 
          payroll._id === id ? updatedPayroll : payroll
        )
      );
      
      return updatedPayroll;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao atualizar folha de pagamento';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentPayroll]);

  // Exclui uma folha de pagamento
  const deletePayroll = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await payrollService.deletePayroll(id);
      
      // Remove a folha da lista
      setPayrolls(prev => prev.filter(payroll => payroll._id !== id));
      
      // Limpa a folha atual se for a mesma
      if (currentPayroll && currentPayroll._id === id) {
        setCurrentPayroll(null);
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao excluir folha de pagamento';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentPayroll]);

  // Filtra folhas de pagamento
  const filterPayrolls = useCallback(async (filter: PayrollFilter) => {
    setLoading(true);
    setError(null);
    
    try {
      const filteredPayrolls = await payrollService.filterPayrolls(filter);
      setPayrolls(filteredPayrolls);
      return filteredPayrolls;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao filtrar folhas de pagamento';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fecha uma folha de pagamento
  const closePayroll = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const closedPayroll = await payrollService.closePayroll(id);
      
      // Atualiza a folha atual se for a mesma
      if (currentPayroll && currentPayroll._id === id) {
        setCurrentPayroll(closedPayroll);
      }
      
      // Atualiza a lista de folhas
      setPayrolls(prev => 
        prev.map(payroll => 
          payroll._id === id ? closedPayroll : payroll
        )
      );
      
      return closedPayroll;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao fechar folha de pagamento';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentPayroll]);

  // Gera holerites para uma folha de pagamento
  const generatePaystubs = useCallback(async (payrollId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const generatedPaystubs = await payrollService.generatePaystubs(payrollId);
      setPaystubs(prev => [...prev, ...generatedPaystubs]);
      return generatedPaystubs;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao gerar holerites';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtém holerites de uma folha de pagamento
  const fetchPayrollPaystubs = useCallback(async (payrollId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const payrollPaystubs = await payrollService.getPayrollPaystubs(payrollId);
      setPaystubs(payrollPaystubs);
      return payrollPaystubs;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar holerites da folha';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ---- OPERAÇÕES DE HOLERITE ----

  // Busca todos os holerites
  const fetchAllPaystubs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await payrollService.getAllPaystubs();
      setPaystubs(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar holerites';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca um holerite por ID
  const fetchPaystubById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await payrollService.getPaystubById(id);
      setCurrentPaystub(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar holerite';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cria um novo holerite
  const createPaystub = useCallback(async (data: PaystubCreate) => {
    setLoading(true);
    setError(null);
    
    try {
      const newPaystub = await payrollService.createPaystub(data);
      setPaystubs(prev => [...prev, newPaystub]);
      return newPaystub;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao criar holerite';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualiza um holerite
  const updatePaystub = useCallback(async (id: string, data: PaystubUpdate) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedPaystub = await payrollService.updatePaystub(id, data);
      
      // Atualiza o holerite atual se for o mesmo
      if (currentPaystub && currentPaystub._id === id) {
        setCurrentPaystub(updatedPaystub);
      }
      
      // Atualiza a lista de holerites
      setPaystubs(prev => 
        prev.map(paystub => 
          paystub._id === id ? updatedPaystub : paystub
        )
      );
      
      return updatedPaystub;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao atualizar holerite';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentPaystub]);

  // Exclui um holerite
  const deletePaystub = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await payrollService.deletePaystub(id);
      
      // Remove o holerite da lista
      setPaystubs(prev => prev.filter(paystub => paystub._id !== id));
      
      // Limpa o holerite atual se for o mesmo
      if (currentPaystub && currentPaystub._id === id) {
        setCurrentPaystub(null);
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao excluir holerite';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentPaystub]);

  // Filtra holerites
  const filterPaystubs = useCallback(async (filter: PaystubFilter) => {
    setLoading(true);
    setError(null);
    
    try {
      const filteredPaystubs = await payrollService.filterPaystubs(filter);
      setPaystubs(filteredPaystubs);
      return filteredPaystubs;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao filtrar holerites';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Aprova um holerite
  const approvePaystub = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const approvedPaystub = await payrollService.approvePaystub(id);
      
      // Atualiza o holerite atual se for o mesmo
      if (currentPaystub && currentPaystub._id === id) {
        setCurrentPaystub(approvedPaystub);
      }
      
      // Atualiza a lista de holerites
      setPaystubs(prev => 
        prev.map(paystub => 
          paystub._id === id ? approvedPaystub : paystub
        )
      );
      
      return approvedPaystub;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao aprovar holerite';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentPaystub]);

  // Gera documento PDF para um holerite
  const generatePaystubDocument = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const documentBlob = await payrollService.generatePaystubDocument(id);
      return documentBlob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao gerar documento do holerite';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Download de holerite
  const downloadPaystub = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const blob = await payrollService.downloadPaystub(id);
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao fazer download do holerite';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ---- OPERAÇÕES RELACIONADAS A FUNCIONÁRIOS ----

  // Busca todos os holerites de um funcionário
  const fetchWorkerPaystubs = useCallback(async (workerId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const workerPaystubs = await payrollService.getWorkerPaystubs(workerId);
      setPaystubs(workerPaystubs);
      return workerPaystubs;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar holerites do funcionário';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtra holerites de um funcionário
  const filterWorkerPaystubs = useCallback(async (
    workerId: string, 
    filter: Omit<PaystubFilter, 'workerId'>
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const filteredPaystubs = await payrollService.filterWorkerPaystubs(workerId, filter);
      setPaystubs(filteredPaystubs);
      return filteredPaystubs;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao filtrar holerites do funcionário';
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
    payrolls,
    currentPayroll,
    paystubs,
    currentPaystub,
    loading,
    error,
    
    // Funções de folha de pagamento
    fetchAllPayrolls,
    fetchPayrollById,
    createPayroll,
    updatePayroll,
    deletePayroll,
    filterPayrolls,
    closePayroll,
    generatePaystubs,
    fetchPayrollPaystubs,
    
    // Funções de holerite
    fetchAllPaystubs,
    fetchPaystubById,
    createPaystub,
    updatePaystub,
    deletePaystub,
    filterPaystubs,
    approvePaystub,
    generatePaystubDocument,
    downloadPaystub,
    
    // Funções relacionadas a funcionários
    fetchWorkerPaystubs,
    filterWorkerPaystubs,
    
    // Utilitários
    clearError,
    setCurrentPayroll,
    setCurrentPaystub
  };
};

export default usePayroll;
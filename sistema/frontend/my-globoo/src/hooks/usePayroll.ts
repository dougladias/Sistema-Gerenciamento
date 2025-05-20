import { useState, useCallback } from 'react';
import { 
  Payroll, 
  Payslip, 
  PayrollCreate, 
  PayrollProcess, 
  PayrollSummary,
  PayslipCalculate,
  PayslipStatus
} from '@/types/payroll';
import payrollService from '@/services/payrollService';

// Hook personalizado para gerenciar folhas de pagamento
export const usePayroll = () => {
  // Estados
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [currentPayroll, setCurrentPayroll] = useState<Payroll | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [currentPayslip, setCurrentPayslip] = useState<Payslip | null>(null);
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummary | null>(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Busca todas as folhas de pagamento
  const fetchPayrolls = useCallback(async (page: number = 1, limit: number = 10) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await payrollService.getAllPayrolls(page, limit);
      setPayrolls(data.payrolls);
      setPagination({
        total: data.total,
        page: data.page,
        pages: data.pages
      });
      return data.payrolls;
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

  // Processa uma folha de pagamento
  const processPayroll = useCallback(async (id: string, data: PayrollProcess) => {
    setLoading(true);
    setError(null);
    
    try {
      const processedPayroll = await payrollService.processPayroll(id, data);
      
      // Atualiza a folha de pagamento atual se for a mesma
      if (currentPayroll && currentPayroll._id === id) {
        setCurrentPayroll(processedPayroll);
      }
      
      // Atualiza a lista de folhas de pagamento
      setPayrolls(prev => 
        prev.map(payroll => 
          payroll._id === id ? processedPayroll : payroll
        )
      );
      
      return processedPayroll;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao processar folha de pagamento';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentPayroll]);

  // Busca os holerites de uma folha de pagamento
  const fetchPayslipsByPayrollId = useCallback(async (payrollId: string) => {
    setLoading(true);
    try {
      // Busca os holerites para esta folha de pagamento
      const data = await payrollService.getPayslipsByPayrollId(payrollId);
      
      // Importante: Preservar holerites anteriores de outro tipo
      // Em vez de substituir completamente, agrupe por tipo
      setPayslips(prevPayslips => {
        // Primeiro, remova os holerites antigos desta mesma folha
        const otherPayrolls = prevPayslips.filter(p => p.payrollId !== payrollId);
        
        // Adicione os novos holerites
        return [...otherPayrolls, ...data];
      });
      
      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar holerites';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca o resumo de uma folha de pagamento
  const fetchPayrollSummary = useCallback(async (payrollId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await payrollService.getPayrollSummary(payrollId);
      setPayrollSummary(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar resumo da folha de pagamento';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca um holerite por ID
  const fetchPayslipById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await payrollService.getPayslipById(id);
      setCurrentPayslip(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar holerite';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Calcula um holerite (simulação)
  const calculatePayslip = useCallback(async (data: PayslipCalculate) => {
    setLoading(true);
    setError(null);
    
    try {
      const calculatedPayslip = await payrollService.calculatePayslip(data);
      return calculatedPayslip;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao calcular holerite';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualiza o status de um holerite
  const updatePayslipStatus = useCallback(async (id: string, status: PayslipStatus) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedPayslip = await payrollService.updatePayslipStatus(id, status);
      
      // Atualiza o holerite atual se for o mesmo
      if (currentPayslip && currentPayslip._id === id) {
        setCurrentPayslip(updatedPayslip);
      }
      
      // Atualiza a lista de holerites
      setPayslips(prev => 
        prev.map(payslip => 
          payslip._id === id ? updatedPayslip : payslip
        )
      );
      
      return updatedPayslip;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao atualizar status do holerite';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentPayslip]);

  // Busca holerites por funcionário
  const fetchPayslipsByWorker = useCallback(async (workerId: string, month?: number, year?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await payrollService.getPayslipsByWorker(workerId, month, year);
      setPayslips(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar holerites do funcionário';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Download de PDF do holerite
  const downloadPayslipPDF = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const blob = await payrollService.downloadPayslipPDF(id);
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao baixar PDF do holerite';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Visualização de PDF do holerite
  const viewPayslipPDF = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const blob = await payrollService.viewPayslipPDF(id);
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao visualizar PDF do holerite';
      setError(errorMessage);
      return null;
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
    payslips,
    currentPayslip,
    payrollSummary,
    pagination,
    loading,
    error,
    
    // Funções
    fetchPayrolls,
    fetchPayrollById,
    createPayroll,
    processPayroll,
    fetchPayslipsByPayrollId,
    fetchPayrollSummary,
    fetchPayslipById,
    calculatePayslip,
    updatePayslipStatus,
    fetchPayslipsByWorker,
    downloadPayslipPDF,
    viewPayslipPDF,
    clearError,
    
    // Utilitários
    setCurrentPayroll,
    setCurrentPayslip,
    setPayslips
  };
};

export default usePayroll;
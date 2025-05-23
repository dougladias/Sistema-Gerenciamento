import { useState, useCallback } from 'react';
import { Invoice, InvoiceCreate, InvoiceUpdate, InvoiceFilter, InvoiceStatus } from '@/types/invoice';
import invoiceService from '@/services/invoiceService';

// Hook personalizado para gerenciar notas fiscais
export const useInvoice = () => {
  // Estados
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Busca todas as notas fiscais
  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await invoiceService.getAllInvoices();
      setInvoices(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar notas fiscais';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca uma nota fiscal por ID
  const fetchInvoiceById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await invoiceService.getInvoiceById(id);
      setCurrentInvoice(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar nota fiscal';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cria uma nova nota fiscal
  const createInvoice = useCallback(async (data: InvoiceCreate) => {
    setLoading(true);
    setError(null);
    
    try {
      const newInvoice = await invoiceService.createInvoice(data);
      setInvoices(prev => [...prev, newInvoice]);
      return newInvoice;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao criar nota fiscal';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualiza uma nota fiscal
  const updateInvoice = useCallback(async (id: string, data: InvoiceUpdate) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedInvoice = await invoiceService.updateInvoice(id, data);
      
      // Atualiza a nota fiscal atual se for a mesma
      if (currentInvoice && currentInvoice._id === id) {
        setCurrentInvoice(updatedInvoice);
      }
      
      // Atualiza a lista de notas fiscais
      setInvoices(prev => 
        prev.map(invoice => 
          invoice._id === id ? updatedInvoice : invoice
        )
      );
      
      return updatedInvoice;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao atualizar nota fiscal';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentInvoice]);

  // Atualiza o status de uma nota fiscal
  const updateInvoiceStatus = useCallback(async (id: string, status: InvoiceStatus) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedInvoice = await invoiceService.updateInvoiceStatus(id, status);
      
      // Atualiza a nota fiscal atual se for a mesma
      if (currentInvoice && currentInvoice._id === id) {
        setCurrentInvoice(updatedInvoice);
      }
      
      // Atualiza a lista de notas fiscais
      setInvoices(prev => 
        prev.map(invoice => 
          invoice._id === id ? updatedInvoice : invoice
        )
      );
      
      return updatedInvoice;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao atualizar status da nota fiscal';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentInvoice]);

  // Exclui uma nota fiscal
  const deleteInvoice = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await invoiceService.deleteInvoice(id);
      
      // Remove a nota fiscal da lista
      setInvoices(prev => prev.filter(invoice => invoice._id !== id));
      
      // Limpa a nota fiscal atual se for a mesma
      if (currentInvoice && currentInvoice._id === id) {
        setCurrentInvoice(null);
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao excluir nota fiscal';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentInvoice]);

  // Download do arquivo da nota fiscal
  const downloadInvoice = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const blob = await invoiceService.downloadInvoice(id);
      
      // Encontra a nota fiscal para obter o nome do arquivo
      const invoice = invoices.find(inv => inv._id === id) || currentInvoice;
      if (invoice && invoice.attachment) {
        // Cria um link para download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = invoice.attachment.originalName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao fazer download da nota fiscal';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [invoices, currentInvoice]);

  // Filtra notas fiscais
  const filterInvoices = useCallback(async (filter: InvoiceFilter) => {
    setLoading(true);
    setError(null);
    
    try {
      const filteredInvoices = await invoiceService.filterInvoices(filter);
      setInvoices(filteredInvoices);
      return filteredInvoices;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao filtrar notas fiscais';
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
    invoices,
    currentInvoice,
    loading,
    error,
    
    // Funções
    fetchInvoices,
    fetchInvoiceById,
    createInvoice,
    updateInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    downloadInvoice,
    filterInvoices,
    clearError,
    
    // Utilitários
    setCurrentInvoice
  };
};

export default useInvoice;
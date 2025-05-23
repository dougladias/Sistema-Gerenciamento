import { useState, useCallback } from 'react';
import {
  Visitor,
  VisitorCreate,
  VisitorUpdate,
  VisitorPhotoUpdate,
  VisitorFilter,
  VisitorStatus
} from '@/types/visitor';
import visitorService from '@/services/visitorService';

// Hook personalizado para gerenciar visitantes
export const useVisitor = () => {
  // Estados
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [currentVisitors, setCurrentVisitors] = useState<Visitor[]>([]);
  const [currentVisitor, setCurrentVisitor] = useState<Visitor | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Busca todos os visitantes (com filtros opcionais)
  const fetchVisitors = useCallback(async (filter?: VisitorFilter) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await visitorService.getAllVisitors(filter);
      setVisitors(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar visitantes';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca os visitantes atuais (que estão no prédio)
  const fetchCurrentVisitors = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await visitorService.getCurrentVisitors();
      setCurrentVisitors(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar visitantes atuais';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca um visitante pelo ID
  const fetchVisitorById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await visitorService.getVisitorById(id);
      setCurrentVisitor(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar visitante';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cria um novo visitante
  const createVisitor = useCallback(async (data: VisitorCreate) => {
    setLoading(true);
    setError(null);
    
    try {
      const newVisitor = await visitorService.createVisitor(data);
      setVisitors(prev => [...prev, newVisitor]);
      return newVisitor;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao criar visitante';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualiza um visitante
  const updateVisitor = useCallback(async (id: string, data: VisitorUpdate) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedVisitor = await visitorService.updateVisitor(id, data);
      
      // Atualiza o visitante atual se for o mesmo
      if (currentVisitor && currentVisitor._id === id) {
        setCurrentVisitor(updatedVisitor);
      }
      
      // Atualiza a lista de visitantes
      setVisitors(prev => 
        prev.map(visitor => 
          visitor._id === id ? updatedVisitor : visitor
        )
      );
      
      // Atualiza a lista de visitantes atuais se necessário
      setCurrentVisitors(prev => 
        prev.map(visitor => 
          visitor._id === id ? updatedVisitor : visitor
        )
      );
      
      return updatedVisitor;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao atualizar visitante';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentVisitor]);

  // Atualiza a foto de um visitante
  const updateVisitorPhoto = useCallback(async (id: string, photoData: VisitorPhotoUpdate) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedVisitor = await visitorService.updateVisitorPhoto(id, photoData);
      
      // Atualiza o visitante atual se for o mesmo
      if (currentVisitor && currentVisitor._id === id) {
        setCurrentVisitor(updatedVisitor);
      }
      
      // Atualiza a lista de visitantes
      setVisitors(prev => 
        prev.map(visitor => 
          visitor._id === id ? updatedVisitor : visitor
        )
      );
      
      // Atualiza a lista de visitantes atuais se necessário
      setCurrentVisitors(prev => 
        prev.map(visitor => 
          visitor._id === id ? updatedVisitor : visitor
        )
      );
      
      return updatedVisitor;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao atualizar foto do visitante';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentVisitor]);

  // Atualiza o status de um visitante
  const updateVisitorStatus = useCallback(async (id: string, status: VisitorStatus) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedVisitor = await visitorService.updateVisitorStatus(id, status);
      
      // Atualiza o visitante atual se for o mesmo
      if (currentVisitor && currentVisitor._id === id) {
        setCurrentVisitor(updatedVisitor);
      }
      
      // Atualiza a lista de visitantes
      setVisitors(prev => 
        prev.map(visitor => 
          visitor._id === id ? updatedVisitor : visitor
        )
      );
      
      // Atualiza a lista de visitantes atuais
      // Se o status for diferente de CHECKED_IN, remove da lista de visitantes atuais
      if (status !== VisitorStatus.CHECKED_IN) {
        setCurrentVisitors(prev => prev.filter(visitor => visitor._id !== id));
      } else {
        setCurrentVisitors(prev => {
          const exists = prev.some(visitor => visitor._id === id);
          if (exists) {
            return prev.map(visitor => visitor._id === id ? updatedVisitor : visitor);
          } else {
            return [...prev, updatedVisitor];
          }
        });
      }
      
      return updatedVisitor;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao atualizar status do visitante';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentVisitor]);

  // Registra a entrada de um visitante
  const checkInVisitor = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedVisitor = await visitorService.checkInVisitor(id);
      
      // Atualiza o visitante atual se for o mesmo
      if (currentVisitor && currentVisitor._id === id) {
        setCurrentVisitor(updatedVisitor);
      }
      
      // Atualiza a lista de visitantes
      setVisitors(prev => 
        prev.map(visitor => 
          visitor._id === id ? updatedVisitor : visitor
        )
      );
      
      // Adiciona à lista de visitantes atuais
      setCurrentVisitors(prev => {
        const exists = prev.some(visitor => visitor._id === id);
        if (exists) {
          return prev.map(visitor => visitor._id === id ? updatedVisitor : visitor);
        } else {
          return [...prev, updatedVisitor];
        }
      });
      
      return updatedVisitor;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao registrar entrada do visitante';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentVisitor]);

  // Registra a saída de um visitante
  const checkOutVisitor = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedVisitor = await visitorService.checkOutVisitor(id);
      
      // Atualiza o visitante atual se for o mesmo
      if (currentVisitor && currentVisitor._id === id) {
        setCurrentVisitor(updatedVisitor);
      }
      
      // Atualiza a lista de visitantes
      setVisitors(prev => 
        prev.map(visitor => 
          visitor._id === id ? updatedVisitor : visitor
        )
      );
      
      // Remove da lista de visitantes atuais
      setCurrentVisitors(prev => prev.filter(visitor => visitor._id !== id));
      
      return updatedVisitor;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao registrar saída do visitante';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentVisitor]);

  // Exclui um visitante
  const deleteVisitor = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await visitorService.deleteVisitor(id);
      
      // Remove da lista de visitantes
      setVisitors(prev => prev.filter(visitor => visitor._id !== id));
      
      // Remove da lista de visitantes atuais
      setCurrentVisitors(prev => prev.filter(visitor => visitor._id !== id));
      
      // Limpa o visitante atual se for o mesmo
      if (currentVisitor && currentVisitor._id === id) {
        setCurrentVisitor(null);
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao excluir visitante';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentVisitor]);

  // Obtém a URL da foto do visitante
  const getVisitorPhotoUrl = useCallback((id: string) => {
    return visitorService.getVisitorPhotoUrl(id);
  }, []);

  // Converte um arquivo de imagem para Base64
  const convertImageToBase64 = useCallback(async (file: File): Promise<string> => {
    try {
      return await visitorService.fileToBase64(file);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao converter imagem para Base64';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Limpa o erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estados
    visitors,
    currentVisitors,
    currentVisitor,
    loading,
    error,
    
    // Funções
    fetchVisitors,
    fetchCurrentVisitors,
    fetchVisitorById,
    createVisitor,
    updateVisitor,
    updateVisitorPhoto,
    updateVisitorStatus,
    checkInVisitor,
    checkOutVisitor,
    deleteVisitor,
    getVisitorPhotoUrl,
    convertImageToBase64,
    clearError,
    
    // Utilitários
    setCurrentVisitor
  };
};

export default useVisitor;
import { useState, useCallback } from 'react';
import {
  Provider,
  ProviderCreate,
  ProviderUpdate,
  ProviderPhotoUpdate,
  ProviderFilter,
  ProviderStatus
} from '@/types/provider';
import providerService from '@/services/providerService';

// Hook personalizado para gerenciar fornecedores
export const useProvider = () => {
  // Estados
  const [providers, setProviders] = useState<Provider[]>([]);
  const [currentProviders, setCurrentProviders] = useState<Provider[]>([]);
  const [currentProvider, setCurrentProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Busca todos os fornecedores (com filtros opcionais)
  const fetchProviders = useCallback(async (filter?: ProviderFilter) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await providerService.getAllProviders(filter);
      setProviders(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar fornecedores';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca os fornecedores atuais (que estão no prédio)
  const fetchCurrentProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await providerService.getCurrentProviders();
      setCurrentProviders(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar fornecedores atuais';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca um fornecedor pelo ID
  const fetchProviderById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await providerService.getProviderById(id);
      setCurrentProvider(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar fornecedor';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cria um novo fornecedor
  const createProvider = useCallback(async (data: ProviderCreate) => {
    setLoading(true);
    setError(null);
    
    try {
      const newProvider = await providerService.createProvider(data);
      setProviders(prev => [...prev, newProvider]);
      return newProvider;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao criar fornecedor';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualiza um fornecedor
  const updateProvider = useCallback(async (id: string, data: ProviderUpdate) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedProvider = await providerService.updateProvider(id, data);
      
      // Atualiza o fornecedor atual se for o mesmo
      if (currentProvider && currentProvider._id === id) {
        setCurrentProvider(updatedProvider);
      }
      
      // Atualiza a lista de fornecedores
      setProviders(prev => 
        prev.map(provider => 
          provider._id === id ? updatedProvider : provider
        )
      );
      
      // Atualiza a lista de fornecedores atuais se necessário
      setCurrentProviders(prev => 
        prev.map(provider => 
          provider._id === id ? updatedProvider : provider
        )
      );
      
      return updatedProvider;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao atualizar fornecedor';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentProvider]);

  // Atualiza a foto de um fornecedor
  const updateProviderPhoto = useCallback(async (id: string, photoData: ProviderPhotoUpdate) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedProvider = await providerService.updateProviderPhoto(id, photoData);
      
      // Atualiza o fornecedor atual se for o mesmo
      if (currentProvider && currentProvider._id === id) {
        setCurrentProvider(updatedProvider);
      }
      
      // Atualiza a lista de fornecedores
      setProviders(prev => 
        prev.map(provider => 
          provider._id === id ? updatedProvider : provider
        )
      );
      
      // Atualiza a lista de fornecedores atuais se necessário
      setCurrentProviders(prev => 
        prev.map(provider => 
          provider._id === id ? updatedProvider : provider
        )
      );
      
      return updatedProvider;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao atualizar foto do fornecedor';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentProvider]);

  // Atualiza o status de um fornecedor
  const updateProviderStatus = useCallback(async (id: string, status: ProviderStatus) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedProvider = await providerService.updateProviderStatus(id, status);
      
      // Atualiza o fornecedor atual se for o mesmo
      if (currentProvider && currentProvider._id === id) {
        setCurrentProvider(updatedProvider);
      }
      
      // Atualiza a lista de fornecedores
      setProviders(prev => 
        prev.map(provider => 
          provider._id === id ? updatedProvider : provider
        )
      );
      
      // Atualiza a lista de fornecedores atuais
      // Se o status for diferente de CHECKED_IN, remove da lista de fornecedores atuais
      if (status !== ProviderStatus.CHECKED_IN) {
        setCurrentProviders(prev => prev.filter(provider => provider._id !== id));
      } else {
        setCurrentProviders(prev => {
          const exists = prev.some(provider => provider._id === id);
          if (exists) {
            return prev.map(provider => provider._id === id ? updatedProvider : provider);
          } else {
            return [...prev, updatedProvider];
          }
        });
      }
      
      return updatedProvider;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao atualizar status do fornecedor';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentProvider]);

  // Registra a entrada de um fornecedor
  const checkInProvider = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedProvider = await providerService.checkInProvider(id);
      
      // Atualiza o fornecedor atual se for o mesmo
      if (currentProvider && currentProvider._id === id) {
        setCurrentProvider(updatedProvider);
      }
      
      // Atualiza a lista de fornecedores
      setProviders(prev => 
        prev.map(provider => 
          provider._id === id ? updatedProvider : provider
        )
      );
      
      // Adiciona à lista de fornecedores atuais
      setCurrentProviders(prev => {
        const exists = prev.some(provider => provider._id === id);
        if (exists) {
          return prev.map(provider => provider._id === id ? updatedProvider : provider);
        } else {
          return [...prev, updatedProvider];
        }
      });
      
      return updatedProvider;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao registrar entrada do fornecedor';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentProvider]);

  // Registra a saída de um fornecedor
  const checkOutProvider = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedProvider = await providerService.checkOutProvider(id);
      
      // Atualiza o fornecedor atual se for o mesmo
      if (currentProvider && currentProvider._id === id) {
        setCurrentProvider(updatedProvider);
      }
      
      // Atualiza a lista de fornecedores
      setProviders(prev => 
        prev.map(provider => 
          provider._id === id ? updatedProvider : provider
        )
      );
      
      // Remove da lista de fornecedores atuais
      setCurrentProviders(prev => prev.filter(provider => provider._id !== id));
      
      return updatedProvider;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao registrar saída do fornecedor';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentProvider]);

  // Exclui um fornecedor
  const deleteProvider = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await providerService.deleteProvider(id);
      
      // Remove da lista de fornecedores
      setProviders(prev => prev.filter(provider => provider._id !== id));
      
      // Remove da lista de fornecedores atuais
      setCurrentProviders(prev => prev.filter(provider => provider._id !== id));
      
      // Limpa o fornecedor atual se for o mesmo
      if (currentProvider && currentProvider._id === id) {
        setCurrentProvider(null);
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao excluir fornecedor';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentProvider]);

  // Obtém a URL da foto do fornecedor
  const getProviderPhotoUrl = useCallback((id: string) => {
    return providerService.getProviderPhotoUrl(id);
  }, []);

  // Converte um arquivo de imagem para Base64
  const convertImageToBase64 = useCallback(async (file: File): Promise<string> => {
    try {
      return await providerService.fileToBase64(file);
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
    providers,
    currentProviders,
    currentProvider,
    loading,
    error,
    
    // Funções
    fetchProviders,
    fetchCurrentProviders,
    fetchProviderById,
    createProvider,
    updateProvider,
    updateProviderPhoto,
    updateProviderStatus,
    checkInProvider,
    checkOutProvider,
    deleteProvider,
    getProviderPhotoUrl,
    convertImageToBase64,
    clearError,
    
    // Utilitários
    setCurrentProvider
  };
};

export default useProvider;
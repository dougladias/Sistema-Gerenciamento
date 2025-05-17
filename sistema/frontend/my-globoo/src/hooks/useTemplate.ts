import { useState, useCallback } from 'react';
import { Template, TemplateCreate, TemplateUpdate, TemplateFilter } from '@/types/template';
import templateService from '@/services/templateService';

// Hook personalizado para gerenciar templates
export const useTemplate = () => {
  // Estados
  const [templates, setTemplates] = useState<Template[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Busca todos os templates
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Limpa o template atual
    try {
      const data = await templateService.getAllTemplates();
      setTemplates(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar templates';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca um template por ID
  const fetchTemplateById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    // Limpa o template atual
    try {
      const data = await templateService.getTemplateById(id);
      setCurrentTemplate(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar template';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca templates por tipo
  const fetchTemplatesByType = useCallback(async (type: string) => {
    setLoading(true);
    setError(null);
    
    // Limpa o template atual
    try {
      const data = await templateService.getTemplatesByType(type);
      setTemplates(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar templates por tipo';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Cria um novo template
  const createTemplate = useCallback(async (data: TemplateCreate) => {
    setLoading(true);
    setError(null);
    
    // Limpa o template atual
    try {
      const newTemplate = await templateService.createTemplate(data);
      setTemplates(prev => [...prev, newTemplate]);
      return newTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao criar template';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualiza um template existente
  const updateTemplate = useCallback(async (id: string, data: TemplateUpdate) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedTemplate = await templateService.updateTemplate(id, data);
      
      // Atualiza o template atual se for o mesmo
      if (currentTemplate && currentTemplate._id === id) {
        setCurrentTemplate(updatedTemplate);
      }
      
      // Atualiza a lista de templates
      setTemplates(prev => 
        prev.map(template => 
          template._id === id ? updatedTemplate : template
        )
      );
      
      // Retorna o template atualizado
      return updatedTemplate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao atualizar template';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentTemplate]);

  // Exclui um template
  const deleteTemplate = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    // Limpa o template atual
    try {
      await templateService.deleteTemplate(id);
      
      // Remove o template da lista
      setTemplates(prev => prev.filter(template => template._id !== id));
      
      // Limpa o template atual se for o mesmo
      if (currentTemplate && currentTemplate._id === id) {
        setCurrentTemplate(null);
      }
      
      // Retorna true para indicar sucesso
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao excluir template';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [currentTemplate]);

  // Upload de arquivo de template
  const uploadTemplate = useCallback(async (data: TemplateCreate) => {
    setLoading(true);
    setError(null);
    
    // Limpa o template atual
    try {
      const template = await templateService.uploadTemplate(data);
      setTemplates(prev => [...prev, template]);
      return template;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao fazer upload do template';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Download de arquivo de template
  const downloadTemplate = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    // Limpa o template atual
    try {
      const blob = await templateService.downloadTemplate(id);
      return blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao fazer download do template';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtra templates
  const filterTemplates = useCallback(async (filter: TemplateFilter) => {
    setLoading(true);
    setError(null);
    
    // Limpa o template atual
    try {
      const filteredTemplates = await templateService.filterTemplates(filter);
      setTemplates(filteredTemplates);
      return filteredTemplates;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao filtrar templates';
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
    templates,
    currentTemplate,
    loading,
    error,
    
    // Funções
    fetchTemplates,
    fetchTemplateById,
    fetchTemplatesByType,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    uploadTemplate,
    downloadTemplate,
    filterTemplates,
    clearError,
    
    // Utilitários
    setCurrentTemplate
  };
};

export default useTemplate;
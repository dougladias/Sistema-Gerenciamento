"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTemplate } from '@/hooks/useTemplate';
import { DocumentType } from '@/types/template';
import { motion, AnimatePresence } from "framer-motion";
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function TemplatesPage() {
  // Estados do formulário
  const [name, setName] = useState('');
  const [type, setType] = useState(DocumentType.OTHER);
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para edição/visualização
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Hook de templates
  const {
    templates,
    currentTemplate,
    loading,
    error,
    fetchTemplates,
    fetchTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    downloadTemplate,
    clearError
  } = useTemplate();

  // Carrega os templates na inicialização
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Redefine o formulário
  const resetForm = () => {
    setName('');
    setType(DocumentType.OTHER);
    setDescription('');
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setSelectedTemplateId(null);
    setIsEditing(false);
  };

  // Manipula seleção de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Manipula envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file && !isEditing) {
      alert('Selecione um arquivo');
      return;
    }
    
    try {
      // Preparar dados do template
      let fileData = '';
      let fileName = '';
      let fileSize = 0;
      let mimeType = '';
      
      if (file) {
        // Converter arquivo para Base64
        fileData = await convertFileToBase64(file);
        fileName = file.name;
        fileSize = file.size;
        mimeType = file.type;
      }
      
      if (isEditing && selectedTemplateId) {
        // Atualizar template existente
        const updateData = {
          name,
          type,
          description,
          ...(file ? { 
            fileData, 
            fileName, 
            fileSize, 
            mimeType, 
            format: fileName.split('.').pop() || '' 
          } : {})
        };
        
        await updateTemplate(selectedTemplateId, updateData);
        setSuccessMessage('Template atualizado com sucesso!');
      } else {
        // Criar novo template
        await createTemplate({
          name,
          type,
          description,
          createdBy: 'Usuario Atual',
          format: fileName.split('.').pop() || '',
          fileData,
          fileName,
          fileSize,
          mimeType
        });
        setSuccessMessage('Template criado com sucesso!');
      }
      
      // Recarregar lista e limpar formulário
      await fetchTemplates();
      resetForm();
      
      // Limpar mensagem após alguns segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Erro ao salvar template:', err);
    }
  };

  // Converter arquivo para Base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remover a parte inicial ("data:application/pdf;base64,")
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject('Erro ao converter arquivo');
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  // Manipula visualização de template
  const handleView = async (id: string) => {
    const template = await fetchTemplateById(id);
    if (template) {
      setSelectedTemplateId(id);
      setIsEditing(false);
      
      // Preencher o formulário com os dados do template
      setName(template.name);
      setType(template.type as DocumentType);
      setDescription(template.description);
    }
  };

  // Manipula edição de template
  const handleEdit = async (id: string) => {
    const template = await fetchTemplateById(id);
    if (template) {
      setSelectedTemplateId(id);
      setIsEditing(true);
      
      // Preencher o formulário com os dados do template
      setName(template.name);
      setType(template.type as DocumentType);
      setDescription(template.description);
    }
  };

  // Manipula exclusão de template
  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este template?')) {
      await deleteTemplate(id);
      setSuccessMessage('Template excluído com sucesso!');
      await fetchTemplates();
      
      if (selectedTemplateId === id) {
        resetForm();
      }
      
      // Limpar mensagem após alguns segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }
  };

  // Manipula download de template
  const handleDownload = async (id: string) => {
    try {
      const blob = await downloadTemplate(id);
      if (blob) {
        // Encontrar o template para obter o nome do arquivo
        const template = templates.find(t => t._id === id);
        if (!template) return;
        
        // Criar um link de download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = template.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      }
    } catch (err) {
      console.error('Erro ao baixar arquivo:', err);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1 
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 260, damping: 20 }
    }
  };

  return (
    <motion.div 
      className="p-6 ml-[var(--sidebar-width,4.5rem)] transition-all duration-300 bg-gray-50 dark:bg-gray-900 min-h-screen"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ width: "calc(100% - var(--sidebar-width, 4.5rem))" }}
    >
      {/* Page header */}
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gerenciamento de Templates</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Crie, visualize e gerencie templates de documentos</p>
      </motion.div>

      {/* Mensagens de sucesso e erro */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <Alert
              type="success"
              message={successMessage}
              onClose={() => setSuccessMessage('')}
            />
          </motion.div>
        )}
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <Alert
              type="error"
              message={error}
              onClose={clearError}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Lista de Templates */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Templates Disponíveis
              </h3>
              <motion.button 
                onClick={resetForm}
                className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 px-3 flex items-center py-2 rounded-lg text-sm gap-2 text-white shadow-sm transition-colors"
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.95 }}
              >
                <span>Novo Template</span>
                <PlusIcon className="h-5 w-5" />
              </motion.button>
            </div>
            
            {loading && templates.length === 0 ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 dark:border-cyan-400"></div>
              </div>
            ) : templates.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <p>Nenhum template disponível.</p>
                <Button
                  variant="primary"
                  className="mt-4 bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
                  onClick={resetForm}
                >
                  Adicionar Template
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Formato
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {templates.map((template) => (
                      <tr key={template._id} className={`${selectedTemplateId === template._id ? 'bg-blue-50 dark:bg-blue-900/20' : ''} hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{template.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">{template.type}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">{template.format.toUpperCase()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex justify-center space-x-3">
                            <motion.button
                              onClick={() => handleView(template._id!)}
                              className="text-cyan-600 hover:text-cyan-900 dark:text-cyan-400 dark:hover:text-cyan-300"
                              title="Visualizar"
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <EyeIcon className="h-5 w-5" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleEdit(template._id!)}
                              className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                              title="Editar"
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <PencilIcon className="h-5 w-5" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDownload(template._id!)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Baixar"
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <ArrowDownTrayIcon className="h-5 w-5" />
                            </motion.button>
                            <motion.button
                              onClick={() => handleDelete(template._id!)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                              title="Excluir"
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <TrashIcon className="h-5 w-5" />
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        
        {/* Formulário */}
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              {isEditing ? 'Editar Template' : selectedTemplateId ? 'Visualizar Template' : 'Novo Template'}
            </h3>
            {(isEditing || selectedTemplateId) && (
              <motion.button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <XMarkIcon className="h-6 w-6" />
              </motion.button>
            )}
          </div>
          
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nome <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
                  required
                  disabled={!!selectedTemplateId && !isEditing}
                />
              </div>
              
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tipo <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value as DocumentType)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
                  required
                  disabled={!!selectedTemplateId && !isEditing}
                >
                  {Object.values(DocumentType).map((docType) => (
                    <option key={docType} value={docType}>
                      {docType}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Descrição
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
                  disabled={!!(selectedTemplateId && !isEditing)}
                />
              </div>
              
              {(!selectedTemplateId || isEditing) && (
                <div>
                  <label htmlFor="file" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Arquivo {isEditing && '(deixe em branco para manter o atual)'}
                  </label>
                  <input
                    type="file"
                    id="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400
                      file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold 
                      file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100
                      dark:file:bg-cyan-900/30 dark:file:text-cyan-300 dark:hover:file:bg-cyan-800/40"
                    required={!isEditing}
                  />
                </div>
              )}
              
              {selectedTemplateId && currentTemplate && !isEditing ? (
                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => handleEdit(selectedTemplateId)}
                    className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
                  >
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleDownload(selectedTemplateId)}
                    className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white"
                  >
                    Baixar
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => handleDelete(selectedTemplateId)}
                    className="bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700"
                  >
                    Excluir
                  </Button>
                </div>
              ) : (
                <div className="flex justify-end space-x-3 pt-4">
                  {isEditing && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={resetForm}
                      className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={loading}
                    className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
                  >
                    {isEditing ? 'Atualizar' : 'Salvar'}
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
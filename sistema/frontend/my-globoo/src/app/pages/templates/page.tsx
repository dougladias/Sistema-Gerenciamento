"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useTemplate } from '@/hooks/useTemplate';
import { DocumentType } from '@/types/template';

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Gerenciamento de Templates</h1>
        
        {/* Mensagens de sucesso e erro */}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 relative">
            <span className="block sm:inline">{successMessage}</span>
            <button 
              onClick={() => setSuccessMessage('')}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              &times;
            </button>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
            <span className="block sm:inline">{error}</span>
            <button 
              onClick={clearError}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              &times;
            </button>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Lista de Templates */}
          <div className="md:col-span-2">
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Templates Disponíveis
                </h3>
              </div>
              
              {loading && templates.length === 0 ? (
                <div className="flex justify-center items-center p-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : templates.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <p>Nenhum template disponível.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Formato
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {templates.map((template) => (
                        <tr key={template._id} className={selectedTemplateId === template._id ? 'bg-blue-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{template.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{template.type}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{template.format.toUpperCase()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <button
                              onClick={() => handleView(template._id!)}
                              className="text-blue-600 hover:text-blue-900 mx-1"
                            >
                              Ver
                            </button>
                            <button
                              onClick={() => handleEdit(template._id!)}
                              className="text-indigo-600 hover:text-indigo-900 mx-1"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDownload(template._id!)}
                              className="text-green-600 hover:text-green-900 mx-1"
                            >
                              Baixar
                            </button>
                            <button
                              onClick={() => handleDelete(template._id!)}
                              className="text-red-600 hover:text-red-900 mx-1"
                            >
                              Excluir
                            </button>
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
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {isEditing ? 'Editar Template' : selectedTemplateId ? 'Visualizar Template' : 'Novo Template'}
              </h3>
              {(isEditing || selectedTemplateId) && (
                <button
                  onClick={resetForm}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Novo
                </button>
              )}
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Nome
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      required
                      disabled={!!selectedTemplateId && !isEditing}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                      Tipo
                    </label>
                    <select
                      id="type"
                      value={type}
                      onChange={(e) => setType(e.target.value as DocumentType)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Descrição
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      disabled={!!(selectedTemplateId && !isEditing)}
                    />
                  </div>
                  
                  {(!selectedTemplateId || isEditing) && (
                    <div>
                      <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                        Arquivo {isEditing && '(deixe em branco para manter o atual)'}
                      </label>
                      <input
                        type="file"
                        id="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        required={!isEditing}
                      />
                    </div>
                  )}
                  
                  {selectedTemplateId && currentTemplate && !isEditing ? (
                    <div className="flex space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => handleEdit(selectedTemplateId)}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownload(selectedTemplateId)}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Baixar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(selectedTemplateId)}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Excluir
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end space-x-3 pt-4">
                      {isEditing && (
                        <button
                          type="button"
                          onClick={resetForm}
                          className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Cancelar
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                      >
                        {loading ? 'Salvando...' : isEditing ? 'Atualizar' : 'Salvar'}
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
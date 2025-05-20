"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import apiService from '@/services/api';
import { Worker, WorkerFile } from '@/types/worker';

const DocumentsPage: React.FC = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
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

  // Estados
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [workerFiles, setWorkerFiles] = useState<WorkerFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  
  // Estados para upload de documento
  const [uploadFormData, setUploadFormData] = useState({
    description: '',
    category: 'OUTROS',
  });
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  
  // Estados para edição de documento
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    description: '',
    category: 'OUTROS',
  });

  // Função para buscar todos os funcionários
  const fetchWorkers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.get<Worker[]>('/workers');
      setWorkers(response);
    } catch (error) {
      console.error("Erro ao buscar funcionários:", error);
      setMessage({ text: 'Erro ao buscar funcionários', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para buscar documentos de um funcionário
  const fetchWorkerFiles = useCallback(async (workerId: string) => {
    if (!workerId) return;
    
    setLoading(true);
    try {
      const worker = await apiService.get<Worker>(`/workers/${workerId}`);
      setWorkerFiles(worker.files || []);
    } catch (error) {
      console.error("Erro ao buscar documentos:", error);
      setMessage({ text: 'Erro ao buscar documentos', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Efeito para carregar funcionários quando a página é carregada
  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  // Efeito para carregar documentos quando um funcionário é selecionado
  useEffect(() => {
    if (selectedWorkerId) {
      fetchWorkerFiles(selectedWorkerId);
    } else {
      setWorkerFiles([]);
    }
  }, [selectedWorkerId, fetchWorkerFiles]);

  // Manipulador para seleção de funcionário
  const handleWorkerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWorkerId(e.target.value);
    // Limpa as mensagens ao trocar de funcionário
    setMessage({ text: '', type: '' });
    // Limpa o modo de edição
    setEditingFileId(null);
  };

  // Manipulador para seleção de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target?.result as string;
        const base64Content = base64Data.split(',')[1]; // Remove o prefixo "data:mime/type;base64,"
        setFileBase64(base64Content);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // Manipulador para alterações nos campos do formulário de upload
  const handleUploadFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUploadFormData({
      ...uploadFormData,
      [name]: value,
    });
  };

  // Manipulador para alterações nos campos do formulário de edição
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value,
    });
  };
    

  // Função para salvar alterações em um documento
  const saveDocumentEdit = async () => {
    if (!editingFileId || !selectedWorkerId) return;

    setLoading(true);
    try {
      // Buscamos o arquivo atual para garantir que temos informações completas
      const currentFile = workerFiles.find(file => String(file._id) === editingFileId);
      if (!currentFile) {
        throw new Error('Documento não encontrado');
      }
      
      // Enviamos apenas os campos que queremos atualizar
      const updates = {
        description: editFormData.description,
        category: editFormData.category,
      };

      console.log("Enviando atualizações:", updates);
      const response = await apiService.put(`/workers/${selectedWorkerId}/files/${editingFileId}`, updates);
      console.log("Resposta da atualização:", response);
      
      // Importante: Ao invés de fazer nova requisição, atualizamos o estado local
      // mantendo o conteúdo do arquivo intacto
      setWorkerFiles(prevFiles => 
        prevFiles.map(file => 
          String(file._id) === editingFileId 
            ? { ...file, description: editFormData.description, category: editFormData.category }
            : file
        )
      );
      
      // Limpa o modo de edição
      setEditingFileId(null);
      setMessage({ text: 'Documento atualizado com sucesso!', type: 'success' });
    } catch (error) {
      console.error("Erro ao atualizar documento:", error);
      setMessage({ text: 'Erro ao atualizar documento', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Função para upload de documento
  const uploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedWorkerId) {
      setMessage({ text: 'Selecione um funcionário', type: 'error' });
      return;
    }

    if (!file || !fileBase64) {
      setMessage({ text: 'Selecione um arquivo', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const documentData = {
        filename: `${Date.now()}-${file.name}`,
        originalName: file.name,
        mimetype: file.type,
        size: file.size,
        content: fileBase64,  
        description: uploadFormData.description,
        category: uploadFormData.category,
      };

      await apiService.post(`/workers/${selectedWorkerId}/files`, documentData);
      
      // Limpa o formulário
      setUploadFormData({
        description: '',
        category: 'OUTROS',
      });
      setFile(null);
      setFileBase64(null);
      
      // Limpa o input de arquivo
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Atualiza a lista de documentos
      fetchWorkerFiles(selectedWorkerId);
      
      setMessage({ text: 'Documento enviado com sucesso!', type: 'success' });
    } catch (error) {
      console.error("Erro ao enviar documento:", error);
      setMessage({ text: 'Erro ao enviar documento', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Função para excluir documento
  const deleteDocument = async (fileId: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;
    
    if (!selectedWorkerId) return;
    
    setLoading(true);
    try {
      await apiService.delete(`/workers/${selectedWorkerId}/files/${fileId}`);
      
      // Atualiza a lista de documentos
      fetchWorkerFiles(selectedWorkerId);
      
      setMessage({ text: 'Documento excluído com sucesso!', type: 'success' });
    } catch (error) {
      console.error("Erro ao excluir documento:", error);
      setMessage({ text: 'Erro ao excluir documento', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Função para download de documento
  const downloadDocument = async (file: WorkerFile) => {
    try {
      console.log("Tentando baixar arquivo:", file.originalName);
      
      // Sempre tente primeiro buscar do servidor
      try {
        console.log(`Solicitando download: /workers/${selectedWorkerId}/files/${file._id}/download`);
        
        const response = await apiService.get<Blob>(
          `/workers/${selectedWorkerId}/files/${file._id}/download`, 
          {}, 
          true
        );
        
        console.log("Download bem-sucedido, tamanho:", response.size);
        const url = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.originalName;
        a.click();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error("Erro no download, buscando documento novamente:", error);
        
        // Se falhar, exibir mensagem e sugerir ação
        setMessage({ 
          text: 'Não foi possível fazer o download do documento. Tente baixar novamente após recarregar a página.', 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error("Erro ao processar download:", error);
      setMessage({ text: 'Erro ao baixar documento', type: 'error' });
    }
  };

  // Função para formatar o tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Função para formatar a data
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div 
      className="p-6 ml-[var(--sidebar-width,4.5rem)] transition-all duration-300 bg-gray-50 dark:bg-gray-900 min-h-screen"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ width: "calc(100% - var(--sidebar-width, 4.5rem))" }}
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Gerenciamento de Documentos</h1>
      </motion.div>

      {/* Seleção de funcionário */}
      <motion.div className="mb-6" variants={itemVariants}>
        <label className="block mb-2 font-medium text-gray-800 dark:text-gray-200">Funcionário:</label>
        <select
          className="w-full border rounded p-2 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          value={selectedWorkerId}
          onChange={handleWorkerSelect}
        >
          <option value="">Selecione um funcionário</option>
          {workers.map((worker) => (
            <option key={String(worker._id)} value={String(worker._id)}>
              {worker.name}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Mensagem de sucesso/erro */}
      {message.text && (
        <motion.div
          className={`mb-4 p-3 rounded ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {message.text}
        </motion.div>
      )}

      {selectedWorkerId && (
        <>
          {/* Formulário de upload */}
          <motion.div 
            className="mb-8 bg-white dark:bg-gray-800 p-4 rounded-md shadow border dark:border-gray-700"
            variants={itemVariants}
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Upload de Documento</h2>
            <form onSubmit={uploadDocument}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 font-medium text-gray-800 dark:text-gray-200">Arquivo:</label>
                  <input
                    id="file-input"
                    type="file"
                    className="w-full border rounded p-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    onChange={handleFileChange}
                    required
                  />
                  {file && (
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      {file.name} ({formatFileSize(file.size)})
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block mb-1 font-medium text-gray-800 dark:text-gray-200">Categoria:</label>
                  <select
                    name="category"
                    className="w-full border rounded p-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    value={uploadFormData.category}
                    onChange={handleUploadFormChange}
                  >
                    <option value="OUTROS">Outros</option>
                    <option value="CONTRATO">Contrato</option>
                    <option value="FOLHA_PAGAMENTO">Folha de Pagamento</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block mb-1 font-medium text-gray-800 dark:text-gray-200">Descrição:</label>
                  <textarea
                    name="description"
                    className="w-full border rounded p-2 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                    rows={2}
                    value={uploadFormData.description}
                    onChange={handleUploadFormChange}
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <motion.button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded dark:bg-cyan-600 dark:hover:bg-cyan-700"
                  disabled={loading}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {loading ? 'Enviando...' : 'Enviar Documento'}
                </motion.button>
              </div>
            </form>
          </motion.div>

          {/* Lista de documentos */}
          <motion.div 
            className="bg-white dark:bg-gray-800 p-4 rounded-md shadow border dark:border-gray-700"
            variants={itemVariants}
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Documentos do Funcionário</h2>
            
            {loading && (
              <motion.div 
                className="flex justify-center items-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div 
                  className="h-10 w-10 border-t-2 border-b-2 border-blue-500 dark:border-cyan-400 rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            )}
            
            {!loading && workerFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Nenhum documento encontrado para este funcionário.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border dark:border-gray-700">
                  <thead className="bg-gray-100 dark:bg-gray-900">
                    <tr>
                      <th className="border px-4 py-2 text-left dark:border-gray-700 dark:text-gray-200">Nome</th>
                      <th className="border px-4 py-2 text-left dark:border-gray-700 dark:text-gray-200">Descrição</th>
                      <th className="border px-4 py-2 text-left dark:border-gray-700 dark:text-gray-200">Categoria</th>
                      <th className="border px-4 py-2 text-left dark:border-gray-700 dark:text-gray-200">Tamanho</th>
                      <th className="border px-4 py-2 text-left dark:border-gray-700 dark:text-gray-200">Data de Upload</th>
                      <th className="border px-4 py-2 text-center dark:border-gray-700 dark:text-gray-200">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workerFiles.map((file, index) => (
                      <motion.tr 
                        key={String(file._id)} 
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-100">{file.originalName}</td>
                        <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-100">
                          {editingFileId === String(file._id) ? (
                            <textarea
                              name="description"
                              className="w-full border rounded p-1 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                              value={editFormData.description}
                              onChange={handleEditFormChange}
                            />
                          ) : (
                            file.description || "-"
                          )}
                        </td>
                        <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-100">
                          {editingFileId === String(file._id) ? (
                            <select
                              name="category"
                              className="w-full border rounded p-1 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                              value={editFormData.category}
                              onChange={handleEditFormChange}
                            >
                              <option value="OUTROS">Outros</option>
                              <option value="CONTRATO">Contrato</option>
                              <option value="FOLHA_PAGAMENTO">Folha de Pagamento</option>
                            </select>
                          ) : (
                            file.category === "CONTRATO"
                              ? "Contrato"
                              : file.category === "FOLHA_PAGAMENTO"
                              ? "Folha de Pagamento"
                              : "Outros"
                          )}
                        </td>
                        <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-100">{formatFileSize(file.size)}</td>
                        <td className="border px-4 py-2 dark:border-gray-700 dark:text-gray-100">{formatDate(file.uploadDate)}</td>
                        <td className="border px-4 py-2 text-center dark:border-gray-700">
                          {editingFileId === String(file._id) ? (
                            <div className="flex justify-center space-x-2">
                              <motion.button
                                onClick={saveDocumentEdit}
                                className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded dark:bg-green-700 dark:hover:bg-green-800"
                                title="Salvar"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Salvar
                              </motion.button>                             
                            </div>
                          ) : (
                            <div className="flex justify-center space-x-2">
                              <motion.button
                                onClick={() => downloadDocument(file)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded dark:bg-cyan-600 dark:hover:bg-cyan-700"
                                title="Download"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Download
                              </motion.button>                              
                              <motion.button
                                onClick={() => deleteDocument(String(file._id))}
                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded dark:bg-red-700 dark:hover:bg-red-800"
                                title="Excluir"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Excluir
                              </motion.button>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </>
      )}

      {!selectedWorkerId && (
        <motion.div 
          className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-100 dark:border-yellow-700 p-8 rounded-md text-center"
          variants={itemVariants}
        >
          <p className="text-yellow-700 dark:text-yellow-300 text-lg">
            Selecione um funcionário para gerenciar seus documentos.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default DocumentsPage;
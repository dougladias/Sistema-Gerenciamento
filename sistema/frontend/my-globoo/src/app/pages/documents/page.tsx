"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useWorker } from '@/hooks/useWorkers';
import type { WorkerFile } from '@/types/worker';

const DocumentsPage: React.FC = () => {
  // Hooks
  const { 
    workers, 
    fetchWorkers, 
    addFile, 
    updateFile, 
    removeFile, 
    getWorkerFiles 
  } = useWorker();

  // Estados
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'OUTROS',
    workerId: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [workerFiles, setWorkerFiles] = useState<WorkerFile[]>([]);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  // Carregar trabalhadores ao iniciar
  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  // Função para carregar arquivos de um funcionário
  const loadWorkerFiles = useCallback(async (workerId: string) => {
    try {
      const files = await getWorkerFiles(workerId);
      setWorkerFiles(files);
    } catch (error) {
      console.error("Erro ao carregar arquivos:", error);
      setMessage({ text: 'Erro ao carregar arquivos', type: 'error' });
    }
  }, [getWorkerFiles]);

  // Carregar arquivos quando o funcionário selecionado mudar
  useEffect(() => {
    if (selectedWorkerId) {
      loadWorkerFiles(selectedWorkerId);
    }
  }, [selectedWorkerId, loadWorkerFiles]);

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

  // Manipulador para envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!file || !fileBase64) {
      setMessage({ text: 'Por favor, selecione um arquivo', type: 'error' });
      return;
    }

    if (!formData.workerId) {
      setMessage({ text: 'Por favor, selecione um funcionário', type: 'error' });
      return;
    }

    try {
      setLoading(true);

      const uploadData = {
        filename: `${Date.now()}-${file.name}`,
        originalName: file.name,
        mimetype: file.type,
        size: file.size,
        fileContent: fileBase64,
        description: formData.description,
        category: formData.category,
      };

      await addFile(formData.workerId, uploadData);

      setMessage({ text: 'Documento enviado com sucesso!', type: 'success' });
      loadWorkerFiles(formData.workerId);

      // Limpa o formulário
      setFormData({ ...formData, title: '', description: '' });
      setFile(null);
      setFileBase64(null);
    } catch (error) {
      console.error("Erro ao enviar documento:", error);
      setMessage({ text: 'Erro ao enviar documento', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Manipulador para exclusão de arquivo
  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Tem certeza que deseja excluir este documento?')) return;

    try {
      setLoading(true);
      await removeFile(selectedWorkerId, fileId);
      setMessage({ text: 'Documento removido com sucesso!', type: 'success' });
      loadWorkerFiles(selectedWorkerId);
    } catch (error) {
      console.error("Erro ao excluir documento:", error);
      setMessage({ text: 'Erro ao excluir documento', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Manipulador para download do arquivo
  const handleDownloadFile = async (file: WorkerFile) => {
    try {
      const blob = new Blob([atob(file.fileContent || '')], { type: file.mimetype });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao baixar arquivo:", error);
      setMessage({ text: 'Erro ao baixar documento', type: 'error' });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gerenciamento de Documentos</h1>

      {/* Formulário de Upload */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label className="block mb-1 font-medium">Funcionário:</label>
          <select
            className="w-full border rounded p-2"
            value={formData.workerId}
            onChange={(e) => setFormData({ ...formData, workerId: e.target.value })}
            required
          >
            <option value="">Selecione um funcionário</option>
            {workers.map((worker) => (
              <option key={worker._id} value={worker._id as string}>
                {worker.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Descrição:</label>
          <textarea
            className="w-full border rounded p-2"
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Categoria:</label>
          <select
            className="w-full border rounded p-2"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          >
            <option value="OUTROS">Outros</option>
            <option value="CONTRATO">Contrato</option>
            <option value="FOLHA_PAGAMENTO">Folha de Pagamento</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-medium">Arquivo:</label>
          <input type="file" className="w-full border rounded p-2" onChange={handleFileChange} required />
        </div>

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          disabled={loading}
        >
          {loading ? 'Enviando...' : 'Enviar Documento'}
        </button>
      </form>

      {/* Lista de Documentos */}
      {selectedWorkerId && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Documentos do Funcionário</h2>
          {workerFiles.length === 0 ? (
            <p>Nenhum documento encontrado.</p>
          ) : (
            <table className="min-w-full border">
              <thead>
                <tr>
                  <th className="border px-4 py-2">Nome</th>
                  <th className="border px-4 py-2">Descrição</th>
                  <th className="border px-4 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {workerFiles.map((file) => (
                  <tr key={String(file._id)}>
                    <td className="border px-4 py-2">{file.originalName}</td>
                    <td className="border px-4 py-2">{file.description}</td>
                    <td className="border px-4 py-2">
                      <button
                        onClick={() => handleDownloadFile(file)}
                        className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded mr-2"
                      >
                        Baixar
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file._id as string)}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;
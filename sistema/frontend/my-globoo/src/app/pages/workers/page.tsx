"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useWorker } from '@/hooks/useWorkers';
import { Worker } from '@/types/worker';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Modal from '@/components/ui/Modal';
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function WorkersPage() {
  // Estados para controle da interface
  const [activeSection, setActiveSection] = useState<'list' | 'form' | 'details'>('list');
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Hook personalizado para gerenciar os funcionários
  const {
    workers,
    currentWorker,
    loading,
    error,
    fetchWorkers,
    fetchWorkerById,
    createWorker,
    updateWorker,
    deleteWorker,    
    clearError
  } = useWorker();

  // Formulário
  interface FormData {
    name: string;
    cpf: string;
    nascimento: string;
    admissao: string;
    salario: string;
    ajuda: string;
    numero: string;
    email: string;
    address: string;
    contract: 'CLT' | 'PJ';
    role: string;
    department: string;
    status: 'active' | 'inactive' | 'other';
    _id?: string; 
  }

  const [formData, setFormData] = useState<FormData>({
    name: '',
    cpf: '',
    nascimento: '',
    admissao: '',
    salario: '',
    ajuda: '',
    numero: '',
    email: '',
    address: '',
    contract: 'CLT',
    role: '',
    department: 'Geral',
    status: 'active'
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Filtrar funcionários com base no termo de pesquisa
  const filteredWorkers = useMemo(() => {
    if (!searchTerm.trim()) return workers;
    
    const searchLower = searchTerm.toLowerCase();
    return workers.filter((worker: Worker) => 
      worker.name?.toLowerCase().includes(searchLower) || 
      worker.cpf?.includes(searchTerm) || 
      worker.role?.toLowerCase().includes(searchLower) || 
      worker.department?.toLowerCase().includes(searchLower)
    );
  }, [workers, searchTerm]);

  // Carrega os funcionários ao iniciar
  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  // Resetar o formulário
  const resetForm = () => {
    setFormData({
      name: '',
      cpf: '',
      nascimento: '',
      admissao: '',
      salario: '',
      ajuda: '',
      numero: '',
      email: '',
      address: '',
      contract: 'CLT',
      role: '',
      department: 'Geral',
      status: 'active'
    });
    setFormErrors({});
  };

  // Manipuladores de ação
  const handleNewWorker = () => {
    resetForm();
    setFormMode('create');
    setActiveSection('form');
  };

  const handleViewWorker = async (id: string) => {
    await fetchWorkerById(id);
    setActiveSection('details');
  };

  const handleEditWorker = async (id: string) => {
    const worker = await fetchWorkerById(id);
    if (worker) {
      // Formatação das datas para o formato do input
      const formattedData = {
        ...worker,
        nascimento: formatDateForInput(worker.nascimento),
        admissao: formatDateForInput(worker.admissao),
        ajuda: worker.ajuda || '' // Ensure ajuda is always a string
      };
      setFormData({
        ...formattedData,
        status: formattedData.status || 'active', // Ensure status has a valid default value
      });
      setFormMode('edit');
      setActiveSection('form');
    }
  };

  const handleDeleteConfirm = async () => {
    if (currentWorker?._id) {
      try {
        // Armazena o nome do funcionário antes de excluir (para mensagem)
        const workerName = currentWorker.name;
        
        // Aguarda a conclusão da operação de exclusão
        await deleteWorker(currentWorker._id);
        
        // Só fecha o modal depois que a exclusão for bem-sucedida
        setIsDeleteModalOpen(false);
        setActiveSection('list');
        setSuccessMessage(`Funcionário ${workerName} excluído com sucesso!`);
        
        // Limpa a mensagem após alguns segundos
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } catch (err) {
        // Se ocorrer um erro, mantém o modal aberto e mostra o erro
        console.error('Erro ao excluir funcionário:', err);
        // O erro já deve ser tratado pelo hook useWorker
      }
    }
  };

  // Manipuladores de formulário
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: typeof formData) => ({
      ...prev,
      [name]: value
    }));
    
    // Limpa erros específicos do campo
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Validação básica
    if (!formData.name?.trim()) {
      errors.name = 'Nome é obrigatório';
    }
    
    if (!formData.cpf?.trim()) {
      errors.cpf = 'CPF é obrigatório';
    } else if (!/^\d{11}$/.test(formData.cpf)) {
      errors.cpf = 'CPF deve conter 11 dígitos numéricos';
    }
    
    if (!formData.email?.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }
    
    // Adicione outras validações conforme necessário
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      if (formMode === 'create') {
        await createWorker(formData);
        setSuccessMessage('Funcionário criado com sucesso!');
      } else {
        if (formData._id) {
          await updateWorker(formData._id, formData);
        } else {
          console.error('Error: formData._id is undefined');
        }
        setSuccessMessage('Funcionário atualizado com sucesso!');
      }
      
      // Volta para a lista após a operação bem-sucedida
      setActiveSection('list');
      
      // Limpa a mensagem após alguns segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      // O erro já é tratado pelo hook useWorker
      console.error('Erro ao salvar:', err);
    }
  };

  // Funções utilitárias
  const formatCPF = (cpf: string): string => {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return cpf;
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'active': 'Ativo',
      'inactive': 'Inativo',
      'other': 'Outro'
    };
    return statusMap[status] || status;
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('pt-BR');
  };

  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toISOString().split('T')[0];
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

  // Renderização condicional das seções
  const renderContent = () => {
    if (loading && workers.length === 0) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 dark:border-cyan-400"></div>
        </div>
      );
    }

    switch (activeSection) {
      case 'list':
        return renderWorkersList();
      case 'form':
        return renderWorkerForm();
      case 'details':
        return renderWorkerDetails();
      default:
        return renderWorkersList();
    }
  };

  // Seção: Lista de Funcionários
  const renderWorkersList = () => {
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b dark:border-gray-700 gap-3">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Lista de Funcionários</h2>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative flex-grow sm:flex-grow-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 relative right-10" />
              </div>
              <input
                type="text"
                className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-600 focus:border-cyan-500 dark:focus:border-cyan-600 transition-colors"
                placeholder="Buscar funcionário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* New Worker Button */}
            <motion.button 
              className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 px-4 flex items-center py-4 rounded-lg text-[14px] gap-2 text-white shadow-sm transition-colors whitespace-nowrap"
              onClick={handleNewWorker} 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.95 }}
            >
              <span>Novo Funcionário</span>
              <PlusIcon className="h-5 w-5" />
            </motion.button>
          </div>
        </div>

        {workers.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p>Nenhum funcionário cadastrado.</p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={handleNewWorker}
            >
              Adicionar Funcionário
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nome
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    CPF
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Cargo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Departamento
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      {searchTerm 
                        ? "Nenhum funcionário encontrado com esse termo de busca." 
                        : "Nenhum funcionário cadastrado."}
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((worker: Worker) => (
                    <tr key={worker._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{worker.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{formatCPF(worker.cpf)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{worker.role}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{worker.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${worker.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                            : worker.status === 'inactive' 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                          {formatStatus(worker.status || 'active')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center space-x-3">
                          <motion.button
                            onClick={() => handleViewWorker(worker._id as string)}
                            className="text-cyan-600 hover:text-cyan-900 dark:text-cyan-400 dark:hover:text-cyan-300"
                            title="Ver detalhes"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <EyeIcon className="h-5 w-5" />
                          </motion.button>
                          <motion.button
                            onClick={() => handleEditWorker(worker._id as string)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Editar"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <PencilIcon className="h-5 w-5" />
                          </motion.button>
                          <motion.button
                            onClick={() => {
                              fetchWorkerById(worker._id as string);
                              setIsDeleteModalOpen(true);
                            }}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // Seção: Formulário de Funcionário
  const renderWorkerForm = () => {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 dark:bg-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {formMode === 'create' ? 'Novo Funcionário' : 'Editar Funcionário'}
          </h2>
          <motion.button
            onClick={() => setActiveSection('list')}
            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <XMarkIcon className="h-6 w-6" />
          </motion.button>
        </div>
        
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome Completo <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name || ''}
                onChange={handleFormChange}
                className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm ${
                  formErrors.name ? 'border-red-300 dark:border-red-500' : ''
                }`}
                required
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.name}</p>
              )}
            </div>
            
            {/* CPF */}
            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                CPF <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                name="cpf"
                id="cpf"
                value={formData.cpf || ''}
                onChange={handleFormChange}
                className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm ${
                  formErrors.cpf ? 'border-red-300 dark:border-red-500' : ''
                }`}
                required
                maxLength={11}
                placeholder="Apenas números"
              />
              {formErrors.cpf && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.cpf}</p>
              )}
            </div>
            
            {/* Data de Nascimento */}
            <div>
              <label htmlFor="nascimento" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Data de Nascimento <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="date"
                name="nascimento"
                id="nascimento"
                value={formData.nascimento || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
                required
              />
            </div>
            
            {/* Data de Admissão */}
            <div>
              <label htmlFor="admissao" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Data de Admissão <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="date"
                name="admissao"
                id="admissao"
                value={formData.admissao || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
                required
              />
            </div>
            
            {/* Salário */}
            <div>
              <label htmlFor="salario" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Salário <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                name="salario"
                id="salario"
                value={formData.salario || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
                required
              />
            </div>
            
            {/* Ajuda de Custo */}
            <div>
              <label htmlFor="ajuda" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ajuda de Custo
              </label>
              <input
                type="text"
                name="ajuda"
                id="ajuda"
                value={formData.ajuda || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
              />
            </div>
            
            {/* Telefone */}
            <div>
              <label htmlFor="numero" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Telefone <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                name="numero"
                id="numero"
                value={formData.numero || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
                required
              />
            </div>
            
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email || ''}
                onChange={handleFormChange}
                className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm ${
                  formErrors.email ? 'border-red-300 dark:border-red-500' : ''
                }`}
                required
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.email}</p>
              )}
            </div>
            
            {/* Endereço */}
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Endereço <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                name="address"
                id="address"
                value={formData.address || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
                required
              />
            </div>
            
            {/* Tipo de Contrato */}
            <div>
              <label htmlFor="contract" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tipo de Contrato <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <select
                name="contract"
                id="contract"
                value={formData.contract || 'CLT'}
                onChange={handleFormChange}
                className="p-4 mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
                required
              >
                <option value="CLT">CLT</option>
                <option value="PJ">PJ</option>
              </select>
            </div>
            
            {/* Cargo */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cargo <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                name="role"
                id="role"
                value={formData.role || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
                required
              />
            </div>
            
            {/* Departamento */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Departamento <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                name="department"
                id="department"
                value={formData.department || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
                required
              />
            </div>
            
            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                name="status"
                id="status"
                value={formData.status || 'active'}
                onChange={handleFormChange}
                className="p-4 mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
              >
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="other">Outro</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setActiveSection('list')}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
            >
              {formMode === 'create' ? 'Criar Funcionário' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </div>
    );
  };

  // Seção: Detalhes do Funcionário
  const renderWorkerDetails = () => {
    if (!currentWorker) return null;
    
    // Item de informação reutilizável
    const InfoItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
      <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200 sm:col-span-2 sm:mt-0">{value}</dd>
      </div>
    );
    
    return (
      <div className="bg-white shadow overflow-hidden rounded-lg dark:bg-gray-800">
        <div className="flex justify-between items-center px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Informações do Funcionário
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Detalhes pessoais e informações de contato.
            </p>
          </div>
          <motion.button
            onClick={() => setActiveSection('list')}
            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <XMarkIcon className="h-6 w-6" />
          </motion.button>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200 sm:dark:divide-gray-700">
            <InfoItem label="Nome completo" value={currentWorker.name} />
            <InfoItem label="CPF" value={formatCPF(currentWorker.cpf)} />
            <InfoItem label="Data de nascimento" value={formatDate(currentWorker.nascimento)} />
            <InfoItem label="Data de admissão" value={formatDate(currentWorker.admissao)} />
            <InfoItem label="Salário" value={`R$ ${currentWorker.salario}`} />
            {currentWorker.ajuda && (
              <InfoItem label="Ajuda de custo" value={`R$ ${currentWorker.ajuda}`} />
            )}
            <InfoItem label="Telefone" value={currentWorker.numero} />
            <InfoItem label="Email" value={currentWorker.email} />
            <InfoItem label="Endereço" value={currentWorker.address} />
            <InfoItem label="Cargo" value={currentWorker.role} />
            <InfoItem label="Departamento" value={currentWorker.department} />
            <InfoItem label="Contrato" value={currentWorker.contract} />
            <InfoItem 
              label="Status" 
              value={
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${currentWorker.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                    : currentWorker.status === 'inactive' 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                  {formatStatus(currentWorker.status || 'active')}
                </span>
              } 
            />
          </dl>
        </div>
        
        <div className="px-4 py-5 sm:px-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-end space-x-3">
            <Button
              variant="danger"
              onClick={() => setIsDeleteModalOpen(true)}
              className="bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700"
            >
              Excluir
            </Button>
            <Button
              variant="primary"
              onClick={() => handleEditWorker(currentWorker._id as string)}
              className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700"
            >
              Editar
            </Button>
          </div>
        </div>
      </div>
    );
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
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gerenciamento de Funcionários</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Cadastre, visualize e gerencie todos os funcionários da empresa</p>
      </motion.div>

      {/* Mensagens de sucesso/erro */}
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
      
      {/* Main content with shadow and rounded corners */}
      <motion.div 
        variants={itemVariants}
        className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-cyan-700 dark:bg-gray-800"
      >
        {renderContent()}
      </motion.div>

      {/* Modal de confirmação de exclusão */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Exclusão"
        size="sm"
        closeOnOutsideClick={true}
        footer={
          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={loading}
              className="hover:scale-105 active:scale-95 transition-transform"
            >
              Cancelar
            </Button>
            
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              isLoading={loading}
              className="hover:scale-105 active:scale-95 transition-transform"
            >
              Excluir
            </Button>
          </div>
        }
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-col items-center mb-4">
            <motion.div 
              className="bg-red-100 rounded-full p-3 text-red-500 mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 10 }}
            >
              <TrashIcon className="h-6 w-6" />
            </motion.div>
          </div>
          
          <p className="text-gray-700 dark:text-gray-300 text-center">
            Tem certeza que deseja excluir o funcionário <strong>{currentWorker?.name}</strong>?
          </p>
          <p className="text-gray-700 dark:text-gray-400 text-center mt-2 text-sm">
            Esta ação não pode ser desfeita.
          </p>
        </motion.div>
      </Modal>
    </motion.div>
  );
}


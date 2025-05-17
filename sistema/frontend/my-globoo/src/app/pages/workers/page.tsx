"use client";

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useWorker } from '@/hooks/useWorkers';
import { Worker } from '@/types/worker';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Modal from '@/components/ui/Modal';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export default function Home() {
  // Estados para controle da interface
  const [activeSection, setActiveSection] = useState<'list' | 'form' | 'details'>('list');
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

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

  // Renderização condicional das seções
  const renderContent = () => {
    if (loading && workers.length === 0) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Lista de Funcionários</h2>
          <Button
            variant="primary"
            leftIcon={<PlusIcon className="h-5 w-5" />}
            onClick={handleNewWorker}
          >
            Novo Funcionário
          </Button>
        </div>

        {workers.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
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
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CPF
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cargo
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departamento
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workers.map((worker: Worker) => (
                  <tr key={worker._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatCPF(worker.cpf)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{worker.role}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{worker.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${worker.status === 'active' ? 'bg-green-100 text-green-800' : 
                          worker.status === 'inactive' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {formatStatus(worker.status || 'active')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleViewWorker(worker._id as string)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver detalhes"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditWorker(worker._id as string)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Editar"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            fetchWorkerById(worker._id as string);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Excluir"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {formMode === 'create' ? 'Novo Funcionário' : 'Editar Funcionário'}
          </h2>
          <button
            onClick={() => setActiveSection('list')}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name || ''}
                onChange={handleFormChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  formErrors.name ? 'border-red-300' : ''
                }`}
                required
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>
            
            {/* CPF */}
            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
                CPF <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="cpf"
                id="cpf"
                value={formData.cpf || ''}
                onChange={handleFormChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  formErrors.cpf ? 'border-red-300' : ''
                }`}
                required
                maxLength={11}
                placeholder="Apenas números"
              />
              {formErrors.cpf && (
                <p className="mt-1 text-sm text-red-600">{formErrors.cpf}</p>
              )}
            </div>
            
            {/* Data de Nascimento */}
            <div>
              <label htmlFor="nascimento" className="block text-sm font-medium text-gray-700">
                Data de Nascimento <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="nascimento"
                id="nascimento"
                value={formData.nascimento || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            
            {/* Data de Admissão */}
            <div>
              <label htmlFor="admissao" className="block text-sm font-medium text-gray-700">
                Data de Admissão <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="admissao"
                id="admissao"
                value={formData.admissao || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            
            {/* Salário */}
            <div>
              <label htmlFor="salario" className="block text-sm font-medium text-gray-700">
                Salário <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="salario"
                id="salario"
                value={formData.salario || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            
            {/* Ajuda de Custo */}
            <div>
              <label htmlFor="ajuda" className="block text-sm font-medium text-gray-700">
                Ajuda de Custo
              </label>
              <input
                type="text"
                name="ajuda"
                id="ajuda"
                value={formData.ajuda || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            {/* Telefone */}
            <div>
              <label htmlFor="numero" className="block text-sm font-medium text-gray-700">
                Telefone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="numero"
                id="numero"
                value={formData.numero || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email || ''}
                onChange={handleFormChange}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  formErrors.email ? 'border-red-300' : ''
                }`}
                required
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>
            
            {/* Endereço */}
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Endereço <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="address"
                id="address"
                value={formData.address || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            
            {/* Tipo de Contrato */}
            <div>
              <label htmlFor="contract" className="block text-sm font-medium text-gray-700">
                Tipo de Contrato <span className="text-red-500">*</span>
              </label>
              <select
                name="contract"
                id="contract"
                value={formData.contract || 'CLT'}
                onChange={handleFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              >
                <option value="CLT">CLT</option>
                <option value="PJ">PJ</option>
              </select>
            </div>
            
            {/* Cargo */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Cargo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="role"
                id="role"
                value={formData.role || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            
            {/* Departamento */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                Departamento <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="department"
                id="department"
                value={formData.department || ''}
                onChange={handleFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            
            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                name="status"
                id="status"
                value={formData.status || 'active'}
                onChange={handleFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
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
      <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{value}</dd>
      </div>
    );
    
    return (
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="flex justify-between items-center px-4 py-5 sm:px-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Informações do Funcionário
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Detalhes pessoais e informações de contato.
            </p>
          </div>
          <button
            onClick={() => setActiveSection('list')}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="border-t border-gray-200">
          <dl>
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
                  ${currentWorker.status === 'active' ? 'bg-green-100 text-green-800' : 
                    currentWorker.status === 'inactive' ? 'bg-red-100 text-red-800' : 
                    'bg-gray-100 text-gray-800'}`}>
                  {formatStatus(currentWorker.status || 'active')}
                </span>
              } 
            />
          </dl>
        </div>
        
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <Button
              variant="danger"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Excluir
            </Button>
            <Button
              variant="primary"
              onClick={() => handleEditWorker(currentWorker._id as string)}
            >
              Editar
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <Head>
        <title>Sistema de Gerenciamento de Funcionários</title>
        <meta name="description" content="Sistema para gerenciar funcionários" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Sistema de Gerenciamento de Funcionários
            </h1>
          </div>
        </header>

        <main className="flex-grow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {/* Mensagens de sucesso/erro */}
            {successMessage && (
              <Alert
                type="success"
                message={successMessage}
                className="mb-4"
                onClose={() => setSuccessMessage('')}
              />
            )}
            
            {error && (
              <Alert
                type="error"
                message={error}
                className="mb-4"
                onClose={clearError}
              />
            )}
            
            {/* Conteúdo principal */}
            {renderContent()}
          </div>
        </main>

        <footer className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-gray-500 text-sm">
              Sistema de Gerenciamento de Funcionários &copy; {new Date().getFullYear()}
            </p>
          </div>
        </footer>

        {/* Modal de confirmação de exclusão */}
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Confirmar Exclusão"
          size="sm"
          closeOnOutsideClick={false}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                isLoading={loading}
              >
                Excluir
              </Button>
            </>
          }
        >
          <div>
            <p className="text-gray-700">
              Tem certeza que deseja excluir o funcionário <strong>{currentWorker?.name}</strong>?
            </p>
            <p className="text-gray-700 mt-2">
              Esta ação não pode ser desfeita.
            </p>
          </div>
        </Modal>
      </div>
    </div>
  );
}
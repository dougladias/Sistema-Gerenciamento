'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useInvoice } from '@/hooks/useInvoice';
import { Invoice, InvoiceStatus, InvoiceCreate } from '@/types/invoice';
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
  MagnifyingGlassIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

// Componente da página de notas fiscais
export default function InvoicesPage() {
  // Hook de notas fiscais
  const {
    invoices,
    currentInvoice,
    loading,
    error,
    fetchInvoices,
    fetchInvoiceById,
    createInvoice,
    updateInvoice,    
    deleteInvoice,
    downloadInvoice,
    clearError,    
  } = useInvoice();

  // Estados locais
  const [activeSection, setActiveSection] = useState<'list' | 'form' | 'details'>('list');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  
  interface InvoiceFormData {
    number: string;
    date: string;
    value: string | number;
    description: string;
    status: InvoiceStatus;
    issuer: string;
    recipient: string;
    _id?: string;
  }

  const [formData, setFormData] = useState<InvoiceFormData>({
    number: '',
    date: new Date().toISOString().substring(0, 10),
    value: '',
    description: '',
    status: InvoiceStatus.PENDING,
    issuer: '',
    recipient: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Filtrar notas fiscais
  const filteredInvoices = useMemo(() => {
    if (!searchTerm.trim()) return invoices;
    
    const searchLower = searchTerm.toLowerCase();
    return invoices.filter((invoice: Invoice) => 
      invoice.number.toLowerCase().includes(searchLower) || 
      invoice.issuer.toLowerCase().includes(searchLower) || 
      invoice.recipient.toLowerCase().includes(searchLower) ||
      invoice.description.toLowerCase().includes(searchLower)
    );
  }, [invoices, searchTerm]);

  // Busca as notas fiscais ao carregar a página
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Resetar o formulário
  const resetForm = () => {
    setFormData({
      number: '',
      date: new Date().toISOString().substring(0, 10),
      value: '',
      description: '',
      status: InvoiceStatus.PENDING,
      issuer: '',
      recipient: ''
    });
    setSelectedFile(null);
    setFormErrors({});
  };

  // Função para lidar com a alteração dos campos do formulário
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpa erros específicos do campo
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Função para lidar com a seleção de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Função para converter arquivo para Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Validação do formulário
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.number?.trim()) {
      errors.number = 'Número da nota é obrigatório';
    }
    
    if (!formData.date?.trim()) {
      errors.date = 'Data é obrigatória';
    }
    
    if (!formData.value) {
      errors.value = 'Valor é obrigatório';
    } else if (Number(formData.value) <= 0) {
      errors.value = 'Valor deve ser maior que zero';
    }
    
    if (!formData.description?.trim()) {
      errors.description = 'Descrição é obrigatória';
    }
    
    if (!formData.issuer?.trim()) {
      errors.issuer = 'Emissor é obrigatório';
    }
    
    if (!formData.recipient?.trim()) {
      errors.recipient = 'Destinatário é obrigatório';
    }
    
    if (!selectedFile && formMode === 'create') {
      errors.file = 'Arquivo da nota fiscal é obrigatório';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Função para enviar o formulário
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      if (formMode === 'edit') {
        // Atualiza a nota fiscal
        if (formData._id) {
          await updateInvoice(formData._id, {
            number: formData.number,
            date: new Date(formData.date),
            value: typeof formData.value === 'string' ? parseFloat(formData.value) : formData.value,
            description: formData.description,
            status: formData.status as InvoiceStatus,
            issuer: formData.issuer,
            recipient: formData.recipient,
          });
          
          setSuccessMessage('Nota fiscal atualizada com sucesso!');
        }
      } else {
        // Cria nova nota fiscal
        if (selectedFile) {
          const fileBase64 = await fileToBase64(selectedFile);
          
          const invoiceData: InvoiceCreate = {
            number: formData.number,
            date: new Date(formData.date),
            value: typeof formData.value === 'string' ? parseFloat(formData.value) : formData.value,
            description: formData.description,
            status: formData.status as InvoiceStatus,
            issuer: formData.issuer,
            recipient: formData.recipient,
            attachment: {
              originalName: selectedFile.name,
              mimetype: selectedFile.type,
              size: selectedFile.size,
              content: fileBase64
            }
          };
          
          await createInvoice(invoiceData);
          setSuccessMessage('Nota fiscal criada com sucesso!');
        }
      }
      
      // Volta para a lista
      setActiveSection('list');
      resetForm();
      fetchInvoices();
      
      // Limpa a mensagem após alguns segundos
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Erro ao processar formulário:', err);
    }
  };

  // Manipuladores de ação
  const handleNewInvoice = () => {
    resetForm();
    setFormMode('create');
    setActiveSection('form');
  };

  const handleViewInvoice = async (id: string) => {
    await fetchInvoiceById(id);
    setActiveSection('details');
  };

  const handleEditInvoice = async (id: string) => {
    const invoice = await fetchInvoiceById(id);
    if (invoice) {
      setFormData({
        _id: invoice._id,
        number: invoice.number,
        date: new Date(invoice.date).toISOString().substring(0, 10),
        value: invoice.value,
        description: invoice.description,
        status: invoice.status,
        issuer: invoice.issuer,
        recipient: invoice.recipient
      });
      
      setFormMode('edit');
      setActiveSection('form');
    }
  };

  const handleDeleteInvoice = (id: string) => {
    fetchInvoiceById(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (currentInvoice?._id) {
      try {
        // Armazena o número da nota fiscal antes de excluir
        const invoiceNumber = currentInvoice.number;
        
        await deleteInvoice(currentInvoice._id);
        
        setIsDeleteModalOpen(false);
        setActiveSection('list');
        setSuccessMessage(`Nota Fiscal ${invoiceNumber} excluída com sucesso!`);
        
        // Limpa a mensagem após alguns segundos
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } catch (err) {
        console.error('Erro ao excluir nota fiscal:', err);
      }
    }
  };

  // Funções utilitárias
  const formatValue = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  const formatDate = (dateString: string | Date): string => {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };
  
  const formatStatus = (status: string): string => {
    switch (status) {
      case InvoiceStatus.PAID: return 'Pago';
      case InvoiceStatus.CANCELED: return 'Cancelado';
      case InvoiceStatus.PENDING: return 'Pendente';
      default: return status;
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

  // Renderização condicional das seções
  const renderContent = () => {
    if (loading && invoices.length === 0) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 dark:border-cyan-400"></div>
        </div>
      );
    }

    switch (activeSection) {
      case 'list':
        return renderInvoicesList();
      case 'form':
        return renderInvoiceForm();
      case 'details':
        return renderInvoiceDetails();
      default:
        return renderInvoicesList();
    }
  };

  // Seção: Lista de Notas Fiscais
  const renderInvoicesList = () => {
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b dark:border-gray-700 gap-3">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Lista de Notas Fiscais</h2>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative flex-grow sm:flex-grow-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 relative right-10" />
              </div>
              <input
                type="text"
                className="pl-10 block w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-600 focus:border-cyan-500 dark:focus:border-cyan-600 transition-colors py-2"
                placeholder="Buscar notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* New Invoice Button */}
            <motion.button 
              className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 px-4 py-4 flex items-center py-2 rounded-lg text-[14px] gap-2 text-white shadow-sm transition-colors whitespace-nowrap"
              onClick={handleNewInvoice} 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.95 }}
            >
              <span>Nova Nota Fiscal</span>
              <PlusIcon className="h-5 w-5" />
            </motion.button>
          </div>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p>
              {searchTerm 
                ? "Nenhuma nota fiscal encontrada com esse termo de busca." 
                : "Nenhuma nota fiscal cadastrada."}
            </p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={handleNewInvoice}
            >
              Adicionar Nota Fiscal
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Número
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Data
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Valor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Emissor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Destinatário
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
                {filteredInvoices.map((invoice: Invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{invoice.number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{formatDate(invoice.date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{formatValue(invoice.value)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{invoice.issuer}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{invoice.recipient}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${invoice.status === InvoiceStatus.PAID
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                          : invoice.status === InvoiceStatus.CANCELED
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                        {formatStatus(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-3">
                        <motion.button
                          onClick={() => handleViewInvoice(invoice._id as string)}
                          className="text-cyan-600 hover:text-cyan-900 dark:text-cyan-400 dark:hover:text-cyan-300"
                          title="Ver detalhes"
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <EyeIcon className="h-5 w-5" />
                        </motion.button>
                        <motion.button
                          onClick={() => handleEditInvoice(invoice._id as string)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="Editar"
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <PencilIcon className="h-5 w-5" />
                        </motion.button>
                        <motion.button
                          onClick={() => downloadInvoice(invoice._id as string)}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          title="Download"
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <ArrowDownTrayIcon className="h-5 w-5" />
                        </motion.button>
                        <motion.button
                          onClick={() => handleDeleteInvoice(invoice._id as string)}
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
    );
  };

  // Seção: Formulário de Nota Fiscal
  const renderInvoiceForm = () => {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 dark:bg-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            {formMode === 'create' ? 'Nova Nota Fiscal' : 'Editar Nota Fiscal'}
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
            {/* Número da Nota */}
            <div>
              <label htmlFor="number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Número da Nota <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                name="number"
                id="number"
                value={formData.number}
                onChange={handleFormChange}
                className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm ${
                  formErrors.number ? 'border-red-300 dark:border-red-500' : ''
                }`}
                required
              />
              {formErrors.number && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.number}</p>
              )}
            </div>
            
            {/* Data */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Data <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="date"
                name="date"
                id="date"
                value={formData.date}
                onChange={handleFormChange}
                className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm ${
                  formErrors.date ? 'border-red-300 dark:border-red-500' : ''
                }`}
                required
              />
              {formErrors.date && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.date}</p>
              )}
            </div>
            
            {/* Valor */}
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Valor <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="number"
                name="value"
                id="value"
                value={formData.value}
                onChange={handleFormChange}
                min="0.01"
                step="0.01"
                className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm ${
                  formErrors.value ? 'border-red-300 dark:border-red-500' : ''
                }`}
                required
              />
              {formErrors.value && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.value}</p>
              )}
            </div>
            
            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Status <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <select
                name="status"
                id="status"
                value={formData.status}
                onChange={handleFormChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
                required
              >
                <option value={InvoiceStatus.PENDING}>Pendente</option>
                <option value={InvoiceStatus.PAID}>Pago</option>
                <option value={InvoiceStatus.CANCELED}>Cancelado</option>
              </select>
            </div>
            
            {/* Emissor */}
            <div>
              <label htmlFor="issuer" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Emissor <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                name="issuer"
                id="issuer"
                value={formData.issuer}
                onChange={handleFormChange}
                className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm ${
                  formErrors.issuer ? 'border-red-300 dark:border-red-500' : ''
                }`}
                required
              />
              {formErrors.issuer && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.issuer}</p>
              )}
            </div>
            
            {/* Destinatário */}
            <div>
              <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Destinatário <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                name="recipient"
                id="recipient"
                value={formData.recipient}
                onChange={handleFormChange}
                className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm ${
                  formErrors.recipient ? 'border-red-300 dark:border-red-500' : ''
                }`}
                required
              />
              {formErrors.recipient && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.recipient}</p>
              )}
            </div>
            
            {/* Descrição */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Descrição <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <textarea
                name="description"
                id="description"
                value={formData.description}
                onChange={handleFormChange}
                rows={3}
                className={`mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm ${
                  formErrors.description ? 'border-red-300 dark:border-red-500' : ''
                }`}
                required
              />
              {formErrors.description && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.description}</p>
              )}
            </div>
            
            {/* Upload de arquivo (apenas para novas notas) */}
            {formMode === 'create' && (
              <div className="md:col-span-2">
                <label htmlFor="file" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Arquivo da Nota Fiscal <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="file"
                  id="file"
                  onChange={handleFileChange}
                  accept=".pdf,.xml,.jpg,.jpeg,.png"
                  className={`mt-1 block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-cyan-50 file:text-cyan-700
                    dark:file:bg-cyan-900/30 dark:file:text-cyan-300
                    hover:file:bg-cyan-100 dark:hover:file:bg-cyan-800/40 ${
                      formErrors.file ? 'border-red-300 dark:border-red-500 text-red-600 dark:text-red-400' : ''
                    }`}
                  required
                />
                {selectedFile && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Arquivo selecionado: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                  </p>
                )}
                {formErrors.file && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.file}</p>
                )}
              </div>
            )}
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
              {formMode === 'create' ? 'Criar Nota Fiscal' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </div>
    );
  };

  // Seção: Detalhes da Nota Fiscal
  const renderInvoiceDetails = () => {
    if (!currentInvoice) return null;
    
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
              Detalhes da Nota Fiscal
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Informações detalhadas e arquivo anexo.
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
            <InfoItem label="Número da Nota" value={currentInvoice.number} />
            <InfoItem label="Data" value={formatDate(currentInvoice.date)} />
            <InfoItem label="Valor" value={formatValue(currentInvoice.value)} />
            <InfoItem label="Emissor" value={currentInvoice.issuer} />
            <InfoItem label="Destinatário" value={currentInvoice.recipient} />
            <InfoItem 
              label="Status" 
              value={
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${currentInvoice.status === InvoiceStatus.PAID 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                    : currentInvoice.status === InvoiceStatus.CANCELED 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                  {formatStatus(currentInvoice.status)}
                </span>
              } 
            />
            <InfoItem label="Data de Criação" value={currentInvoice.createdAt && new Date(currentInvoice.createdAt).toLocaleString()} />
            <InfoItem label="Última Atualização" value={currentInvoice.updatedAt && new Date(currentInvoice.updatedAt).toLocaleString()} />
            
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 sm:py-5 border-b border-gray-200 dark:border-gray-700">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Descrição</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200 sm:col-span-2 sm:mt-0">
                <p className="bg-gray-50 dark:bg-gray-700 p-3 rounded">{currentInvoice.description}</p>
              </dd>
            </div>
            
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 sm:py-5">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Arquivo</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200 sm:col-span-2 sm:mt-0">
                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded flex items-center justify-between">
                  <div>
                    <p>{currentInvoice.attachment.originalName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {Math.round(currentInvoice.attachment.size / 1024)} KB | {currentInvoice.attachment.mimetype}
                    </p>
                  </div>
                  <Button
                    onClick={() => downloadInvoice(currentInvoice._id as string)}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1 rounded dark:bg-cyan-600 dark:hover:bg-cyan-700"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-1 inline-block" />
                    Download
                  </Button>
                </div>
              </dd>
            </div>
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
              onClick={() => handleEditInvoice(currentInvoice._id as string)}
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
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Gerenciamento de Notas Fiscais</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Cadastre, visualize e gerencie todas as notas fiscais da empresa</p>
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
            Tem certeza que deseja excluir a nota fiscal <strong>{currentInvoice?.number}</strong>?
          </p>
          <p className="text-gray-700 dark:text-gray-400 text-center mt-2 text-sm">
            Esta ação não pode ser desfeita.
          </p>
        </motion.div>
      </Modal>
    </motion.div>
  );
}
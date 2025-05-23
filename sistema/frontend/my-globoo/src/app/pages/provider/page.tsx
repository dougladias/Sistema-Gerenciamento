"use client";

import React, { useState, useRef, useMemo } from 'react';
import { useProvider } from '@/hooks/useProvider';
import { 
  Provider, 
  ProviderCreate, 
  DocumentType,
  ProviderStatus
} from '@/types/provider';
import Webcam from 'react-webcam';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  TrashIcon, 
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,  
  ArrowLeftOnRectangleIcon,
  EyeIcon,
  BuildingOfficeIcon,
  UserIcon,
  PhoneIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface ProviderFormData {
  name: string;
  documentType: DocumentType;
  documentNumber: string;
  phone: string;
  email: string;
  company: string;
  reason: string;
  hostName: string;
  notes: string;
}

export default function ProvidersPage() {
  // Hook de fornecedores
  const {
    providers,
    loading,
    error,
    createProvider,
    checkInProvider,
    checkOutProvider,
    deleteProvider,
    getProviderPhotoUrl,
    clearError
  } = useProvider();

  // Estados
  const [showProviders, setShowProviders] = useState<boolean>(true);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [showProviderDetail, setShowProviderDetail] = useState<boolean>(false);
  const [providerForm, setProviderForm] = useState<ProviderFormData>({
    name: '',
    documentType: DocumentType.RG,
    documentNumber: '',
    phone: '',
    email: '',
    company: '',
    reason: '',
    hostName: '',
    notes: ''
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [useWebcam, setUseWebcam] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Filtrar fornecedores com base no termo de pesquisa
  const filteredProviders = useMemo(() => {
    // Primeiro, filtramos apenas os prestadores do dia atual
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Define para início do dia
    
    const todaysProviders = providers.filter((provider: Provider) => {
      // Verifica se o prestador foi criado/agendado para hoje
      const createdDate = new Date(provider.createdAt || provider.scheduledEntry || '');
      createdDate.setHours(0, 0, 0, 0);
      return createdDate.getTime() === today.getTime();
    });
    
    // Depois aplicamos o filtro de busca, se houver
    if (!searchTerm.trim()) return todaysProviders;
    
    const searchLower = searchTerm.toLowerCase();
    return todaysProviders.filter((provider: Provider) => 
      provider.name?.toLowerCase().includes(searchLower) || 
      provider.documentNumber?.includes(searchTerm) || 
      provider.company?.toLowerCase().includes(searchLower) || 
      provider.hostName?.toLowerCase().includes(searchLower)
    );
  }, [providers, searchTerm]);

  // Manipula mudanças no formulário
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setProviderForm(prev => ({ ...prev, [name]: value }));
  };

  // Manipula a seleção de foto
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Cria uma URL para preview
      const fileUrl = URL.createObjectURL(file);
      setPhotoPreview(fileUrl);
      
      // Desativa a webcam se estiver ativa
      setUseWebcam(false);
    }
  };

  // Captura foto da webcam
  const handleCapturePhoto = (): void => {
    setUseWebcam(true);
  };

  // Tira uma foto da webcam
  const captureWebcamPhoto = (): void => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setPhotoPreview(imageSrc);
      }
    }
  };

  // Converter base64 para Blob
  const base64toBlob = (base64Data: string, contentType: string): Blob => {
    contentType = contentType || '';
    const sliceSize = 1024;
    const byteCharacters = atob(base64Data.split(',')[1]);
    const bytesLength = byteCharacters.length;
    const slicesCount = Math.ceil(bytesLength / sliceSize);
    const byteArrays = new Array(slicesCount);

    for (let sliceIndex = 0; sliceIndex < slicesCount; sliceIndex++) {
      const begin = sliceIndex * sliceSize;
      const end = Math.min(begin + sliceSize, bytesLength);

      const bytes = new Array(end - begin);
      for (let offset = begin, i = 0; offset < end; ++i, ++offset) {
        bytes[i] = byteCharacters[offset].charCodeAt(0);
      }
      byteArrays[sliceIndex] = new Uint8Array(bytes);
    }
    return new Blob(byteArrays, { type: contentType });
  };

  // Enviar o formulário
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    try {
      // Criando novo fornecedor
      const providerData: ProviderCreate = {
        ...providerForm,
        documentType: providerForm.documentType,
        status: ProviderStatus.EXPECTED
      };
      
      // Adiciona a foto se houver preview
      if (photoPreview) {
        // Determinar o tipo MIME
        let mimetype = 'image/jpeg';
        if (photoPreview.startsWith('data:image/png')) {
          mimetype = 'image/png';
        }
        
        // Criar nome de arquivo
        const originalName = `foto_${providerForm.name.replace(/\s+/g, '_').toLowerCase()}.jpg`;
        
        // Converte para blob para obter o tamanho
        const blob = base64toBlob(photoPreview, mimetype);
        
        providerData.photo = {
          originalName,
          mimetype,
          size: blob.size,
          content: photoPreview
        };
      }
      
      await createProvider(providerData);
      
      // Mostra mensagem de sucesso
      setSuccessMessage('Fornecedor cadastrado com sucesso!');
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      // Reseta o formulário
      resetForm();
      
      // Mostra a lista de fornecedores
      setShowProviders(true);
    } catch {
      console.error('Erro ao processar formulário');
    }
  };

  // Reseta o formulário
  const resetForm = (): void => {
    setProviderForm({
      name: '',
      documentType: DocumentType.RG,
      documentNumber: '',
      phone: '',
      email: '',
      company: '',
      reason: '',
      hostName: '',
      notes: ''
    });
    setPhotoPreview(null);
    setUseWebcam(false);
  };

  // Registra entrada de fornecedor
  const handleCheckIn = async (id: string): Promise<void> => {
    try {
      await checkInProvider(id);
      setSuccessMessage('Entrada registrada com sucesso!');
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch {
      // O erro já é tratado pelo hook useProvider
    }
  };

  // Registra saída de fornecedor
  const handleCheckOut = async (id: string): Promise<void> => {
    try {
      await checkOutProvider(id);
      setSuccessMessage('Saída registrada com sucesso!');
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch {
      // O erro já é tratado pelo hook useProvider
    }
  };

  // Exclui um fornecedor
  const handleDelete = async (id: string): Promise<void> => {
    if (window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
      try {
        await deleteProvider(id);
        setSuccessMessage('Fornecedor excluído com sucesso!');
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } catch {
        // O erro já é tratado pelo hook useProvider
      }
    }
  };

  // Mostra detalhes do fornecedor
  const handleViewDetails = (provider: Provider): void => {
    setSelectedProvider(provider);
    setShowProviderDetail(true);
    setShowProviders(false);
  };

  // Retorna o texto do status para exibição
  const getStatusText = (status: ProviderStatus): string => {
    switch (status) {
      case ProviderStatus.EXPECTED:
        return 'Agendado';
      case ProviderStatus.CHECKED_IN:
        return 'Em serviço';
      case ProviderStatus.CHECKED_OUT:
        return 'Finalizado';
      case ProviderStatus.CANCELLED:
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Retorna a cor do status
  const getStatusColor = (status: ProviderStatus): string => {
    switch (status) {
      case ProviderStatus.EXPECTED:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case ProviderStatus.CHECKED_IN:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case ProviderStatus.CHECKED_OUT:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case ProviderStatus.CANCELLED:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Toggle entre visualizações
  const handleToggleForm = () => {
    setShowProviders(!showProviders);
    setShowProviderDetail(false);
    if (!showProviders) {
      resetForm();
    }
  };

  const handleBackToList = () => {
    setShowProviders(true);
    setShowProviderDetail(false);
    setSelectedProvider(null);
  };

  // Formatar data para exibição
  const formatDate = (date: Date | string): string => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Renderiza os detalhes do fornecedor
  const renderProviderDetail = () => {
    if (!selectedProvider) return null;

    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Detalhes do Fornecedor
          </h2>
          <motion.button
            onClick={handleBackToList}
            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <XMarkIcon className="h-6 w-6" />
          </motion.button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Foto do fornecedor */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              {selectedProvider.photo && selectedProvider._id ? (
                <div className="relative w-48 h-48 mx-auto mb-4">
                  <Image
                    src={getProviderPhotoUrl(selectedProvider._id)}
                    alt={`Foto de ${selectedProvider.name}`}
                    fill
                    className="rounded-lg object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-48 h-48 mx-auto mb-4 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                  <UserIcon className="h-16 w-16 text-gray-400 dark:text-gray-500" />
                </div>
              )}
              <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(selectedProvider.status)}`}>
                {getStatusText(selectedProvider.status)}
              </span>
            </div>
          </div>

          {/* Informações principais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dados pessoais */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4 flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Dados Pessoais
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Nome</label>
                  <p className="text-gray-800 dark:text-white font-medium">{selectedProvider.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Documento</label>
                  <p className="text-gray-800 dark:text-white">{selectedProvider.documentType.toUpperCase()}: {selectedProvider.documentNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Telefone</label>
                  <p className="text-gray-800 dark:text-white flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-1" />
                    {selectedProvider.phone}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Email</label>
                  <p className="text-gray-800 dark:text-white">{selectedProvider.email || '-'}</p>
                </div>
              </div>
            </div>

            {/* Dados da visita */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4 flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                Dados da Visita
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Empresa</label>
                  <p className="text-gray-800 dark:text-white">{selectedProvider.company || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Responsável</label>
                  <p className="text-gray-800 dark:text-white">{selectedProvider.hostName}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Motivo da Visita</label>
                  <p className="text-gray-800 dark:text-white">{selectedProvider.reason}</p>
                </div>
                {selectedProvider.notes && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Observações</label>
                    <p className="text-gray-800 dark:text-white">{selectedProvider.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Horários */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2" />
                Horários
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Entrada Agendada</label>
                  <p className="text-gray-800 dark:text-white">{formatDate(selectedProvider.scheduledEntry || '')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Saída Agendada</label>
                  <p className="text-gray-800 dark:text-white">{formatDate(selectedProvider.scheduledExit || '')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Entrada Real</label>
                  <p className="text-gray-800 dark:text-white">{formatDate(selectedProvider.actualEntry || '')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Saída Real</label>
                  <p className="text-gray-800 dark:text-white">{formatDate(selectedProvider.actualExit || '')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-6 flex justify-center space-x-4">
          {selectedProvider.status === ProviderStatus.EXPECTED && selectedProvider._id && (
            <Button
              onClick={() => handleCheckIn(selectedProvider._id as string)}
              className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              Registrar Entrada
            </Button>
          )}
          
          {selectedProvider.status === ProviderStatus.CHECKED_IN && selectedProvider._id && (
            <Button
              onClick={() => handleCheckOut(selectedProvider._id as string)}
              className="bg-blue-500 hover:bg-blue-600 text-white flex items-center gap-2"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5" />
              Registrar Saída
            </Button>
          )}
          
          {selectedProvider._id && (
            <Button
              onClick={() => handleDelete(selectedProvider._id as string)}
              className="bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
            >
              <TrashIcon className="h-5 w-5" />
              Excluir
            </Button>
          )}
        </div>
      </div>
    );
  };
  
  // Renderiza o formulário de cadastro de fornecedores
  const renderProviderForm = () => {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Cadastrar Novo Fornecedor
          </h2>
          <motion.button
            onClick={handleToggleForm}
            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <XMarkIcon className="h-6 w-6" />
          </motion.button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nome <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={providerForm.name}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tipo de Documento <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <select
                  name="documentType"
                  value={providerForm.documentType}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
                >
                  <option value={DocumentType.RG}>RG</option>
                  <option value={DocumentType.CPF}>CPF</option>
                  <option value={DocumentType.CNH}>CNH</option>
                  <option value={DocumentType.PASSPORT}>Passaporte</option>
                  <option value={DocumentType.OTHER}>Outro</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Número do Documento <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="documentNumber"
                  value={providerForm.documentNumber}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Telefone <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={providerForm.phone}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={providerForm.email}
                  onChange={handleFormChange}
                  className="mt-1 block w-full px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Empresa
                </label>
                <input
                  type="text"
                  name="company"
                  value={providerForm.company}
                  onChange={handleFormChange}
                  className="mt-1 block w-full px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Motivo da Visita <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="reason"
                  value={providerForm.reason}
                  onChange={handleFormChange}
                  required
                  placeholder="Ex: Manutenção de equipamentos, Entrega de materiais..."
                  className="mt-1 block w-full px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Responsável <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="hostName"
                  value={providerForm.hostName}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Observações
                </label>
                <textarea
                  name="notes"
                  value={providerForm.notes}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Informações adicionais, equipamentos necessários, horários específicos..."
                  className="mt-1 block w-full px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Foto do fornecedor */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Foto do Fornecedor
            </label>
            
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex flex-col gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                    setUseWebcam(false);
                  }}
                  className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
                >
                  Selecionar Arquivo
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCapturePhoto}
                  className="bg-cyan-100 hover:bg-cyan-200 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 dark:hover:bg-cyan-800/40"
                >
                  {useWebcam ? 'Fechar Webcam' : 'Usar Webcam'}
                </Button>
                
                {useWebcam && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={captureWebcamPhoto}
                    className="bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-800/40"
                  >
                    Tirar Foto
                  </Button>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  ref={fileInputRef}
                  className="hidden"
                />
              </div>
              
              <div className="flex-grow">
                {useWebcam ? (
                  <div className="rounded-lg overflow-hidden border dark:border-gray-700">
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      width={320}
                      height={240}
                      videoConstraints={{
                        width: 320,
                        height: 240,
                        facingMode: "user"
                      }}
                    />
                  </div>
                ) : photoPreview ? (
                  <div className="relative rounded-lg overflow-hidden border dark:border-gray-700"> 
                    <Image
                      src={photoPreview}
                      alt="Foto do fornecedor"
                      className="h-60 w-auto"
                      width={240}
                      height={240}
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div className="h-60 w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400">Nenhuma foto selecionada</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleToggleForm}
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
              {loading ? 'Cadastrando...' : 'Cadastrar Fornecedor'}
            </Button>
          </div>
        </form>
      </div>
    );
  };

  // Renderiza a lista de fornecedores
  const renderProvidersList = () => {
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b dark:border-gray-700 gap-3">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Lista de Fornecedores</h2>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative flex-grow sm:flex-grow-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 relative right-10" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-600 focus:border-cyan-500 dark:focus:border-cyan-600 transition-colors"
                placeholder="Buscar fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* New Provider Button */}
            <motion.button 
              className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 px-4 py-4 flex items-center rounded-lg text-sm gap-2 text-white shadow-sm transition-colors whitespace-nowrap"
              onClick={handleToggleForm} 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.95 }}
            >
              <span>Novo Fornecedor</span>
              <PlusIcon className="h-5 w-5" />
            </motion.button>
          </div>
        </div>

        {filteredProviders.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p>{searchTerm ? "Nenhum fornecedor encontrado com esse termo de busca." : "Nenhum fornecedor cadastrado."}</p>
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
                    Documento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Responsável
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Motivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProviders.map((provider: Provider) => (
                  <tr key={provider._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{provider.name}</div>
                      {provider.company && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{provider.company}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{provider.documentNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{provider.hostName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={provider.reason}>
                        {provider.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(provider.status)}`}>
                        {getStatusText(provider.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        {/* Ver detalhes */}
                        {provider._id && (
                          <motion.button
                            onClick={() => handleViewDetails(provider)}
                            className="text-cyan-600 hover:text-cyan-900 dark:text-cyan-400 dark:hover:text-cyan-300"
                            title="Ver Detalhes"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <EyeIcon className="h-5 w-5" />
                          </motion.button>
                        )}
                        
                        {/* Check-in */}
                        {provider.status === ProviderStatus.EXPECTED && provider._id && (
                          <motion.button
                            onClick={() => handleCheckIn(provider._id as string)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            title="Registrar Entrada"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <ArrowRightOnRectangleIcon className="h-5 w-5" />
                          </motion.button>
                        )}
                        
                        {/* Check-out */}
                        {provider.status === ProviderStatus.CHECKED_IN && provider._id && (
                          <motion.button
                            onClick={() => handleCheckOut(provider._id as string)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Registrar Saída"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                          </motion.button>
                        )}
                        
                        {/* Excluir */}
                        {provider._id && (
                          <motion.button
                            onClick={() => handleDelete(provider._id as string)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Excluir"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <TrashIcon className="h-5 w-5" />
                          </motion.button>
                        )}
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

  // Conteúdo principal
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
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Controle de Fornecedores</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Cadastre, visualize e gerencie todos os fornecedores da empresa</p>
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
        {showProviderDetail ? renderProviderDetail() : showProviders ? renderProvidersList() : renderProviderForm()}
      </motion.div>
    </motion.div>
  );
}
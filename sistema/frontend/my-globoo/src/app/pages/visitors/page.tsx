"use client";

import React, { useState, useRef, useMemo } from 'react';
import { useVisitor } from '@/hooks/useVisitor';
import { 
  Visitor, 
  VisitorCreate, 
  DocumentType,
  VisitorStatus
} from '@/types/visitor';
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
  ArrowLeftOnRectangleIcon    
} from '@heroicons/react/24/outline';

interface VisitorFormData {
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

export default function VisitorsPage() {
  // Hook de visitantes
  const {
    visitors,
    loading,
    error,
    createVisitor,
    checkInVisitor,
    checkOutVisitor,
    deleteVisitor,    
    clearError
  } = useVisitor();

  // Estados
  const [showVisitors, setShowVisitors] = useState<boolean>(true);
  const [visitorForm, setVisitorForm] = useState<VisitorFormData>({
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

  // Filtrar visitantes com base no termo de pesquisa
  const filteredVisitors = useMemo(() => {
    if (!searchTerm.trim()) return visitors;
    
    const searchLower = searchTerm.toLowerCase();
    return visitors.filter((visitor: Visitor) => 
      visitor.name?.toLowerCase().includes(searchLower) || 
      visitor.documentNumber?.includes(searchTerm) || 
      visitor.company?.toLowerCase().includes(searchLower) || 
      visitor.hostName?.toLowerCase().includes(searchLower)
    );
  }, [visitors, searchTerm]);

  // Manipula mudanças no formulário
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setVisitorForm(prev => ({ ...prev, [name]: value }));
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
      // Criando novo visitante
      const visitorData: VisitorCreate = {
        ...visitorForm,
        documentType: visitorForm.documentType,
        status: VisitorStatus.EXPECTED
      };
      
      // Adiciona a foto se houver preview
      if (photoPreview) {
        // Determinar o tipo MIME
        let mimetype = 'image/jpeg';
        if (photoPreview.startsWith('data:image/png')) {
          mimetype = 'image/png';
        }
        
        // Criar nome de arquivo
        const originalName = `foto_${visitorForm.name.replace(/\s+/g, '_').toLowerCase()}.jpg`;
        
        // Converte para blob para obter o tamanho
        const blob = base64toBlob(photoPreview, mimetype);
        
        visitorData.photo = {
          originalName,
          mimetype,
          size: blob.size,
          content: photoPreview
        };
      }
      
      await createVisitor(visitorData);
      
      // Mostra mensagem de sucesso
      setSuccessMessage('Visitante cadastrado com sucesso!');
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      // Reseta o formulário
      resetForm();
      
      // Mostra a lista de visitantes
      setShowVisitors(true);
    } catch {
      console.error('Erro ao processar formulário');
    }
  };

  // Reseta o formulário
  const resetForm = (): void => {
    setVisitorForm({
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

  // Registra entrada de visitante
  const handleCheckIn = async (id: string): Promise<void> => {
    try {
      await checkInVisitor(id);
      setSuccessMessage('Entrada registrada com sucesso!');
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch {
      // O erro já é tratado pelo hook useVisitor
    }
  };

  // Registra saída de visitante
  const handleCheckOut = async (id: string): Promise<void> => {
    try {
      await checkOutVisitor(id);
      setSuccessMessage('Saída registrada com sucesso!');
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch {
      // O erro já é tratado pelo hook useVisitor
    }
  };

  // Exclui um visitante
  const handleDelete = async (id: string): Promise<void> => {
    if (window.confirm('Tem certeza que deseja excluir este visitante?')) {
      try {
        await deleteVisitor(id);
        setSuccessMessage('Visitante excluído com sucesso!');
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } catch {
        // O erro já é tratado pelo hook useVisitor
      }
    }
  };

  // Retorna o texto do status para exibição
  const getStatusText = (status: VisitorStatus): string => {
    switch (status) {
      case VisitorStatus.EXPECTED:
        return 'Aguardando';
      case VisitorStatus.CHECKED_IN:
        return 'Em visita';
      case VisitorStatus.CHECKED_OUT:
        return 'Finalizado';
      case VisitorStatus.CANCELLED:
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Retorna a cor do status
  const getStatusColor = (status: VisitorStatus): string => {
    switch (status) {
      case VisitorStatus.EXPECTED:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case VisitorStatus.CHECKED_IN:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case VisitorStatus.CHECKED_OUT:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case VisitorStatus.CANCELLED:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Toggle entre formulário e lista
  const handleToggleForm = () => {
    setShowVisitors(!showVisitors);
    if (!showVisitors) {
      resetForm();
    }
  };
  
  // Renderiza o formulário de cadastro de visitantes
  const renderVisitorForm = () => {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Cadastrar Novo Visitante
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
                  value={visitorForm.name}
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
                  value={visitorForm.documentType}
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
                  value={visitorForm.documentNumber}
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
                  value={visitorForm.phone}
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
                  value={visitorForm.email}
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
                  value={visitorForm.company}
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
                  value={visitorForm.reason}
                  onChange={handleFormChange}
                  required
                  className="mt-1 block w-full px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Anfitrião <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="hostName"
                  value={visitorForm.hostName}
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
                  value={visitorForm.notes}
                  onChange={handleFormChange}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-cyan-500 focus:ring-cyan-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400 sm:text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Foto do visitante */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Foto do Visitante
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
                      alt="Foto do visitante"
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
              {loading ? 'Cadastrando...' : 'Cadastrar Visitante'}
            </Button>
          </div>
        </form>
      </div>
    );
  };

  // Renderiza a lista de visitantes
  const renderVisitorsList = () => {
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b dark:border-gray-700 gap-3">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Lista de Visitantes</h2>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative flex-grow sm:flex-grow-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500 relative right-10" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-600 focus:border-cyan-500 dark:focus:border-cyan-600 transition-colors"
                placeholder="Buscar visitante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* New Visitor Button */}
            <motion.button 
              className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 px-4 py-4 flex items-center rounded-lg text-[14px] gap-2 text-white shadow-sm transition-colors whitespace-nowrap"
              onClick={handleToggleForm} 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.95 }}
            >
              <span>Novo Visitante</span>
              <PlusIcon className="h-5 w-5" />
            </motion.button>
          </div>
        </div>

        {filteredVisitors.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <p>{searchTerm ? "Nenhum visitante encontrado com esse termo de busca." : "Nenhum visitante cadastrado."}</p>
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
                    Anfitrião
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
                {filteredVisitors.map((visitor: Visitor) => (
                  <tr key={visitor._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{visitor.name}</div>
                      {visitor.company && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{visitor.company}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{visitor.documentNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{visitor.hostName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(visitor.status)}`}>
                        {getStatusText(visitor.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-3">
                        {visitor.status === VisitorStatus.EXPECTED && visitor._id && (
                          <motion.button
                            onClick={() => handleCheckIn(visitor._id as string)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            title="Registrar Entrada"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <ArrowRightOnRectangleIcon className="h-5 w-5" />
                          </motion.button>
                        )}
                        
                        {visitor.status === VisitorStatus.CHECKED_IN && visitor._id && (
                          <motion.button
                            onClick={() => handleCheckOut(visitor._id as string)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Registrar Saída"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                          </motion.button>
                        )}
                        
                        {visitor._id && (
                          <motion.button
                            onClick={() => handleDelete(visitor._id as string)}
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
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Controle de Visitantes</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Cadastre, visualize e gerencie todos os visitantes da empresa</p>
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
        {showVisitors ? renderVisitorsList() : renderVisitorForm()}
      </motion.div>
    </motion.div>
  );
}
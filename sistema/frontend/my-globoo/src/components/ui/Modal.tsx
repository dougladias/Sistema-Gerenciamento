// frontend/src/components/ui/Modal.tsx

import React, { Fragment, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOutsideClick?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full'
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOutsideClick = true
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Previne que o body role quando o modal estiver aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  // Fecha o modal ao pressionar a tecla ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
  
  // Fecha o modal ao clicar fora dele
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
        >
          {/* Backdrop */}
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          
          {/* Modal Content */}
          <motion.div
            ref={modalRef}
            className={`${sizeClasses[size]} w-full bg-white rounded-lg shadow-xl z-50 overflow-hidden relative`}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ 
              type: "spring",
              damping: 25,
              stiffness: 300
            }}
            onClick={(e) => e.stopPropagation()} // Impede que cliques se propaguem para o fundo
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                <motion.button
                  type="button"
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={onClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="sr-only">Fechar</span>
                  <XMarkIcon className="h-6 w-6" />
                </motion.button>
              </div>
            )}
            
            {/* Body */}
            <div className="p-6">
              {children}
            </div>
            
            {/* Footer */}
            {footer && (
              <div className="p-4 border-t flex justify-end space-x-3">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;

// Exemplo de uso do componente Modal
export const Example = () => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleDeleteConfirm = () => {
    setLoading(true);
    // Simula uma chamada de API
    setTimeout(() => {
      setLoading(false);
      setIsDeleteModalOpen(false);
    }, 2000);
  };

  return (
    <Modal
      isOpen={isDeleteModalOpen}
      onClose={() => setIsDeleteModalOpen(false)}
      title="Confirmar Exclusão"
      size="sm"
      closeOnOutsideClick={false} // Impede fechamento ao clicar fora
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
      <p>Tem certeza de que deseja excluir este item? Esta ação não pode ser desfeita.</p>
    </Modal>
  );
};
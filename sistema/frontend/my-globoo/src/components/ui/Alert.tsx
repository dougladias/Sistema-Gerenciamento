import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export type AlertType = 'success' | 'warning' | 'error' | 'info';

interface AlertProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
  className?: string;
}

const alertStyles = {
  success: 'bg-green-50 text-green-800 border-green-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
};

const iconStyles = {
  success: 'text-green-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
  info: 'text-blue-400',
};

const Alert: React.FC<AlertProps> = ({ type, message, onClose, className = '' }) => {
  if (!message) return null;

  return (
    <div className={`rounded-md border p-4 ${alertStyles[type]} ${className}`} role="alert">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {/* Ícone pode ser personalizado com base no tipo */}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm">{message}</p>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${iconStyles[type]}`}
              onClick={onClose}
            >
              <span className="sr-only">Fechar</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;
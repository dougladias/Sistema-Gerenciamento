'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string | string[];
  requiredPermission?: {
    resource: string;
    action: string;
  };
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  fallback
}) => {
  const { isAuthenticated, isLoading, user, hasRole, checkPermission } = useAuth();
  const router = useRouter();

  // Se ainda está carregando, mostra loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Se não está autenticado, redireciona para login
  if (!isAuthenticated) {
    router.push('/login');
    return null;
  }

  // Verifica role se especificado
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasRequiredRole = roles.some(role => hasRole(role));
    
    if (!hasRequiredRole) {
      return (
        fallback || (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Acesso Negado
              </h2>
              <p className="text-gray-600 mb-4">
                Você não tem permissão para acessar esta página.
              </p>
              <p className="text-sm text-gray-500">
                Role necessário: {Array.isArray(requiredRole) ? requiredRole.join(' ou ') : requiredRole}
              </p>
              <p className="text-sm text-gray-500">
                Seu role: {user?.role}
              </p>
              <button
                onClick={() => router.back()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        )
      );
    }
  }

  // Verifica permissão se especificada
  if (requiredPermission) {
    const hasPermission = checkPermission(
      requiredPermission.resource,
      requiredPermission.action
    );
    
    if (!hasPermission) {
      return (
        fallback || (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Permissão Negada
              </h2>
              <p className="text-gray-600 mb-4">
                Você não tem permissão para realizar esta ação.
              </p>
              <p className="text-sm text-gray-500">
                Permissão necessária: {requiredPermission.resource}:{requiredPermission.action}
              </p>
              <p className="text-sm text-gray-500">
                Seu role: {user?.role}
              </p>
              <button
                onClick={() => router.back()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        )
      );
    }
  }

  // Se passou por todas as verificações, renderiza o conteúdo
  return <>{children}</>;
};

export default ProtectedRoute;
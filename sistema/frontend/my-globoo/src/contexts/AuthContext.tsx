'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthContextType, User, LoginRequest, RegisterRequest, SystemRole, ROLE_PERMISSIONS, SystemPermission } from '@/types/auth';
import authService from '@/services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Inicialização do contexto
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser);
          
          // Valida o token com o servidor
          const validation = await authService.validateToken(storedToken);
          
          if (validation.valid) {
            setToken(storedToken);
            setUser(parsedUser);
            setIsAuthenticated(true);
          } else {
            // Token inválido, limpa o storage
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
        }
      } catch (error) {
        console.error('Erro na inicialização da autenticação:', error);
        // Limpa dados inválidos
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login
  const login = useCallback(async (credentials: LoginRequest): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authService.login(credentials);
      
      if (response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        
        // Salva no localStorage
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('auth_user', JSON.stringify(response.user));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Registro
  const register = useCallback(async (data: RegisterRequest): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authService.register(data);
      
      if (response.token && response.user) {
        setToken(response.token);
        setUser(response.user);
        setIsAuthenticated(true);
        
        // Salva no localStorage
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('auth_user', JSON.stringify(response.user));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro no registro:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      if (token) {
        await authService.logout();
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // Limpa o estado local
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      
      // Limpa o localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  }, [token]);

  // Verifica se o usuário tem uma permissão específica
  const checkPermission = useCallback((resource: string, action: string): boolean => {
    if (!user || !isAuthenticated) return false;
    
    // Manager tem todas as permissões
    if (user.role === 'manager') return true;
    
    // Verifica nas permissões específicas do usuário
    const permission = `${resource}:${action}`;
    if (user.permissions && user.permissions.includes(permission)) return true;
    
    // Verifica nas permissões baseadas no role
    const rolePermissions = ROLE_PERMISSIONS[user.role as SystemRole] || [];
    return rolePermissions.includes(permission as SystemPermission);
  }, [user, isAuthenticated]);

  // Verifica se o usuário tem um role específico
  const hasRole = useCallback((roleName: string): boolean => {
    if (!user || !isAuthenticated) return false;
    return user.role === roleName;
  }, [user, isAuthenticated]);

  // Verifica se o usuário pode acessar uma rota
  const canAccess = useCallback((route: string): boolean => {
    if (!user || !isAuthenticated) return false;
    
    // Rotas públicas
    const publicRoutes = ['/login', '/register', '/'];
    if (publicRoutes.includes(route)) return true;
    
    // Manager pode acessar tudo
    if (user.role === 'manager') return true;
    
    // Mapeia rotas para permissões
    const routePermissions: Record<string, string> = {
      '/users': 'users:read',
      '/workers': 'workers:read',
      '/documents': 'documents:read',
      '/timesheet': 'timesheet:read',
      '/templates': 'templates:read',
      '/payroll': 'payroll:read'
    };
    
    const requiredPermission = routePermissions[route];
    if (!requiredPermission) return true; // Rota não mapeada, permite acesso
    
    const [resource, action] = requiredPermission.split(':');
    return checkPermission(resource, action);
  }, [user, isAuthenticated, checkPermission]);

  // Refresh do token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const response = await authService.refreshToken(token);
      
      if (response.token) {
        setToken(response.token);
        localStorage.setItem('auth_token', response.token);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      // Se falhar, faz logout
      logout();
      return false;
    }
  }, [token, logout]);

  // Atualiza perfil do usuário
  const updateProfile = useCallback(async (updates: Partial<User>): Promise<boolean> => {
    if (!token || !user) return false;
    
    try {
      const updatedUser = await authService.updateProfile(updates, token);
      setUser(updatedUser);
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      return true;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return false;
    }
  }, [token, user]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    checkPermission,
    hasRole,
    canAccess,
    refreshToken,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar o contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export default AuthContext;
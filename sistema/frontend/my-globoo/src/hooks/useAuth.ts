import { useState, useCallback } from 'react';
import { User, Role, Permission } from '@/types/auth';
import authService from '@/services/authService';
import { useAuth } from '@/contexts/AuthContext';

export const useAuthManagement = () => {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gerenciamento de Usuários
  const fetchUsers = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await authService.getAllUsers(token);
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar usuários');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createUser = useCallback(async (userData: {
    email: string;
    password: string;
    name: string;
    role: string;
    permissions?: string[];
  }) => {
    if (!token) return null;
    
    setLoading(true);
    setError(null);
    try {
      const newUser = await authService.createUser(userData, token);
      setUsers(prev => [...prev, newUser]);
      return newUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar usuário');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    if (!token) return null;
    
    setLoading(true);
    setError(null);
    try {
      const updatedUser = await authService.updateUser(id, updates, token);
      setUsers(prev => prev.map(user => 
        (user._id || user.id) === id ? updatedUser : user
      ));
      return updatedUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar usuário');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const deleteUser = useCallback(async (id: string) => {
    if (!token) return false;
    
    setLoading(true);
    setError(null);
    try {
      await authService.deleteUser(id, token);
      setUsers(prev => prev.filter(user => (user._id || user.id) !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir usuário');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const changeUserRole = useCallback(async (userId: string, role: string) => {
    if (!token) return null;
    
    setLoading(true);
    setError(null);
    try {
      const updatedUser = await authService.changeUserRole(userId, role, token);
      setUsers(prev => prev.map(user => 
        (user._id || user.id) === userId ? updatedUser : user
      ));
      return updatedUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar role do usuário');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Busca usuário por email
  const fetchUserByEmail = useCallback(async (email: string) => {
    if (!token) return null;
    
    setLoading(true);
    setError(null);
    try {
      const user = await authService.getUserByEmail(email, token);
      return user;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar usuário por email');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Gerenciamento de Roles
  const fetchRoles = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await authService.getAllRoles();
      setRoles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar roles');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createRole = useCallback(async (roleData: {
    name: string;
    description: string;
    permissions: string[];
  }) => {
    if (!token) return null;
    
    setLoading(true);
    setError(null);
    try {
      const newRole = await authService.createRole(roleData);
      setRoles(prev => [...prev, newRole]);
      return newRole;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar role');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Gerenciamento de Permissões
  const fetchPermissions = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await authService.getAllPermissions();
      setPermissions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar permissões');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Verifica permissões
  const checkUserPermission = useCallback(async (resource: string, action: string) => {
    if (!token) return false;
    
    try {
      const result = await authService.checkPermission(resource, action, token);
      return result.hasPermission;
    } catch (err) {
      console.error('Erro ao verificar permissão:', err);
      return false;
    }
  }, [token]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Estados
    users,
    roles,
    permissions,
    loading,
    error,
    
    // Funções de usuários
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    changeUserRole,
    fetchUserByEmail,
    
    // Funções de roles
    fetchRoles,
    createRole,
    
    // Funções de permissões
    fetchPermissions,
    checkUserPermission,
    
    // Utilitários
    clearError
  };
};
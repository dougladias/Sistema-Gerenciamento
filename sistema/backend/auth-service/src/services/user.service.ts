import { userRepository, UserFilters } from '../repositories/user.repository';
import { roleRepository } from '../repositories/role.repository';
import bcrypt from 'bcrypt';

// Interfaces para os serviços
export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: string; // Role ID
  customPermissions?: string[];
  status?: 'active' | 'inactive';
  createdBy?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  customPermissions?: string[];
  status?: 'active' | 'inactive' | 'suspended';
}

export interface AuditLogFilters {
  page: number;
  limit: number;
  userId: string;
  action: string;
  startDate: string;
  endDate: string;
}

export class UserService {

  // ===== CRUD DE USUÁRIOS =====

  // Buscar usuários com filtros e paginação
  async getUsers(filters: UserFilters) {
    try {
      const result = await userRepository.findAll(filters);

      return {
        users: result.users,
        pagination: {
          current: filters.page || 1,
          total: Math.ceil(result.total / (filters.limit || 10)),
          count: result.users.length,
          totalItems: result.total
        }
      };

    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
  }

  // Buscar usuário por ID
  async getUserById(id: string) {
    try {
      const user = await userRepository.findById(id);

      if (!user) return null;

      // Combina permissões da role com customizadas
      const rolePermissions = (user.role as any).permissions || [];
      const customPermissions = user.customPermissions || [];
      const allPermissions = [...new Set([...rolePermissions, ...customPermissions])];

      return {
        ...user.toObject(),
        allPermissions
      };

    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      throw error;
    }
  }

  // Criar novo usuário
  async createUser(userData: CreateUserData) {
    try {
      // Verifica se email já existe
      const existingUser = await userRepository.findByEmail(userData.email);
      if (existingUser) {
        return {
          success: false,
          message: 'Email já está em uso'
        };
      }

      // Verifica se a role existe
      const role = await roleRepository.findById(userData.role);
      if (!role) {
        return {
          success: false,
          message: 'Role não encontrada'
        };
      }

      // Valida força da senha
      if (userData.password.length < 6) {
        return {
          success: false,
          message: 'Senha deve ter pelo menos 6 caracteres'
        };
      }

      // Cria o usuário
      const newUser = await userRepository.create({
        name: userData.name.trim(),
        email: userData.email.toLowerCase().trim(),
        password: userData.password,
        role: userData.role,
        customPermissions: userData.customPermissions || [],
        status: userData.status || 'active',
        createdBy: userData.createdBy
      } as any);

      // Busca o usuário criado com dados completos
      const createdUser = await this.getUserById((newUser._id as any).toString());

      return {
        success: true,
        message: 'Usuário criado com sucesso',
        data: createdUser
      };

    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return {
        success: false,
        message: `Erro ao criar usuário: ${(error as Error).message}`
      };
    }
  }

  // Atualizar usuário
  async updateUser(id: string, updateData: UpdateUserData) {
    try {
      // Busca o usuário atual
      const currentUser = await userRepository.findById(id);
      if (!currentUser) {
        return {
          success: false,
          message: 'Usuário não encontrado'
        };
      }

      // Verifica conflito de email se estiver sendo alterado
      if (updateData.email && updateData.email !== currentUser.email) {
        const existingUser = await userRepository.findByEmail(updateData.email);
        
        if (existingUser && (existingUser._id as any).toString() !== id) {
          return {
            success: false,
            message: 'Email já está em uso'
          };
        }
      }

      // Verifica se a role existe se estiver sendo alterada
      if (updateData.role) {
        const role = await roleRepository.findById(updateData.role);
        if (!role) {
          return {
            success: false,
            message: 'Role não encontrada'
          };
        }
      }

      // Prepara dados para atualização
      const updateFields: any = {};
      
      if (updateData.name) updateFields.name = updateData.name.trim();
      if (updateData.email) updateFields.email = updateData.email.toLowerCase().trim();
      if (updateData.role) updateFields.role = updateData.role;
      if (updateData.customPermissions !== undefined) updateFields.customPermissions = updateData.customPermissions;
      if (updateData.status) updateFields.status = updateData.status;

      // Hash da nova senha se fornecida
      if (updateData.password) {
        if (updateData.password.length < 6) {
          return {
            success: false,
            message: 'Senha deve ter pelo menos 6 caracteres'
          };
        }
        const salt = await bcrypt.genSalt(12);
        updateFields.password = await bcrypt.hash(updateData.password, salt);
      }

      // Atualiza o usuário
      await userRepository.update(id, updateFields);

      // Busca dados atualizados
      const updatedUser = await this.getUserById(id);

      return {
        success: true,
        message: 'Usuário atualizado com sucesso',
        data: updatedUser
      };

    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return {
        success: false,
        message: `Erro ao atualizar usuário: ${(error as Error).message}`
      };
    }
  }

  // Deletar usuário
  async deleteUser(id: string) {
    try {
      const user = await userRepository.findById(id);
      if (!user) {
        return {
          success: false,
          message: 'Usuário não encontrado'
        };
      }

      // Verifica se há outros usuários criados por este usuário
      const createdUsers = await userRepository.findByCreator(id);
      if (createdUsers.length > 0) {
        return {
          success: false,
          message: `Não é possível excluir usuário que criou outros ${createdUsers.length} usuário(s)`
        };
      }

      await userRepository.delete(id);

      return {
        success: true,
        message: 'Usuário excluído com sucesso'
      };

    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      return {
        success: false,
        message: `Erro ao excluir usuário: ${(error as Error).message}`
      };
    }
  }

  // Atualizar status do usuário
  async updateUserStatus(id: string, status: 'active' | 'inactive' | 'suspended') {
    try {
      const user = await userRepository.updateStatus(id, status);

      if (!user) {
        return {
          success: false,
          message: 'Usuário não encontrado'
        };
      }

      return {
        success: true,
        message: `Status alterado para ${status}`,
        data: {
          id: user._id,
          name: user.name,
          email: user.email,
          status: user.status
        }
      };

    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      return {
        success: false,
        message: `Erro ao atualizar status: ${(error as Error).message}`
      };
    }
  }

  // ===== ESTATÍSTICAS E DASHBOARD =====

  async getDashboardStats() {
    try {
      const stats = await userRepository.getDashboardStats();
      
      // Adiciona informações extras
      const totalRoles = await roleRepository.findAll();

      return {
        ...stats,
        summary: {
          ...stats.summary,
          totalRoles: totalRoles.length
        }
      };

    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      throw error;
    }
  }

  // ===== LOGS DE AUDITORIA =====

  async getAuditLogs(filters: AuditLogFilters) {
    try {
      // Em uma implementação real, você teria uma collection separada para logs
      // Por simplicidade, vamos retornar dados mockados baseados nos filtros
      
      const mockLogs = [
        {
          id: '1',
          userId: '507f1f77bcf86cd799439011',
          userEmail: 'admin@sistema.com',
          action: 'user:create',
          details: 'Criou usuário joão@empresa.com',
          ip: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          timestamp: new Date()
        },
        {
          id: '2',
          userId: '507f1f77bcf86cd799439012',
          userEmail: 'gerente@sistema.com',
          action: 'worker:update',
          details: 'Atualizou dados do funcionário Maria Silva',
          ip: '192.168.1.2',
          userAgent: 'Mozilla/5.0...',
          timestamp: new Date(Date.now() - 60000)
        }
      ];

      // Filtra logs se necessário
      let filteredLogs = mockLogs;
      
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }
      
      if (filters.action) {
        filteredLogs = filteredLogs.filter(log => log.action.includes(filters.action));
      }

      return {
        logs: filteredLogs.slice((filters.page - 1) * filters.limit, filters.page * filters.limit),
        pagination: {
          current: filters.page,
          total: Math.ceil(filteredLogs.length / filters.limit),
          count: Math.min(filters.limit, filteredLogs.length),
          totalItems: filteredLogs.length
        }
      };

    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error);
      throw error;
    }
  }

  // ===== RELATÓRIOS =====

  async generateUserReport(options: { format: string; startDate: string; endDate: string }) {
    try {
      // Query base
      const filters: UserFilters = { page: 1, limit: 1000 };
      
      const result = await userRepository.findAll(filters);
      let users = result.users;

      // Filtra por data se especificado
      if (options.startDate && options.endDate) {
        const startDate = new Date(options.startDate);
        const endDate = new Date(options.endDate);
        
        users = users.filter(user => {
          const createdAt = new Date(user.createdAt);
          return createdAt >= startDate && createdAt <= endDate;
        });
      }

      if (options.format === 'csv') {
        // Gera CSV
        const headers = ['Nome', 'Email', 'Role', 'Status', 'Criado em', 'Último Login', 'Criado por'];
        const rows = users.map(user => [
          user.name,
          user.email,
          (user.role as any)?.name || '',
          user.status,
          user.createdAt.toISOString().split('T')[0],
          user.lastLogin ? user.lastLogin.toISOString().split('T')[0] : '',
          (user.createdBy as any)?.name || ''
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        return csv;
      }

      // Retorna JSON
      return {
        totalUsers: users.length,
        generatedAt: new Date(),
        filters: options,
        users: users.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          role: (user.role as any)?.name || '',
          status: user.status,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          createdBy: (user.createdBy as any)?.name || ''
        }))
      };

    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }

  // ===== UTILITÁRIOS =====

  // Buscar usuários por role
  async getUsersByRole(roleId: string) {
    try {
      const { users } = await userRepository.findAll({ role: roleId });
      
      return users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        lastLogin: user.lastLogin
      }));

    } catch (error) {
      console.error('Erro ao buscar usuários por role:', error);
      throw error;
    }
  }

  // Resetar senha do usuário
  async resetUserPassword(userId: string, newPassword: string) {
    try {
      if (newPassword.length < 6) {
        return {
          success: false,
          message: 'Senha deve ter pelo menos 6 caracteres'
        };
      }

      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await userRepository.update(userId, {
        password: hashedPassword,
        // Reset tentativas de login
        loginAttempts: 0,
        lockUntil: undefined
      } as any);

      return {
        success: true,
        message: 'Senha resetada com sucesso'
      };

    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      return {
        success: false,
        message: `Erro ao resetar senha: ${(error as Error).message}`
      };
    }
  }
}

// Exporta instância única do serviço
export const userService = new UserService();
export default userService;
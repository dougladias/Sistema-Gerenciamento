import { roleRepository } from '../repositories/role.repository';
import { permissionRepository } from '../repositories/permission.repository';
import { userRepository } from '../repositories/user.repository';

// Interfaces para o serviço
export interface CreateRoleData {
  name: string;
  description: string;
  permissions: string[];
  isDefault?: boolean;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissions?: string[];
  isDefault?: boolean;
}

export class RoleService {

  // ===== CRUD DE ROLES =====

  // Buscar todas as roles
  async getAllRoles() {
    try {
      const roles = await roleRepository.findAll();
      
      // Adiciona contador de usuários para cada role
      const rolesWithUserCount = await Promise.all(
        roles.map(async (role) => {
          const userCount = await roleRepository.countUsers((role._id as any).toString());
          return {
            ...role.toObject(),
            userCount
          };
        })
      );

      return rolesWithUserCount;

    } catch (error) {
      console.error('Erro ao buscar roles:', error);
      throw error;
    }
  }

  // Buscar role por ID
  async getRoleById(id: string) {
    try {
      const role = await roleRepository.findById(id);
      
      if (!role) return null;

      // Adiciona contador de usuários
      const userCount = await roleRepository.countUsers(id);
      
      return {
        ...role.toObject(),
        userCount
      };

    } catch (error) {
      console.error('Erro ao buscar role:', error);
      throw error;
    }
  }

  // Buscar role por nome
  async getRoleByName(name: string) {
    try {
      return await roleRepository.findByName(name);
    } catch (error) {
      console.error('Erro ao buscar role por nome:', error);
      throw error;
    }
  }

  // Buscar role padrão
  async getDefaultRole() {
    try {
      return await roleRepository.findDefault();
    } catch (error) {
      console.error('Erro ao buscar role padrão:', error);
      throw error;
    }
  }

  // Criar nova role
  async createRole(roleData: CreateRoleData) {
    try {
      // Verifica se nome já existe
      const existingRole = await roleRepository.findByName(roleData.name);
      if (existingRole) {
        return {
          success: false,
          message: 'Já existe uma role com este nome'
        };
      }

      // Valida permissões
      const validationResult = await this.validatePermissions(roleData.permissions);
      if (!validationResult.valid) {
        return {
          success: false,
          message: validationResult.message
        };
      }

      // Se for definida como padrão, remove a flag de outras roles
      if (roleData.isDefault) {
        await this.removeDefaultFromOtherRoles();
      }

      // Cria a role
      const newRole = await roleRepository.create({
        name: roleData.name.trim(),
        description: roleData.description.trim(),
        permissions: roleData.permissions,
        isDefault: roleData.isDefault || false
      } as any);

      return {
        success: true,
        message: 'Role criada com sucesso',
        data: newRole
      };

    } catch (error) {
      console.error('Erro ao criar role:', error);
      return {
        success: false,
        message: `Erro ao criar role: ${(error as Error).message}`
      };
    }
  }

  // Atualizar role
  async updateRole(id: string, updateData: UpdateRoleData) {
    try {
      // Verifica se a role existe
      const existingRole = await roleRepository.findById(id);
      if (!existingRole) {
        return {
          success: false,
          message: 'Role não encontrada'
        };
      }

      // Verifica conflito de nome se estiver sendo alterado
      if (updateData.name && updateData.name !== existingRole.name) {
        const nameConflict = await roleRepository.findByName(updateData.name);
        if (nameConflict) {
          return {
            success: false,
            message: 'Já existe uma role com este nome'
          };
        }
      }

      // Valida permissões se estiverem sendo alteradas
      if (updateData.permissions) {
        const validationResult = await this.validatePermissions(updateData.permissions);
        if (!validationResult.valid) {
          return {
            success: false,
            message: validationResult.message
          };
        }
      }

      // Se for definida como padrão, remove a flag de outras roles
      if (updateData.isDefault) {
        await this.removeDefaultFromOtherRoles();
      }

      // Prepara dados para atualização
      const updateFields: any = {};
      if (updateData.name) updateFields.name = updateData.name.trim();
      if (updateData.description) updateFields.description = updateData.description.trim();
      if (updateData.permissions) updateFields.permissions = updateData.permissions;
      if (updateData.isDefault !== undefined) updateFields.isDefault = updateData.isDefault;

      // Atualiza a role
      const updatedRole = await roleRepository.update(id, updateFields);

      return {
        success: true,
        message: 'Role atualizada com sucesso',
        data: updatedRole
      };

    } catch (error) {
      console.error('Erro ao atualizar role:', error);
      return {
        success: false,
        message: `Erro ao atualizar role: ${(error as Error).message}`
      };
    }
  }

  // Deletar role
  async deleteRole(id: string) {
    try {
      const role = await roleRepository.findById(id);
      if (!role) {
        return {
          success: false,
          message: 'Role não encontrada'
        };
      }

      // Verifica se há usuários usando esta role
      const userCount = await roleRepository.countUsers(id);
      if (userCount > 0) {
        return {
          success: false,
          message: `Não é possível excluir role que está sendo usada por ${userCount} usuário(s)`
        };
      }

      // Não permite excluir role padrão se for a única
      if (role.isDefault) {
        const allRoles = await roleRepository.findAll();
        if (allRoles.length <= 1) {
          return {
            success: false,
            message: 'Não é possível excluir a única role do sistema'
          };
        }
      }

      await roleRepository.delete(id);

      return {
        success: true,
        message: 'Role excluída com sucesso'
      };

    } catch (error) {
      console.error('Erro ao excluir role:', error);
      return {
        success: false,
        message: `Erro ao excluir role: ${(error as Error).message}`
      };
    }
  }

  // ===== GERENCIAMENTO DE PERMISSÕES =====

  // Buscar todas as permissões disponíveis
  async getAllPermissions() {
    try {
      return await permissionRepository.getGroupedByResource();
    } catch (error) {
      console.error('Erro ao buscar permissões:', error);
      throw error;
    }
  }

  // Buscar permissões por categoria
  async getPermissionsByCategory(category: string) {
    try {
      return await permissionRepository.findByCategory(category);
    } catch (error) {
      console.error('Erro ao buscar permissões por categoria:', error);
      throw error;
    }
  }

  // Adicionar permissão à role
  async addPermissionToRole(roleId: string, permission: string) {
    try {
      // Verifica se a role existe
      const role = await roleRepository.findById(roleId);
      if (!role) {
        return {
          success: false,
          message: 'Role não encontrada'
        };
      }

      // Verifica se a permissão é válida
      const [resource, action] = permission.split(':');
      const validPermission = await permissionRepository.findByCode(resource, action);
      if (!validPermission) {
        return {
          success: false,
          message: 'Permissão inválida'
        };
      }

      // Adiciona a permissão
      const updatedRole = await roleRepository.addPermission(roleId, permission);

      return {
        success: true,
        message: 'Permissão adicionada com sucesso',
        data: updatedRole
      };

    } catch (error) {
      console.error('Erro ao adicionar permissão:', error);
      return {
        success: false,
        message: `Erro ao adicionar permissão: ${(error as Error).message}`
      };
    }
  }

  // Remover permissão da role
  async removePermissionFromRole(roleId: string, permission: string) {
    try {
      // Verifica se a role existe
      const role = await roleRepository.findById(roleId);
      if (!role) {
        return {
          success: false,
          message: 'Role não encontrada'
        };
      }

      // Remove a permissão
      const updatedRole = await roleRepository.removePermission(roleId, permission);

      return {
        success: true,
        message: 'Permissão removida com sucesso',
        data: updatedRole
      };

    } catch (error) {
      console.error('Erro ao remover permissão:', error);
      return {
        success: false,
        message: `Erro ao remover permissão: ${(error as Error).message}`
      };
    }
  }

  // ===== UTILITÁRIOS =====

  // Validar lista de permissões
  private async validatePermissions(permissions: string[]): Promise<{ valid: boolean; message?: string }> {
    try {
      if (!permissions || permissions.length === 0) {
        return {
          valid: false,
          message: 'Role deve ter pelo menos uma permissão'
        };
      }

      // Verifica formato das permissões
      for (const permission of permissions) {
        if (!/^[a-z]+:[a-z]+$/.test(permission)) {
          return {
            valid: false,
            message: `Formato de permissão inválido: ${permission}. Use o formato "resource:action"`
          };
        }

        // Verifica se a permissão existe
        const [resource, action] = permission.split(':');
        const validPermission = await permissionRepository.findByCode(resource, action);
        if (!validPermission) {
          return {
            valid: false,
            message: `Permissão não encontrada: ${permission}`
          };
        }
      }

      return { valid: true };

    } catch (error) {
      return {
        valid: false,
        message: 'Erro ao validar permissões'
      };
    }
  }

  // Remove flag de padrão de outras roles
  private async removeDefaultFromOtherRoles(): Promise<void> {
    try {
      const allRoles = await roleRepository.findAll();
      for (const role of allRoles) {
        if (role.isDefault) {
          await roleRepository.update((role._id as any).toString(), { isDefault: false });
        }
      }
    } catch (error) {
      console.error('Erro ao remover flag padrão de outras roles:', error);
    }
  }

  // Buscar usuários que usam uma role específica
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

  // Clonar role (criar cópia)
  async cloneRole(roleId: string, newName: string) {
    try {
      const originalRole = await roleRepository.findById(roleId);
      if (!originalRole) {
        return {
          success: false,
          message: 'Role original não encontrada'
        };
      }

      // Verifica se novo nome já existe
      const nameExists = await roleRepository.findByName(newName);
      if (nameExists) {
        return {
          success: false,
          message: 'Já existe uma role com este nome'
        };
      }

      // Cria nova role baseada na original
      const clonedRole = await roleRepository.create({
        name: newName.trim(),
        description: `Cópia de ${originalRole.name} - ${originalRole.description}`,
        permissions: [...originalRole.permissions],
        isDefault: false
      } as any);

      return {
        success: true,
        message: 'Role clonada com sucesso',
        data: clonedRole
      };

    } catch (error) {
      console.error('Erro ao clonar role:', error);
      return {
        success: false,
        message: `Erro ao clonar role: ${(error as Error).message}`
      };
    }
  }

  // Estatísticas de roles
  async getRoleStats() {
    try {
      const allRoles = await roleRepository.findAll();
      
      const stats = await Promise.all(
        allRoles.map(async (role) => {
          const userCount = await roleRepository.countUsers((role._id as any).toString());
          return {
            id: role._id,
            name: role.name,
            userCount,
            permissionCount: role.permissions.length,
            isDefault: role.isDefault
          };
        })
      );

      return {
        totalRoles: allRoles.length,
        defaultRole: allRoles.find(role => role.isDefault)?.name || 'Nenhuma',
        roles: stats.sort((a, b) => b.userCount - a.userCount)
      };

    } catch (error) {
      console.error('Erro ao buscar estatísticas de roles:', error);
      throw error;
    }
  }
}

// Exporta instância única do serviço
export const roleService = new RoleService();
export default roleService;
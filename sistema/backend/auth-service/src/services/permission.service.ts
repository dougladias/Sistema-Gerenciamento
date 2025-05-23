import { permissionRepository } from '../repositories/permission.repository';

// Interface para criar permissão
export interface CreatePermissionData {
  resource: string;
  action: string;
  description: string;
  category?: string;
}

// Interface para atualizar permissão
export interface UpdatePermissionData {
  description?: string;
  category?: string;
}

export class PermissionService {

  // ===== CRUD DE PERMISSÕES =====

  // Buscar todas as permissões
  async getAllPermissions() {
    try {
      return await permissionRepository.findAll();
    } catch (error) {
      console.error('Erro ao buscar permissões:', error);
      throw error;
    }
  }

  // Buscar permissões agrupadas por recurso
  async getGroupedPermissions() {
    try {
      return await permissionRepository.getGroupedByResource();
    } catch (error) {
      console.error('Erro ao buscar permissões agrupadas:', error);
      throw error;
    }
  }

  // Buscar permissão por ID
  async getPermissionById(id: string) {
    try {
      return await permissionRepository.findById(id);
    } catch (error) {
      console.error('Erro ao buscar permissão:', error);
      throw error;
    }
  }

  // Buscar permissões por recurso
  async getPermissionsByResource(resource: string) {
    try {
      return await permissionRepository.findByResource(resource);
    } catch (error) {
      console.error('Erro ao buscar permissões por recurso:', error);
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

  // Buscar permissão por código (resource:action)
  async getPermissionByCode(resource: string, action: string) {
    try {
      return await permissionRepository.findByCode(resource, action);
    } catch (error) {
      console.error('Erro ao buscar permissão por código:', error);
      throw error;
    }
  }

  // Criar nova permissão
  async createPermission(permissionData: CreatePermissionData) {
    try {
      // Verifica se já existe permissão com este resource:action
      const existingPermission = await permissionRepository.findByCode(
        permissionData.resource,
        permissionData.action
      );

      if (existingPermission) {
        return {
          success: false,
          message: `Permissão ${permissionData.resource}:${permissionData.action} já existe`
        };
      }

      // Valida dados
      const validation = this.validatePermissionData(permissionData);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.message
        };
      }

      // Cria a permissão
      const newPermission = await permissionRepository.create({
        resource: permissionData.resource.toLowerCase(),
        action: permissionData.action.toLowerCase(),
        description: permissionData.description.trim(),
        category: permissionData.category || 'basic'
      } as any);

      return {
        success: true,
        message: 'Permissão criada com sucesso',
        data: newPermission
      };

    } catch (error) {
      console.error('Erro ao criar permissão:', error);
      return {
        success: false,
        message: `Erro ao criar permissão: ${(error as Error).message}`
      };
    }
  }

  // Atualizar permissão
  async updatePermission(id: string, updateData: UpdatePermissionData) {
    try {
      // Verifica se a permissão existe
      const existingPermission = await permissionRepository.findById(id);
      if (!existingPermission) {
        return {
          success: false,
          message: 'Permissão não encontrada'
        };
      }

      // Prepara dados para atualização (resource e action não podem ser alterados)
      const updateFields: any = {};
      if (updateData.description) updateFields.description = updateData.description.trim();
      if (updateData.category) updateFields.category = updateData.category;

      // Atualiza a permissão
      const updatedPermission = await permissionRepository.update(id, updateFields);

      return {
        success: true,
        message: 'Permissão atualizada com sucesso',
        data: updatedPermission
      };

    } catch (error) {
      console.error('Erro ao atualizar permissão:', error);
      return {
        success: false,
        message: `Erro ao atualizar permissão: ${(error as Error).message}`
      };
    }
  }

  // Deletar permissão
  async deletePermission(id: string) {
    try {
      const permission = await permissionRepository.findById(id);
      if (!permission) {
        return {
          success: false,
          message: 'Permissão não encontrada'
        };
      }

      // Verifica se a permissão está sendo usada em alguma role
      const isUsed = await this.isPermissionInUse(`${permission.resource}:${permission.action}`);
      if (isUsed) {
        return {
          success: false,
          message: 'Não é possível excluir permissão que está sendo usada por alguma role'
        };
      }

      await permissionRepository.delete(id);

      return {
        success: true,
        message: 'Permissão excluída com sucesso'
      };

    } catch (error) {
      console.error('Erro ao excluir permissão:', error);
      return {
        success: false,
        message: `Erro ao excluir permissão: ${(error as Error).message}`
      };
    }
  }

  // ===== UTILITÁRIOS =====

  // Validar dados da permissão
  private validatePermissionData(data: CreatePermissionData): { valid: boolean; message?: string } {
    // Valida resource
    if (!data.resource || data.resource.trim().length < 2) {
      return {
        valid: false,
        message: 'Resource deve ter pelo menos 2 caracteres'
      };
    }

    // Valida action
    if (!data.action || data.action.trim().length < 2) {
      return {
        valid: false,
        message: 'Action deve ter pelo menos 2 caracteres'
      };
    }

    // Valida description
    if (!data.description || data.description.trim().length < 5) {
      return {
        valid: false,
        message: 'Description deve ter pelo menos 5 caracteres'
      };
    }

    // Valida formato (apenas letras minúsculas para resource e action)
    if (!/^[a-z]+$/.test(data.resource)) {
      return {
        valid: false,
        message: 'Resource deve conter apenas letras minúsculas'
      };
    }

    if (!/^[a-z]+$/.test(data.action)) {
      return {
        valid: false,
        message: 'Action deve conter apenas letras minúsculas'
      };
    }

    return { valid: true };
  }

  // Verificar se permissão está sendo usada
  private async isPermissionInUse(permissionCode: string): Promise<boolean> {
    try {
      const { roleRepository } = require('../repositories/role.repository');
      const allRoles = await roleRepository.findAll();
      
      return allRoles.some((role: any) => role.permissions.includes(permissionCode));
    } catch (error) {
      console.error('Erro ao verificar uso da permissão:', error);
      return true; // Por segurança, assume que está em uso
    }
  }

  // Inicializar permissões padrão
  async initializeDefaultPermissions() {
    try {
      await permissionRepository.initializeDefaultPermissions();
      return {
        success: true,
        message: 'Permissões padrão inicializadas com sucesso'
      };
    } catch (error) {
      console.error('Erro ao inicializar permissões padrão:', error);
      return {
        success: false,
        message: `Erro ao inicializar permissões: ${(error as Error).message}`
      };
    }
  }

  // Buscar permissões disponíveis para uma role
  async getAvailablePermissions() {
    try {
      const permissions = await this.getGroupedPermissions();
      
      // Adiciona informações extras para cada permissão
      const enrichedPermissions: any = {};
      
      for (const [resource, perms] of Object.entries(permissions)) {
        enrichedPermissions[resource] = {
          name: this.getResourceDisplayName(resource),
          description: this.getResourceDescription(resource),
          permissions: perms
        };
      }

      return enrichedPermissions;
    } catch (error) {
      console.error('Erro ao buscar permissões disponíveis:', error);
      throw error;
    }
  }

  // Obter nome de exibição do recurso
  private getResourceDisplayName(resource: string): string {
    const displayNames: Record<string, string> = {
      'workers': 'Funcionários',
      'documents': 'Documentos',
      'timesheet': 'Registro de Ponto',
      'reports': 'Relatórios',
      'backoffice': 'Administração'
    };

    return displayNames[resource] || resource;
  }

  // Obter descrição do recurso
  private getResourceDescription(resource: string): string {
    const descriptions: Record<string, string> = {
      'workers': 'Gerenciamento de funcionários e seus dados',
      'documents': 'Upload, download e gerenciamento de documentos',
      'timesheet': 'Controle de entrada e saída dos funcionários',
      'reports': 'Geração e visualização de relatórios',
      'backoffice': 'Painel administrativo e configurações do sistema'
    };

    return descriptions[resource] || 'Recurso do sistema';
  }

  // Validar lista de permissões
  async validatePermissions(permissions: string[]): Promise<{ valid: boolean; message?: string; invalidPermissions?: string[] }> {
    try {
      if (!permissions || permissions.length === 0) {
        return {
          valid: false,
          message: 'Lista de permissões não pode estar vazia'
        };
      }

      const invalidPermissions: string[] = [];

      for (const permission of permissions) {
        // Verifica formato
        if (!/^[a-z]+:[a-z]+$/.test(permission)) {
          invalidPermissions.push(permission);
          continue;
        }

        // Verifica se existe
        const [resource, action] = permission.split(':');
        const exists = await permissionRepository.findByCode(resource, action);
        if (!exists) {
          invalidPermissions.push(permission);
        }
      }

      if (invalidPermissions.length > 0) {
        return {
          valid: false,
          message: `Permissões inválidas encontradas: ${invalidPermissions.join(', ')}`,
          invalidPermissions
        };
      }

      return { valid: true };

    } catch (error) {
      console.error('Erro ao validar permissões:', error);
      return {
        valid: false,
        message: 'Erro ao validar permissões'
      };
    }
  }

  // Obter estatísticas de permissões
  async getPermissionStats() {
    try {
      const allPermissions = await permissionRepository.findAll();
      
      // Agrupa por categoria
      const byCategory = allPermissions.reduce((acc: any, perm) => {
        acc[perm.category] = (acc[perm.category] || 0) + 1;
        return acc;
      }, {});

      // Agrupa por recurso
      const byResource = allPermissions.reduce((acc: any, perm) => {
        acc[perm.resource] = (acc[perm.resource] || 0) + 1;
        return acc;
      }, {});

      return {
        total: allPermissions.length,
        byCategory,
        byResource,
        resources: Object.keys(byResource).length
      };

    } catch (error) {
      console.error('Erro ao buscar estatísticas de permissões:', error);
      throw error;
    }
  }
}

// Exporta instância única do serviço
export const permissionService = new PermissionService();
export default permissionService;
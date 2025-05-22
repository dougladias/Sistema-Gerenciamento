import permissionRepository from '../repositories/permission.repository';
import roleRepository from '../repositories/role.repository';
import { IPermission } from '../models/permission.model';
import roleService from '../services/role.service';

export class PermissionService {
  async createPermission(permissionData: {
    resource: string;
    action: string;
    route?: string;
    description: string;
  }): Promise<IPermission> {
    // Verifica se a permissão já existe
    if (await permissionRepository.exists(permissionData.resource, permissionData.action)) {
      throw new Error('Permissão já existe para este recurso e ação');
    }

    return await permissionRepository.create(permissionData);
  }

  async getPermissionById(id: string): Promise<IPermission | null> {
    return await permissionRepository.findById(id);
  }

  async getPermissionByResourceAndAction(resource: string, action: string): Promise<IPermission | null> {
    return await permissionRepository.findByResourceAndAction(resource, action);
  }

  async getAllPermissions(filter?: any): Promise<IPermission[]> {
    return await permissionRepository.findAll(filter);
  }

  async getPermissionsByResource(resource: string): Promise<IPermission[]> {
    return await permissionRepository.findByResource(resource);
  }

  async getPermissionsByRoute(route: string): Promise<IPermission[]> {
    return await permissionRepository.findByRoute(route);
  }

  async updatePermission(id: string, updateData: Partial<IPermission>): Promise<IPermission | null> {
    const permission = await permissionRepository.findById(id);
    if (!permission) {
      return null;
    }

    // Se está alterando resource/action, verifica duplicação
    if (updateData.resource || updateData.action) {
      const resource = updateData.resource || permission.resource;
      const action = updateData.action || permission.action;
      
      const existing = await permissionRepository.findByResourceAndAction(resource, action);
      if (existing && existing._id.toString() !== id) {
        throw new Error('Já existe uma permissão com este recurso e ação');
      }
    }

    return await permissionRepository.update(id, updateData);
  }

  async deletePermission(id: string): Promise<IPermission | null> {
    const permission = await permissionRepository.findById(id);
    if (!permission) {
      return null;
    }

    // Verifica se alguma role está usando esta permissão
    const rolesUsingPermission = await roleService.getRolesByPermission(id);
    if (rolesUsingPermission.length > 0) {
      const roleNames = rolesUsingPermission.map(r => r.name).join(', ');
      throw new Error(`Não é possível excluir: permissão em uso pelas roles: ${roleNames}`);
    }

    return await permissionRepository.delete(id);
  }

  async groupPermissionsByResource(): Promise<Map<string, IPermission[]>> {
    return await permissionRepository.groupByResource();
  }

  async checkUserPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const { userRepository } = await import('../repositories/user.repository');
    
    const user = await userRepository.findById(userId);
    if (!user || !user.role) {
      return false;
    }

    const role = await roleRepository.findById(user.role.toString());
    if (!role) {
      return false;
    }

    const permission = await permissionRepository.findByResourceAndAction(resource, action);
    if (!permission) {
      return false;
    }

    return role.permissions.some(p => p.toString() === permission._id.toString());
  }

  async checkUserRouteAccess(userId: string, route: string): Promise<boolean> {
    const { userRepository } = await import('../repositories/user.repository');
    
    const user = await userRepository.findById(userId);
    if (!user || !user.role) {
      return false;
    }

    const role = await roleRepository.findById(user.role.toString());
    if (!role) {
      return false;
    }

    const routePermissions = await permissionRepository.findByRoute(route);
    const routePermissionIds = routePermissions.map(p => p._id.toString());

    return role.permissions.some(p => routePermissionIds.includes(p.toString()));
  }

  async getAvailableActions(): Promise<string[]> {
    return ['create', 'read', 'update', 'delete', 'access', 'manage'];
  }

  async bulkCreatePermissions(permissions: Array<{
    resource: string;
    action: string;
    route?: string;
    description: string;
  }>): Promise<IPermission[]> {
    const created: IPermission[] = [];

    for (const permData of permissions) {
      try {
        const permission = await permissionRepository.upsert(permData);
        created.push(permission);
      } catch (error) {
        console.error(`Erro ao criar permissão ${permData.resource}:${permData.action}`, error);
      }
    }

    return created;
  }

  async getPermissionStats(): Promise<{
    total: number;
    byResource: Record<string, number>;
    byAction: Record<string, number>;
  }> {
    const permissions = await permissionRepository.findAll();
    
    const byResource: Record<string, number> = {};
    const byAction: Record<string, number> = {};

    permissions.forEach(perm => {
      byResource[perm.resource] = (byResource[perm.resource] || 0) + 1;
      byAction[perm.action] = (byAction[perm.action] || 0) + 1;
    });

    return {
      total: permissions.length,
      byResource,
      byAction
    };
  }
}

// Exporta uma instância única do serviço
export const permissionService = new PermissionService();
export default permissionService;
import roleRepository from '../repositories/role.repository';
import permissionRepository from '../repositories/permission.repository';
import userRepository from '../repositories/user.repository';
import { IRole } from '../models/role.model';
import { ObjectId } from 'mongodb';

export class RoleService {
  async createRole(roleData: {
    name: string;
    description: string;
    permissions?: string[];
    isDefault?: boolean;
  }): Promise<IRole> {
    // Verifica se a role já existe
    if (await roleRepository.exists(roleData.name)) {
      throw new Error('Role já existe');
    }

    // Valida as permissões se fornecidas
    if (roleData.permissions && roleData.permissions.length > 0) {
      const permissions = await permissionRepository.findByIds(roleData.permissions);
      if (permissions.length !== roleData.permissions.length) {
        throw new Error('Uma ou mais permissões inválidas');
      }
    }

    // Se for marcada como padrão, remove o padrão de outras
    if (roleData.isDefault) {
      const transformedRoleData = {
        ...roleData,
        permissions: roleData.permissions?.map(permission => new ObjectId(permission))
      };
      return await roleRepository.createDefault(transformedRoleData);
    }

    const transformedRoleData = {
      ...roleData,
      permissions: roleData.permissions?.map(permission => new ObjectId(permission))
    };
    return await roleRepository.create(transformedRoleData);
  }

  async getRoleById(id: string): Promise<IRole | null> {
    return await roleRepository.findById(id);
  }

  async getRoleByName(name: string): Promise<IRole | null> {
    return await roleRepository.findByName(name);
  }

  async getAllRoles(filter?: any): Promise<IRole[]> {
    return await roleRepository.findAll(filter);
  }

  async updateRole(id: string, updateData: Partial<IRole>): Promise<IRole | null> {
    const role = await roleRepository.findById(id);
    if (!role) {
      return null;
    }

    // Se está alterando o nome, verifica se já existe
    if (updateData.name && updateData.name !== role.name) {
      if (await roleRepository.exists(updateData.name)) {
        throw new Error('Já existe uma role com este nome');
      }
    }

    // Valida as permissões se fornecidas
    if (updateData.permissions) {
      const permissions = await permissionRepository.findByIds(
        updateData.permissions.map(p => p.toString())
      );
      if (permissions.length !== updateData.permissions.length) {
        throw new Error('Uma ou mais permissões inválidas');
      }
    }

    return await roleRepository.update(id, updateData);
  }

  async deleteRole(id: string): Promise<IRole | null> {
    const role = await roleRepository.findById(id);
    if (!role) {
      return null;
    }

    // Verifica se há usuários usando esta role
    const usersCount = await userRepository.countByRole(id);
    if (usersCount > 0) {
      throw new Error(`Não é possível excluir: ${usersCount} usuário(s) usando esta role`);
    }

    // Verifica se é a role padrão
    if (role.isDefault) {
      throw new Error('Não é possível excluir a role padrão');
    }

    return await roleRepository.delete(id);
  }

  async addPermissionToRole(roleId: string, permissionId: string): Promise<IRole | null> {
    // Verifica se a permissão existe
    const permission = await permissionRepository.findById(permissionId);
    if (!permission) {
      throw new Error('Permissão não encontrada');
    }

    return await roleRepository.addPermission(roleId, permissionId);
  }

  async removePermissionFromRole(roleId: string, permissionId: string): Promise<IRole | null> {
    return await roleRepository.removePermission(roleId, permissionId);
  }

  async setRolePermissions(roleId: string, permissionIds: string[]): Promise<IRole | null> {
    // Valida todas as permissões
    const permissions = await permissionRepository.findByIds(permissionIds);
    if (permissions.length !== permissionIds.length) {
      throw new Error('Uma ou mais permissões inválidas');
    }

    return await roleRepository.setPermissions(roleId, permissionIds);
  }

  async getDefaultRole(): Promise<IRole | null> {
    return await roleRepository.findDefault();
  }

  async setDefaultRole(id: string): Promise<IRole | null> {
    const role = await roleRepository.findById(id);
    if (!role) {
      return null;
    }

    // Remove o padrão de todas as outras roles
    const allRoles = await roleRepository.findAll() as IRole[];
    for (const r of allRoles) {
      if (r.isDefault && r._id.toString() !== id) {
        await roleRepository.update(r._id.toString(), { isDefault: false });
      }
    }

    // Define esta como padrão
    return await roleRepository.update(id, { isDefault: true });
  }

  async getRolesByPermission(permissionId: string): Promise<IRole[]> {
    const allRoles = await roleRepository.findAll();
    return allRoles.filter(role => 
      role.permissions.some(p => p.toString() === permissionId)
    );
  }

  async cloneRole(id: string, newName: string, newDescription: string): Promise<IRole> {
    const sourceRole = await roleRepository.findById(id);
    if (!sourceRole) {
      throw new Error('Role de origem não encontrada');
    }

    if (await roleRepository.exists(newName)) {
      throw new Error('Já existe uma role com este nome');
    }

    return await roleRepository.create({
      name: newName,
      description: newDescription,
      permissions: sourceRole.permissions,
      isDefault: false,
      isSystem: false
    });
  }
}

// Exporta uma instância única do serviço
export const roleService = new RoleService();
export default roleService;
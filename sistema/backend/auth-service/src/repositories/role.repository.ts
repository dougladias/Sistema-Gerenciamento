import createRoleModel, { IRole } from '../models/role.model';
import mongoose from 'mongoose';

export class RoleRepository {
  private Role = createRoleModel();

  async create(roleData: Partial<IRole>): Promise<IRole> {
    const role = new this.Role(roleData);
    return await role.save();
  }

  async findById(id: string): Promise<IRole | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await this.Role.findById(id).populate('permissions');
  }

  async findByName(name: string): Promise<IRole | null> {
    return await this.Role.findOne({ name: name.toLowerCase() }).populate('permissions');
  }

  async findAll(filter: any = {}): Promise<IRole[]> {
    return await this.Role.find(filter)
      .populate('permissions')
      .sort({ name: 1 });
  }

  async findDefault(): Promise<IRole | null> {
    return await this.Role.findOne({ isDefault: true }).populate('permissions');
  }

  async update(id: string, updateData: Partial<IRole>): Promise<IRole | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    
    // Não permite alterar o status de sistema
    delete updateData.isSystem;
    delete updateData.createdAt;
    
    return await this.Role.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('permissions');
  }

  async delete(id: string): Promise<IRole | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    
    // Verifica se não é uma role do sistema
    const role = await this.Role.findById(id);
    if (role && role.isSystem) {
      throw new Error('Não é possível excluir roles do sistema');
    }
    
    return await this.Role.findByIdAndDelete(id);
  }

  async addPermission(roleId: string, permissionId: string): Promise<IRole | null> {
    if (!mongoose.Types.ObjectId.isValid(roleId) || !mongoose.Types.ObjectId.isValid(permissionId)) {
      return null;
    }
    
    return await this.Role.findByIdAndUpdate(
      roleId,
      { $addToSet: { permissions: permissionId } },
      { new: true }
    ).populate('permissions');
  }

  async removePermission(roleId: string, permissionId: string): Promise<IRole | null> {
    if (!mongoose.Types.ObjectId.isValid(roleId) || !mongoose.Types.ObjectId.isValid(permissionId)) {
      return null;
    }
    
    return await this.Role.findByIdAndUpdate(
      roleId,
      { $pull: { permissions: permissionId } },
      { new: true }
    ).populate('permissions');
  }

  async setPermissions(roleId: string, permissionIds: string[]): Promise<IRole | null> {
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return null;
    }
    
    // Valida todos os IDs de permissão
    const validIds = permissionIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    
    return await this.Role.findByIdAndUpdate(
      roleId,
      { permissions: validIds },
      { new: true }
    ).populate('permissions');
  }

  async exists(name: string): Promise<boolean> {
    const count = await this.Role.countDocuments({ name: name.toLowerCase() });
    return count > 0;
  }

  async createDefault(roleData: Partial<IRole>): Promise<IRole> {
    // Remove qualquer role default anterior
    await this.Role.updateMany({ isDefault: true }, { isDefault: false });
    
    // Cria a nova role como default
    return await this.create({ ...roleData, isDefault: true });
  }
}

// Exporta uma instância única do repositório
export const roleRepository = new RoleRepository();
export default roleRepository;
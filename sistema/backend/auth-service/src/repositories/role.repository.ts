import { connectToDatabase } from '../config/database';
import { IRole, createRoleModel } from '../models/role.model';

// Interface para o repositório de Roles
export interface IRoleRepository {
  findAll(): Promise<IRole[]>;
  findById(id: string): Promise<IRole | null>;
  findByName(name: string): Promise<IRole | null>;
  findDefault(): Promise<IRole | null>;
  create(role: Omit<IRole, '_id'>): Promise<IRole>;
  update(id: string, role: Partial<IRole>): Promise<IRole | null>;
  delete(id: string): Promise<boolean>;
  addPermission(id: string, permission: string): Promise<IRole | null>;
  removePermission(id: string, permission: string): Promise<IRole | null>;
  countUsers(roleId: string): Promise<number>;
}

// Implementação do repositório de Roles
export class RoleRepository implements IRoleRepository {
  
  // Busca todas as roles
  async findAll(): Promise<IRole[]> {
    await connectToDatabase();
    const RoleModel = createRoleModel();
    
    return RoleModel.find()
      .sort({ name: 1 })
      .exec();
  }

  // Busca role por ID
  async findById(id: string): Promise<IRole | null> {
    await connectToDatabase();
    const RoleModel = createRoleModel();
    
    return RoleModel.findById(id).exec();
  }

  // Busca role por nome
  async findByName(name: string): Promise<IRole | null> {
    await connectToDatabase();
    const RoleModel = createRoleModel();
    
    return RoleModel.findOne({ name }).exec();
  }

  // Busca role padrão
  async findDefault(): Promise<IRole | null> {
    await connectToDatabase();
    const RoleModel = createRoleModel();
    
    return RoleModel.findOne({ isDefault: true }).exec();
  }

  // Cria nova role
  async create(roleData: Omit<IRole, '_id'>): Promise<IRole> {
    await connectToDatabase();
    const RoleModel = createRoleModel();
    
    const newRole = new RoleModel(roleData);
    return newRole.save();
  }

  // Atualiza role
  async update(id: string, updateData: Partial<IRole>): Promise<IRole | null> {
    await connectToDatabase();
    const RoleModel = createRoleModel();
    
    return RoleModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).exec();
  }

  // Deleta role
  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const RoleModel = createRoleModel();
    
    const result = await RoleModel.findByIdAndDelete(id).exec();
    return result !== null;
  }

  // Adiciona permissão à role
  async addPermission(id: string, permission: string): Promise<IRole | null> {
    await connectToDatabase();
    const RoleModel = createRoleModel();
    
    return RoleModel.findByIdAndUpdate(
      id,
      { $addToSet: { permissions: permission } },
      { new: true }
    ).exec();
  }

  // Remove permissão da role
  async removePermission(id: string, permission: string): Promise<IRole | null> {
    await connectToDatabase();
    const RoleModel = createRoleModel();
    
    return RoleModel.findByIdAndUpdate(
      id,
      { $pull: { permissions: permission } },
      { new: true }
    ).exec();
  }

  // Conta quantos usuários usam esta role
  async countUsers(roleId: string): Promise<number> {
    await connectToDatabase();
    const { createUserModel } = require('../models/user.model');
    const UserModel = createUserModel();
    
    return UserModel.countDocuments({ role: roleId });
  }
}

// Exporta instância única do repositório
export const roleRepository = new RoleRepository();
export default roleRepository;
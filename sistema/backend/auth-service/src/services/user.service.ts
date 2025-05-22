import userRepository from '../repositories/user.repository';
import roleRepository from '../repositories/role.repository';
import { IUser } from '../models/user.model';

export class UserService {
  async createUser(userData: {
    email: string;
    password: string;
    name: string;
    roleId?: string;
  }): Promise<IUser> {
    // Verifica se o usuário já existe
    if (await userRepository.exists(userData.email)) {
      throw new Error('Email já cadastrado');
    }

    // Se não foi especificada uma role, usa a padrão
    let roleId = userData.roleId;
    if (!roleId) {
      const defaultRole = await roleRepository.findDefault();
      if (!defaultRole) {
        throw new Error('Role padrão não encontrada');
      }
      roleId = defaultRole._id.toString();
      if (!defaultRole) {
        throw new Error('Role padrão não encontrada');
      }
    } else {
      // Verifica se a role existe
      const role = await roleRepository.findById(roleId);
      if (!role) {
        throw new Error('Role não encontrada');
      }
    }

    // Cria o usuário
    return await userRepository.create({
      email: userData.email,
      password: userData.password,
      name: userData.name,
      role: roleId as any
    });
  }

  async getUserById(id: string): Promise<IUser | null> {
    return await userRepository.findById(id);
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    return await userRepository.findByEmail(email);
  }

  async getAllUsers(filter?: any): Promise<IUser[]> {
    return await userRepository.findAll(filter);
  }

  async updateUser(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    // Se está atualizando o email, verifica se já existe
    if (updateData.email) {
      const existingUser = await userRepository.findByEmail(updateData.email) as IUser | null;
      if (existingUser && existingUser._id.toString() !== id) {
        throw new Error('Email já está em uso');
      }
    }

    // Se está atualizando a role, verifica se existe
    if (updateData.role) {
      const role = await roleRepository.findById(updateData.role.toString());
      if (!role) {
        throw new Error('Role não encontrada');
      }
    }

    return await userRepository.update(id, updateData);
  }

  async deleteUser(id: string): Promise<IUser | null> {
    const user = await userRepository.findById(id);
    if (!user) {
      return null;
    }

    // Não permite deletar o último admin
    const role = await roleRepository.findById(user.role.toString());
    if (role && role.name === 'admin') {
      const adminCount = await userRepository.countByRole(user.role.toString());
      if (adminCount <= 1) {
        throw new Error('Não é possível deletar o último administrador');
      }
    }

    return await userRepository.delete(id);
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Verifica a senha atual
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      throw new Error('Senha atual incorreta');
    }

    // Valida a nova senha
    if (newPassword.length < 6) {
      throw new Error('A nova senha deve ter no mínimo 6 caracteres');
    }

    // Atualiza a senha
    await userRepository.updatePassword(id, newPassword);
  }

  async resetPassword(id: string, newPassword: string): Promise<void> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Valida a nova senha
    if (newPassword.length < 6) {
      throw new Error('A nova senha deve ter no mínimo 6 caracteres');
    }

    // Atualiza a senha
    await userRepository.updatePassword(id, newPassword);
  }

  async activateUser(id: string): Promise<IUser | null> {
    return await userRepository.activate(id);
  }

  async deactivateUser(id: string): Promise<IUser | null> {
    const user = await userRepository.findById(id);
    if (!user) {
      return null;
    }

    // Não permite desativar o último admin
    const role = await roleRepository.findById(user.role.toString());
    if (role && role.name === 'admin' && user.isActive) {
      const activeAdmins = await userRepository.findAll({
        role: user.role,
        isActive: true
      });
      
      if (activeAdmins.length <= 1) {
        throw new Error('Não é possível desativar o último administrador ativo');
      }
    }

    return await userRepository.deactivate(id);
  }

  async getUsersByRole(roleId: string): Promise<IUser[]> {
    return await userRepository.findByRole(roleId);
  }

  async getUsersCount(): Promise<number> {
    return await userRepository.countByRole('');
  }

  async getActiveUsersCount(): Promise<number> {
    const users = await userRepository.findAll({ isActive: true });
    return users.length;
  }
}

// Exporta uma instância única do serviço
export const userService = new UserService();
export default userService;
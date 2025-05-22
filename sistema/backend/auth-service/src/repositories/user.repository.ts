import createUserModel, { IUser } from '../models/user.model';
import mongoose from 'mongoose';

export class UserRepository {
  private User = createUserModel();

  async create(userData: Partial<IUser>): Promise<IUser> {
    const user = new this.User(userData);
    return await user.save();
  }

  async findById(id: string): Promise<IUser | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await this.User.findById(id).populate('role');
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return await this.User.findOne({ email: email.toLowerCase() }).populate('role');
  }

  async findAll(filter: any = {}): Promise<IUser[]> {
    return await this.User.find(filter)
      .populate('role', 'name description')
      .sort({ createdAt: -1 });
  }

  async update(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    
    // Remove campos que não devem ser atualizados diretamente
    delete updateData.password;
    delete updateData.createdAt;
    
    return await this.User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('role');
  }

  async updatePassword(id: string, newPassword: string): Promise<IUser | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    
    const user = await this.User.findById(id);
    if (!user) return null;
    
    user.password = newPassword;
    return await user.save();
  }

  async delete(id: string): Promise<IUser | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await this.User.findByIdAndDelete(id);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.User.findByIdAndUpdate(id, { lastLogin: new Date() });
  }

  async findByRole(roleId: string): Promise<IUser[]> {
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return [];
    }
    return await this.User.find({ role: roleId }).populate('role');
  }

  async countByRole(roleId: string): Promise<number> {
    if (!mongoose.Types.ObjectId.isValid(roleId)) {
      return 0;
    }
    return await this.User.countDocuments({ role: roleId });
  }

  async activate(id: string): Promise<IUser | null> {
    return await this.update(id, { isActive: true });
  }

  async deactivate(id: string): Promise<IUser | null> {
    return await this.update(id, { isActive: false });
  }

  async exists(email: string): Promise<boolean> {
    const count = await this.User.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  }
}

// Exporta uma instância única do repositório
export const userRepository = new UserRepository();
export default userRepository;
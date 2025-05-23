import { connectToDatabase } from '../config/database';
import { IUser, createUserModel } from '../models/user.model';

// Interface para filtros de busca
export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  role?: string;
}

// Interface para o repositório de Users
export interface IUserRepository {
  findAll(filters?: UserFilters): Promise<{ users: IUser[]; total: number }>;
  findById(id: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  create(user: Omit<IUser, '_id'>): Promise<IUser>;
  update(id: string, user: Partial<IUser>): Promise<IUser | null>;
  delete(id: string): Promise<boolean>;
  updateStatus(id: string, status: string): Promise<IUser | null>;
  countByRole(roleId: string): Promise<number>;
  findByCreator(creatorId: string): Promise<IUser[]>;
  getDashboardStats(): Promise<any>;
}

// Implementação do repositório de Users
export class UserRepository implements IUserRepository {
  
  // Busca todos os usuários com filtros e paginação
  async findAll(filters: UserFilters = {}): Promise<{ users: IUser[]; total: number }> {
    await connectToDatabase();
    const UserModel = createUserModel();
    
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      role = ''
    } = filters;

    // Constrói query de filtro
    const query: any = {};

    // Filtro por status
    if (status) {
      query.status = status;
    }

    // Filtro por role
    if (role) {
      query.role = role;
    }

    // Filtro por busca (nome ou email)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Contagem total para paginação
    const total = await UserModel.countDocuments(query);

    // Busca usuários com paginação
    const users = await UserModel.find(query)
      .populate('role', 'name description permissions')
      .populate('createdBy', 'name email')
      .select('-password') // Exclui senha da resposta
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return { users, total };
  }

  // Busca usuário por ID
  async findById(id: string): Promise<IUser | null> {
    await connectToDatabase();
    const UserModel = createUserModel();
    
    return UserModel.findById(id)
      .populate('role', 'name description permissions')
      .populate('createdBy', 'name email')
      .select('-password')
      .exec();
  }

  // Busca usuário por email
  async findByEmail(email: string): Promise<IUser | null> {
    await connectToDatabase();
    const UserModel = createUserModel();
    
    return UserModel.findOne({ email: email.toLowerCase() })
      .populate('role', 'name description permissions')
      .exec();
  }

  // Cria novo usuário
  async create(userData: Omit<IUser, '_id'>): Promise<IUser> {
    await connectToDatabase();
    const UserModel = createUserModel();
    
    const newUser = new UserModel(userData);
    return newUser.save();
  }

  // Atualiza usuário
  async update(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    await connectToDatabase();
    const UserModel = createUserModel();
    
    return UserModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
    .populate('role', 'name description permissions')
    .populate('createdBy', 'name email')
    .select('-password')
    .exec();
  }

  // Deleta usuário
  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const UserModel = createUserModel();
    
    const result = await UserModel.findByIdAndDelete(id).exec();
    return result !== null;
  }

  // Atualiza status do usuário
  async updateStatus(id: string, status: string): Promise<IUser | null> {
    await connectToDatabase();
    const UserModel = createUserModel();
    
    return UserModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
    .populate('role', 'name description permissions')
    .select('-password')
    .exec();
  }

  // Conta usuários por role
  async countByRole(roleId: string): Promise<number> {
    await connectToDatabase();
    const UserModel = createUserModel();
    
    return UserModel.countDocuments({ role: roleId });
  }

  // Busca usuários criados por um criador específico
  async findByCreator(creatorId: string): Promise<IUser[]> {
    await connectToDatabase();
    const UserModel = createUserModel();
    
    return UserModel.find({ createdBy: creatorId })
      .populate('role', 'name')
      .select('name email status createdAt')
      .sort({ createdAt: -1 })
      .exec();
  }

  // Estatísticas para dashboard
  async getDashboardStats(): Promise<any> {
    await connectToDatabase();
    const UserModel = createUserModel();

    // Contadores básicos
    const totalUsers = await UserModel.countDocuments();
    const activeUsers = await UserModel.countDocuments({ status: 'active' });
    const inactiveUsers = await UserModel.countDocuments({ status: 'inactive' });
    const suspendedUsers = await UserModel.countDocuments({ status: 'suspended' });

    // Usuários por role
    const usersByRole = await UserModel.aggregate([
      {
        $lookup: {
          from: 'roles',
          localField: 'role',
          foreignField: '_id',
          as: 'roleInfo'
        }
      },
      {
        $unwind: '$roleInfo'
      },
      {
        $group: {
          _id: '$roleInfo.name',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Usuários criados nos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = await UserModel.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Últimos logins
    const recentLogins = await UserModel.find({ 
      lastLogin: { $exists: true }
    })
    .select('name email lastLogin')
    .sort({ lastLogin: -1 })
    .limit(10);

    return {
      summary: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        suspendedUsers,
        recentUsers
      },
      usersByRole,
      recentLogins: recentLogins.map(user => ({
        name: user.name,
        email: user.email,
        lastLogin: user.lastLogin
      }))
    };
  }
}

// Exporta instância única do repositório
export const userRepository = new UserRepository();
export default userRepository;
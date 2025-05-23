import { connectToDatabase } from '../config/database';
import { IUser, createUserModel } from '../models/user.model';
import bcrypt from 'bcrypt';

// Interface para o repositório de Users
export interface IUserRepository {
  findAll(): Promise<IUser[]>;
  findById(id: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  create(user: Omit<IUser, '_id'>): Promise<IUser>;
  update(id: string, user: Partial<IUser>): Promise<IUser | null>;
  delete(id: string): Promise<boolean>;
  validatePassword(email: string, password: string): Promise<IUser | null>;
}

// Implementação do repositório de Users
export class UserRepository implements IUserRepository {
  
  // Encontra todos os usuários   
  async findAll(): Promise<IUser[]> {
    await connectToDatabase();
    const UserModel = createUserModel();
    return UserModel.find().select('-password').sort({ name: 1 }).exec();
  }

  
  // Encontra um usuário pelo ID  
  async findById(id: string): Promise<IUser | null> {
    await connectToDatabase();
    const UserModel = createUserModel();
    return UserModel.findById(id).select('-password').exec();
  }

  
  // Encontra um usuário pelo email   
  async findByEmail(email: string): Promise<IUser | null> {
    await connectToDatabase();
    const UserModel = createUserModel();
    return UserModel.findOne({ email }).select('-password').exec();
  }

 // Cria um novo usuário
  async create(user: Omit<IUser, '_id'>): Promise<IUser> {
    await connectToDatabase();
    const UserModel = createUserModel();
    
    // Hash da senha antes de salvar
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(user.password, saltRounds);
    
    const newUser = new UserModel({
      ...user,
      password: hashedPassword
    });
    
    const savedUser = await newUser.save();
    // Retorna o usuário sem a senha
    return UserModel.findById(savedUser._id).select('-password').exec() as Promise<IUser>;
  }

 // Atualiza um usuário pelo ID
  async update(id: string, user: Partial<IUser>): Promise<IUser | null> {
    await connectToDatabase();
    const UserModel = createUserModel();
    
    // Se a senha está sendo atualizada, hash ela
    if (user.password) {
      const saltRounds = 10;
      user.password = await bcrypt.hash(user.password, saltRounds);
    }
    
    return UserModel.findByIdAndUpdate(
      id,
      { $set: user },
      { new: true }
    ).select('-password').exec();
  }

  // Exclui um usuário pelo ID
  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const UserModel = createUserModel();
    const result = await UserModel.findByIdAndDelete(id).exec();
    return result !== null;
  }

  // Valida email e senha do usuário
  async validatePassword(email: string, password: string): Promise<IUser | null> {
    await connectToDatabase();
    const UserModel = createUserModel();
    
    // Busca o usuário com a senha
    const user = await UserModel.findOne({ email }).exec();
    if (!user) return null;
    
    // Verifica se a senha está correta
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;
    
    // Retorna o usuário sem a senha
    return UserModel.findById(user._id).select('-password').exec();
  }
}

// Exporta uma instância única do repositório
export const userRepository = new UserRepository();
export default userRepository;
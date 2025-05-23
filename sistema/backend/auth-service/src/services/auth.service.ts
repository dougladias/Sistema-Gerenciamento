import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { IUser } from '../models/user.model';

export class AuthService {
  private jwtSecret: string = process.env.JWT_SECRET || 'your-secret-key';

  // Realiza o login do usuário
  async login(email: string, password: string): Promise<{ user: IUser; token: string } | null> {
    try {
      // Valida as credenciais do usuário
      const user = await userRepository.validatePassword(email, password);
      if (!user) return null;

      // Gera o token JWT com informações do usuário
      const token = jwt.sign(
        { 
          userId: user._id, 
          email: user.email, 
          role: user.role,
          permissions: user.permissions
        },
        this.jwtSecret,
        { expiresIn: '24h' }
      );

      return { user, token };
    } catch (error) {
      console.error('Erro no login:', error);
      return null;
    }
  }

  // Valida um token JWT
  async validateToken(token: string): Promise<any> {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      console.error('Token inválido:', error);
      return null;
    }
  }

  // Renova um token JWT
  async refreshToken(token: string): Promise<string | null> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      // Gera um novo token com as mesmas informações
      const newToken = jwt.sign(
        { 
          userId: decoded.userId, 
          email: decoded.email, 
          role: decoded.role,
          permissions: decoded.permissions
        },
        this.jwtSecret,
        { expiresIn: '24h' }
      );

      return newToken;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      return null;
    }
  }

  // Decodifica um token sem validar (para extrair informações)
  decodeToken(token: string): any {
    try {
      return jwt.decode(token);
    } catch (error) {
      console.error('Erro ao decodificar token:', error);
      return null;
    }
  }
}

// Exporta uma instância única do serviço
export const authService = new AuthService();
export default authService;
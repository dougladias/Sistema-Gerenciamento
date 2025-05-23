import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { connectToDatabase } from '../config/database';

// Interface para login
export interface LoginCredentials {
  email: string;
  password: string;
}

// Interface para token payload
export interface TokenPayload {
  userId: string;
  email: string;
  roleId: string;
  permissions: string[];
  iat?: number;
  exp?: number;
}

// Interface para dados do usuário
export interface UserData {
  id: string;
  name: string;
  email: string;
  role: {
    id: string;
    name: string;
    permissions: string[];
  };
  customPermissions: string[];
  allPermissions: string[];
  status: string;
  lastLogin?: Date;
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';
  private readonly JWT_EXPIRE = process.env.JWT_EXPIRE || '8h';
  private readonly REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret';
  private readonly REFRESH_EXPIRE = process.env.REFRESH_EXPIRE || '7d';

  // Login do usuário
  async login(credentials: LoginCredentials): Promise<{
    success: boolean;
    message: string;
    data?: {
      user: UserData;
      token: string;
      refreshToken: string;
    };
  }> {
    try {
      await connectToDatabase();
      
      // Busca o usuário pelo email com role populada
      const user = await userRepository.findByEmail(credentials.email);

      if (!user) {
        return {
          success: false,
          message: 'Email ou senha incorretos'
        };
      }

      // Verifica se a conta está bloqueada
      if (user.isLocked()) {
        return {
          success: false,
          message: 'Conta temporariamente bloqueada devido a muitas tentativas de login'
        };
      }

      // Verifica se o usuário está ativo
      if (user.status !== 'active') {
        return {
          success: false,
          message: 'Conta inativa. Contate o administrador'
        };
      }

      // Verifica a senha
      const isPasswordValid = await user.comparePassword(credentials.password);
      
      if (!isPasswordValid) {
        // Incrementa tentativas de login
        await user.incrementLoginAttempts();
        
        return {
          success: false,
          message: 'Email ou senha incorretos'
        };
      }

      // Reset tentativas de login em caso de sucesso
      if (user.loginAttempts && user.loginAttempts > 0) {
        await user.resetLoginAttempts();
      }

      // Atualiza último login
      await userRepository.update((user._id as any).toString(), {
        lastLogin: new Date()
      } as any);

      // Combina permissões da role com permissões customizadas
      const rolePermissions = (user.role as any).permissions || [];
      const customPermissions = user.customPermissions || [];
      const allPermissions = [...new Set([...rolePermissions, ...customPermissions])];

      // Gera tokens
      const tokenPayload: TokenPayload = {
        userId: (user._id as any).toString(),
        email: user.email,
        roleId: (user.role as any)._id.toString(),
        permissions: allPermissions
      };

      const token = this.generateAccessToken(tokenPayload);
      const refreshToken = this.generateRefreshToken({
        userId: (user._id as any).toString(),
        email: user.email
      });

      // Prepara dados do usuário para resposta
      const userData: UserData = {
        id: (user._id as any).toString(),
        name: user.name,
        email: user.email,
        role: {
          id: (user.role as any)._id.toString(),
          name: (user.role as any).name,
          permissions: rolePermissions
        },
        customPermissions,
        allPermissions,
        status: user.status,
        lastLogin: user.lastLogin
      };

      return {
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: userData,
          token,
          refreshToken
        }
      };

    } catch (error) {
      console.error('Erro no login:', error);
      return {
        success: false,
        message: 'Erro interno do servidor'
      };
    }
  }

  // Validar token
  async validateToken(token: string): Promise<{
    valid: boolean;
    payload?: TokenPayload;
    user?: UserData;
  }> {
    try {
      // Verifica e decodifica o token
      const decoded = jwt.verify(token, this.JWT_SECRET) as TokenPayload;
      
      await connectToDatabase();
      
      // Busca o usuário para verificar se ainda está ativo
      const user = await userRepository.findById(decoded.userId);

      if (!user || user.status !== 'active') {
        return { valid: false };
      }

      // Recalcula permissões para garantir que estão atualizadas
      const rolePermissions = (user.role as any).permissions || [];
      const customPermissions = user.customPermissions || [];
      const allPermissions = [...new Set([...rolePermissions, ...customPermissions])];

      const userData: UserData = {
        id: (user._id as any).toString(),
        name: user.name,
        email: user.email,
        role: {
          id: (user.role as any)._id.toString(),
          name: (user.role as any).name,
          permissions: rolePermissions
        },
        customPermissions,
        allPermissions,
        status: user.status,
        lastLogin: user.lastLogin
      };

      return {
        valid: true,
        payload: decoded,
        user: userData
      };

    } catch (error) {
      return { valid: false };
    }
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{
    success: boolean;
    message: string;
    data?: {
      token: string;
      refreshToken: string;
    };
  }> {
    try {
      // Verifica o refresh token
      const decoded = jwt.verify(refreshToken, this.REFRESH_SECRET) as any;
      
      await connectToDatabase();
      
      // Busca o usuário
      const user = await userRepository.findById(decoded.userId);

      if (!user || user.status !== 'active') {
        return {
          success: false,
          message: 'Token inválido'
        };
      }

      // Gera novos tokens
      const rolePermissions = (user.role as any).permissions || [];
      const customPermissions = user.customPermissions || [];
      const allPermissions = [...new Set([...rolePermissions, ...customPermissions])];

      const tokenPayload: TokenPayload = {
        userId: (user._id as any).toString(),
        email: user.email,
        roleId: (user.role as any)._id.toString(),
        permissions: allPermissions
      };

      const newToken = this.generateAccessToken(tokenPayload);
      const newRefreshToken = this.generateRefreshToken({
        userId: (user._id as any).toString(),
        email: user.email
      });

      return {
        success: true,
        message: 'Token renovado com sucesso',
        data: {
          token: newToken,
          refreshToken: newRefreshToken
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Token inválido'
      };
    }
  }

  // Verificar permissão
  hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    // Verifica se o usuário tem a permissão específica
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }

    // Verifica se o usuário tem permissão de admin total
    if (userPermissions.includes('backoffice:manage')) {
      return true;
    }

    // Extrai resource e action da permissão requerida
    const [resource, action] = requiredPermission.split(':');
    
    // Verifica se tem permissão wildcard para o recurso
    if (userPermissions.includes(`${resource}:*`)) {
      return true;
    }

    return false;
  }

  // Gerar access token
  private generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRE,
      issuer: 'worker-system',
      audience: 'worker-system-users'
    } as jwt.SignOptions);
  }

  // Gerar refresh token
  private generateRefreshToken(payload: { userId: string; email: string }): string {
    return jwt.sign(payload, this.REFRESH_SECRET, {
      expiresIn: this.REFRESH_EXPIRE,
      issuer: 'worker-system',
      audience: 'worker-system-users'
    } as jwt.SignOptions);
  }

  // Logout (invalidar token - seria necessário uma blacklist em produção)
  async logout(token: string): Promise<{
    success: boolean;
    message: string;
  }> {
    // Em produção, adicionar o token a uma blacklist
    // Por simplicidade, apenas retornamos sucesso
    return {
      success: true,
      message: 'Logout realizado com sucesso'
    };
  }

  // Buscar dados do usuário pelo token
  async getMe(token: string): Promise<{
    success: boolean;
    message: string;
    data?: UserData;
  }> {
    const validation = await this.validateToken(token);
    
    if (!validation.valid || !validation.user) {
      return {
        success: false,
        message: 'Token inválido'
      };
    }

    return {
      success: true,
      message: 'Dados do usuário obtidos com sucesso',
      data: validation.user
    };
  }
}

// Exporta instância única do serviço
export const authService = new AuthService();
export default authService;
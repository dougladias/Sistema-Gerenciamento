import apiService from './api';
import { User, Role, Permission, LoginRequest, RegisterRequest, LoginResponse } from '@/types/auth';

export class AuthService {
  private baseEndpoint = '/api/auth';
  private usersEndpoint = '/api/users';

  // Autenticação
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiService.post<LoginResponse>(`${this.baseEndpoint}/login`, credentials);
  }

  async logout(): Promise<void> {
    return apiService.post<void>(`${this.baseEndpoint}/logout`, {});
  }

  async validateToken(token: string): Promise<{ valid: boolean; user?: User }> {
    return apiService.post<{ valid: boolean; user?: User }>(
      `${this.baseEndpoint}/validate`,
      { token }
    );
  }

  async refreshToken(token: string): Promise<{ token: string }> {
    return apiService.post<{ token: string }>(
      `${this.baseEndpoint}/refresh`,
      { token }
    );
  }

  async checkPermission(resource: string, action: string, token: string): Promise<{ hasPermission: boolean }> {
    return apiService.post<{ hasPermission: boolean }>(
      `${this.baseEndpoint}/check-permission`,
      { resource, action },
      { Authorization: `Bearer ${token}` }
    );
  }

  // Gerenciamento de Usuários
  async getAllUsers(token: string): Promise<User[]> {
    return apiService.get<User[]>(this.usersEndpoint, {
      Authorization: `Bearer ${token}`
    });
  }

  async getUserById(id: string, token: string): Promise<User> {
    return apiService.get<User>(`${this.usersEndpoint}/${id}`, {
      Authorization: `Bearer ${token}`
    });
  }

  async createUser(userData: {
    name: string;
    email: string;
    password: string;
    role: string;
    permissions?: string[];
  }, token: string): Promise<User> {
    return apiService.post<User>(this.usersEndpoint, userData, {
      Authorization: `Bearer ${token}`
    });
  }

  async updateUser(id: string, updates: Partial<User>, token: string): Promise<User> {
    return apiService.put<User>(`${this.usersEndpoint}/${id}`, updates, {
      Authorization: `Bearer ${token}`
    });
  }

  async deleteUser(id: string, token: string): Promise<void> {
    return apiService.delete(`${this.usersEndpoint}/${id}`, {
      Authorization: `Bearer ${token}`
    });
  }

  async changeUserRole(userId: string, role: string, token: string): Promise<User> {
    return apiService.put<User>(`${this.usersEndpoint}/${userId}`, { role }, {
      Authorization: `Bearer ${token}`
    });
  }

  // Busca usuário por email
  async getUserByEmail(email: string, token: string): Promise<User> {
    return apiService.get<User>(`${this.usersEndpoint}/email/${encodeURIComponent(email)}`, {
      Authorization: `Bearer ${token}`
    });
  }

  // Perfil do usuário
  async getProfile(token: string): Promise<User> {
    return apiService.get<User>(`${this.baseEndpoint}/me`, {
      Authorization: `Bearer ${token}`
    });
  }

  async updateProfile(updates: Partial<User>, token: string): Promise<User> {
    return apiService.put<User>(`${this.baseEndpoint}/me`, updates, {
      Authorization: `Bearer ${token}`
    });
  }

  async changePassword(currentPassword: string, newPassword: string, token: string): Promise<void> {
    return apiService.post<void>(`${this.baseEndpoint}/change-password`, {
      currentPassword,
      newPassword
    }, {
      Authorization: `Bearer ${token}`
    });
  }

  // Métodos de compatibilidade com o sistema existente
  async register(data: RegisterRequest): Promise<LoginResponse> {
    // Mapeia para o formato esperado pelo backend
    await this.createUser({
      name: data.name,
      email: data.email,
      password: data.password,
      role: 'viewer' // Role padrão
    }, ''); // Token vazio para registro público
    
    // Fazer login após registro para obter o token
    return this.login({ email: data.email, password: data.password });
  }

  async verifyToken(token: string): Promise<{ valid: boolean; user?: User }> {
    return this.validateToken(token);
  }

  // Métodos para gerenciamento de roles (compatibilidade)
  async getAllRoles(): Promise<Role[]> {
    // Como não temos endpoint específico de roles, retorna roles básicos
    return [
      {
        _id: 'manager',
        name: 'Manager',
        description: 'Gerente com acesso completo',
        permissions: [],
        isDefault: false,
        isSystem: true,
        isAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'assistant',
        name: 'Assistant',
        description: 'Assistente com acesso limitado',
        permissions: [],
        isDefault: false,
        isSystem: true,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'viewer',
        name: 'Viewer',
        description: 'Visualizador apenas',
        permissions: [],
        isDefault: true,
        isSystem: true,
        isAdmin: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  async createRole(roleData: {
    name: string;
    description: string;
    permissions: string[];
  }): Promise<Role> {
    // Implementação básica - retorna o role criado
    return {
      _id: Date.now().toString(),
      name: roleData.name,
      description: roleData.description,
      permissions: [],
      isDefault: false,
      isSystem: false,
      isAdmin: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async getAllPermissions(): Promise<Permission[]> {
    // Retorna permissões básicas do sistema
    return [
      {
        _id: 'users:read',
        resource: 'users',
        action: 'read',
        description: 'Visualizar usuários',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'users:create',
        resource: 'users',
        action: 'create',
        description: 'Criar usuários',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'users:edit',
        resource: 'users',
        action: 'edit',
        description: 'Editar usuários',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'users:delete',
        resource: 'users',
        action: 'delete',
        description: 'Excluir usuários',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'workers:read',
        resource: 'workers',
        action: 'read',
        description: 'Visualizar funcionários',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'workers:create',
        resource: 'workers',
        action: 'create',
        description: 'Criar funcionários',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'workers:edit',
        resource: 'workers',
        action: 'edit',
        description: 'Editar funcionários',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'workers:delete',
        resource: 'workers',
        action: 'delete',
        description: 'Excluir funcionários',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }
}

// Exporta uma instância do serviço
export const authService = new AuthService();
export default authService;
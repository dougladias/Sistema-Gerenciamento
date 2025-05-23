import apiService from './api';
import { User, Role, Permission, LoginRequest, RegisterRequest, LoginResponse } from '@/types/auth';

export class AuthService {
  private baseEndpoint = '/auth';
  private usersEndpoint = '/users';
  private rolesEndpoint = '/roles';
  private permissionsEndpoint = '/permissions';

  // Autenticação
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiService.post<LoginResponse>(`${this.baseEndpoint}/login`, credentials);
  }

  async register(data: RegisterRequest): Promise<LoginResponse> {
    return apiService.post<LoginResponse>(`${this.baseEndpoint}/register`, data);
  }

  async verifyToken(token: string): Promise<{ valid: boolean; user?: User }> {
    return apiService.get<{ valid: boolean; user?: User }>(
      `${this.baseEndpoint}/verify`,
      { Authorization: `Bearer ${token}` }
    );
  }

  async checkPermission(resource: string, action: string, token: string): Promise<{ hasPermission: boolean }> {
    return apiService.post<{ hasPermission: boolean }>(
      `${this.baseEndpoint}/check-permission`,
      { resource, action },
      { Authorization: `Bearer ${token}` }
    );
  }

  // Gerenciamento de Usuários (apenas para Developers)
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
    email: string;
    password: string;
    name: string;
    roleId: string;
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

  async activateUser(id: string, token: string): Promise<User> {
    return apiService.put<User>(`${this.usersEndpoint}/${id}/activate`, {}, {
      Authorization: `Bearer ${token}`
    });
  }

  async deactivateUser(id: string, token: string): Promise<User> {
    return apiService.put<User>(`${this.usersEndpoint}/${id}/deactivate`, {}, {
      Authorization: `Bearer ${token}`
    });
  }

  async changeUserRole(id: string, roleId: string, token: string): Promise<User> {
    return apiService.put<User>(`${this.usersEndpoint}/${id}/change-role`, { roleId }, {
      Authorization: `Bearer ${token}`
    });
  }

  // Gerenciamento de Roles
  async getAllRoles(token: string): Promise<Role[]> {
    return apiService.get<Role[]>(this.rolesEndpoint, {
      Authorization: `Bearer ${token}`
    });
  }

  async getRoleById(id: string, token: string): Promise<Role> {
    return apiService.get<Role>(`${this.rolesEndpoint}/${id}`, {
      Authorization: `Bearer ${token}`
    });
  }

  async createRole(roleData: {
    name: string;
    description: string;
    permissions: string[];
  }, token: string): Promise<Role> {
    return apiService.post<Role>(this.rolesEndpoint, roleData, {
      Authorization: `Bearer ${token}`
    });
  }

  async updateRole(id: string, updates: Partial<Role>, token: string): Promise<Role> {
    return apiService.put<Role>(`${this.rolesEndpoint}/${id}`, updates, {
      Authorization: `Bearer ${token}`
    });
  }

  async deleteRole(id: string, token: string): Promise<void> {
    return apiService.delete(`${this.rolesEndpoint}/${id}`, {
      Authorization: `Bearer ${token}`
    });
  }

  // Gerenciamento de Permissões
  async getAllPermissions(token: string): Promise<Permission[]> {
    return apiService.get<Permission[]>(this.permissionsEndpoint, {
      Authorization: `Bearer ${token}`
    });
  }

  async getPermissionsGrouped(token: string): Promise<Record<string, Permission[]>> {
    return apiService.get<Record<string, Permission[]>>(`${this.permissionsEndpoint}/grouped`, {
      Authorization: `Bearer ${token}`
    });
  }
}

export const authService = new AuthService();
export default authService;
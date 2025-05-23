export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isDefault: boolean;
  isSystem: boolean;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  _id: string;
  resource: string;
  action: string;
  route?: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  logout: () => void;
  checkPermission: (resource: string, action: string) => boolean;
  hasRole: (roleName: string) => boolean;
  canAccess: (route: string) => boolean;
}
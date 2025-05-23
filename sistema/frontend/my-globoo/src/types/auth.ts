export interface User {
  _id?: string;
  id?: string;
  email: string;
  name: string;
  role: string; // Mudança: agora é string simples (manager, assistant, viewer)
  permissions: string[]; // Array de strings das permissões
  isActive?: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
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
  refreshToken: () => Promise<boolean>;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
}

// Tipos auxiliares para roles do sistema
export type SystemRole = 'manager' | 'assistant' | 'viewer';

// Permissões básicas do sistema
export type SystemPermission = 
  | 'users:read' | 'users:create' | 'users:edit' | 'users:delete'
  | 'workers:read' | 'workers:create' | 'workers:edit' | 'workers:delete'
  | 'documents:read' | 'documents:create' | 'documents:edit' | 'documents:delete'
  | 'timesheet:read' | 'timesheet:create' | 'timesheet:edit' | 'timesheet:delete'
  | 'templates:read' | 'templates:create' | 'templates:edit' | 'templates:delete'
  | 'payroll:read' | 'payroll:create' | 'payroll:edit' | 'payroll:delete';

// Mapeamento de roles para permissões
export const ROLE_PERMISSIONS: Record<SystemRole, SystemPermission[]> = {
  manager: [
    'users:read', 'users:create', 'users:edit', 'users:delete',
    'workers:read', 'workers:create', 'workers:edit', 'workers:delete',
    'documents:read', 'documents:create', 'documents:edit', 'documents:delete',
    'timesheet:read', 'timesheet:create', 'timesheet:edit', 'timesheet:delete',
    'templates:read', 'templates:create', 'templates:edit', 'templates:delete',
    'payroll:read', 'payroll:create', 'payroll:edit', 'payroll:delete'
  ],
  assistant: [
    'users:read',
    'workers:read', 'workers:create', 'workers:edit',
    'documents:read', 'documents:create', 'documents:edit',
    'timesheet:read', 'timesheet:create', 'timesheet:edit',
    'templates:read', 'templates:create',
    'payroll:read'
  ],
  viewer: [
    'workers:read',
    'documents:read',
    'timesheet:read',
    'templates:read',
    'payroll:read'
  ]
};
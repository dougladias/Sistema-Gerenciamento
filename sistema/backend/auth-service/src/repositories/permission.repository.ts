import { connectToDatabase } from '../config/database';
import { IPermission, createPermissionModel } from '../models/permission.model';

// Interface para o repositório de Permissions
export interface IPermissionRepository {
  findAll(): Promise<IPermission[]>;
  findById(id: string): Promise<IPermission | null>;
  findByResource(resource: string): Promise<IPermission[]>;
  findByCategory(category: string): Promise<IPermission[]>;
  findByCode(resource: string, action: string): Promise<IPermission | null>;
  create(permission: Omit<IPermission, '_id'>): Promise<IPermission>;
  update(id: string, permission: Partial<IPermission>): Promise<IPermission | null>;
  delete(id: string): Promise<boolean>;
  getGroupedByResource(): Promise<any>;
  initializeDefaultPermissions(): Promise<void>;
}

// Implementação do repositório de Permissions
export class PermissionRepository implements IPermissionRepository {
  
  // Busca todas as permissões
  async findAll(): Promise<IPermission[]> {
    await connectToDatabase();
    const PermissionModel = createPermissionModel();
    
    return PermissionModel.find()
      .sort({ resource: 1, action: 1 })
      .exec();
  }

  // Busca permissão por ID
  async findById(id: string): Promise<IPermission | null> {
    await connectToDatabase();
    const PermissionModel = createPermissionModel();
    
    return PermissionModel.findById(id).exec();
  }

  // Busca permissões por recurso
  async findByResource(resource: string): Promise<IPermission[]> {
    await connectToDatabase();
    const PermissionModel = createPermissionModel();
    
    return PermissionModel.find({ resource })
      .sort({ action: 1 })
      .exec();
  }

  // Busca permissões por categoria
  async findByCategory(category: string): Promise<IPermission[]> {
    await connectToDatabase();
    const PermissionModel = createPermissionModel();
    
    return PermissionModel.find({ category })
      .sort({ resource: 1, action: 1 })
      .exec();
  }

  // Busca permissão por código (resource:action)
  async findByCode(resource: string, action: string): Promise<IPermission | null> {
    await connectToDatabase();
    const PermissionModel = createPermissionModel();
    
    return PermissionModel.findOne({ resource, action }).exec();
  }

  // Cria nova permissão
  async create(permissionData: Omit<IPermission, '_id'>): Promise<IPermission> {
    await connectToDatabase();
    const PermissionModel = createPermissionModel();
    
    const newPermission = new PermissionModel(permissionData);
    return newPermission.save();
  }

  // Atualiza permissão
  async update(id: string, updateData: Partial<IPermission>): Promise<IPermission | null> {
    await connectToDatabase();
    const PermissionModel = createPermissionModel();
    
    return PermissionModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).exec();
  }

  // Deleta permissão
  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const PermissionModel = createPermissionModel();
    
    const result = await PermissionModel.findByIdAndDelete(id).exec();
    return result !== null;
  }

  // Busca permissões agrupadas por recurso
  async getGroupedByResource(): Promise<any> {
    await connectToDatabase();
    const PermissionModel = createPermissionModel();
    
    const permissions = await PermissionModel.aggregate([
      {
        $group: {
          _id: '$resource',
          permissions: {
            $push: {
              action: '$action',
              description: '$description',
              category: '$category',
              code: { $concat: ['$resource', ':', '$action'] }
            }
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return permissions.reduce((acc, item) => {
      acc[item._id] = item.permissions.sort((a: any, b: any) => a.action.localeCompare(b.action));
      return acc;
    }, {});
  }

  // Inicializa permissões padrão do sistema
  async initializeDefaultPermissions(): Promise<void> {
    await connectToDatabase();
    
    const defaultPermissions = [
      // Workers (Funcionários)
      { resource: 'workers', action: 'read', description: 'Visualizar funcionários', category: 'basic' },
      { resource: 'workers', action: 'create', description: 'Criar funcionários', category: 'basic' },
      { resource: 'workers', action: 'update', description: 'Editar funcionários', category: 'basic' },
      { resource: 'workers', action: 'delete', description: 'Excluir funcionários', category: 'advanced' },
      
      // Documents (Documentos)
      { resource: 'documents', action: 'read', description: 'Visualizar documentos', category: 'basic' },
      { resource: 'documents', action: 'upload', description: 'Fazer upload de documentos', category: 'basic' },
      { resource: 'documents', action: 'download', description: 'Baixar documentos', category: 'basic' },
      { resource: 'documents', action: 'delete', description: 'Excluir documentos', category: 'advanced' },
      
      // Timesheet (Ponto)
      { resource: 'timesheet', action: 'read', description: 'Visualizar registros de ponto', category: 'basic' },
      { resource: 'timesheet', action: 'create', description: 'Registrar ponto', category: 'basic' },
      { resource: 'timesheet', action: 'update', description: 'Editar registros de ponto', category: 'basic' },
      { resource: 'timesheet', action: 'delete', description: 'Excluir registros de ponto', category: 'advanced' },
      { resource: 'timesheet', action: 'manage', description: 'Gerenciar todo o sistema de ponto', category: 'admin' },
      
      // Reports (Relatórios)
      { resource: 'reports', action: 'read', description: 'Visualizar relatórios', category: 'basic' },
      { resource: 'reports', action: 'create', description: 'Gerar relatórios', category: 'advanced' },
      
      // Backoffice (Administração)
      { resource: 'backoffice', action: 'access', description: 'Acessar painel administrativo', category: 'advanced' },
      { resource: 'backoffice', action: 'users', description: 'Gerenciar usuários', category: 'admin' },
      { resource: 'backoffice', action: 'manage', description: 'Administração total do sistema', category: 'admin' }
    ];

    for (const permData of defaultPermissions) {
      try {
        const existing = await this.findByCode(permData.resource, permData.action);
        if (!existing) {
          const completePermData = {
            ...permData,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await this.create(completePermData as Omit<IPermission, '_id'>);
          console.log(`✅ Permissão criada: ${permData.resource}:${permData.action}`);
        }
      } catch (error) {
        console.error(`Erro ao criar permissão ${permData.resource}:${permData.action}:`, error);
      }
    }
  }
}

// Exporta instância única do repositório
export const permissionRepository = new PermissionRepository();
export default permissionRepository;
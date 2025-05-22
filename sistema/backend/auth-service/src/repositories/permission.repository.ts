import createPermissionModel, { IPermission } from '../models/permission.model';
import mongoose from 'mongoose';

export class PermissionRepository {
  private Permission = createPermissionModel();

  async create(permissionData: Partial<IPermission>): Promise<IPermission> {
    const permission = new this.Permission(permissionData);
    return await permission.save();
  }

  async findById(id: string): Promise<IPermission | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await this.Permission.findById(id);
  }

  async findByResourceAndAction(resource: string, action: string): Promise<IPermission | null> {
    return await this.Permission.findOne({ 
      resource: resource.toLowerCase(), 
      action: action.toLowerCase() 
    });
  }

  async findByRoute(route: string): Promise<IPermission[]> {
    // Busca todas as permissões que têm uma rota definida
    const permissions = await this.Permission.find({ route: { $exists: true, $ne: null } });
    
    // Filtra as permissões que correspondem à rota
    return permissions.filter(permission => {
      if (!permission.route) return false;
      
      // Converte o padrão em regex
      const pattern = permission.route.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      
      return regex.test(route);
    });
  }

  async findAll(filter: any = {}): Promise<IPermission[]> {
    return await this.Permission.find(filter).sort({ resource: 1, action: 1 });
  }

  async findByResource(resource: string): Promise<IPermission[]> {
    return await this.Permission.find({ resource: resource.toLowerCase() }).sort({ action: 1 });
  }

  async update(id: string, updateData: Partial<IPermission>): Promise<IPermission | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    
    delete updateData.createdAt;
    
    return await this.Permission.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
  }

  async delete(id: string): Promise<IPermission | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await this.Permission.findByIdAndDelete(id);
  }

  async upsert(permissionData: Partial<IPermission>): Promise<IPermission> {
    const { resource, action, ...rest } = permissionData;
    
    return await this.Permission.findOneAndUpdate(
      { 
        resource: resource?.toLowerCase(), 
        action: action?.toLowerCase() 
      },
      { 
        $set: {
          resource: resource?.toLowerCase(),
          action: action?.toLowerCase(),
          ...rest
        }
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );
  }

  async exists(resource: string, action: string): Promise<boolean> {
    const count = await this.Permission.countDocuments({ 
      resource: resource.toLowerCase(), 
      action: action.toLowerCase() 
    });
    return count > 0;
  }

  async findByIds(ids: string[]): Promise<IPermission[]> {
    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    return await this.Permission.find({ _id: { $in: validIds } });
  }

  async groupByResource(): Promise<Map<string, IPermission[]>> {
    const permissions = await this.findAll();
    const grouped = new Map<string, IPermission[]>();
    
    permissions.forEach(permission => {
      const resource = permission.resource;
      if (!grouped.has(resource)) {
        grouped.set(resource, []);
      }
      grouped.get(resource)!.push(permission);
    });
    
    return grouped;
  }
}

// Exporta uma instância única do repositório
export const permissionRepository = new PermissionRepository();
export default permissionRepository;
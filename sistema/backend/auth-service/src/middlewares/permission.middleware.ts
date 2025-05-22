import { Request, Response, NextFunction } from 'express';
import userRepository from '../repositories/user.repository';
import roleRepository from '../repositories/role.repository';
import permissionRepository from '../repositories/permission.repository';

class PermissionMiddleware {
  requirePermission(resource: string, action: string) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user || !req.user.id) {
          res.status(401).json({ error: 'Usuário não autenticado' });
          return;
        }

        const user = await userRepository.findById(req.user.id);
        if (!user) {
          res.status(401).json({ error: 'Usuário não encontrado' });
          return;
        }

        const role = await roleRepository.findById(user.role.toString());
        if (!role) {
          res.status(403).json({ error: 'Role de usuário não encontrada' });
          return;
        }

        // Verificar se é admin com permissão total
        if (role.isAdmin) {
          next();
          return;
        }

        // Buscar permissão específica
        const permission = await permissionRepository.findByResourceAndAction(resource, action);
        if (!permission) {
          res.status(403).json({ error: 'Permissão não encontrada' });
          return;
        }

        // Verificar se a role tem a permissão necessária
        const hasPermission = role.permissions.some(
          permId => permId.toString() === permission._id.toString()
        );

        if (hasPermission) {
          next();
        } else {
          res.status(403).json({ error: 'Permissão negada' });
        }
      } catch (error) {
        console.error('Erro ao verificar permissão:', error);
        res.status(500).json({ error: 'Erro ao verificar permissão' });
      }
    };
  }
}

export default new PermissionMiddleware();
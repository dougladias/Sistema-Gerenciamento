import express, { Request, Response } from 'express';
import roleRepository from '../repositories/role.repository';
import userRepository from '../repositories/user.repository';
import AuthMiddleware from '../middlewares/auth.middleware';
import PermissionMiddleware from '../middlewares/permission.middleware';

const router = express.Router();

// Listar roles
router.get('/', AuthMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    const roles = await roleRepository.findAll();
    res.json(roles);
  } catch (error) {
    console.error('Erro ao listar roles:', error);
    res.status(500).json({ error: 'Erro ao listar roles' });
  }
});

// Buscar role por ID
router.get('/:id', AuthMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    const role = await roleRepository.findById(req.params.id);

    if (!role) {
      res.status(404).json({ error: 'Role não encontrada' });
      return;
    }

    res.json(role);
  } catch (error) {
    console.error('Erro ao buscar role:', error);
    res.status(500).json({ error: 'Erro ao buscar role' });
  }
});

// Criar role
router.post('/', PermissionMiddleware.requirePermission('roles', 'create'), async (req: Request, res: Response) => {
  try {
    if (!req.body.name || !req.body.description) {
      res.status(400).json({ error: 'Nome e descrição são obrigatórios' });
      return;
    }

    if (await roleRepository.exists(req.body.name)) {
      res.status(409).json({ error: 'Role já existe' });
      return;
    }

    const role = await roleRepository.create(req.body);
    res.status(201).json(role);
  } catch (error) {
    console.error('Erro ao criar role:', error);
    res.status(500).json({ error: 'Erro ao criar role' });
  }
});

// Atualizar role
router.put('/:id', PermissionMiddleware.requirePermission('roles', 'update'), async (req: Request, res: Response) => {
  try {
    const role = await roleRepository.update(req.params.id, req.body);

    if (!role) {
      res.status(404).json({ error: 'Role não encontrada' });
      return;
    }

    res.json(role);
  } catch (error) {
    console.error('Erro ao atualizar role:', error);
    res.status(500).json({ error: 'Erro ao atualizar role' });
  }
});

// Deletar role
router.delete('/:id', PermissionMiddleware.requirePermission('roles', 'delete'), async (req: Request, res: Response) => {
  try {
    // Verifica se há usuários usando esta role
    const usersCount = await userRepository.countByRole(req.params.id);
    if (usersCount > 0) {
      res.status(400).json({ 
        error: `Não é possível excluir: ${usersCount} usuário(s) usando esta role` 
      });
      return;
    }

    const role = await roleRepository.delete(req.params.id);
    if (!role) {
      res.status(404).json({ error: 'Role não encontrada' });
      return;
    }

    res.status(204).end();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
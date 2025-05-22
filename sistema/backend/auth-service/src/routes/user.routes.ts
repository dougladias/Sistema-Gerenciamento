import express, { Request, Response } from 'express';
import userRepository from '../repositories/user.repository';
import roleRepository from '../repositories/role.repository';
import AuthMiddleware from '../middlewares/auth.middleware';
import PermissionMiddleware from '../middlewares/permission.middleware';

const router = express.Router();

// Listar usuários
router.get('/', AuthMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    const users = await userRepository.findAll();
    res.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// Buscar usuário por ID
router.get('/:id', AuthMiddleware.authenticate, async (req: Request, res: Response) => {
  try {
    const user = await userRepository.findById(req.params.id);
    
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    const role = await roleRepository.findById(user.role.toString());
    const userWithRole = {
      ...user.toJSON(),
      role
    };

    res.json(userWithRole);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// Atualizar usuário
router.put('/:id', PermissionMiddleware.requirePermission('users', 'update'), async (req: Request, res: Response) => {
  try {
    const user = await userRepository.update(req.params.id, req.body);

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Deletar usuário
router.delete('/:id', PermissionMiddleware.requirePermission('users', 'delete'), async (req: Request, res: Response) => {
  try {
    const user = await userRepository.delete(req.params.id);

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.status(204).end();
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

// Ativar usuário
router.put('/:id/activate', PermissionMiddleware.requirePermission('users', 'update'), async (req: Request, res: Response) => {
  try {
    const user = await userRepository.activate(req.params.id);

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao ativar usuário:', error);
    res.status(500).json({ error: 'Erro ao ativar usuário' });
  }
});

// Desativar usuário
router.put('/:id/deactivate', PermissionMiddleware.requirePermission('users', 'update'), async (req: Request, res: Response) => {
  try {
    const user = await userRepository.deactivate(req.params.id);

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao desativar usuário:', error);
    res.status(500).json({ error: 'Erro ao desativar usuário' });
  }
});

// Alterar role do usuário
router.put('/:id/change-role', PermissionMiddleware.requirePermission('users', 'manage'), async (req: Request, res: Response) => {
  try {
    const { roleId } = req.body;

    if (!roleId) {
      res.status(400).json({ error: 'ID da role é obrigatório' });
      return;
    }

    const role = await roleRepository.findById(roleId);
    if (!role) {
      res.status(404).json({ error: 'Role não encontrada' });
      return;
    }

    const user = await userRepository.update(req.params.id, { role: roleId });
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao alterar role do usuário:', error);
    res.status(500).json({ error: 'Erro ao alterar role do usuário' });
  }
});

export default router;
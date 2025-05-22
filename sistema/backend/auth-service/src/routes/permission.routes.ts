import express from 'express';
import permissionRepository from '../repositories/permission.repository';
import AuthMiddleware from '../middlewares/auth.middleware';

const router = express.Router();

// Listar permissões
router.get('/', AuthMiddleware.authenticate, async (req, res) => {
  try {
    const permissions = await permissionRepository.findAll();
    res.json(permissions);
  } catch (error) {
    console.error('Erro ao listar permissões:', error);
    res.status(500).json({ error: 'Erro ao listar permissões' });
  }
});

// Listar permissões agrupadas por recurso
router.get('/grouped', AuthMiddleware.authenticate, async (req, res) => {
  try {
    const grouped = await permissionRepository.groupByResource();
    
    // Converte Map para objeto
    const result: Record<string, any[]> = {};
    grouped.forEach((value, key) => {
      result[key] = value;
    });

    res.json(result);
  } catch (error) {
    console.error('Erro ao listar permissões agrupadas:', error);
    res.status(500).json({ error: 'Erro ao listar permissões agrupadas' });
  }
});

export default router;
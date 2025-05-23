import { Request, Response } from 'express';
import { BenefitService } from '../services/benefit.service';
import { BenefitStatus } from '../models/benefit.model';

export class BenefitController {
  private benefitService: BenefitService;

  constructor() {
    this.benefitService = new BenefitService();
  }

  // Buscar todos os benefícios
  async getAllBenefits(req: Request, res: Response): Promise<void> {
    try {
      const benefits = await this.benefitService.getAllBenefits(req.query);
      res.status(200).json({
        success: true,
        data: benefits,
        message: 'Benefícios recuperados com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Erro ao buscar benefícios: ${error}`
      });
    }
  }

  // Buscar benefício por ID
  async getBenefitById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const benefit = await this.benefitService.getBenefitById(id);
      
      res.status(200).json({
        success: true,
        data: benefit,
        message: 'Benefício encontrado com sucesso'
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: `Erro ao buscar benefício: ${error}`
      });
    }
  }

  // Buscar benefícios ativos
  async getActiveBenefits(req: Request, res: Response): Promise<void> {
    try {
      const benefits = await this.benefitService.getActiveBenefits();
      res.status(200).json({
        success: true,
        data: benefits,
        message: 'Benefícios ativos recuperados com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Erro ao buscar benefícios ativos: ${error}`
      });
    }
  }

  // Buscar benefícios por tipo
  async getBenefitsByType(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      const benefits = await this.benefitService.getBenefitsByType(type);
      
      res.status(200).json({
        success: true,
        data: benefits,
        message: `Benefícios do tipo ${type} recuperados com sucesso`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Erro ao buscar benefícios por tipo: ${error}`
      });
    }
  }

  // Buscar benefícios expirando
  async getExpiringBenefits(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const benefits = await this.benefitService.getExpiringBenefits(days);
      
      res.status(200).json({
        success: true,
        data: benefits,
        message: 'Benefícios expirando recuperados com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Erro ao buscar benefícios expirando: ${error}`
      });
    }
  }

  // Criar novo benefício
  async createBenefit(req: Request, res: Response): Promise<void> {
    try {
      const benefit = await this.benefitService.createBenefit(req.body);
      
      res.status(201).json({
        success: true,
        data: benefit,
        message: 'Benefício criado com sucesso'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: `Erro ao criar benefício: ${error}`
      });
    }
  }

  // Atualizar benefício
  async updateBenefit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const benefit = await this.benefitService.updateBenefit(id, req.body);
      
      res.status(200).json({
        success: true,
        data: benefit,
        message: 'Benefício atualizado com sucesso'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: `Erro ao atualizar benefício: ${error}`
      });
    }
  }

  // Atualizar status
  async updateBenefitStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const benefit = await this.benefitService.updateBenefitStatus(id, status);
      
      res.status(200).json({
        success: true,
        data: benefit,
        message: 'Status do benefício atualizado com sucesso'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: `Erro ao atualizar status: ${error}`
      });
    }
  }

  // Ativar benefício
  async activateBenefit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const benefit = await this.benefitService.activateBenefit(id);
      
      res.status(200).json({
        success: true,
        data: benefit,
        message: 'Benefício ativado com sucesso'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: `Erro ao ativar benefício: ${error}`
      });
    }
  }

  // Desativar benefício
  async deactivateBenefit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const benefit = await this.benefitService.deactivateBenefit(id);
      
      res.status(200).json({
        success: true,
        data: benefit,
        message: 'Benefício desativado com sucesso'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: `Erro ao desativar benefício: ${error}`
      });
    }
  }

  // Suspender benefício
  async suspendBenefit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const benefit = await this.benefitService.suspendBenefit(id);
      
      res.status(200).json({
        success: true,
        data: benefit,
        message: 'Benefício suspenso com sucesso'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: `Erro ao suspender benefício: ${error}`
      });
    }
  }

  // Cancelar benefício
  async cancelBenefit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const benefit = await this.benefitService.cancelBenefit(id);
      
      res.status(200).json({
        success: true,
        data: benefit,
        message: 'Benefício cancelado com sucesso'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: `Erro ao cancelar benefício: ${error}`
      });
    }
  }

  // Deletar benefício
  async deleteBenefit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.benefitService.deleteBenefit(id);
      
      res.status(200).json({
        success: true,
        message: 'Benefício deletado com sucesso'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: `Erro ao deletar benefício: ${error}`
      });
    }
  }

  // Duplicar benefício
  async duplicateBenefit(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name } = req.body;
      
      const benefit = await this.benefitService.duplicateBenefit(id, name);
      
      res.status(201).json({
        success: true,
        data: benefit,
        message: 'Benefício duplicado com sucesso'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: `Erro ao duplicar benefício: ${error}`
      });
    }
  }

  // Obter estatísticas
  async getBenefitStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.benefitService.getBenefitStats();
      
      res.status(200).json({
        success: true,
        data: stats,
        message: 'Estatísticas recuperadas com sucesso'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: `Erro ao obter estatísticas: ${error}`
      });
    }
  }
}
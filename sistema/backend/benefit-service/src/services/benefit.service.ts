import { BenefitRepository } from '../repositories/benefit.repository';
import { IBenefit, BenefitStatus } from '../models/benefit.model';

export class BenefitService {
  private benefitRepository: BenefitRepository;

  constructor() {
    this.benefitRepository = new BenefitRepository();
  }

  // Buscar todos os benefícios com filtros
  async getAllBenefits(filters: any = {}): Promise<IBenefit[]> {
    try {
      const query: any = {};

      // Aplicar filtros
      if (filters.name) {
        query.name = { $regex: filters.name, $options: 'i' };
      }
      if (filters.type) {
        query.type = filters.type;
      }
      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.provider) {
        query.provider = { $regex: filters.provider, $options: 'i' };
      }
      if (filters.minValue) {
        query.value = { ...query.value, $gte: Number(filters.minValue) };
      }
      if (filters.maxValue) {
        query.value = { ...query.value, $lte: Number(filters.maxValue) };
      }
      if (filters.startDate) {
        query.startDate = { $gte: new Date(filters.startDate) };
      }
      if (filters.endDate) {
        query.endDate = { $lte: new Date(filters.endDate) };
      }

      return await this.benefitRepository.findAll(query);
    } catch (error) {
      throw new Error(`Erro no serviço ao buscar benefícios: ${error}`);
    }
  }

  // Buscar benefício por ID
  async getBenefitById(id: string): Promise<IBenefit> {
    try {
      const benefit = await this.benefitRepository.findById(id);
      if (!benefit) {
        throw new Error('Benefício não encontrado');
      }
      return benefit;
    } catch (error) {
      throw new Error(`Erro no serviço ao buscar benefício: ${error}`);
    }
  }

  // Buscar benefícios ativos
  async getActiveBenefits(): Promise<IBenefit[]> {
    try {
      return await this.benefitRepository.findActive();
    } catch (error) {
      throw new Error(`Erro no serviço ao buscar benefícios ativos: ${error}`);
    }
  }

  // Buscar por tipo
  async getBenefitsByType(type: string): Promise<IBenefit[]> {
    try {
      return await this.benefitRepository.findByType(type);
    } catch (error) {
      throw new Error(`Erro no serviço ao buscar benefícios por tipo: ${error}`);
    }
  }

  // Buscar benefícios expirando
  async getExpiringBenefits(days: number = 30): Promise<IBenefit[]> {
    try {
      return await this.benefitRepository.findExpiring(days);
    } catch (error) {
      throw new Error(`Erro no serviço ao buscar benefícios expirando: ${error}`);
    }
  }

  // Criar novo benefício
  async createBenefit(benefitData: Partial<IBenefit>): Promise<IBenefit> {
    try {
      // Validações básicas
      if (!benefitData.name) {
        throw new Error('Nome do benefício é obrigatório');
      }
      if (!benefitData.type) {
        throw new Error('Tipo do benefício é obrigatório');
      }
      if (!benefitData.value || benefitData.value <= 0) {
        throw new Error('Valor do benefício deve ser maior que zero');
      }
      if (!benefitData.frequency) {
        throw new Error('Frequência é obrigatória');
      }
      if (!benefitData.startDate) {
        throw new Error('Data de início é obrigatória');
      }

      return await this.benefitRepository.create(benefitData);
    } catch (error) {
      throw new Error(`Erro no serviço ao criar benefício: ${error}`);
    }
  }

  // Atualizar benefício
  async updateBenefit(id: string, updateData: Partial<IBenefit>): Promise<IBenefit> {
    try {
      const benefit = await this.benefitRepository.update(id, updateData);
      if (!benefit) {
        throw new Error('Benefício não encontrado para atualização');
      }
      return benefit;
    } catch (error) {
      throw new Error(`Erro no serviço ao atualizar benefício: ${error}`);
    }
  }

  // Atualizar status
  async updateBenefitStatus(id: string, status: BenefitStatus): Promise<IBenefit> {
    try {
      const benefit = await this.benefitRepository.updateStatus(id, status);
      if (!benefit) {
        throw new Error('Benefício não encontrado para atualizar status');
      }
      return benefit;
    } catch (error) {
      throw new Error(`Erro no serviço ao atualizar status: ${error}`);
    }
  }

  // Ativar benefício
  async activateBenefit(id: string): Promise<IBenefit> {
    try {
      return await this.updateBenefitStatus(id, BenefitStatus.ACTIVE);
    } catch (error) {
      throw new Error(`Erro no serviço ao ativar benefício: ${error}`);
    }
  }

  // Desativar benefício
  async deactivateBenefit(id: string): Promise<IBenefit> {
    try {
      return await this.updateBenefitStatus(id, BenefitStatus.INACTIVE);
    } catch (error) {
      throw new Error(`Erro no serviço ao desativar benefício: ${error}`);
    }
  }

  // Suspender benefício
  async suspendBenefit(id: string): Promise<IBenefit> {
    try {
      return await this.updateBenefitStatus(id, BenefitStatus.SUSPENDED);
    } catch (error) {
      throw new Error(`Erro no serviço ao suspender benefício: ${error}`);
    }
  }

  // Cancelar benefício
  async cancelBenefit(id: string): Promise<IBenefit> {
    try {
      return await this.updateBenefitStatus(id, BenefitStatus.CANCELLED);
    } catch (error) {
      throw new Error(`Erro no serviço ao cancelar benefício: ${error}`);
    }
  }

  // Deletar benefício
  async deleteBenefit(id: string): Promise<boolean> {
    try {
      const deleted = await this.benefitRepository.delete(id);
      if (!deleted) {
        throw new Error('Benefício não encontrado para exclusão');
      }
      return deleted;
    } catch (error) {
      throw new Error(`Erro no serviço ao deletar benefício: ${error}`);
    }
  }

  // Duplicar benefício
  async duplicateBenefit(id: string, newName?: string): Promise<IBenefit> {
    try {
      const originalBenefit = await this.getBenefitById(id);
      
      const duplicatedData = {
        ...originalBenefit.toObject(),
        name: newName || `${originalBenefit.name} - Cópia`,
        status: BenefitStatus.PENDING,
        currentParticipants: 0
      };
      
      // Remove _id para criar novo documento
      delete duplicatedData._id;
      delete duplicatedData.createdAt;
      delete duplicatedData.updatedAt;
      
      return await this.createBenefit(duplicatedData);
    } catch (error) {
      throw new Error(`Erro no serviço ao duplicar benefício: ${error}`);
    }
  }

  // Obter estatísticas
  async getBenefitStats(): Promise<any> {
    try {
      return await this.benefitRepository.getStats();
    } catch (error) {
      throw new Error(`Erro no serviço ao obter estatísticas: ${error}`);
    }
  }
}
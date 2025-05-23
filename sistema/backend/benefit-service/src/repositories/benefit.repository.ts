import Benefit, { IBenefit, BenefitStatus } from '../models/benefit.model';

export class BenefitRepository {
  
  // Buscar todos os benefícios
  async findAll(filter: any = {}): Promise<IBenefit[]> {
    try {
      return await Benefit.find(filter).sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Erro ao buscar benefícios: ${error}`);
    }
  }

  // Buscar benefício por ID
  async findById(id: string): Promise<IBenefit | null> {
    try {
      return await Benefit.findById(id);
    } catch (error) {
      throw new Error(`Erro ao buscar benefício: ${error}`);
    }
  }

  // Buscar benefícios ativos
  async findActive(): Promise<IBenefit[]> {
    try {
      const now = new Date();
      return await Benefit.find({
        status: BenefitStatus.ACTIVE,
        startDate: { $lte: now },
        $or: [
          { endDate: { $exists: false } },
          { endDate: { $gte: now } }
        ]
      }).sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Erro ao buscar benefícios ativos: ${error}`);
    }
  }

  // Buscar por tipo
  async findByType(type: string): Promise<IBenefit[]> {
    try {
      return await Benefit.find({ type }).sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Erro ao buscar benefícios por tipo: ${error}`);
    }
  }

  // Buscar benefícios próximos ao vencimento
  async findExpiring(days: number = 30): Promise<IBenefit[]> {
    try {
      const now = new Date();
      const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
      
      return await Benefit.find({
        status: BenefitStatus.ACTIVE,
        endDate: {
          $exists: true,
          $gte: now,
          $lte: futureDate
        }
      }).sort({ endDate: 1 });
    } catch (error) {
      throw new Error(`Erro ao buscar benefícios expirando: ${error}`);
    }
  }

  // Criar novo benefício
  async create(benefitData: Partial<IBenefit>): Promise<IBenefit> {
    try {
      const benefit = new Benefit(benefitData);
      return await benefit.save();
    } catch (error) {
      throw new Error(`Erro ao criar benefício: ${error}`);
    }
  }

  // Atualizar benefício
  async update(id: string, updateData: Partial<IBenefit>): Promise<IBenefit | null> {
    try {
      return await Benefit.findByIdAndUpdate(
        id, 
        updateData, 
        { new: true, runValidators: true }
      );
    } catch (error) {
      throw new Error(`Erro ao atualizar benefício: ${error}`);
    }
  }

  // Atualizar status
  async updateStatus(id: string, status: BenefitStatus): Promise<IBenefit | null> {
    try {
      return await Benefit.findByIdAndUpdate(
        id, 
        { status }, 
        { new: true }
      );
    } catch (error) {
      throw new Error(`Erro ao atualizar status: ${error}`);
    }
  }

  // Deletar benefício
  async delete(id: string): Promise<boolean> {
    try {
      const result = await Benefit.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      throw new Error(`Erro ao deletar benefício: ${error}`);
    }
  }

  // Contar total de benefícios
  async count(filter: any = {}): Promise<number> {
    try {
      return await Benefit.countDocuments(filter);
    } catch (error) {
      throw new Error(`Erro ao contar benefícios: ${error}`);
    }
  }

  // Obter estatísticas básicas
  async getStats(): Promise<any> {
    try {
      const [total, active, inactive, suspended, cancelled] = await Promise.all([
        this.count(),
        this.count({ status: BenefitStatus.ACTIVE }),
        this.count({ status: BenefitStatus.INACTIVE }),
        this.count({ status: BenefitStatus.SUSPENDED }),
        this.count({ status: BenefitStatus.CANCELLED })
      ]);

      return {
        total,
        active,
        inactive,
        suspended,
        cancelled
      };
    } catch (error) {
      throw new Error(`Erro ao obter estatísticas: ${error}`);
    }
  }
}
import { connectToDatabase } from '../config/database';
import { IPayroll, createPayrollModel, IDeduction, IBenefit, IAdditional } from '../models/payroll.model';

// Interface para o repositório de Payroll
export interface IPayrollRepository {
  findAll(): Promise<IPayroll[]>;
  findById(id: string): Promise<IPayroll | null>;
  findByWorker(workerId: string): Promise<IPayroll[]>;
  findByMonth(month: number, year: number): Promise<IPayroll[]>;
  findByWorkerAndMonth(workerId: string, month: number, year: number): Promise<IPayroll | null>;
  create(payroll: Omit<IPayroll, '_id'>): Promise<IPayroll>;
  update(id: string, payroll: Partial<IPayroll>): Promise<IPayroll | null>;
  delete(id: string): Promise<boolean>;
  addDeduction(payrollId: string, deduction: IDeduction): Promise<IPayroll | null>;
  updateDeduction(payrollId: string, deductionId: string, updates: Partial<IDeduction>): Promise<IPayroll | null>;
  removeDeduction(payrollId: string, deductionId: string): Promise<IPayroll | null>;
  addBenefit(payrollId: string, benefit: IBenefit): Promise<IPayroll | null>;
  updateBenefit(payrollId: string, benefitId: string, updates: Partial<IBenefit>): Promise<IPayroll | null>;
  removeBenefit(payrollId: string, benefitId: string): Promise<IPayroll | null>;
  addAdditional(payrollId: string, additional: IAdditional): Promise<IPayroll | null>;
  updateAdditional(payrollId: string, additionalId: string, updates: Partial<IAdditional>): Promise<IPayroll | null>;
  removeAdditional(payrollId: string, additionalId: string): Promise<IPayroll | null>;
  setStatus(id: string, status: "draft" | "processing" | "completed" | "canceled"): Promise<IPayroll | null>;
  recalculate(id: string): Promise<IPayroll | null>;
}

// Implementação do repositório de Payroll
export class PayrollRepository implements IPayrollRepository {
  
  // Encontra todos os pagamentos
  async findAll(): Promise<IPayroll[]> {
    await connectToDatabase();
    const PayrollModel = createPayrollModel();
    return PayrollModel.find().sort({ year: -1, month: -1 }).exec();
  }

  // Encontra um pagamento pelo ID
  async findById(id: string): Promise<IPayroll | null> {
    await connectToDatabase();
    const PayrollModel = createPayrollModel();
    return PayrollModel.findById(id).exec();
  }

  // Encontra pagamentos por ID de funcionário
  async findByWorker(workerId: string): Promise<IPayroll[]> {
    await connectToDatabase();
    const PayrollModel = createPayrollModel();
    return PayrollModel.find({ workerId }).sort({ year: -1, month: -1 }).exec();
  }

  // Encontra pagamentos por mês e ano
  async findByMonth(month: number, year: number): Promise<IPayroll[]> {
    await connectToDatabase();
    const PayrollModel = createPayrollModel();
    return PayrollModel.find({ month, year }).sort({ workerName: 1 }).exec();
  }

  // Encontra pagamento específico de um funcionário por mês e ano
  async findByWorkerAndMonth(workerId: string, month: number, year: number): Promise<IPayroll | null> {
    await connectToDatabase();
    const PayrollModel = createPayrollModel();
    return PayrollModel.findOne({ workerId, month, year }).exec();
  }

  // Cria um novo registro de pagamento
  async create(payroll: Omit<IPayroll, '_id'>): Promise<IPayroll> {
    await connectToDatabase();
    const PayrollModel = createPayrollModel();
    
    // Certifica-se de calcular os totais
    const payrollData = this.calculatePayrollTotals(payroll);
    
    // Cria um novo registro
    const newPayroll = new PayrollModel(payrollData);
    return newPayroll.save();
  }

  // Atualiza um registro de pagamento pelo ID
  async update(id: string, payroll: Partial<IPayroll>): Promise<IPayroll | null> {
    await connectToDatabase();
    const PayrollModel = createPayrollModel();
    
    // Adiciona a data de atualização
    const updates = {
      ...payroll,
      updatedDate: new Date()
    };
    
    const updatedPayroll = await PayrollModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).exec();
    
    // Se atualizou valores que afetam o cálculo, recalcula os totais
    if (updatedPayroll && this.shouldRecalculate(payroll)) {
      return this.recalculate(id);
    }
    
    return updatedPayroll;
  }

  // Exclui um registro de pagamento pelo ID
  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const PayrollModel = createPayrollModel();
    const result = await PayrollModel.findByIdAndDelete(id).exec();
    return result !== null;
  }

  // Adiciona um desconto ao registro de pagamento
  async addDeduction(payrollId: string, deduction: IDeduction): Promise<IPayroll | null> {
    await connectToDatabase();
    const PayrollModel = createPayrollModel();
    
    const updatedPayroll = await PayrollModel.findByIdAndUpdate(
      payrollId,
      { 
        $push: { deductions: deduction },
        $set: { updatedDate: new Date() }
      },
      { new: true }
    ).exec();
    
    // Recalcula os totais
    if (updatedPayroll) {
      return this.recalculate(payrollId);
    }
    
    return null;
  }

  // Atualiza um desconto no registro de pagamento
  async updateDeduction(payrollId: string, deductionId: string, updates: Partial<IDeduction>): Promise<IPayroll | null> {
    await connectToDatabase();
    const PayrollModel = createPayrollModel();
    
    // Primeiro obter o payroll para verificar se o desconto existe
    const payroll = await this.findById(payrollId);
    if (!payroll) return null;
    
    // Encontra o índice do desconto
    const deductionIndex = payroll.deductions.findIndex(d => d._id?.toString() === deductionId);
    if (deductionIndex === -1) return null;
    
    // Preparar o caminho para cada campo que pode ser atualizado
    const updateFields: any = { updatedDate: new Date() };
    
    // Atualizar os campos do desconto
    if (updates.name !== undefined) {
      updateFields[`deductions.${deductionIndex}.name`] = updates.name;
    }
    
    if (updates.value !== undefined) {
      updateFields[`deductions.${deductionIndex}.value`] = updates.value;
    }
    
    if (updates.type !== undefined) {
      updateFields[`deductions.${deductionIndex}.type`] = updates.type;
    }
    
    if (updates.description !== undefined) {
      updateFields[`deductions.${deductionIndex}.description`] = updates.description;
    }
    
    // Atualizar os campos específicos
    const updatedPayroll = await PayrollModel.findByIdAndUpdate(
      payrollId,
      { $set: updateFields },
      { new: true }
    ).exec();
    
    // Recalcula os totais
    if (updatedPayroll) {
      return this.recalculate(payrollId);
    }
    
    return null;
  }

  // Remove um desconto do registro de pagamento
  async removeDeduction(payrollId: string, deductionId: string): Promise<IPayroll | null> {
    await connectToDatabase();
    const PayrollModel = createPayrollModel();
    
    const updatedPayroll = await PayrollModel.findByIdAndUpdate(
      payrollId,
      { 
        $pull: { deductions: { _id: deductionId } },
        $set: { updatedDate: new Date() }
      },
      { new: true }
    ).exec();
    
    // Recalcula os totais
    if (updatedPayroll) {
      return this.recalculate(payrollId);
    }
    
    return null;
  }

  // Adiciona um benefício ao registro de pagamento
  async addBenefit(payrollId: string, benefit: IBenefit): Promise<IPayroll | null> {
    await connectToDatabase();
    const PayrollModel = createPayrollModel();
    
    const updatedPayroll = await PayrollModel.findByIdAndUpdate(
      payrollId,
      { 
        $push: { benefits: benefit },
        $set: { updatedDate: new Date() }
      },
      { new: true }
    ).exec();
    
    // Recalcula os totais
    if (updatedPayroll) {
      return this.recalculate(payrollId);
    }
    
    return null;
  }

  // Atualiza um benefício no registro de pagamento
  async updateBenefit(payrollId: string, benefitId: string, updates: Partial<IBenefit>): Promise<IPayroll | null> {
    await connectToDatabase();
    const PayrollModel = createPayrollModel();
    
    // Primeiro obter o payroll para verificar se o benefício existe
    const payroll = await this.findById(payrollId);
    if (!payroll) return null;
    
    // Encontra o índice do benefício
    const benefitIndex = payroll.benefits.findIndex(b => b._id?.toString() === benefitId);
    if (benefitIndex === -1) return null;
    
    // Preparar o caminho para cada campo que pode ser atualizado
    const updateFields: any = { updatedDate: new Date() };
    
    // Atualizar os campos do benefício
    if (updates.name !== undefined) {
      updateFields[`benefits.${benefitIndex}.name`] = updates.name;
    }
    
    if (updates.value !== undefined) {
      updateFields[`benefits.${benefitIndex}.value`] = updates.value;
    }
    
    if (updates.type !== undefined) {
      updateFields[`benefits.${benefitIndex}.type`] = updates.type;
    }
    
    if (updates.description !== undefined) {
      updateFields[`benefits.${benefitIndex}.description`] = updates.description;
    }
    
    // Atualizar os campos específicos
    const updatedPayroll = await PayrollModel.findByIdAndUpdate(
      payrollId,
      { $set: updateFields },
      { new: true }
    ).exec();
    
    // Recalcula os totais
    if (updatedPayroll) {
      return this.recalculate(payrollId);
    }
    
    return null;
  }

  // Remove um benefício do registro de pagamento
  async removeBenefit(payrollId: string, benefitId: string): Promise<IPayroll | null> {
    await connectToDatabase();
    const PayrollModel = createPayrollModel();
    
    const updatedPayroll = await PayrollModel.findByIdAndUpdate(
      payrollId,
      { 
        $pull: { benefits: { _id: benefitId } },
        $set: { updatedDate: new Date() }
      },
      { new: true }
    ).exec();
    
    // Recalcula os totais
    if (updatedPayroll) {
      return this.recalculate(payrollId);
    }
    
    return null;
  }

  // Adiciona um adicional ao registro de pagamento
  async addAdditional(payrollId: string, additional: IAdditional): Promise<IPayroll | null> {
    await connectToDatabase();
    const PayrollModel = createPayrollModel();
    
    const updatedPayroll = await PayrollModel.findByIdAndUpdate(
      payrollId,
      { 
        $push: { additionals: additional },
        $set: { updatedDate: new Date() }
      },
      { new: true }
    ).exec();
    
    // Recalcula os totais
    if (updatedPayroll) {
      return this.recalculate(payrollId);
    }
    
    return null;
  }

  // Atualiza um adicional no registro de pagamento
  async updateAdditional(payrollId: string, additionalId: string, updates: Partial<IAdditional>): Promise<IPayroll | null> {
    await connectToDatabase();
    const PayrollModel = createPayrollModel();
    
    // Primeiro obter o payroll para verificar se o adicional existe
    const payroll = await this.findById(payrollId);
    if (!payroll) return null;
    
    // Encontra o índice do adicional
    const additionalIndex = payroll.additionals.findIndex(a => a._id?.toString() === additionalId);
    if (additionalIndex === -1) return null;
    
    // Preparar o caminho para cada campo que pode ser atualizado
    const updateFields: any = { updatedDate: new Date() };
    
    // Atualizar os campos do adicional
    if (updates.name !== undefined) {
      updateFields[`additionals.${additionalIndex}.name`] = updates.name;
    }
    
    if (updates.value !== undefined) {
      updateFields[`additionals.${additionalIndex}.value`] = updates.value;
    }
    
    if (updates.type !== undefined) {
      updateFields[`additionals.${additionalIndex}.type`] = updates.type;
    }
    
    if (updates.description !== undefined) {
      updateFields[`additionals.${additionalIndex}.description`] = updates.description;
    }
    
    // Atualizar os campos específicos
    const updatedPayroll = await PayrollModel.findByIdAndUpdate(
      payrollId,
      { $set: updateFields },
      { new: true }
    ).exec();
    
    // Recalcula os totais
    if (updatedPayroll) {
      return this.recalculate(payrollId);
    }
    
    return null;
  }

  // Remove um adicional do registro de pagamento
  async removeAdditional(payrollId: string, additionalId: string): Promise<IPayroll | null> {
    await connectToDatabase();
    const PayrollModel = createPayrollModel();
    
    const updatedPayroll = await PayrollModel.findByIdAndUpdate(
      payrollId,
      { 
        $pull: { additionals: { _id: additionalId } },
        $set: { updatedDate: new Date() }
      },
      { new: true }
    ).exec();
    
    // Recalcula os totais
    if (updatedPayroll) {
      return this.recalculate(payrollId);
    }
    
    return null;
  }

  // Atualiza o status do registro de pagamento
  async setStatus(id: string, status: "draft" | "processing" | "completed" | "canceled"): Promise<IPayroll | null> {
    await connectToDatabase();
    const PayrollModel = createPayrollModel();
    
    // Adiciona data de pagamento se o status for "completed"
    const updateData: any = { status, updatedDate: new Date() };
    if (status === "completed" && !(await this.findById(id))?.paymentDate) {
      updateData.paymentDate = new Date();
    }
    
    return PayrollModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).exec();
  }

  // Recalcula os totais do registro de pagamento
  async recalculate(id: string): Promise<IPayroll | null> {
    await connectToDatabase();
    const PayrollModel = createPayrollModel();
    
    // Busca o registro atual
    const payroll = await this.findById(id);
    if (!payroll) return null;
    
    // Calcula os novos totais
    const totalDeductions = this.calculateTotalDeductions(payroll);
    const totalBenefits = this.calculateTotalBenefits(payroll);
    const totalAdditionals = this.calculateTotalAdditionals(payroll);
    
    // Calcula o salário líquido
    const netSalary = payroll.baseGrossSalary + totalAdditionals + totalBenefits - totalDeductions;
    
    // Atualiza os totais
    return PayrollModel.findByIdAndUpdate(
      id,
      { 
        $set: { 
          totalDeductions,
          totalBenefits,
          totalAdditionals,
          netSalary,
          updatedDate: new Date()
        } 
      },
      { new: true }
    ).exec();
  }

  // Métodos privados auxiliares
  
  // Verifica se é necessário recalcular os totais
  private shouldRecalculate(updates: Partial<IPayroll>): boolean {
    // Verifica se algum campo que afeta os cálculos foi alterado
    return (
      updates.baseGrossSalary !== undefined ||
      updates.deductions !== undefined ||
      updates.benefits !== undefined ||
      updates.additionals !== undefined
    );
  }
  
  // Calcula os totais de um registro de pagamento
  private calculatePayrollTotals(payroll: any): any {
    const payrollData = { ...payroll };
    
    // Calcula os totais
    payrollData.totalDeductions = this.calculateTotalDeductions(payroll);
    payrollData.totalBenefits = this.calculateTotalBenefits(payroll);
    payrollData.totalAdditionals = this.calculateTotalAdditionals(payroll);
    
    // Calcula o salário líquido
    payrollData.netSalary = payroll.baseGrossSalary + payrollData.totalAdditionals + 
                           payrollData.totalBenefits - payrollData.totalDeductions;
    
    return payrollData;
  }
  
  // Calcula o total de descontos
  private calculateTotalDeductions(payroll: any): number {
    let total = 0;
    
    if (payroll.deductions && Array.isArray(payroll.deductions)) {
      for (const deduction of payroll.deductions) {
        if (deduction.type === "percentage") {
          total += (payroll.baseGrossSalary * deduction.value / 100);
        } else { // fixed
          total += deduction.value;
        }
      }
    }
    
    return total;
  }
  
  // Calcula o total de benefícios
  private calculateTotalBenefits(payroll: any): number {
    let total = 0;
    
    if (payroll.benefits && Array.isArray(payroll.benefits)) {
      for (const benefit of payroll.benefits) {
        if (benefit.type === "percentage") {
          total += (payroll.baseGrossSalary * benefit.value / 100);
        } else { // fixed
          total += benefit.value;
        }
      }
    }
    
    return total;
  }
  
  // Calcula o total de adicionais
  private calculateTotalAdditionals(payroll: any): number {
    let total = 0;
    
    if (payroll.additionals && Array.isArray(payroll.additionals)) {
      for (const additional of payroll.additionals) {
        if (additional.type === "percentage") {
          total += (payroll.baseGrossSalary * additional.value / 100);
        } else { // fixed
          total += additional.value;
        }
      }
    }
    
    return total;
  }

  // Atualiza um campo específico no registro de pagamento
  private async updateField(
    payrollId: string,
    field: 'deductions' | 'benefits' | 'additionals',
    operation: '$push' | '$pull' | '$set',
    value: any
  ): Promise<IPayroll | null> {
    const PayrollModel = createPayrollModel();
    const update = { [operation]: { [field]: value } };
    return PayrollModel.findByIdAndUpdate(payrollId, update, { new: true }).exec();
  }
}

// Exporta uma instância única do repositório
export const payrollRepository = new PayrollRepository();
export default payrollRepository;
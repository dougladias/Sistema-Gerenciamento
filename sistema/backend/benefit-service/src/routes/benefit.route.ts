import mongoose, { Document, Schema } from 'mongoose';

// Enums
export enum BenefitType {
  HEALTH = "health",
  DENTAL = "dental", 
  LIFE_INSURANCE = "life_insurance",
  MEAL_VOUCHER = "meal_voucher",
  FOOD_VOUCHER = "food_voucher",
  TRANSPORT = "transport",
  EDUCATION = "education",
  CHILDCARE = "childcare",
  GYM = "gym",
  OTHER = "other"
}

export enum BenefitStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  PENDING = "pending",
  SUSPENDED = "suspended",
  CANCELLED = "cancelled"
}

export enum BenefitFrequency {
  MONTHLY = "monthly",
  QUARTERLY = "quarterly",
  SEMIANNUAL = "semiannual",
  ANNUAL = "annual",
  ONE_TIME = "one_time"
}

// Interface do documento
export interface IBenefit extends Document {
  name: string;
  description?: string;
  type: BenefitType;
  value: number;
  frequency: BenefitFrequency;
  status: BenefitStatus;
  startDate: Date;
  endDate?: Date;
  eligibilityCriteria?: string;
  provider?: string;
  maxParticipants?: number;
  currentParticipants: number;
  requirements: string[];
  benefits: string[];
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
  };
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema básico do Mongoose
const BenefitSchema = new Schema<IBenefit>({
  name: {
    type: String,
    required: [true, 'Nome do benefício é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Descrição não pode ter mais de 500 caracteres']
  },
  type: {
    type: String,
    enum: Object.values(BenefitType),
    required: [true, 'Tipo do benefício é obrigatório']
  },
  value: {
    type: Number,
    required: [true, 'Valor do benefício é obrigatório'],
    min: [0, 'Valor deve ser positivo']
  },
  frequency: {
    type: String,
    enum: Object.values(BenefitFrequency),
    required: [true, 'Frequência é obrigatória']
  },
  status: {
    type: String,
    enum: Object.values(BenefitStatus),
    default: BenefitStatus.PENDING
  },
  startDate: {
    type: Date,
    required: [true, 'Data de início é obrigatória']
  },
  endDate: {
    type: Date
  },
  eligibilityCriteria: {
    type: String,
    trim: true,
    maxlength: [300, 'Critérios de elegibilidade não podem ter mais de 300 caracteres']
  },
  provider: {
    type: String,
    trim: true,
    maxlength: [100, 'Nome do fornecedor não pode ter mais de 100 caracteres']
  },
  maxParticipants: {
    type: Number,
    min: [1, 'Número máximo de participantes deve ser pelo menos 1']
  },
  currentParticipants: {
    type: Number,
    default: 0,
    min: [0, 'Número atual de participantes não pode ser negativo']
  },
  requirements: [{
    type: String,
    trim: true,
    maxlength: [200, 'Cada requisito não pode ter mais de 200 caracteres']
  }],
  benefits: [{
    type: String,
    trim: true,
    maxlength: [200, 'Cada benefício não pode ter mais de 200 caracteres']
  }],
  contactInfo: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    website: {
      type: String,
      trim: true
    }
  },
  createdBy: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Índices para melhor performance
BenefitSchema.index({ name: 1 });
BenefitSchema.index({ type: 1 });
BenefitSchema.index({ status: 1 });
BenefitSchema.index({ startDate: 1, endDate: 1 });
BenefitSchema.index({ provider: 1 });
BenefitSchema.index({ createdAt: -1 });

// Virtual para calcular valor anual
BenefitSchema.virtual('annualValue').get(function(this: IBenefit) {
  const multipliers: Record<BenefitFrequency, number> = {
    [BenefitFrequency.MONTHLY]: 12,
    [BenefitFrequency.QUARTERLY]: 4,
    [BenefitFrequency.SEMIANNUAL]: 2,
    [BenefitFrequency.ANNUAL]: 1,
    [BenefitFrequency.ONE_TIME]: 1
  };
  return this.value * (multipliers[this.frequency] || 1);
});

// Virtual para verificar se está ativo
BenefitSchema.virtual('isActive').get(function(this: IBenefit) {
  const now = new Date();
  return this.status === BenefitStatus.ACTIVE && 
         this.startDate <= now && 
         (!this.endDate || this.endDate >= now);
});

// Virtual para verificar se está próximo ao vencimento
BenefitSchema.virtual('isExpiringSoon').get(function(this: IBenefit) {
  if (!this.endDate) return false;
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
  return this.endDate <= thirtyDaysFromNow && this.endDate > now;
});

// Modelo
const Benefit = mongoose.model<IBenefit>('Benefit', BenefitSchema);

export default Benefit;
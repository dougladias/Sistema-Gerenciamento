import mongoose, { Schema, Document } from "mongoose";

// Interface para Role
export interface IRole extends Document {
  name: string;
  description: string;
  permissions: string[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Schema para Role
const RoleSchema = new Schema<IRole>(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true, // Isso já cria um índice, não precisamos redefini-lo abaixo
      trim: true,
      minlength: 2,
      maxlength: 50
    },
    description: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 255
    },
    permissions: [{ 
      type: String,
      validate: {
        validator: function(permission: string) {
          // Valida formato: resource:action
          return /^[a-z]+:[a-z]+$/.test(permission);
        },
        message: 'Permission must be in format "resource:action"'
      }
    }],
    isDefault: { 
      type: Boolean, 
      default: false 
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Índices para performance
// RoleSchema.index({ name: 1 }); // Remova ou comente esta linha
RoleSchema.index({ isDefault: 1 });

// Middleware para validar se ao menos uma permissão foi fornecida
RoleSchema.pre('save', function(next) {
  if (this.permissions.length === 0) {
    next(new Error('Role deve ter pelo menos uma permissão'));
  } else {
    next();
  }
});

// Método estático para buscar role padrão
RoleSchema.statics.findDefault = function() {
  return this.findOne({ isDefault: true });
};

// Função para criar modelo
export const createRoleModel = () => {
  return mongoose.models.Role || mongoose.model<IRole>("Role", RoleSchema);
};

export { RoleSchema };
export default createRoleModel;
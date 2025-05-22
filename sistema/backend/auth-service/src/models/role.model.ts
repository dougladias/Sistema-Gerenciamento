import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  permissions: mongoose.Types.ObjectId[];
  isDefault: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  isAdmin: boolean;
}

const RoleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      // Mantendo unique: true que já cria um índice único implicitamente
      unique: true, 
      trim: true,
      lowercase: true
    },
    description: {
      type: String,
      required: true
    },
    permissions: [{
      type: Schema.Types.ObjectId,
      ref: 'Permission'
    }],
    isDefault: {
      type: Boolean,
      default: false
    },
    isSystem: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Comentando ou removendo esta linha, pois unique: true já cria um índice
// RoleSchema.index({ name: 1 });

// Previne exclusão de roles do sistema
RoleSchema.pre('findOneAndDelete', async function(next) {
  const role = await this.model.findOne(this.getQuery());
  if (role && role.isSystem) {
    next(new Error('Não é possível excluir roles do sistema'));
  } else {
    next();
  }
});

// Função para criar o modelo Role
export const createRoleModel = () => {
  return mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);
};

export default createRoleModel;
export { RoleSchema };
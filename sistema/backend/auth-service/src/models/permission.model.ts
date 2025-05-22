import mongoose, { Document, Schema } from 'mongoose';

export interface IPermission extends Document {
  _id: mongoose.Types.ObjectId;
  resource: string;
  action: string;
  route?: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema = new Schema<IPermission>(
  {
    resource: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    action: {
      type: String,
      required: true,
      enum: ['create', 'read', 'update', 'delete', 'access', 'manage'],
      trim: true,
      lowercase: true
    },
    route: {
      type: String,
      required: true,
      trim: true,
      // Explicitamente definimos o index como falso para garantir que não haja índice automático
      index: false  
    },
    description: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false,
    // Desabilitando a criação automática de índices
    autoIndex: false  
  }
);

// Índice composto único para resource + action
PermissionSchema.index({ resource: 1, action: 1 });

// Índice para route - mantemos apenas esta declaração
PermissionSchema.index({ route: 1 });

// Método para verificar se uma rota corresponde ao padrão
PermissionSchema.methods.matchRoute = function(route: string): boolean {
  if (!this.route) return false;
  
  // Converte o padrão em regex (ex: /admin/* vira /admin/.*)
  const pattern = this.route.replace(/\*/g, '.*');
  const regex = new RegExp(`^${pattern}$`);
  
  return regex.test(route);
};

// Função para criar o modelo Permission
export const createPermissionModel = () => {
  // Certificando que não estamos recriando o modelo se ele já existir
  const modelName = 'Permission';
  return mongoose.models[modelName] || mongoose.model<IPermission>(modelName, PermissionSchema);
};

export default createPermissionModel;
export { PermissionSchema };
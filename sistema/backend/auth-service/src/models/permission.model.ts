import mongoose, { Schema, Document } from "mongoose";

// Interface para Permission
export interface IPermission extends Document {
  resource: string;
  action: string;
  description: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema para Permission
const PermissionSchema = new Schema<IPermission>(
  {
    resource: { 
      type: String, 
      required: true,
      enum: ['workers', 'documents', 'timesheet', 'backoffice', 'reports'],
      lowercase: true
    },
    action: { 
      type: String, 
      required: true,
      enum: ['read', 'create', 'update', 'delete', 'upload', 'download', 'access', 'manage', 'users'],
      lowercase: true
    },
    description: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: 255
    },
    category: { 
      type: String, 
      required: true,
      enum: ['basic', 'advanced', 'admin'],
      default: 'basic'
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Índice composto único para resource + action
PermissionSchema.index({ resource: 1, action: 1 }, { unique: true });
PermissionSchema.index({ category: 1 });

// Virtual para obter o código da permissão (resource:action)
PermissionSchema.virtual('code').get(function() {
  return `${this.resource}:${this.action}`;
});

// Método estático para buscar permissões por categoria
PermissionSchema.statics.findByCategory = function(category: string) {
  return this.find({ category });
};

// Método estático para buscar permissões por recurso
PermissionSchema.statics.findByResource = function(resource: string) {
  return this.find({ resource });
};

// Função para criar modelo
export const createPermissionModel = () => {
  return mongoose.models.Permission || mongoose.model<IPermission>("Permission", PermissionSchema);
};

export { PermissionSchema };
export default createPermissionModel;
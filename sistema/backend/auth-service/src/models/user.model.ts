import mongoose, { Schema, Document } from "mongoose";
import bcrypt from 'bcrypt';

// Interface para User
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: mongoose.Types.ObjectId;
  customPermissions?: string[];
  status: "active" | "inactive" | "suspended";
  lastLogin?: Date;
  loginAttempts?: number;
  lockUntil?: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // Métodos
  comparePassword(password: string): Promise<boolean>;
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

// Schema para User
const UserSchema = new Schema<IUser>(
  {
    name: { 
      type: String, 
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },
    email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
    },
    password: { 
      type: String, 
      required: true,
      minlength: 6
    },
    role: { 
      type: Schema.Types.ObjectId, 
      ref: 'Role',
      required: true
    },
    customPermissions: [{
      type: String,
      validate: {
        validator: function(permission: string) {
          return /^[a-z]+:[a-z]+$/.test(permission);
        },
        message: 'Permission must be in format "resource:action"'
      }
    }],
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active"
    },
    lastLogin: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    createdBy: { 
      type: Schema.Types.ObjectId, 
      ref: 'User'
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Middleware para hash da senha antes de salvar
UserSchema.pre('save', async function(next) {
  // Só faz hash se a senha foi modificada
  if (!this.isModified('password')) return next();
  
  try {
    // Gera o hash da senha
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Método para comparar senha
UserSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    return false;
  }
};

// Método para verificar se conta está bloqueada
UserSchema.methods.isLocked = function(): boolean {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Método para incrementar tentativas de login
UserSchema.methods.incrementLoginAttempts = async function(): Promise<void> {
  // Se já tem um lockUntil e ainda está válido, apenas incrementa
  if (this.lockUntil && this.lockUntil <= Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates: any = { $inc: { loginAttempts: 1 } };
  
  // Se atingiu o máximo de tentativas e não está bloqueado, bloqueia por 2 horas
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000 // 2 horas
    };
  }
  
  return this.updateOne(updates);
};

// Método para resetar tentativas de login
UserSchema.methods.resetLoginAttempts = async function(): Promise<void> {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockUntil: 1
    }
  });
};

// Índices para performance
UserSchema.index({ status: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ lockUntil: 1 }, { sparse: true });

// Função para criar modelo
export const createUserModel = () => {
  return mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
};

export { UserSchema };
export default createUserModel;
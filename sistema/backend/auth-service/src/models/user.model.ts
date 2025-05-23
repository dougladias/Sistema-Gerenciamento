import mongoose, { Schema, Document } from "mongoose";

// Interface para o documento User
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "manager" | "assistant" | "viewer";
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Schema do User
const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, 
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["manager", "assistant", "viewer"],
      default: "viewer"
    },
    permissions: [{ type: String }]
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Criar índices para melhorar a performance das consultas
UserSchema.index({ role: 1 });

// Função para criar o modelo User
export const createUserModel = () => {
  return mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
};

// Exportar o modelo User
export default createUserModel;
export { UserSchema };
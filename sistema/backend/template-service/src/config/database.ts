import mongoose, { Connection } from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente de um local específico
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Interface para o cache de conexão
interface DatabaseConnection {
  conn: Connection | null;
  promise: Promise<typeof mongoose> | null;
}

// Variáveis de ambiente
const MONGODB_URI: string = process.env.MONGODB_URI || '4012';

// Cache global para a conexão com o MongoDB
const globalWithMongoose = global as typeof globalThis & {
  mongoose?: DatabaseConnection;
};

// Verifica se o Mongoose já está definido no cache global
let cached: DatabaseConnection = globalWithMongoose.mongoose || {
  conn: null,
  promise: null,
};

// Se o Mongoose não estiver definido, inicializa o cache
if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = cached;
}

/// Conecta ao MongoDB
export async function connectToDatabase(): Promise<typeof mongoose> {
  // Se já existe uma conexão, retorne-a
  if (cached.conn) {
    return mongoose;
  }

  // Se não existe uma promessa de conexão em andamento, crie uma
  if (!cached.promise) {
    console.log(`🔄 Conectando ao MongoDB: ${MONGODB_URI}`);    
    mongoose.set('strictQuery', true);
    
    // Conecta ao MongoDB e armazena a promessa no cache
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        autoIndex: true, // Importante para índices
      })
      // Aguarda a conexão e armazena no cache
      .then((mongoose) => {
        console.log('✅ Conectado ao MongoDB com sucesso!');
        return mongoose;
      })
      // Em caso de erro, exibe uma mensagem de erro
      .catch((error: Error) => {
        console.error('❌ Erro ao conectar ao MongoDB:', error);
        throw error;
      });
  }

  // Aguarde a promessa existente e armazene a conexão
  await cached.promise;
  cached.conn = mongoose.connection;
  return mongoose;
}

/// Desconecta do MongoDB
export async function disconnectFromDatabase(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('❌ Desconectado do MongoDB');
  }
}

export default connectToDatabase;
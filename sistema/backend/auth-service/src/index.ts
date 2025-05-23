import { httpService } from './services/http.service';
import { connectToDatabase } from './config/database';
import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente do arquivo na raiz do backend
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Porta do serviço Auth (usando PORT ou AUTH_SERVICE_PORT)
const PORT = process.env.PORT || process.env.AUTH_SERVICE_PORT || 4016;

// Função assíncrona para iniciar o servidor
async function startServer() {
  try {
    console.log('🚀 Iniciando Auth Service...');
    console.log(`📝 Configuração: porta=${PORT}, banco=${process.env.MONGODB_URI?.substring(0, 20)}...`);
    
    // Conecta ao banco de dados
    await connectToDatabase();
    
    // Define a porta do serviço auth
    if (httpService) {
      // Se o serviço já tiver uma porta configurada, atualize
      (httpService as any).port = Number(PORT);
    }
    
    // Inicia o serviço HTTP
    httpService.start();
    
    // Exibe informações sobre o serviço
    console.log(`✅ Auth Service iniciado com sucesso em http://localhost:${PORT}`);
    console.log(`📝 ${process.env.APP_NAME || 'API de Autenticação'}`);
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
}

// Inicia o servidor
startServer();

// Trata o encerramento do processo
process.on('SIGINT', async () => {
  console.log('🛑 Auth Service encerrando...');
  process.exit(0);
});
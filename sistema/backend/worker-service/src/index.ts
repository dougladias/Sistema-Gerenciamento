import { workerService } from './services/worker.service';
import { connectToDatabase } from './config/database';
import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente do arquivo na raiz do backend
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Porta do serviço Worker (usando PORT ou WORKER_SERVICE_PORT)
const PORT = process.env.PORT || process.env.WORKER_SERVICE_PORT || 4015;

// Função assíncrona para iniciar o servidor
async function startServer() {
  try {
    console.log('🚀 Iniciando Worker Service...');
    console.log(`📝 Configuração: porta=${PORT}, banco=${process.env.MONGODB_URI?.substring(0, 20)}...`);
    
    // Conecta ao banco de dados
    await connectToDatabase();
    
    // Define a porta do serviço worker
    if (workerService) {
      // Se o serviço já tiver uma porta configurada, atualize
      (workerService as any).port = Number(PORT);
    }
    
    // Inicia o serviço HTTP
    workerService.start();
    
    // Exibe informações sobre o serviço
    console.log(`✅ Worker Service iniciado com sucesso em http://localhost:${PORT}`);
    console.log(`📝 ${process.env.APP_NAME || 'API de Funcionários'}`);
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
}

// Inicia o servidor
startServer();

// Trata o encerramento do processo
process.on('SIGINT', async () => {
  console.log('🛑 Worker Service encerrando...');
  process.exit(0);
});
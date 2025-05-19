import payrollService from './services/payroll.service';
import { connectToDatabase } from './config/database';
import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente do arquivo na raiz do backend
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Porta do serviço Payroll (usando PORT ou PAYROLL_SERVICE_PORT)
const PORT = process.env.PORT || process.env.PAYROLL_SERVICE_PORT || 4013;

// Função assíncrona para iniciar o servidor
async function startServer() {
  try {
    console.log('🚀 Iniciando Payroll Service...');
    console.log(`📝 Configuração: porta=${PORT}, banco=${process.env.MONGODB_URI?.substring(0, 20)}...`);
    
    // Conecta ao banco de dados
    await connectToDatabase();
    
    // Define a porta do serviço payroll
    if (payrollService) {
      // Se o serviço já tiver uma porta configurada, atualize
      (payrollService as any).port = Number(PORT);
    }
    
    // Inicia o serviço HTTP
    (payrollService as any).start();
    
    // Exibe informações sobre o serviço
    console.log(`✅ Payroll Service iniciado com sucesso em http://localhost:${PORT}`);
    console.log(`📝 ${process.env.APP_NAME || 'API de Folha de Pagamento'}`);
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
}

// Inicia o servidor
startServer();

// Trata o encerramento do processo
process.on('SIGINT', async () => {
  console.log('🛑 Payroll Service encerrando...');
  process.exit(0);
});
import { templateService } from './services/template.service';
import { connectToDatabase } from './config/database';
import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente do arquivo na raiz do backend
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Porta do serviço Template
const PORT = process.env.TEMPLATE_SERVICE_PORT || process.env.PORT || 4012;

// Função assíncrona para iniciar o servidor 
async function startServer() {
  try {
    console.log('🚀 Iniciando Template Service...');
    console.log(`📝 Configuração: porta=${PORT}, banco=${process.env.MONGODB_URI?.substring(0, 20)}...`);
    
    // Conecta ao banco de dados
    await connectToDatabase();
    
    // Define a porta do serviço template
    if (templateService) {
      // Se o serviço já tiver uma porta configurada, atualize
      (templateService as any).port = Number(PORT);
    }
    
    // Inicia o serviço HTTP
    templateService.start();
    
    // Exibe informações sobre o serviço
    console.log(`✅ Template Service iniciado com sucesso em http://localhost:${PORT}`);
    console.log(`📝 ${process.env.APP_NAME || 'API de Templates'}`);
    console.log(`📊 Endpoints disponíveis:`);
    console.log(`   GET  /             - Status da API`);
    console.log(`   GET  /templates    - Listar templates`);   
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
}

// Inicia o servidor
startServer();

// Trata o encerramento do processo
process.on('SIGINT', async () => {
  console.log('🛑 Template Service encerrando...');
  process.exit(0);
});
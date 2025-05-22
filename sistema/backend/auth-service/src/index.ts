import { authService } from './services/auth.service';
import { connectToDatabase } from './config/database';
import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Porta do serviço Auth
const PORT = process.env.AUTH_SERVICE_PORT || process.env.PORT || 4013;

async function startServer() {
  try {
    console.log('🚀 Iniciando Auth Service...');
    console.log(`📝 Configuração: porta=${PORT}`);
    console.log(`🔑 JWT Secret configurado: ${process.env.JWT_SECRET ? 'Sim' : 'Não'}`);
    
    // Conecta ao banco de dados
    await connectToDatabase();
    
    // Define a porta do serviço
    if (authService) {
      (authService as any).port = Number(PORT);
    }
    
    // Inicia o serviço
    authService.start();
    
    console.log(`✅ Auth Service iniciado com sucesso em http://localhost:${PORT}`);
    console.log(`🔐 Sistema de Autenticação e Autorização`);
    console.log(`📊 Endpoints principais:`);
    console.log(`   POST /auth/login             - Login de usuário`);
    console.log(`   POST /auth/register          - Registro de usuário`);
    console.log(`   GET  /auth/verify            - Verificar token`);
    console.log(`   POST /auth/check-permission  - Verificar permissão`);
    console.log(`   GET  /users                  - Listar usuários`);
    console.log(`   GET  /roles                  - Listar perfis`);
    console.log(`   GET  /permissions            - Listar permissões`);    
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
}

// Inicia o servidor
startServer();

// Trata o encerramento do processo
process.on('SIGINT', async () => {
  console.log('\n🛑 Auth Service encerrando...');
  const { disconnectFromDatabase } = await import('./config/database');
  await disconnectFromDatabase();
  process.exit(0);
});

// Trata erros não capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Erro não tratado:', err);
  process.exit(1);
});
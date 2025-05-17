#### Worker Service - Gerenciamento de Funcionários ###

PORT = 4015

### Funcionalidades ###

- Controle de ponto (entrada, saída e ausências)
- Gerenciamento de documentos dos funcionários
- Upload e download de arquivos

### Arquitetura ###

(Este microserviço foi implementado com Node.js puro (sem Express), seguindo uma arquitetura simples)

### Arquivos ###

- src/config/: Configuração de conexão com o MongoDB
- src/controllers/: Controladores para funcionalidades específicas
- src/models/: Definição do modelo de dados
- src/repositories/: Repositório para acesso ao banco de dados
- src/routes/: Arquivos com definições de rotas
- src/services/: Serviço principal da aplicação
- src/index.ts: Ponto de entrada da aplicação

### Endpoints da API Funcionários ###

GET http://localhost:4015/workers - Listar todos os funcionários
GET http://localhost:4015/workers/:id - Buscar funcionário por ID
POST http://localhost:4015/workers - Criar novo funcionário
PUT http://localhost:4015/workers/:id - Atualizar funcionário
DELETE http://localhost:4015/workers/:id - Excluir funcionário
POST http://localhost:4015/workers/:id/entries - Adicionar registro de entrada/saída

### Endpoints da API Documentos ###

GET http://localhost:4015/workers/:id/files - Listar documentos de um funcionário
GET http://localhost:4015/workers/:id/files/:fileId - Obter detalhes de um documento
POST http://localhost:4015/workers/:id/files - Adicionar documento (metadados)
PUT http://localhost:4015/workers/:id/files/:fileId - Atualizar informações de um documento
DELETE http://localhost:4015/workers/:id/files/:fileId - Remover documento
GET http://localhost:4015/workers/:id/files/:fileId/download - Download de um documento
POST http://localhost:4015/workers/:id/upload/base64 - Upload de arquivo via Base64


### Criar um funcionário ###

bashcurl -X POST http://localhost:4015/workers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "cpf": "123.456.789-00",
    "nascimento": "1985-10-15",
    "admissao": "2022-01-10",
    "salario": "5000.00",
    "numero": "(11) 98765-4321",
    "email": "joao.silva@exemplo.com",
    "address": "Rua Exemplo, 123",
    "contract": "CLT",
    "role": "Desenvolvedor",
    "department": "TI"
  }'

### Upload de documento via Base64 ###

bashcurl -X POST http://localhost:4015/workers/[ID_DO_FUNCIONARIO]/upload/base64 \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "contrato.pdf",
    "data": "BASE64_ENCODED_DATA",
    "mimetype": "application/pdf",
    "description": "Contrato de trabalho",
    "category": "contrato"
  }'

### Download de documento ###
bashcurl -X GET http://localhost:4015/workers/[ID_DO_FUNCIONARIO]/files/[ID_DO_ARQUIVO]/download -O


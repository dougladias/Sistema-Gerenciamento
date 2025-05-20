# Microsserviço de Templates (Template Service)

Um microsserviço dedicado ao gerenciamento de modelos de documentos (templates) para a plataforma, permitindo armazenamento, recuperação e gerenciamento de vários tipos de documentos como contratos, atestados e certificados.

## 📋 Visão Geral

O Template Service é um microsserviço que permite gerenciar modelos de documentos usados em toda a plataforma. É especialmente útil para armazenar e recuperar documentos padrão como contratos de trabalho, atestados médicos, documentos de admissão e demissão, que podem ser preenchidos dinamicamente com informações específicas.

O serviço é construído utilizando Node.js, TypeScript e MongoDB para armazenamento, oferecendo uma API RESTful para interação com outros serviços ou com o frontend.

## ✨ Funcionalidades

- **Gerenciamento de Templates**
  - Criar novos templates com metadados e conteúdo
  - Listar todos os templates disponíveis
  - Filtrar templates por tipo
  - Baixar o conteúdo original de um template
  - Atualizar templates existentes
  - Excluir templates

- **Categorização**
  - Organização por tipo de documento
  - Metadados para facilitar busca e organização
  - Descrições detalhadas

- **Armazenamento de Conteúdo**
  - Suporte para múltiplos formatos (PDF, DOCX, etc.)
  - Armazenamento binário eficiente no MongoDB
  - Download de arquivos originais

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```
# Configuração do Servidor
TEMPLATE_SERVICE_PORT=4012

# Configuração do MongoDB
MONGODB_URI=mongodb://localhost:27017/template-service

# Nome da Aplicação
APP_NAME=API de Templates
```
## 📂 Estrutura do Projeto

```
/template-service
  /src
    /config
      - database.ts           # Configuração de conexão com MongoDB
    /models
      - template.model.ts     # Modelo de dados dos templates
    /repositories
      - template.repository.ts # Acesso ao banco de dados
    /services
      - template.service.ts   # Implementação do serviço HTTP
    - index.ts                # Ponto de entrada da aplicação
  - package.json
  - tsconfig.json
  - .env
```

## 🌐 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | / | Verificação de saúde da API |
| HEAD | / | Health check para o API Gateway |
| GET | /templates | Listar todos os templates |
| GET | /templates/:id | Obter detalhes de um template |
| GET | /templates/:id/download | Baixar arquivo original de um template |
| GET | /templates/type/:type | Listar templates por tipo |
| POST | /templates | Criar novo template |
| PUT | /templates/:id | Atualizar template existente |
| DELETE | /templates/:id | Excluir template |

## 📊 Modelos de Dados

### Template

```typescript
{
  name: string;              // Nome do template
  type: string;              // Tipo de documento (Contrato, Atestado, etc.)
  description: string;       // Descrição detalhada
  createdBy: string;         // Identificação de quem criou
  createdAt: Date;           // Data de criação
  updatedAt: Date;           // Data de atualização
  format: string;            // Formato do arquivo (PDF, DOCX, etc.)
  fileData: Buffer;          // Conteúdo binário do arquivo
  fileName: string;          // Nome original do arquivo
  fileSize: number;          // Tamanho do arquivo em bytes
  mimeType: string;          // Tipo MIME para download correto
}
```

## 📃 Tipos de Documentos

O serviço suporta os seguintes tipos de documentos:

- Contrato de Trabalho
- Atestado Médico
- Documento de Admissão
- Documento de Demissão
- Certificado
- Outros

Esta categorização facilita a organização e recuperação de templates específicos.

## 📋 Exemplo de Requisição

### Criar Template

```bash
curl -X POST http://localhost:4012/templates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Contrato Padrão CLT",
    "type": "Contrato de Trabalho",
    "description": "Modelo de contrato padrão para contratações CLT",
    "createdBy": "admin",
    "format": "DOCX",
    "fileData": "UEsDBBQABgAIAAAAIQA...", 
    "fileName": "contrato_padrao.docx",
    "fileSize": 12345,
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  }'
```

### Listar Templates

```bash
curl -X GET http://localhost:4012/templates
```

### Baixar Template

```bash
curl -X GET http://localhost:4012/templates/61f0a1e3c7f9b9e8a4d8e7f6/download -o template.docx
```

## 📚 Integração com outros Serviços

O Template Service pode ser facilmente integrado com outros serviços da plataforma:

1. **Worker Service**: Para gerar documentos personalizados para funcionários
2. **Payroll Service**: Para criar templates de holerites e documentos fiscais
3. **Frontend**: Para disponibilizar templates para usuários

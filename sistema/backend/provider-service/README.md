# Microsserviço de Controle de Fornecedores (Provider Service)

Um microsserviço dedicado ao gerenciamento de fornecedores de uma empresa ou instituição, permitindo o registro, acompanhamento e controle de acesso, incluindo o armazenamento de fotos dos fornecedores diretamente no MongoDB.

## 📋 Visão Geral

O Provider Service é um microsserviço que possibilita o controle completo de fornecedores, desde o agendamento até o registro de entrada e saída. É especialmente útil para recepções, portarias e áreas de segurança, permitindo acompanhar quem está fornecendo serviços nas instalações, quem é o responsável, o propósito da visita e registrar informações e fotos dos fornecedores.

O serviço é construído utilizando Node.js, TypeScript e MongoDB para armazenamento, oferecendo uma API RESTful para interação com outros serviços ou com o frontend. Uma característica importante é que as fotos dos fornecedores são armazenadas diretamente no MongoDB como documentos binários, simplificando o gerenciamento e melhorando a segurança.

## ✨ Funcionalidades

- **Gerenciamento de Fornecedores**
  - Cadastrar novos fornecedores com informações completas
  - Anexar e armazenar fotos dos fornecedores
  - Agendar visitas com data e hora de entrada e saída
  - Listar todos os fornecedores com filtros diversos
  - Pesquisar fornecedores por nome, documento ou responsável
  - Atualizar informações dos fornecedores
  - Excluir registros de fornecedores

- **Controle de Acesso**
  - Registrar entrada e saída de fornecedores
  - Acompanhar fornecedores atualmente nas instalações
  - Gerenciar status (agendado, em visita, finalizado, cancelado)
  - Verificar histórico de visitas

- **Armazenamento de Fotos**
  - Captura e armazenamento de fotos dos fornecedores
  - Armazenamento eficiente no MongoDB como binário
  - Recuperação e visualização de fotos
  - Atualização de fotos quando necessário

O serviço estará disponível em `http://localhost:4010`

## 📂 Estrutura do Projeto

```
/provider-service
  /src
    /config
      - database.ts           # Configuração de conexão com MongoDB
    /controllers
      - provider.controller.ts # Controlador das requisições HTTP
    /models
      - provider.model.ts      # Modelo de dados dos fornecedores
    /repositories
      - provider.repository.ts # Acesso ao banco de dados
    /routes
      - provider.route.ts      # Definição dos endpoints da API
    /services
      - provider.service.ts    # Implementação da lógica de negócios
    - index.ts                # Ponto de entrada da aplicação
  - package.json
  - tsconfig.json
  - .env
  - README.md
```

## 🌐 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | / | Verificação de saúde da API |
| GET | /providers | Listar todos os fornecedores (admite filtros) |
| GET | /providers/current | Listar fornecedores que estão no prédio atualmente |
| GET | /providers/:id | Obter detalhes de um fornecedor |
| GET | /providers/:id/photo | Visualizar foto de um fornecedor |
| POST | /providers | Criar registro de novo fornecedor |
| PUT | /providers/:id | Atualizar informações de um fornecedor |
| PUT | /providers/:id/photo | Atualizar foto de um fornecedor |
| PATCH | /providers/:id/status | Atualizar status de um fornecedor |
| POST | /providers/:id/check-in | Registrar entrada de fornecedor |
| POST | /providers/:id/check-out | Registrar saída de fornecedor |
| DELETE | /providers/:id | Excluir registro de fornecedor |

## 📃 Status de Fornecedores

O serviço gerencia os seguintes status para fornecedores:

- **expected (Agendado)**: Visita agendada, mas o fornecedor ainda não chegou
- **checked-in (Em visita)**: Fornecedor entrou nas instalações 
- **checked-out (Finalizado)**: Fornecedor saiu, visita concluída
- **cancelled (Cancelado)**: Visita cancelada

## 📋 Exemplo de Requisições

### Criar Fornecedor

```bash
curl -X POST http://localhost:4010/providers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "documentType": "rg",
    "documentNumber": "12.345.678-9",
    "phone": "(11) 98765-4321",
    "email": "joao@example.com",
    "company": "Empresa Fornecedora ABC",
    "reason": "Manutenção dos equipamentos de ar condicionado",
    "hostName": "Maria Oliveira",
    "scheduledEntry": "2025-05-21T14:00:00.000Z",
    "scheduledExit": "2025-05-21T16:00:00.000Z",
    "notes": "Trazer equipamentos de segurança necessários",
    "photo": {
      "originalName": "foto_joao.jpg",
      "mimetype": "image/jpeg",
      "size": 153840,
      "content": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
    }
  }'
```

### Listar Fornecedores

```bash
curl -X GET http://localhost:4010/providers
```

### Registrar Entrada de Fornecedor

```bash
curl -X POST http://localhost:4010/providers/61f0a1e3c7f9b9e8a4d8e7f6/check-in
```

### Obter Foto do Fornecedor

```bash
curl -X GET http://localhost:4010/providers/61f0a1e3c7f9b9e8a4d8e7f6/photo --output foto_fornecedor.jpg
```

## 🔧 Filtros Disponíveis

O endpoint `GET /providers` suporta os seguintes parâmetros de query para filtrar resultados:

- `name` - Busca por nome (busca parcial)
- `documentNumber` - Busca por número do documento (busca exata)
- `status` - Filtra por status (expected, checked-in, checked-out, cancelled)
- `hostName` - Busca por nome do responsável (busca parcial)
- `startDate` - Data inicial para filtro por período
- `endDate` - Data final para filtro por período

### Exemplo de uso dos filtros:

```bash
# Buscar fornecedores com status "checked-in"
curl -X GET "http://localhost:4010/providers?status=checked-in"

# Buscar fornecedores por nome
curl -X GET "http://localhost:4010/providers?name=João"

# Buscar fornecedores por período
curl -X GET "http://localhost:4010/providers?startDate=2025-05-01&endDate=2025-05-31"
```

## 🔐 Considerações de Segurança

- O serviço utiliza validação de dados em todas as entradas
- Implementa sanitização para evitar injeção de código
- Armazenamento seguro de fotos e dados pessoais diretamente no MongoDB
- Controle de acesso através do API Gateway
- Validação de tipos de documentos e formatos de email
- Controle de tamanho e tipo de arquivo para fotos


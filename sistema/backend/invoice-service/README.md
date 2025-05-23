# Microsserviço de Notas Fiscais (Invoice Service)

Um microsserviço dedicado ao gerenciamento de notas fiscais para a plataforma, permitindo armazenamento, recuperação e gerenciamento de notas fiscais, incluindo o armazenamento eficiente dos arquivos diretamente no MongoDB.

## 📋 Visão Geral

O Invoice Service é um microsserviço que permite gerenciar notas fiscais em toda a plataforma. É especialmente útil para armazenar, visualizar e controlar documentos fiscais como notas fiscais eletrônicas (NFe), notas fiscais de serviço, recibos e outros documentos tributários relacionados às operações da empresa.

O serviço é construído utilizando Node.js, TypeScript e MongoDB para armazenamento, oferecendo uma API RESTful para interação com outros serviços ou com o frontend. Uma característica importante é que os arquivos das notas fiscais são armazenados diretamente no MongoDB como documentos binários, simplificando o gerenciamento e eliminando a necessidade de um serviço separado de armazenamento de arquivos.

## ✨ Funcionalidades

- **Gerenciamento de Notas Fiscais**
  - Criar novas notas fiscais com metadados e arquivo anexo
  - Listar todas as notas fiscais disponíveis
  - Filtrar notas fiscais por período, status e valores
  - Baixar o arquivo original de uma nota fiscal
  - Atualizar notas fiscais existentes
  - Atualizar o status de pagamento de notas fiscais
  - Excluir notas fiscais

- **Controle de Status**
  - Acompanhamento de status: pendente, pago, cancelado
  - Atualização simplificada de status
  - Filtragem por status para facilitar o gerenciamento

- **Armazenamento Eficiente**
  - Armazenamento direto de arquivos no MongoDB
  - Suporte para múltiplos formatos (PDF, XML, etc.)
  - Download de arquivos originais

## 📂 Estrutura do Projeto

```
/invoice-service
  /src
    /config
      - database.ts           # Configuração de conexão com MongoDB
    /controllers
      - invoice.controller.ts # Controlador das requisições HTTP
    /models
      - invoice.model.ts      # Modelo de dados das notas fiscais
    /repositories
      - invoice.repository.ts # Acesso ao banco de dados
    /routes
      - invoice.route.ts      # Definição dos endpoints da API
    /services
      - invoice.service.ts    # Implementação da lógica de negócios
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
| GET | /invoices | Listar todas as notas fiscais |
| GET | /invoices/:id | Obter detalhes de uma nota fiscal |
| POST | /invoices | Criar nova nota fiscal com arquivo |
| PUT | /invoices/:id | Atualizar nota fiscal existente |
| PATCH | /invoices/:id/status | Atualizar status de uma nota fiscal |
| DELETE | /invoices/:id | Excluir nota fiscal |
| GET | /invoices/:id/download | Baixar arquivo original de uma nota fiscal |

## 📊 Modelos de Dados

### Nota Fiscal (Invoice)

```typescript
{
  _id?: string;              // ID gerado pelo MongoDB
  number: string;            // Número da nota fiscal
  date: Date;                // Data de emissão
  value: number;             // Valor total
  description: string;       // Descrição da nota fiscal
  status: "pendente" | "pago" | "cancelado"; // Status
  issuer: string;            // Nome do emissor
  recipient: string;         // Nome do destinatário
  attachment: {              // Arquivo da nota fiscal
    filename: string;        // Nome do arquivo no sistema
    originalName: string;    // Nome original do arquivo
    mimetype: string;        // Tipo MIME do arquivo
    size: number;            // Tamanho em bytes
    content: Buffer;         // Conteúdo binário
    uploadDate: Date;        // Data de upload
  };
  createdAt: Date;           // Data de criação do registro
  updatedAt: Date;           // Data de atualização do registro
}
```

## 📃 Status de Notas Fiscais

O serviço gerencia os seguintes status para notas fiscais:

- **Pendente**: Nota fiscal emitida mas ainda não paga
- **Pago**: Nota fiscal que já foi paga
- **Cancelado**: Nota fiscal que foi cancelada

Esta categorização facilita o controle financeiro e o acompanhamento de pagamentos.

## 📋 Exemplo de Requisições

### Criar Nota Fiscal

```bash
curl -X POST http://localhost:4014/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "number": "NF-e 12345",
    "date": "2025-05-20T00:00:00.000Z",
    "value": 1500.50,
    "description": "Serviços de consultoria em TI",
    "status": "pendente",
    "issuer": "Empresa ABC Ltda",
    "recipient": "Cliente XYZ S/A",
    "attachment": {
      "originalName": "nfe-12345.pdf",
      "mimetype": "application/pdf",
      "size": 153840,
      "content": "JVBERi0xLjcKJeLjz9MKNSAwIG9iago..."
    }
  }'
```

### Listar Notas Fiscais

```bash
curl -X GET http://localhost:/invoices
```

### Atualizar Status para Pago

```bash
curl -X PATCH http://localhost:4014/invoices/61f0a1e3c7f9b9e8a4d8e7f6/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "pago"
  }'
```

### Baixar Arquivo da Nota Fiscal

```bash
curl -X GET http://localhost:4014/invoices/61f0a1e3c7f9b9e8a4d8e7f6/download -o nota_fiscal.pdf
```

## 🔐 Considerações de Segurança

- O serviço utiliza validação de dados em todas as entradas
- Implementa sanitização para evitar injeção de código
- Armazenamento seguro de documentos fiscais diretamente no MongoDB
- Controle de acesso através do API Gateway


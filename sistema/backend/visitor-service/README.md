# Microsserviço de Controle de Visitantes (Visitor Service)

Um microsserviço dedicado ao gerenciamento de visitantes de uma empresa ou instituição, permitindo o registro, acompanhamento e controle de acesso, incluindo o armazenamento de fotos dos visitantes diretamente no MongoDB.

## 📋 Visão Geral

O Visitor Service é um microsserviço que possibilita o controle completo de visitantes, desde o agendamento até o registro de entrada e saída. É especialmente útil para recepções, portarias e áreas de segurança, permitindo acompanhar quem está visitando as instalações, quem é o anfitrião, o propósito da visita e registrar informações e fotos dos visitantes.

O serviço é construído utilizando Node.js, TypeScript e MongoDB para armazenamento, oferecendo uma API RESTful para interação com outros serviços ou com o frontend. Uma característica importante é que as fotos dos visitantes são armazenadas diretamente no MongoDB como documentos binários, simplificando o gerenciamento e melhorando a segurança.

## ✨ Funcionalidades

- **Gerenciamento de Visitantes**
  - Cadastrar novos visitantes com informações completas
  - Anexar e armazenar fotos dos visitantes
  - Agendar visitas com data e hora de entrada e saída
  - Listar todos os visitantes com filtros diversos
  - Pesquisar visitantes por nome, documento ou anfitrião
  - Atualizar informações dos visitantes
  - Excluir registros de visitantes

- **Controle de Acesso**
  - Registrar entrada e saída de visitantes
  - Acompanhar visitantes atualmente nas instalações
  - Gerenciar status (agendado, em visita, finalizado, cancelado)
  - Verificar histórico de visitas

- **Armazenamento de Fotos**
  - Captura e armazenamento de fotos dos visitantes
  - Armazenamento eficiente no MongoDB como binário
  - Recuperação e visualização de fotos
  - Atualização de fotos quando necessário


O serviço estará disponível em `http://localhost:4016`

## 📂 Estrutura do Projeto

```
/visitor-service
  /src
    /config
      - database.ts           # Configuração de conexão com MongoDB
    /controllers
      - visitor.controller.ts # Controlador das requisições HTTP
    /models
      - visitor.model.ts      # Modelo de dados dos visitantes
    /repositories
      - visitor.repository.ts # Acesso ao banco de dados
    /routes
      - visitor.route.ts      # Definição dos endpoints da API
    /services
      - visitor.service.ts    # Implementação da lógica de negócios
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
| GET | /visitors | Listar todos os visitantes (admite filtros) |
| GET | /visitors/current | Listar visitantes que estão no prédio atualmente |
| GET | /visitors/:id | Obter detalhes de um visitante |
| GET | /visitors/:id/photo | Visualizar foto de um visitante |
| POST | /visitors | Criar registro de novo visitante |
| PUT | /visitors/:id | Atualizar informações de um visitante |
| PUT | /visitors/:id/photo | Atualizar foto de um visitante |
| PATCH | /visitors/:id/status | Atualizar status de um visitante |
| POST | /visitors/:id/check-in | Registrar entrada de visitante |
| POST | /visitors/:id/check-out | Registrar saída de visitante |
| DELETE | /visitors/:id | Excluir registro de visitante |

## 📊 Modelos de Dados

### Visitante (Visitor)

```typescript
{
  _id?: string;              // ID gerado pelo MongoDB
  name: string;              // Nome completo
  documentType: string;      // Tipo de documento (RG, CPF, CNH, passaporte)
  documentNumber: string;    // Número do documento
  phone: string;             // Telefone
  email?: string;            // Email (opcional)
  company?: string;          // Empresa (opcional)
  reason: string;            // Motivo da visita
  hostName: string;          // Nome do anfitrião
  scheduledEntry?: Date;     // Data/hora agendada para entrada
  scheduledExit?: Date;      // Data/hora agendada para saída
  actualEntry?: Date;        // Data/hora real de entrada
  actualExit?: Date;         // Data/hora real de saída
  status: string;            // Status do visitante (agendado, em visita, finalizado, cancelado)
  notes?: string;            // Observações
  photo?: {                  // Foto do visitante
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

## 📃 Status de Visitantes

O serviço gerencia os seguintes status para visitantes:

- **expected (Agendado)**: Visita agendada, mas o visitante ainda não chegou
- **checked-in (Em visita)**: Visitante entrou nas instalações 
- **checked-out (Finalizado)**: Visitante saiu, visita concluída
- **cancelled (Cancelado)**: Visita cancelada

## 📋 Exemplo de Requisições

### Criar Visitante

```bash
curl -X POST http://localhost:4011/visitors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "documentType": "rg",
    "documentNumber": "12.345.678-9",
    "phone": "(11) 98765-4321",
    "email": "joao@example.com",
    "company": "Empresa ABC",
    "reason": "Reunião com o departamento financeiro",
    "hostName": "Maria Oliveira",
    "scheduledEntry": "2025-05-21T14:00:00.000Z",
    "scheduledExit": "2025-05-21T16:00:00.000Z",
    "notes": "Trazer documentação para assinatura",
    "photo": {
      "originalName": "foto_joao.jpg",
      "mimetype": "image/jpeg",
      "size": 153840,
      "content": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
    }
  }'
```

### Listar Visitantes

```bash
curl -X GET http://localhost:4011/visitors
```

### Registrar Entrada de Visitante

```bash
curl -X POST http://localhost:4011/visitors/61f0a1e3c7f9b9e8a4d8e7f6/check-in
```

### Obter Foto do Visitante

```bash
curl -X GET http://localhost:4011/visitors/61f0a1e3c7f9b9e8a4d8e7f6/photo --output foto_visitante.jpg
```

## 🔐 Considerações de Segurança

- O serviço utiliza validação de dados em todas as entradas
- Implementa sanitização para evitar injeção de código
- Armazenamento seguro de fotos e dados pessoais diretamente no MongoDB
- Controle de acesso através do API Gateway


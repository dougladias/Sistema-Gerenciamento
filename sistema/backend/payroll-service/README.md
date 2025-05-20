# Microsserviço de Folha de Pagamento (Payroll Service)

## 📋 Visão Geral

O Payroll Service é um microsserviço especializado em folhas de pagamento que oferece funcionalidades para criação, processamento e gerenciamento de folhas de pagamento e holerites. O serviço implementa cálculos tributários complexos (INSS, IRRF, FGTS) e suporta diferentes tipos de contratação (CLT e CNPJ).

O serviço é construído utilizando uma arquitetura limpa e modular, facilitando manutenção e extensão futuras.

## ✨ Funcionalidades

- **Gerenciamento de Folhas de Pagamento**
  - Criação de folhas para períodos específicos (mês/ano)
  - Processamento de lotes de funcionários
  - Resumo com totais por departamento e tipo de contrato

- **Gerenciamento de Holerites**
  - Geração automática de holerites baseada em dados de funcionários
  - Cálculo de impostos, benefícios e descontos
  - Geração de PDFs de holerites individuais  

- **Cálculos Tributários**
  - INSS (alíquotas progressivas) - (2025)
  - IRRF (com dependentes) - (2025)
  - FGTS (8%)
  - Suporte para benefícios e descontos adicionais

- **Suporte a Diferentes Vínculos**
  - Funcionários CLT (cálculos completos de tributos)
  - Prestadores CNPJ (sem encargos trabalhistas)

## 🚀 Configuração e Instalação

# Configuração do Servidor
PAYROLL_SERVICE_HOST=localhost
PAYROLL_SERVICE_PORT=4013

## 📂 Estrutura do Projeto
```
/payroll-service
  /src
    /config
      - database.ts           # Configuração de conexão com MongoDB
    /models
      - payroll.model.ts      # Modelo da folha de pagamento
      - payslip.model.ts      # Modelo de holerite
    /routes
      - payroll.routes.ts     # Rotas para folhas de pagamento
      - payslip.routes.ts     # Rotas para holerites
    /services
      - payroll.service.ts    # Serviços de folha de pagamento
    /utils
      - calculationHelpers.ts # Funções de cálculo de tributos
    - index.ts                # Ponto de entrada da aplicação
  - package.json
  - tsconfig.json  
```

## 🌐 API Endpoints

### Folhas de Pagamento

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | localhost:4013/health | Verificação de saúde da API |
| POST | localhost:4013/payrolls | Criar nova folha de pagamento |
| GET | localhost:4013/payrolls | Listar folhas de pagamento |
| GET | localhost:4013/payrolls/:id | Obter detalhes de uma folha |
| POST | localhost:4013/payrolls/:id/process | Processar folha de pagamento |
| GET | localhost:4013/payrolls/:id/payslips | Listar holerites de uma folha |
| GET | localhost:4013/payrolls/:id/summary | Obter resumo com totais |

### Holerites

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | localhost:4013/payslips/calculate | Simular holerite sem salvar |
| GET | localhost:4013/payslips/:id | Obter um holerite específico |
| GET | localhost:4013/payslips/worker/:workerId | Listar holerites de um funcionário |
| PATCH | localhost:4013/payslips/:id/status | Atualizar status de um holerite |
| GET | localhost:4013/payslips/:id/pdf | Gerar PDF do holerite para download |
| GET | localhost:4013/payslips/:id/view | Visualizar PDF do holerite inline |

## 📊 Modelos de Dados

### Folha de Pagamento (Payroll)

```typescript
{
  month: number;              // Mês (1-12)
  year: number;               // Ano
  status: PayrollStatus;      // "draft", "processing", "completed"
  processedAt?: Date;         // Data de processamento
  totalGrossSalary: number;   // Total de salários brutos
  totalDiscounts: number;     // Total de descontos
  totalNetSalary: number;     // Total de salários líquidos
  employeeCount: number;      // Número de funcionários
  createdAt: Date;            // Data de criação
  updatedAt: Date;            // Data de atualização
}
```

### Holerite (Payslip)

```typescript
{
  payrollId: ObjectId;           // Referência à folha de pagamento
  workerId: string;              // ID do funcionário
  employeeType: EmployeeType;    // "CLT" ou "CNPJ"
  name: string;                  // Nome do funcionário
  position: string;              // Cargo
  department: string;            // Departamento
  baseSalary: number;            // Salário base
  benefits: IBenefit[];          // Lista de benefícios
  deductions: IDeduction[];      // Lista de descontos
  totalDeductions: number;       // Total de descontos
  netSalary: number;             // Salário líquido
  status: PayslipStatus;         // "pending", "processed", "paid"
  paymentDate?: Date;            // Data de pagamento
  month: number;                 // Mês (1-12)
  year: number;                  // Ano
  createdAt: Date;               // Data de criação
  updatedAt: Date;               // Data de atualização
}

### Criar Folha de Pagamento

```bash
curl -X POST http://localhost:4013/payrolls \
  -H "Content-Type: application/json" \
  -d '{"month": 5, "year": 2025}'
```

### Processar Folha com Funcionários

```bash
curl -X POST http://localhost:4013/payrolls/65d81a9c5f6b35e4d88e7c92/process \
  -H "Content-Type: application/json" \
  -d '{
    "employees": [
      {
        "id": "123456",
        "name": "João Silva",
        "position": "Desenvolvedor",
        "department": "Tecnologia",
        "contractType": "CLT",
        "baseSalary": 5000,
        "dependents": 2,
        "benefits": [
          {
            "type": "Vale Refeição",
            "value": 500
          }
        ]
      },
      {
        "id": "789012",
        "name": "Maria Souza",
        "position": "Designer",
        "department": "Marketing",
        "contractType": "CNPJ",
        "baseSalary": 6000,
        "deductions": [
          {
            "type": "ISS",
            "value": 300
          }
        ]
      }
    ]
  }'
```

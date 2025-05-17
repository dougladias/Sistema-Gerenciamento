// Tipo para registro de entrada/saída
export interface Entry {
  entryTime?: Date;
  leaveTime?: Date;
  absent?: boolean;
  date?: Date;
  createdAt?: Date;
}

// Tipo para arquivo associado ao funcionário
export interface WorkerFile {
  _id?: string | object;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  uploadDate: Date;
  description?: string;
  category?: string;
  fileContent?: string; // Conteúdo do arquivo em base64
}

// Tipos de contrato disponíveis
export type ContractType = "CLT" | "PJ";

// Status disponíveis
export type WorkerStatus = "active" | "inactive" | "other";

// Interface completa do Worker (funcionário)
export interface Worker {
  _id?: string;           
  name: string;           
  cpf: string;            
  nascimento: string;     
  admissao: string;       
  salario: string;        
  ajuda?: string;         
  numero: string;         
  email: string;          
  address: string;        
  contract: ContractType; 
  role: string;           
  department: string;     
  status?: WorkerStatus;  
  logs?: Entry[];         
  files?: WorkerFile[];   
  createdAt?: Date;       
  updatedAt?: Date;       
}

// Interface para criação de Worker
export type WorkerCreate = Omit<Worker, '_id' | 'createdAt' | 'updatedAt'>;

// Interface para atualização de Worker (todos os campos são opcionais)
export type WorkerUpdate = Partial<Worker>;

// Interface para filtros de busca de Worker
export interface WorkerFilter {
  name?: string;
  department?: string;
  role?: string;
  status?: WorkerStatus;
  contract?: ContractType;
}
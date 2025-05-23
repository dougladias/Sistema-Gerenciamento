import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente do arquivo na raiz do backend
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Configurações
export const API_GATEWAY_PORT = process.env.API_GATEWAY_PORT || 4000;

// Configurações do serviço de autenticação
export const AUTH_SERVICE_PORT = process.env.AUTH_SERVICE_PORT || 4005;
export const AUTH_SERVICE_HOST = process.env.AUTH_SERVICE_HOST || 'localhost';
export const AUTH_SERVICE_URL = `http://${AUTH_SERVICE_HOST}:${AUTH_SERVICE_PORT}`;

// Configurações do serviço de Visitantes
export const PROVIDER_SERVICE_PORT = process.env.PROVIDER_SERVICE_PORT || 4010;
export const PROVIDER_SERVICE_HOST = process.env.PROVIDER_SERVICE_HOST || 'localhost';
export const PROVIDER_SERVICE_URL = `http://${PROVIDER_SERVICE_HOST}:${PROVIDER_SERVICE_PORT}`;

// Configurações do serviço de Visitantes
export const VISITOR_SERVICE_PORT = process.env.VISITOR_SERVICE_PORT || 4011;
export const VISITOR_SERVICE_HOST = process.env.VISITOR_SERVICE_HOST || 'localhost';
export const VISITOR_SERVICE_URL = `http://${VISITOR_SERVICE_HOST}:${VISITOR_SERVICE_PORT}`;

// Configurações do serviço de templates
export const TEMPLATE_SERVICE_PORT = process.env.TEMPLATE_SERVICE_PORT || 4012;
export const TEMPLATE_SERVICE_HOST = process.env.TEMPLATE_SERVICE_HOST || 'localhost';
export const TEMPLATE_SERVICE_URL = `http://${TEMPLATE_SERVICE_HOST}:${TEMPLATE_SERVICE_PORT}`;

// Configurações do serviço de Folha de Pagamento
export const PAYROLL_SERVICE_PORT = process.env.PAYROLL_SERVICE_PORT || 4013;
export const PAYROLL_SERVICE_HOST = process.env.PAYROLL_SERVICE_HOST || 'localhost';
export const PAYROLL_SERVICE_URL = `http://${PAYROLL_SERVICE_HOST}:${PAYROLL_SERVICE_PORT}`;

// Configurações do serviço de Notas Fiscais
export const INVOICE_SERVICE_PORT = process.env.INVOICE_SERVICE_PORT || 4014;
export const INVOICE_SERVICE_HOST = process.env.INVOICE_SERVICE_HOST || 'localhost';
export const INVOICE_SERVICE_URL = `http://${INVOICE_SERVICE_HOST}:${INVOICE_SERVICE_PORT}`;

// Configurações do serviço worker
export const WORKER_SERVICE_PORT = process.env.WORKER_SERVICE_PORT || 4015;
export const WORKER_SERVICE_HOST = process.env.WORKER_SERVICE_HOST || 'localhost';
export const WORKER_SERVICE_URL = `http://${WORKER_SERVICE_HOST}:${WORKER_SERVICE_PORT}`;

// Configurações do serviço de documentos 
export const DOCUMENT_SERVICE_URL = WORKER_SERVICE_URL;

// Configurações do serviço de Time Sheet 
export const TIMESHEET_SERVICE_URL = WORKER_SERVICE_URL;





import dotenv from 'dotenv';
import path from 'path';

// Carrega as variáveis de ambiente do arquivo na raiz do backend
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Configurações
export const API_GATEWAY_PORT = process.env.API_GATEWAY_PORT || 4000;

// Configurações do serviço de templates
export const TEMPLATE_SERVICE_PORT = process.env.TEMPLATE_SERVICE_PORT || 4012;
export const TEMPLATE_SERVICE_HOST = process.env.TEMPLATE_SERVICE_HOST || 'localhost';
export const TEMPLATE_SERVICE_URL = `http://${TEMPLATE_SERVICE_HOST}:${TEMPLATE_SERVICE_PORT}`;

// Configurações do serviço worker
export const WORKER_SERVICE_PORT = process.env.WORKER_SERVICE_PORT || 4015;
export const WORKER_SERVICE_HOST = process.env.WORKER_SERVICE_HOST || 'localhost';
export const WORKER_SERVICE_URL = `http://${WORKER_SERVICE_HOST}:${WORKER_SERVICE_PORT}`;


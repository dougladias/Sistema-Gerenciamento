const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', 
  headers: {
    'Content-Type': 'application/json'
  }
};

// Importa o tipo de requisição
class ApiService {
  public baseUrl: string; // Alterado para public para permitir acesso direto
  private defaultHeaders: Record<string, string>;

  // Construtor da classe ApiService
  constructor(baseUrl: string = API_CONFIG.baseUrl) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = API_CONFIG.headers;
  }

  // Método genérico para fazer requisições
  async request<T = unknown>(
    endpoint: string, 
    method: string = 'GET', 
    data: unknown = null, 
    customHeaders: Record<string, string> = {}
  ): Promise<T> {
    try {
      // Monta URL completa
      const url = `${this.baseUrl}${endpoint}`;
      
      // Configura opções da requisição
      const options: RequestInit = {
        method,
        headers: {
          ...this.defaultHeaders,
          ...customHeaders
        }
      };      
      
      // Adiciona corpo da requisição se necessário
      if (data && (method === 'POST' || method === 'PUT')) {
        if (customHeaders['Content-Type']?.includes('multipart/form-data')) {         
          options.body = data as BodyInit;          
          const headers = options.headers as Record<string, string>;
          delete headers['Content-Type'];
        } else {
          // Para requisições JSON normais
          options.body = JSON.stringify(data);          
        }
      }
      
      // Faz a requisição
      const response = await fetch(url, options);          
      
      // Tenta extrair JSON da resposta
      let result;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();        
      } else {        
        const text = await response.text();
        result = text || { status: response.status };        
      }
      
      // Verifica se a resposta foi bem-sucedida
      if (!response.ok) {
        const errorMessage = result.error || `Erro ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
      
      // Se a resposta for um blob, retorna como blob
      return result as T;
    } catch (error) {
      console.error('[API Error]', error);      
      throw error;
    }
  }

  // Métodos específicos para cada tipo de requisição
  async get<T>(endpoint: string, customHeaders = {}, isBlob = false): Promise<T> {
    if (isBlob) {
      const url = `${this.baseUrl}${endpoint}`;
      const options = {
        method: 'GET',
        headers: {
          ...this.defaultHeaders,
          ...customHeaders
        }
      };

      // Faz a requisição
      const response = await fetch(url, options);
      
      // Verifica se a resposta foi bem-sucedida
      if (!response.ok) {
        throw new Error(`Erro: ${response.status} - ${response.statusText}`);
      }
      // Retorna o blob
      return response.blob() as Promise<T>;
    }
    
    // Se não for um blob, chama o método genérico
    return this.request<T>(endpoint, 'GET', null, customHeaders);
  }

  // Método POST
  async post<T = unknown>(endpoint: string, data: unknown, customHeaders: Record<string, string> = {}): Promise<T> {
    return this.request<T>(endpoint, 'POST', data, customHeaders);
  }

  // Método PUT
  async put<T = unknown>(endpoint: string, data: unknown, customHeaders: Record<string, string> = {}): Promise<T> {
    return this.request<T>(endpoint, 'PUT', data, customHeaders);
  }

  // Método DELETE
  async delete<T = unknown>(endpoint: string, customHeaders: Record<string, string> = {}): Promise<T> {
    return this.request<T>(endpoint, 'DELETE', null, customHeaders);
  }

  // Método específico para download de arquivos
  async downloadBlob(endpoint: string): Promise<Blob> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/octet-stream'
        }
      });
      
      // Verifica se a resposta foi bem-sucedida
      if (!response.ok) {
        throw new Error(`Erro no download: ${response.status} - ${response.statusText}`);
      }
      
      // Retorna o blob
      return await response.blob();
    } catch (error) {
      console.error('[Download Error]', error);
      throw error;
    }
  }
}

// Exporta uma instância do serviço
export const apiService = new ApiService();
export default apiService;
import http from 'http';
import express from 'express';
import dotenv from 'dotenv';
import routes from '../routes';

dotenv.config();

export class AuthService {
  private server: http.Server;
  private app: express.Application;

  constructor(private port: number = Number(process.env.AUTH_SERVICE_PORT) || 4013) {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
    this.server = http.createServer(this.app);
  }

  private configureMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS
    this.app.use(((req: express.Request, res: express.Response, next: express.NextFunction) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Max-Age', '86400');
      if (req.method === 'OPTIONS') {
        return res.status(204).end();
      }
      next();
    }) as express.RequestHandler);
  }

  private configureRoutes(): void {
    this.app.use('/', routes);
  }

  public start(): void {
    this.server.listen(this.port, () => {
      console.log(`🔐 Auth Service iniciado na porta ${this.port}`);
      this.initializeDefaultData();
    });
  }

  // Inicializa dados padrão (roles e permissions)
  private async initializeDefaultData(): Promise<void> {
    // Manter o código existente para inicialização de dados padrão
    // ...
  }
}

// Exporta o serviço
export const authService = new AuthService();
export default authService;
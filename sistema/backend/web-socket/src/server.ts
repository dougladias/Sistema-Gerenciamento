import { WebSocketServer, WebSocket } from 'ws';
import { createLogger, transports, format } from 'winston';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure winston logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ],
});

// Define types
interface Client {
  id: string;
  ws: WebSocket;
  name?: string;
  isSupport?: boolean;
  lastActivity: Date;
}

interface Message {
  type: 'message' | 'auth' | 'system' | 'notification' | 'ack' | 'error';
  id?: string;
  sender?: string;
  senderName?: string;
  recipient?: string;
  content: string;
  isSupport?: boolean;
  timestamp?: Date;
  role?: 'support' | 'user';
}

// Configuration
const PORT = process.env.WEBSOCKET_PORT || 8080;

// Client management
const clients = new Map<string, Client>();
const supportClients = new Map<string, Client>();
const messageQueue = new Map<string, Message[]>();

// Create WebSocket server
const wss = new WebSocketServer({ port: Number(PORT) });

wss.on('connection', (ws: WebSocket) => {
  const clientId = uuidv4();
  
  // Create client object
  const client: Client = {
    id: clientId,
    ws,
    lastActivity: new Date()
  };
  
  clients.set(clientId, client);
  
  logger.info(`Client connected: ${clientId}`);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'system',
    content: 'Bem-vindo ao suporte Globoo. Como podemos ajudar?',
    timestamp: new Date()
  }));
  
  // Check if there are any support agents online
  if (supportClients.size > 0) {
    ws.send(JSON.stringify({
      type: 'system',
      content: 'Um agente de suporte está disponível e irá lhe atender em breve.',
      timestamp: new Date()
    }));
    
    // Notify support about new user
    for (const support of supportClients.values()) {
      support.ws.send(JSON.stringify({
        type: 'notification',
        content: `Novo cliente conectado: ${clientId}`,
        clientId,
        timestamp: new Date()
      }));
    }
  } else {
    ws.send(JSON.stringify({
      type: 'system',
      content: 'No momento não há agentes disponíveis. Sua mensagem ficará registrada e responderemos assim que possível.',
      timestamp: new Date()
    }));
  }
  
  // Check for any queued messages
  const queuedMessages = messageQueue.get(clientId);
  if (queuedMessages && queuedMessages.length > 0) {
    logger.info(`Sending ${queuedMessages.length} queued messages to ${clientId}`);
    queuedMessages.forEach(message => {
      ws.send(JSON.stringify(message));
    });
    messageQueue.delete(clientId);
  }
  
  ws.on('message', (messageData: Buffer | string) => {
    try {
      client.lastActivity = new Date();
      
      let message: Message;
      try {
        message = JSON.parse(messageData.toString());
      } catch (e) {
        // If the message isn't valid JSON, wrap it
        message = {
          type: 'message',
          content: messageData.toString()
        };
      }
      
      // Add message ID if not present
      if (!message.id) {
        message.id = uuidv4();
      }
      
      logger.debug(`Received from ${clientId}:`, message);
      
      // Handle authentication for support staff
      if (message.type === 'auth' && message.role === 'support') {
        // In production, validate credentials here
        client.isSupport = true;
        client.name = message.senderName || 'Support Agent';
        supportClients.set(clientId, client);
        
        ws.send(JSON.stringify({
          type: 'auth',
          success: true,
          content: 'Autenticado como suporte',
          timestamp: new Date()
        }));
        
        logger.info(`Support agent connected: ${clientId}`);
        return;
      }
      
      // Regular chat message
      if (message.type === 'message') {
        // Send message to appropriate recipients
        if (client.isSupport && message.recipient) {
          // Support sending to specific client
          const recipient = clients.get(message.recipient);
          if (recipient) {
            recipient.ws.send(JSON.stringify({
              type: 'message',
              id: message.id,
              sender: clientId,
              senderName: client.name,
              content: message.content,
              isSupport: true,
              timestamp: new Date()
            }));
          } else {
            // Queue message for offline client
            if (!messageQueue.has(message.recipient)) {
              messageQueue.set(message.recipient, []);
            }
            messageQueue.get(message.recipient)?.push({
              type: 'message',
              id: message.id,
              sender: clientId,
              senderName: client.name,
              content: message.content,
              isSupport: true,
              timestamp: new Date()
            });
          }
        } else {
          // Regular client sending message
          // Forward to all support clients
          if (supportClients.size > 0) {
            for (const support of supportClients.values()) {
              support.ws.send(JSON.stringify({
                type: 'message',
                id: message.id,
                sender: clientId,
                content: message.content,
                timestamp: new Date()
              }));
            }
          } else {
            // Queue message since no support is available
            if (!messageQueue.has('support')) {
              messageQueue.set('support', []);
            }
            messageQueue.get('support')?.push({
              type: 'message',
              id: message.id,
              sender: clientId,
              content: message.content,
              timestamp: new Date()
            });
            
            // Let the user know the message is queued
            ws.send(JSON.stringify({
              type: 'system',
              content: 'Sua mensagem foi recebida e será respondida assim que um agente estiver disponível.',
              timestamp: new Date()
            }));
          }
        }
        
        // Send acknowledgment back
        ws.send(JSON.stringify({
          type: 'ack',
          id: message.id,
          timestamp: new Date()
        }));
      }
    } catch (err) {
      logger.error('Error processing message:', err);
      ws.send(JSON.stringify({
        type: 'error',
        content: 'Error processing your message',
        timestamp: new Date()
      }));
    }
  });
  
  ws.on('close', () => {
    logger.info(`Client disconnected: ${clientId}`);
    
    if (client.isSupport) {
      supportClients.delete(clientId);
    }
    
    clients.delete(clientId);
  });
  
  // Ping to keep connection alive
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    } else {
      clearInterval(pingInterval);
    }
  }, 30000);
});

// Periodically clean up stale connections
setInterval(() => {
  const now = new Date();
  for (const [id, client] of clients.entries()) {
    const inactiveTime = now.getTime() - client.lastActivity.getTime();
    
    // Disconnect clients inactive for more than 2 hours
    if (inactiveTime > 2 * 60 * 60 * 1000) {
      logger.info(`Disconnecting inactive client: ${id}`);
      client.ws.terminate();
      clients.delete(id);
      if (client.isSupport) {
        supportClients.delete(id);
      }
    }
  }
}, 15 * 60 * 1000);

// Create .env file
const dotenvContent = `
WEBSOCKET_PORT=8080
LOG_LEVEL=info
`;

logger.info(`WebSocket server running at ws://localhost:${PORT}`);

// Handle process termination
process.on('SIGINT', () => {
  logger.info('Server shutting down');
  wss.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
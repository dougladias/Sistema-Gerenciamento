"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon, 
  PaperAirplaneIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'developer' | 'system';
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

export default function ChatWebSocket() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [unreadCount, setUnreadCount] = useState(0);
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Connect to WebSocket when component mounts
  useEffect(() => {
    connectWebSocket();
    
    // Clean up on unmount
    return () => {
      if (ws.current) {
        ws.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
    
    // Update unread count when chat is not open
    if (!isOpen && messages.length > 0 && 
        (messages[messages.length - 1].sender === 'developer' || 
         messages[messages.length - 1].sender === 'system')) {
      setUnreadCount(prev => prev + 1);
    }
  }, [messages, isOpen]);
  
  // Reset unread count when opening chat
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      scrollToBottom();
    }
  }, [isOpen]);
  
  const connectWebSocket = () => {
    setStatus('connecting');
    
    try {
      // Connect to your WebSocket server
      const socketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8080';
      ws.current = new WebSocket(socketUrl);
      
      ws.current.onopen = () => {
        setStatus('connected');
        setReconnectAttempts(0);
        setReconnecting(false);
      };
      
      ws.current.onmessage = (event) => {
        try {
          const messageData = JSON.parse(event.data);
          
          if (messageData.type === 'ack') {
            // Update message status to sent
            setMessages(prevMessages => 
              prevMessages.map(msg => 
                msg.id === messageData.id 
                  ? { ...msg, status: 'sent' } 
                  : msg
              )
            );
            return;
          }
          
          if (messageData.type === 'error') {
            addSystemMessage(messageData.content || 'Ocorreu um erro na comunicação');
            return;
          }
          
          if (messageData.type === 'system') {
            addSystemMessage(messageData.content);
            return;
          }
          
          // Regular message from support
          if (messageData.type === 'message' && messageData.isSupport) {
            const supportMessage: Message = {
              id: messageData.id || uuidv4(),
              content: messageData.content,
              sender: 'developer',
              timestamp: new Date(messageData.timestamp || Date.now())
            };
            setMessages(prev => [...prev, supportMessage]);
          }
        } catch (err) {
          console.error('Error parsing message:', err);
          addSystemMessage('Erro ao processar mensagem recebida');
        }
      };
      
      ws.current.onclose = (event) => {
        setStatus('disconnected');
        
        // Don't show disconnection message if we're just reconnecting
        if (!reconnecting) {
          addSystemMessage('Desconectado do suporte');
        }
        
        // Attempt to reconnect with exponential backoff
        const reconnectDelay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        
        setReconnecting(true);
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          connectWebSocket();
        }, reconnectDelay);
      };
      
      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setStatus('disconnected');
      };
    } catch (err) {
      console.error('Failed to connect:', err);
      setStatus('disconnected');
      addSystemMessage('Erro ao conectar com o servidor');
    }
  };
  
  const addSystemMessage = (content: string) => {
    const systemMessage: Message = {
      id: uuidv4(),
      content,
      sender: 'system',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, systemMessage]);
  };
  
  const sendMessage = () => {
    if (!inputMessage.trim() || status !== 'connected') return;
    
    const messageId = uuidv4();
    const userMessage: Message = {
      id: messageId,
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    
    // Send message to WebSocket server
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(JSON.stringify({
          type: 'message',
          id: messageId,
          content: inputMessage
        }));
      } catch (err) {
        console.error('Error sending message:', err);
        // Mark message as error
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === messageId 
              ? { ...msg, status: 'error' } 
              : msg
          )
        );
      }
    } else {
      // Mark message as error
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId 
            ? { ...msg, status: 'error' } 
            : msg
        )
      );
    }
  };
  
  const resendMessage = (messageId: string) => {
    // Find the message
    const messageToResend = messages.find(msg => msg.id === messageId);
    if (!messageToResend) return;
    
    // Update status back to sending
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === messageId 
          ? { ...msg, status: 'sending' } 
          : msg
      )
    );
    
    // Send the message again
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(JSON.stringify({
          type: 'message',
          id: messageId,
          content: messageToResend.content
        }));
      } catch (err) {
        console.error('Error resending message:', err);
        // Mark message as error again
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === messageId 
              ? { ...msg, status: 'error' } 
              : msg
          )
        );
      }
    } else {
      // Mark message as error
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId 
            ? { ...msg, status: 'error' } 
            : msg
        )
      );
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const formatTime = (date: Date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const toggleChat = () => {
    setIsOpen(!isOpen);
    // If we're opening the chat and disconnected, try to reconnect
    if (!isOpen && status === 'disconnected') {
      connectWebSocket();
    }
  };

  const getMessageStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending':
        return <div className="animate-pulse h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500"></div>;
      case 'sent':
        return <div className="h-2 w-2 rounded-full bg-green-500 dark:bg-green-400"></div>;
      case 'error':
        return (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const msgId = e.currentTarget.dataset.msgId;
              if (msgId) resendMessage(msgId);
            }} 
            data-msg-id={arguments[1]?.id}
            className="text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
            title="Tentar novamente"
          >
            <ExclamationCircleIcon className="h-4 w-4" />
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Chat button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <button
          onClick={toggleChat}
          className="relative bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white p-3 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 transform hover:scale-105"
          aria-label="Chat com o suporte"
        >
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
        </button>
      </motion.div>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 w-80 sm:w-96 h-96 rounded-lg shadow-xl z-50 flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Chat header */}
            <div className="bg-cyan-500 dark:bg-cyan-600 text-white px-4 py-3 flex justify-between items-center">
              <div className="flex items-center">
                <div className="mr-3">
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Suporte Globoo</h3>
                  <div className="flex items-center text-xs opacity-80">
                    <span className={`h-2 w-2 rounded-full mr-1 ${
                      status === 'connected' 
                        ? 'bg-green-400' 
                        : status === 'connecting' 
                          ? 'bg-yellow-400' 
                          : 'bg-red-400'
                    }`}></span>
                    <span>
                      {status === 'connected' 
                        ? 'Online' 
                        : status === 'connecting' 
                          ? 'Conectando...' 
                          : reconnecting 
                            ? `Reconectando (tentativa ${reconnectAttempts})` 
                            : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-100 focus:outline-none"
                aria-label="Fechar chat"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Chat messages */}
            <div 
              className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50 dark:bg-gray-900"
              ref={chatContainerRef}
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 text-center px-6">
                  <ChatBubbleLeftRightIcon className="h-12 w-12 mb-3 text-cyan-500 dark:text-cyan-400" />
                  <p className="text-sm">Como podemos te ajudar?</p>
                  <p className="text-xs mt-1">Estamos aqui para responder suas perguntas.</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`mb-3 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] shadow-sm ${
                        message.sender === 'user'
                          ? 'bg-cyan-500 text-white ml-4'
                          : message.sender === 'system'
                            ? 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 mr-4'
                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mr-4'
                      }`}
                    >
                      <p className={`text-sm ${
                        message.sender === 'user' 
                          ? 'text-white' 
                          : message.sender === 'system'
                            ? 'text-gray-600 dark:text-gray-300 italic'
                            : 'text-gray-800 dark:text-gray-200'
                      }`}>
                        {message.content}
                      </p>
                      <div className={`text-xs mt-1 flex items-center justify-end gap-1 ${
                        message.sender === 'user' 
                          ? 'text-cyan-100' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {formatTime(message.timestamp)}
                        {message.sender === 'user' && getMessageStatusIcon(message.status)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat input */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <div className="relative">
                <textarea
                  className="w-full pl-3 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-600 focus:border-transparent text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 dark:bg-gray-700 dark:border-gray-600 resize-none"
                  placeholder="Digite sua mensagem..."
                  rows={2}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={status !== 'connected'}
                />
                <button
                  className={`absolute right-2 bottom-2 p-1 rounded-full focus:outline-none ${
                    inputMessage.trim() && status === 'connected'
                      ? 'text-cyan-500 dark:text-cyan-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || status !== 'connected'}
                  aria-label="Enviar mensagem"
                >
                  <PaperAirplaneIcon className="h-5 w-5 transform rotate-90" />
                </button>
              </div>
              {status !== 'connected' && (
                <div className="text-xs text-center mt-2 text-red-500 dark:text-red-400">
                  {status === 'connecting' 
                    ? 'Conectando ao suporte, aguarde...' 
                    : reconnecting
                      ? `Tentando reconectar... (tentativa ${reconnectAttempts})`
                      : 'Não foi possível conectar ao suporte. Tente novamente mais tarde.'}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
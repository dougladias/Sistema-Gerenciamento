"use client";

import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChatBubbleLeftRightIcon, 
  UserCircleIcon, 
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import Alert from '@/components/ui/Alert';

interface Client {
  id: string;
  lastMessage?: string;
  lastActivity: Date;
  unreadCount: number;
}

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  isSupport?: boolean;
  status?: 'sending' | 'sent' | 'error';
}

export default function SupportDashboard() {
  const [clients, setClients] = useState<Record<string, Client>>({});
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [supportName, setSupportName] = useState('Support Agent');
  const [showSidebar, setShowSidebar] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Set mounted state
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  // Connect to WebSocket when component mounts
  useEffect(() => {
    connectWebSocket();
    
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
    if (selectedClient && messages[selectedClient]?.length) {
      scrollToBottom();
    }
  }, [selectedClient, messages]);
  
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  const connectWebSocket = () => {
    if (reconnecting) return;
    
    setReconnecting(true);
    
    try {
      // Connect to your WebSocket server
      const socketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8080';
      ws.current = new WebSocket(socketUrl);
      
      ws.current.onopen = () => {
        setIsConnected(true);
        setReconnecting(false);
        setReconnectAttempts(0);
        setError(null);
        
        // Authenticate as support
        ws.current?.send(JSON.stringify({
          type: 'auth',
          role: 'support',
          senderName: supportName
        }));
      };
      
      ws.current.onclose = () => {
        setIsConnected(false);
        
        // Try to reconnect with exponential backoff
        const nextAttempt = reconnectAttempts + 1;
        const reconnectDelay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        
        setReconnectAttempts(nextAttempt);
        setError(`Conexão perdida. Tentando reconectar (${nextAttempt})...`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          setReconnecting(false);
          connectWebSocket();
        }, reconnectDelay);
      };
      
      ws.current.onerror = (err) => {
        console.error('WebSocket error:', err);
        setIsConnected(false);
        setError('Erro de conexão com o servidor');
      };
      
      ws.current.onmessage = handleWebSocketMessage;
    } catch (err) {
      console.error('Failed to connect:', err);
      setIsConnected(false);
      setReconnecting(false);
      setError('Falha ao conectar ao servidor');
      
      // Try again after delay
      reconnectTimeoutRef.current = setTimeout(() => {
        setReconnectAttempts(prev => prev + 1);
        connectWebSocket();
      }, 5000);
    }
  };
  
  const handleWebSocketMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      // Handle notifications about new clients
      if (data.type === 'notification' && data.clientId) {
        setClients(prev => ({
          ...prev,
          [data.clientId]: {
            id: data.clientId,
            lastActivity: new Date(),
            unreadCount: prev[data.clientId]?.unreadCount || 1
          }
        }));
      }
      
      // Handle acknowledgments for sent messages
      if (data.type === 'ack' && data.id) {
        const clientId = Object.keys(messages).find(clientId => 
          messages[clientId]?.some(msg => msg.id === data.id)
        );
        
        if (clientId) {
          setMessages(prev => ({
            ...prev,
            [clientId]: prev[clientId].map(msg => 
              msg.id === data.id ? { ...msg, status: 'sent' } : msg
            )
          }));
        }
      }
      
      // Handle incoming messages
      if (data.type === 'message' && data.sender) {
        const newMessage = {
          id: data.id || uuidv4(),
          content: data.content,
          sender: data.sender,
          timestamp: new Date(data.timestamp || Date.now())
        };
        
        // Add message to the client's message list
        setMessages(prev => ({
          ...prev,
          [data.sender]: [...(prev[data.sender] || []), newMessage]
        }));
        
        // Update client info
        setClients(prev => ({
          ...prev,
          [data.sender]: {
            ...prev[data.sender],
            id: data.sender,
            lastMessage: data.content,
            lastActivity: new Date(),
            unreadCount: selectedClient === data.sender 
              ? 0 
              : (prev[data.sender]?.unreadCount || 0) + 1
          }
        }));
      }
    } catch (err) {
      console.error('Error handling message:', err);
      setError('Erro ao processar mensagem recebida');
    }
  };
  
  const sendMessage = () => {
    if (!inputMessage.trim() || !selectedClient || !isConnected) return;
    
    const messageId = uuidv4();
    const newMessage: Message = {
      id: messageId,
      content: inputMessage,
      sender: 'support',
      timestamp: new Date(),
      isSupport: true,
      status: 'sending' as 'sending'
    };
    
    // Add to local messages
    setMessages(prev => ({
      ...prev,
      [selectedClient]: [...(prev[selectedClient] || []), newMessage]
    }));
    
    // Send via WebSocket
    try {
      ws.current?.send(JSON.stringify({
        type: 'message',
        id: messageId,
        recipient: selectedClient,
        content: inputMessage
      }));
      
      // Update client info
      setClients(prev => ({
        ...prev,
        [selectedClient]: {
          ...prev[selectedClient],
          lastMessage: inputMessage,
          lastActivity: new Date()
        }
      }));
      
      setInputMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Update message status to error
      setMessages(prev => ({
        ...prev,
        [selectedClient]: prev[selectedClient].map(msg => 
          msg.id === messageId ? { ...msg, status: 'error' } : msg
        )
      }));
    }
  };
  
  const resendMessage = (clientId: string, messageId: string) => {
    const message = messages[clientId]?.find(m => m.id === messageId);
    if (!message) return;
    
    // Update status back to sending
    setMessages(prev => ({
      ...prev,
      [clientId]: prev[clientId].map(msg => 
        msg.id === messageId ? { ...msg, status: 'sending' } : msg
      )
    }));
    
    // Send via WebSocket
    try {
      ws.current?.send(JSON.stringify({
        type: 'message',
        id: messageId,
        recipient: clientId,
        content: message.content
      }));
    } catch (err) {
      console.error('Error resending message:', err);
      
      // Update message status to error
      setMessages(prev => ({
        ...prev,
        [clientId]: prev[clientId].map(msg => 
          msg.id === messageId ? { ...msg, status: 'error' } : msg
        )
      }));
    }
  };
  
  const selectClient = (clientId: string) => {
    setSelectedClient(clientId);
    
    // Reset unread count
    setClients(prev => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        unreadCount: 0
      }
    }));
  };
  
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  
  const formatTime = (date: Date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (date: Date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) return '';
    
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                   date.getMonth() === now.getMonth() && 
                   date.getFullYear() === now.getFullYear();
                   
    if (isToday) {
      return 'Hoje';
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() && 
                        date.getMonth() === yesterday.getMonth() && 
                        date.getFullYear() === yesterday.getFullYear();
                        
    if (isYesterday) {
      return 'Ontem';
    }
    
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };
  
  const clientList = Object.values(clients).sort(
    (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  );
  
  const getActiveClientsCount = () => {
    return clientList.length;
  };
  
  const getTotalUnreadCount = () => {
    return clientList.reduce((count, client) => count + client.unreadCount, 0);
  };
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1 
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 260, damping: 20 }
    }
  };
  
  const listItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    },
    hover: { 
      backgroundColor: "rgba(103, 232, 249, 0.1)",
      transition: { duration: 0.2 }
    },
    selected: {
      backgroundColor: "rgba(6, 182, 212, 0.15)",
      borderLeftColor: "rgb(6, 182, 212)",
      borderLeftWidth: "4px",
    }
  };
  
  const messageVariants = {
    initial: { 
      opacity: 0, 
      y: 20,
      scale: 0.9
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 500, 
        damping: 30 
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.2 }
    }
  };
  
  return (
    <motion.div 
      className="p-6 ml-[var(--sidebar-width,4.5rem)] transition-all duration-300 bg-gray-50 dark:bg-gray-900 min-h-screen"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ width: "calc(100% - var(--sidebar-width, 4.5rem))" }}
    >
      {/* Page header */}
      <motion.div variants={itemVariants} className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Central de Suporte</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Atenda e gerencie conversas com os usuários</p>
      </motion.div>
      
      {/* Status and error messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4"
          >
            <Alert
              type="error"
              message={error}
              onClose={() => setError(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Connection status */}
      <motion.div 
        variants={itemVariants}
        className={`mb-4 px-4 py-2 rounded-lg flex items-center shadow-sm
          ${isConnected 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900' 
            : reconnecting 
              ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-900' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900'
          }`}
      >
        <div className="mr-3">
          {isConnected ? (
            <CheckCircleIcon className="h-5 w-5 text-green-500 dark:text-green-400" />
          ) : reconnecting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            >
              <ArrowPathIcon className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
            </motion.div>
          ) : (
            <XCircleIcon className="h-5 w-5 text-red-500 dark:text-red-400" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {isConnected 
              ? 'Conectado ao servidor' 
              : reconnecting 
                ? `Tentando reconectar (${reconnectAttempts})` 
                : 'Desconectado do servidor'
            }
          </p>
        </div>
        {!isConnected && !reconnecting && (
          <motion.button 
            className="text-xs bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white px-2 py-1 rounded-md"
            onClick={() => {
              setReconnectAttempts(0);
              connectWebSocket();
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Reconectar
          </motion.button>
        )}
      </motion.div>
      
      {/* Main content */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-240px)]"
      >
        {/* Client list sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col z-10"
            >
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-medium text-gray-800 dark:text-white flex items-center">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2 text-cyan-500 dark:text-cyan-400" />
                    Conversas
                  </h2>
                  <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span className="mr-2">{getActiveClientsCount()} ativos</span>
                    {getTotalUnreadCount() > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                        {getTotalUnreadCount()} não lidas
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="overflow-y-auto flex-1">
                <AnimatePresence>
                  {clientList.length === 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center h-full p-6 text-center"
                    >
                      <div className="bg-cyan-50 dark:bg-cyan-900/20 p-4 rounded-full mb-3">
                        <ChatBubbleLeftRightIcon className="h-8 w-8 text-cyan-500 dark:text-cyan-400" />
                      </div>
                      <h3 className="text-gray-700 dark:text-gray-300 font-medium mb-1">Nenhum cliente conectado</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        As conversas aparecerão aqui quando os clientes entrarem em contato
                      </p>
                    </motion.div>
                  ) : (
                    clientList.map((client, index) => (
                      <motion.div 
                        key={client.id}
                        variants={listItemVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover={selectedClient !== client.id ? "hover" : undefined}
                        className={`border-l-4 ${
                          selectedClient === client.id 
                            ? 'border-cyan-500 dark:border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20' 
                            : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        } cursor-pointer transition-all`}
                        onClick={() => selectClient(client.id)}
                        custom={index * 0.05}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                          <div className="flex items-start">
                            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center mr-3 
                              ${selectedClient === client.id 
                                ? 'bg-cyan-500 text-white' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}
                            >
                              <UserCircleIcon className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between">
                                <h3 className="text-sm font-medium truncate text-gray-800 dark:text-white">
                                  Cliente {client.id.substring(0, 8)}
                                </h3>
                                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                                  {formatDate(client.lastActivity)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  {client.lastMessage || 'Nova conversa iniciada'}
                                </p>
                                {client.unreadCount > 0 && (
                                  <motion.span 
                                    className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring" }}
                                  >
                                    {client.unreadCount}
                                  </motion.span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                {formatTime(client.lastActivity)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Chat area */}
        <motion.div 
          className="lg:col-span-3 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden"
          layout
        >
          {!showSidebar && (
            <div className="absolute top-24 left-6 p-2">
              <button
                className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                onClick={toggleSidebar}
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          
          {selectedClient ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-cyan-500 text-white flex items-center justify-center mr-3">
                    <UserCircleIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-white">
                      Cliente {selectedClient.substring(0, 8)}...
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <span className={`h-2 w-2 rounded-full mr-1 ${
                        isConnected ? 'bg-green-500' : 'bg-gray-400'
                      }`}></span>
                      ID: {selectedClient}
                    </p>
                  </div>
                </div>
                {!showSidebar && (
                  <button
                    onClick={toggleSidebar}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Messages */}
              <div 
                className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900"
                ref={chatContainerRef}
              >
                <AnimatePresence initial={false}>
                  {messages[selectedClient]?.length ? (
                    messages[selectedClient].map((message, index) => (
                      <motion.div 
                        key={message.id}
                        className={`mb-4 flex ${message.sender === 'support' ? 'justify-end' : 'justify-start'}`}
                        variants={messageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        custom={index}
                      >
                        <div
                          className={`rounded-lg px-4 py-3 max-w-[80%] shadow-sm ${
                            message.sender === 'support'
                              ? 'bg-cyan-500 text-white'
                              : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'
                          }`}
                        >
                          <p className={`text-sm ${message.sender === 'support' ? 'text-white' : 'text-gray-800 dark:text-white'}`}>
                            {message.content}
                          </p>
                          <div
                            className={`text-xs mt-1 flex items-center justify-end gap-2 ${
                              message.sender === 'support' ? 'text-cyan-100' : 'text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {formatTime(message.timestamp)}
                            
                            {/* Message status indicator (only for support messages) */}
                            {message.sender === 'support' && (
                              <span className="flex items-center">
                                {message.status === 'sending' && (
                                  <motion.div 
                                    animate={{ scale: [0.8, 1, 0.8] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="h-2 w-2 bg-cyan-200 rounded-full"
                                  />
                                )}
                                {message.status === 'sent' && (
                                  <CheckCircleIcon className="h-3 w-3 text-cyan-200" />
                                )}
                                {message.status === 'error' && (
                                  <motion.button
                                    onClick={() => resendMessage(selectedClient, message.id)}
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="text-red-300 hover:text-red-200"
                                    title="Tentar novamente"
                                  >
                                    <ExclamationTriangleIcon className="h-3 w-3" />
                                  </motion.button>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div 
                      className="h-full flex flex-col items-center justify-center text-center p-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="bg-cyan-50 dark:bg-cyan-900/20 p-5 rounded-full mb-3">
                        <ChatBubbleLeftRightIcon className="h-8 w-8 text-cyan-500 dark:text-cyan-400" />
                      </div>
                      <h3 className="text-gray-700 dark:text-gray-300 font-medium mb-1">Nenhuma mensagem trocada</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md">
                        Envie uma mensagem para iniciar a conversa com este cliente
                      </p>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </AnimatePresence>
              </div>
              
              {/* Message input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="relative">
                  <textarea
                    className="w-full pl-4 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 focus:border-transparent text-gray-700 dark:text-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                    placeholder={isConnected ? "Digite sua mensagem..." : "Conexão indisponível"}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                    rows={2}
                    disabled={!isConnected}
                  />
                  <motion.button
                    className={`absolute right-3 bottom-3 p-2 rounded-full ${
                      inputMessage.trim() && isConnected
                        ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!inputMessage.trim() || !isConnected}
                    onClick={sendMessage}
                    whileHover={inputMessage.trim() && isConnected ? { scale: 1.1 } : {}}
                    whileTap={inputMessage.trim() && isConnected ? { scale: 0.9 } : {}}
                    transition={{ duration: 0.2 }}
                  >
                    <PaperAirplaneIcon className="h-5 w-5 transform rotate-90" />
                  </motion.button>
                </div>
              </div>
            </>
          ) : (
            <motion.div 
              className="flex-1 flex flex-col items-center justify-center p-10 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <motion.div 
                className="bg-cyan-50 dark:bg-cyan-900/20 p-6 rounded-full mb-4"
                initial={{ y: 10 }}
                animate={{ y: [10, -10, 10] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              >
                <ChatBubbleLeftRightIcon className="h-16 w-16 text-cyan-500 dark:text-cyan-400" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Central de Atendimento</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
                Selecione um cliente da lista para iniciar ou continuar uma conversa de atendimento
              </p>
              
              {clientList.length > 0 && window.innerWidth < 768 && !showSidebar && (
                <motion.button
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white rounded-lg flex items-center gap-2 shadow-sm"
                  onClick={toggleSidebar}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  Ver conversas ({clientList.length})
                  {getTotalUnreadCount() > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                      {getTotalUnreadCount()}
                    </span>
                  )}
                </motion.button>
              )}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
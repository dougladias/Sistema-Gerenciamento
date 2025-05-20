"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, X, Calendar, User, FileText } from "lucide-react";
import { Worker, Entry } from "@/types/worker";
import useWorker from "@/hooks/useWorkers";
import useLog from "@/hooks/useTimeSheet";

// Variantes para animação do container principal
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Função para formatar data e hora
const formatDateTime = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return "Não registrada";

  try {
    // Garantir que estamos trabalhando com um objeto Date
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) return "Data inválida";

    // Normalizar para o fuso horário local sem alterar a data/hora
    const formattedDate = date.toLocaleDateString("pt-BR");
    const formattedTime = date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false // Garantir formato 24h para evitar confusões
    });

    // Retornar a data e hora formatadas
    return `${formattedDate} às ${formattedTime}`;
  } catch (error) {
    console.error("Erro formatando data:", error);
    return "Erro no formato";
  }
};

// Função para formatar apenas a data
const formatDate = (dateInput: string | Date | undefined | null): string => {
  if (!dateInput) return "Não registrada";

  try {
    // Garantir que estamos trabalhando com um objeto Date
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) return "Data inválida";
    
    // Usar opções específicas para garantir consistência
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch (error) {
    console.error("Erro formatando data:", error);
    return "Erro no formato";
  }
};

// Função para comparar se duas datas são do mesmo dia
const isSameDay = (date1: Date | string | undefined | null, date2: Date | string | undefined | null): boolean => {
  if (!date1 || !date2) return false;
  
  // Garantir que estamos trabalhando com objetos Date
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  
  // Verificar se as datas são válidas
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
  
  // Comparar ano, mês e dia
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

// Componente para exibir o histórico de registros de ponto
interface LogHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker;
}

// Componente para exibir o histórico de registros de ponto
const LogHistoryModal: React.FC<LogHistoryModalProps> = ({ isOpen, onClose, worker }) => {
  const { logs, loading, fetchWorkerLogs } = useLog();
  
  // Busca os registros quando o modal é aberto
  useEffect(() => {
    if (isOpen && worker._id) {
      fetchWorkerLogs(worker._id);
    }
  }, [isOpen, worker._id, fetchWorkerLogs]);

  // Função para agrupar logs por data
  const groupLogsByDate = (): Record<string, Entry[]> => {
    const grouped: Record<string, Entry[]> = {};

    if (logs && logs.length > 0) {
      logs.forEach((log) => {
        // Determina qual data usar para agrupar
        let dateToUse: string | Date;

        // Prioriza a data efetiva do registro (entryTime para registros normais)
        if (log.entryTime) {
          dateToUse = log.entryTime;
        } else if (log.absent && log.createdAt) {
          // Para ausências sem entrada, usa a data de criação
          dateToUse = log.createdAt;
        } else {
          // Fallback para casos extremos
          dateToUse = new Date().toISOString();
        }
        
        // Cria uma data com apenas ano, mês e dia para garantir consistência
        const date = new Date(dateToUse);
        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();
        
        // Cria uma nova data às 12:00 para evitar problemas de fuso horário
        const normalizedDate = new Date(year, month, day, 12, 0, 0);
        const dateKey = normalizedDate.toISOString().split("T")[0]; // Formato YYYY-MM-DD

        // Agrupa os logs pela data normalizada
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        
        grouped[dateKey].push(log);
      });
    }

    return grouped;
  };

  const groupedLogs = groupLogsByDate();
  // Ordena as datas do mais recente para o mais antigo
  const sortedDates = Object.keys(groupedLogs).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-[#00000091] bg-opacity-50 z-90"
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-100 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="dark:bg-gray-800 bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <div className="flex justify-between items-center p-4 border-b">
                <div className="flex items-center">
                  <User className="text-cyan-500 mr-2" size={20} />
                  <h2 className="text-xl font-semibold">{worker.name}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="text-sm text-gray-600 mr-6">
                  <span className="font-medium">Cargo:</span> {worker.role}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">E-mail:</span> {worker.email}
                </div>
              </div>

              <div className="p-4 overflow-y-auto flex-1">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Calendar className="mr-2 text-cyan-500" size={18} />
                  Histórico de Registros de Ponto
                </h3>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <motion.div
                      className="w-8 h-8 border-4 border-gray-200 rounded-full"
                      style={{ borderTopColor: "#22d3ee" }}
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  </div>
                ) : sortedDates.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    Nenhum registro de ponto encontrado
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedDates.map((dateKey) => (
                      <div
                        key={dateKey}
                        className="border rounded-lg overflow-hidden"
                      >
                        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-medium">
                          {(() => {
                            // Garantir que a data mostrada no cabeçalho corresponda às entradas
                            // Pega a data do primeiro log deste grupo para exibição
                            const dateForDisplay = groupedLogs[dateKey][0].entryTime || 
                                                 groupedLogs[dateKey][0].createdAt || 
                                                 dateKey;
                            
                            // Cria uma nova data normalizada para exibição consistente
                            const date = new Date(dateForDisplay);
                            return date.toLocaleDateString("pt-BR", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            });
                          })()}
                        </div>
                        <div className="divide-y">
                          {groupedLogs[dateKey].map((log, idx) => (
                            <div key={idx} className="px-4 py-3">
                              {log.absent ? (
                                <div className="flex flex-col">
                                  <div className="flex items-center text-yellow-600">
                                    <FileText size={16} className="mr-2" />
                                    <span className="font-medium">
                                      Dia não trabalhado
                                    </span>
                                    <span className="text-gray-500 dark:text-gray-300 ml-2 text-sm">
                                      {formatDate(log.createdAt || log.entryTime)}
                                    </span>
                                  </div>
                                  {log.entryTime && (
                                    <div className="flex items-center text-green-600 mt-1 ml-6">
                                      <Clock size={16} className="mr-2" />
                                      <span>
                                        Entrada atrasada: {formatDateTime(log.entryTime)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex items-center text-green-600">
                                    <Clock size={16} className="mr-2" />
                                    <span>
                                      Entrada: {formatDateTime(log.entryTime)}
                                    </span>
                                  </div>
                                  {log.leaveTime && (
                                    <div className="flex items-center text-red-600">
                                      <Clock size={16} className="mr-2" />
                                      <span>
                                        Saída: {formatDateTime(log.leaveTime)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t p-4 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * Props para o componente WorkerRow
 */
interface WorkerRowProps {
  worker: Worker;
  onCheckIn: (id: string) => void;
  onCheckOut: (id: string) => void;
  onFaltou: (id: string) => void;
  onNameClick: (worker: Worker) => void;
}

/**
 * Componente que exibe uma linha da tabela com informações de um funcionário
 */
const WorkerRow: React.FC<WorkerRowProps> = ({
  worker,
  onCheckIn,
  onCheckOut,
  onFaltou,
  onNameClick,
}) => {
  // Obtém o último registro de ponto do funcionário (se houver)
  const lastLog = worker.logs && worker.logs.length > 0
    ? worker.logs[worker.logs.length - 1]
    : null;

  // Verifica se o último log é do dia atual
  const isToday = lastLog ? isSameDay(new Date(), lastLog.entryTime || lastLog.createdAt) : false;
  
  // Define o estado dos botões
  const checkInDisabled = !!(
    // Desativa se já tem entrada sem saída no dia de hoje
    (lastLog && !lastLog.leaveTime && isToday && !lastLog.absent) ||
    // Ou se já foi marcado como presente hoje (tem entrada e saída)
    (lastLog && lastLog.leaveTime && isToday && !lastLog.absent)
  );
  
  // Só permite saída se há uma entrada sem saída no dia de hoje
  const checkOutDisabled = !lastLog || lastLog.leaveTime !== undefined || !isToday || !!lastLog.absent;

  /**
   * Determina o status atual do funcionário
   * @returns Status como string: "Ausente", "Presente", "Faltou" ou "Atrasado"
   */
  const getStatus = (): string => {
    if (!lastLog) return "Ausente";
    
    // Não está presente hoje
    if (!isToday) return "Ausente";
    
    // Se há um registro de falta, mas também há um horário de entrada após a falta
    if (lastLog.absent === true && lastLog.entryTime) {
      return "Atrasado";
    }
    
    // Se há apenas o registro de falta (sem entrada)
    if (lastLog.absent === true) return "Faltou";
    
    // Se tem entrada mas não tem saída
    if (!lastLog.leaveTime) return "Presente";
    
    // Se tem entrada e saída no mesmo dia
    return "Ausente";
  };

  const status = getStatus();

  return (
    <tr className="border-b hover:bg-gray-300 dark:hover:bg-gray-900">
      <td
        className="py-3 px-4 cursor-pointer hover:text-cyan-600 transition-colors"
        onClick={() => onNameClick(worker)}
      >
        <div className="flex items-center">
          <span className="font-medium">{worker.name}</span>
          <Calendar size={14} className="ml-2 text-gray-400" />
        </div>
      </td>
      <td className="py-3 px-4">{worker.role}</td>
      <td className="py-3 px-4">
        {lastLog ? (
          lastLog.absent ? (
            <div className="flex flex-col">
              <div className="flex items-center text-yellow-600">
                <FileText size={14} className="mr-1" />
                <span className="text-xs">
                  Dia não trabalhado: {formatDate(lastLog.createdAt || lastLog.entryTime)}
                </span>
              </div>
              {/* Mostra entrada atrasada se houver */}
              {lastLog.entryTime && (
                <div className="flex items-center text-xs text-gray-600 dark:text-gray-300 mt-1">
                  <Clock size={12} className="mr-1" /> Entrada atrasada: {formatDateTime(lastLog.entryTime)}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-300 mb-1">
                <Clock size={12} className="mr-1" /> Entrada:{" "}
                {lastLog.entryTime
                  ? formatDateTime(lastLog.entryTime)
                  : "Não registrada"}
              </div>
              <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                <Clock size={12} className="mr-1" /> Saída:{" "}
                {lastLog.leaveTime
                  ? formatDateTime(lastLog.leaveTime)
                  : "Não registrada"}
              </div>
            </div>
          )
        ) : (
          <span className="text-xs text-gray-500 dark:text-gray-300">Sem registros</span>
        )}
      </td>
      <td className="py-3 px-4">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            status === "Presente"
              ? "bg-green-100 text-green-800"
              : status === "Faltou"
              ? "bg-yellow-100 text-yellow-800"
              : status === "Atrasado"
              ? "bg-orange-100 text-orange-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {status}
        </span>
      </td>
      <td className="py-3 px-4">
        <div className="flex space-x-2">
          <button
            onClick={() => onCheckIn(worker._id as string)}
            disabled={checkInDisabled}
            className={`px-3 py-1 rounded text-xs font-medium ${
              checkInDisabled
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-green-100 text-green-800 hover:bg-green-200"
            }`}
          >
            Entrada
          </button>
          <button
            onClick={() => onCheckOut(worker._id as string)}
            disabled={checkOutDisabled}
            className={`px-3 py-1 rounded text-xs font-medium ${
              checkOutDisabled
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-red-100 text-red-800 hover:bg-red-200"
            }`}
          >
            Saída
          </button>
          <button
            onClick={() => onFaltou(worker._id as string)}
            className="px-3 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
          >
            Faltou
          </button>
        </div>
      </td>
    </tr>
  );
};

/**
 * Componente principal da página de controle de ponto
 */
const TimeTrackingPage: React.FC = () => {
  // Estados locais
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);

  // Usando hooks personalizados
  const { 
    workers, 
    loading: workersLoading, 
    error: workersError, 
    fetchWorkers, 
    addEntry 
  } = useWorker();
  
  // Hook para atualização de registros
  const { updateLog } = useLog();

  // Carrega os funcionários ao iniciar e configura atualização periódica
  useEffect(() => {
    fetchWorkers();
    
    // Configura um intervalo para atualizar a lista a cada minuto
    // para atualizar status/horários automaticamente
    const intervalId = setInterval(() => {
      fetchWorkers();
    }, 60000); // 60 segundos
    
    // Limpa o intervalo ao desmontar o componente
    return () => clearInterval(intervalId);
  }, [fetchWorkers]);

  // Ordenar os trabalhadores por nome
  const sortedWorkers = useMemo(() => {
    return [...workers].sort((a, b) => 
      a.name.localeCompare(b.name, 'pt-BR')
    );
  }, [workers]);

  // Obter o funcionário selecionado
  const selectedWorker = selectedWorkerId
    ? sortedWorkers.find((w) => w._id === selectedWorkerId)
    : null;

  // Filtrar funcionários com base no termo de busca
  const filteredWorkers = useMemo(() => {
    return sortedWorkers.filter(
      (worker) =>
      worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sortedWorkers, searchTerm]);

  /**
   * Handler para registrar entrada de um funcionário
   * @param workerId - ID do funcionário
   */
  const handleCheckIn = async (workerId: string): Promise<void> => {
    const worker = workers.find(w => w._id === workerId);
    const lastLog = worker?.logs && worker.logs.length > 0 ? worker.logs[worker.logs.length - 1] : null;
    const now = new Date();
    
    // Verifica se já tem um registro de hoje
    const isLastLogToday = lastLog ? isSameDay(now, lastLog.entryTime || lastLog.createdAt) : false;
    
    // Se o último registro for de falta hoje, atualizamos esse mesmo registro incluindo o horário de entrada
    if (lastLog && lastLog.absent === true && isLastLogToday) {
      // Garante que mantemos o ID original e atualizamos apenas o horário de entrada
      await updateLog(workerId, lastLog._id as string, { 
        entryTime: now
      });
    } else {
      // Caso normal - registra entrada com a data/hora atual exata
      await addEntry(workerId, { 
        entryTime: now
      });
    }
    
    // Atualiza a lista de funcionários
    await fetchWorkers();
  };

  /**
   * Handler para registrar saída de um funcionário
   * @param workerId - ID do funcionário
   */
  const handleCheckOut = async (workerId: string): Promise<void> => {
    const worker = workers.find(w => w._id === workerId);
    const now = new Date();
    
    // Encontrar o registro de entrada mais recente sem saída registrada
    const openEntryLog = worker?.logs?.find(log => 
      log.entryTime && !log.leaveTime && !log.absent
    );
    
    if (openEntryLog && openEntryLog._id) {
      // Verificar se a entrada e saída são de dias diferentes
      const entryDate = openEntryLog.entryTime instanceof Date 
        ? openEntryLog.entryTime 
        : new Date(openEntryLog.entryTime || '');
      
      // Comparar apenas as datas (ignorando as horas)
      const sameDayCheck = isSameDay(entryDate, now);
      
      if (sameDayCheck) {
        // Se for no mesmo dia, apenas atualiza o registro existente
        await updateLog(workerId, openEntryLog._id as string, { 
          leaveTime: now 
        });
      } else {
        // Se for em dias diferentes, criamos dois registros:
        // 1. Fechamos o registro de entrada com saída no mesmo dia (fim do expediente)
        const entryDayEnd = new Date(
          entryDate.getFullYear(),
          entryDate.getMonth(),
          entryDate.getDate(),
          23, 59, 59
        );
        
        await updateLog(workerId, openEntryLog._id as string, { 
          leaveTime: entryDayEnd
        });
        
        // 2. Criamos um novo registro para o dia atual
        const todayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          0, 0, 0
        );
        
        await addEntry(workerId, { 
          entryTime: todayStart,
          leaveTime: now
        });
      }
    } else {
      // Fallback - se não houver entrada, cria um registro apenas com saída
      await addEntry(workerId, { 
        leaveTime: now,
        entryTime: new Date(now.getFullYear(), now.getMonth(), now.getDate())
      });
    }
    
    // Recarregar dados após atualização
    await fetchWorkers();
  };

  /**
   * Handler para registrar falta de um funcionário
   * @param workerId - ID do funcionário
   */
  const handleFaltou = async (workerId: string): Promise<void> => {
    const now = new Date();
    await addEntry(workerId, { 
      absent: true,
      entryTime: now, // Usando 'now' como data de referência para a falta
    });
    
    // Recarregar dados após atualização
    await fetchWorkers();
  };
  /**
   * Handler para abrir o modal de histórico de um funcionário
   * @param worker - Objeto do funcionário
   */
  const handleNameClick = (worker: Worker): void => {
    if (worker._id) {
      setSelectedWorkerId(worker._id as string);
      setIsLogModalOpen(true);
    }
  };

  return (
    <motion.div 
      className="p-6 ml-[var(--sidebar-width,4.5rem)] transition-all duration-300 min-h-screen
      bg-gradient-to-br from-gray-50 via-white to-gray-100
      dark:bg-gradient-to-br dark:from-gray-950 dark:via-gray-900 dark:to-gray-950"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ width: "calc(100% - var(--sidebar-width, 4.5rem))" }}
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white drop-shadow">Controle de Ponto</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Registro de entradas e saídas dos funcionários
          </p>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400 dark:text-gray-500 relative right-10" />
          </div>
          <input
            type="text"
            className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block pl-10 p-2.5 transition-all duration-200 focus:w-64 w-48 shadow-sm dark:shadow-none"
            placeholder="Buscar funcionário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg dark:shadow-cyan-900/10 p-2 border border-gray-100 dark:border-gray-800/60">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800/80 rounded text-gray-700 dark:text-gray-200">
              <th className="py-2 px-4 text-left font-semibold">Nome</th>
              <th className="py-2 px-4 text-left font-semibold">Cargo</th>
              <th className="py-2 px-4 text-left font-semibold">Registro de Ponto</th>
              <th className="py-2 px-4 text-left font-semibold">Status</th>
              <th className="py-2 px-4 text-left font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {workersLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <motion.div
                      className="w-12 h-12 mb-3 border-4 border-gray-200 dark:border-gray-700 rounded-full"
                      style={{ borderTopColor: "#22d3ee" }}
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <motion.span
                      className="text-cyan-400 font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      Carregando dados...
                    </motion.span>
                  </div>
                </td>
              </tr>
            ) : workersError ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-red-500 dark:text-red-400">
                  Erro: {workersError}
                </td>
              </tr>
            ) : filteredWorkers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-gray-600 dark:text-gray-400">
                  {searchTerm
                    ? "Nenhum funcionário encontrado com esse termo de busca."
                    : "Nenhum funcionário encontrado."}
                </td>
              </tr>
            ) : (
              filteredWorkers.map((worker) => (
                <WorkerRow
                  key={worker._id as string}
                  worker={worker}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                  onFaltou={handleFaltou}
                  onNameClick={handleNameClick}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para exibir histórico de ponto */}
      {selectedWorker && (
        <LogHistoryModal
          isOpen={isLogModalOpen}
          onClose={() => setIsLogModalOpen(false)}
          worker={selectedWorker}
        />
      )}
    </motion.div>
  );
};

export default TimeTrackingPage;
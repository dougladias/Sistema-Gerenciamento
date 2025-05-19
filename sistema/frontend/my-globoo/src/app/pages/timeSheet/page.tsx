"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Clock, X, Calendar, User, FileText } from "lucide-react";
import { Entry, Worker } from "@/types/worker";
import useWorker from "@/hooks/useWorkers";
import useLog from "@/hooks/useTimeSheet";

// Adicione antes do componente TimeTrackingPage
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Funções de formatação de data - centralizadas para evitar duplicação
const formatDateTime = (dateInput: string | Date | undefined | null) => {
  if (!dateInput) return "Não registrada";

  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return "Data inválida";

    const formattedDate = date.toLocaleDateString("pt-BR");
    const formattedTime = date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${formattedDate} às ${formattedTime}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Erro no formato";
  }
};

// Função para formatar apenas a data
const formatDate = (dateInput: string | Date | undefined | null) => {
  if (!dateInput) return "Não registrada";

  // Verifica se a data é válida
  try {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return "Data inválida";
    return date.toLocaleDateString("pt-BR");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Erro no formato";
  }
};

// Modal de histórico de registros
const LogHistoryModal = ({
  isOpen,
  onClose,
  worker,
}: {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker;
}) => {
  const { logs, loading, fetchWorkerLogs } = useLog();
  
  // Função para buscar os TimeSheet do trabalhador
  useEffect(() => {
    if (isOpen && worker._id) {
      fetchWorkerLogs(worker._id);
    }
  }, [isOpen, worker._id, fetchWorkerLogs]);

  // Agrupamento dos logs por data
  const groupLogsByDate = () => {
    const grouped: Record<string, Entry[]> = {};

    if (logs && logs.length > 0) {
      logs.forEach((log) => {
        // Para logs de ausência, garantimos uma data válida para agrupar
        let dateToUse;

        if (log.absent) {
          dateToUse = log.createdAt || log.entryTime || new Date().toISOString();
        } else if (log.entryTime) {
          dateToUse = log.entryTime;
        } else {
          // Ignorar logs sem data utilizável
          return;
        }

        const date = new Date(dateToUse);
        const dateKey = date.toISOString().split("T")[0]; // Formato YYYY-MM-DD

        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }

        grouped[dateKey].push(log);
      });
    }

    return grouped;
  };

  const groupedLogs = groupLogsByDate();
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
                          {new Date(dateKey).toLocaleDateString("pt-BR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                        <div className="divide-y">
                          {groupedLogs[dateKey].map((log, idx) => (
                            <div key={idx} className="px-4 py-3">
                              {log.absent ? (
                                <div className="flex items-center text-yellow-600">
                                  <FileText size={16} className="mr-2" />
                                  <span className="font-medium">
                                    Dia não trabalhado
                                  </span>
                                  <span className="text-gray-500 dark:text-gray-300 ml-2 text-sm">
                                    {formatDate(log.createdAt || log.entryTime)}
                                  </span>
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

// Componente de linha da tabela
const WorkerRow = ({
  worker,
  onCheckIn,
  onCheckOut,
  onFaltou,
  onNameClick,
}: {
  worker: Worker;
  onCheckIn: (id: string) => void;
  onCheckOut: (id: string) => void;
  onFaltou: (id: string) => void;
  onNameClick: (worker: Worker) => void;
}) => {
  const lastLog = worker.logs && worker.logs.length > 0
    ? worker.logs[worker.logs.length - 1]
    : null;

  // Verifica se o último registro é de falta ou se não há registro
  const checkInDisabled = !!(lastLog && !lastLog.leaveTime && !lastLog.absent);
  const checkOutDisabled = !lastLog || lastLog.leaveTime !== undefined;

  const getStatus = () => {
    if (!lastLog) return "Ausente";
    
    // Se há um registro de falta, mas também há um horário de entrada após a falta
    if (lastLog.absent === true && lastLog.entryTime) {
      return "Atrasado";
    }
    
    // Se há apenas o registro de falta (sem entrada)
    if (lastLog.absent === true) return "Faltou";
    
    // Comportamento normal
    if (!lastLog.leaveTime) return "Presente";
    return "Ausente";
  };

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
              {/* Adicionamos a exibição da entrada quando o funcionário chega após ser marcado como falta */}
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
            getStatus() === "Presente"
              ? "bg-green-100 text-green-800"
              : getStatus() === "Faltou"
              ? "bg-yellow-100 text-yellow-800"
              : getStatus() === "Atrasado"
              ? "bg-orange-100 text-orange-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {getStatus()}
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

const TimeTrackingPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Usando hooks personalizados
  const { 
    workers, 
    loading: workersLoading, 
    error: workersError, 
    fetchWorkers, 
    addEntry 
  } = useWorker();
  
  // Adicione o hook para atualização de registros
  const { updateLog } = useLog();

  // Carrega os funcionários ao iniciar
  useEffect(() => {
    fetchWorkers();
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

  // Handlers
  const handleCheckIn = async (workerId: string) => {
    const worker = workers.find(w => w._id === workerId);
    const lastLog = worker?.logs && worker.logs.length > 0 ? worker.logs[worker.logs.length - 1] : null;
    
    // Se o último registro for de falta, atualizamos esse mesmo registro incluindo o horário de entrada
    if (lastLog && lastLog.absent === true) {
      await addEntry(workerId, { 
        entryTime: new Date(),
        absent: true // Mantemos o registro de falta, apenas adicionamos o horário de entrada
      });
    } else {
      // Caso normal - apenas registra entrada
      await addEntry(workerId, { entryTime: new Date() });
    }
  };

  const handleCheckOut = async (workerId: string) => {
    const worker = workers.find(w => w._id === workerId);
    // Encontrar o registro de entrada mais recente sem saída registrada
    const openEntryLog = worker?.logs?.find(log => 
      log.entryTime && !log.leaveTime && !log.absent
    );
    
    if (openEntryLog && openEntryLog._id) {
      // Verificar se a entrada e saída são de dias diferentes
      const entryDate = openEntryLog.entryTime instanceof Date 
        ? openEntryLog.entryTime 
        : new Date(openEntryLog.entryTime || '');
      const currentDate = new Date();
      
      // Comparar apenas as datas (ignorando as horas)
      const isSameDay = 
        entryDate.getDate() === currentDate.getDate() &&
        entryDate.getMonth() === currentDate.getMonth() &&
        entryDate.getFullYear() === currentDate.getFullYear();
      
      if (isSameDay) {
        // Se for no mesmo dia, apenas atualiza o registro existente
        await updateLog(workerId, openEntryLog._id, { 
          leaveTime: new Date() 
        });
      } else {
        // Se for em dias diferentes, criamos dois registros:
        // 1. Fechamos o registro de entrada com saída no mesmo dia (fim do expediente)
        const entryDayEnd = new Date(entryDate);
        entryDayEnd.setHours(23, 59, 59);
        await updateLog(workerId, openEntryLog._id, { 
          leaveTime: entryDayEnd
        });
        
        // 2. Criamos um novo registro para o dia atual
        const todayStart = new Date(currentDate);
        todayStart.setHours(0, 0, 0);
        await addEntry(workerId, { 
          entryTime: todayStart,
          leaveTime: currentDate
        });
      }
      
      // Recarregar dados após atualização
      await fetchWorkers();
    } else {
      // Fallback para comportamento atual (não ideal)
      await addEntry(workerId, { leaveTime: new Date() });
    }
  };

  const handleFaltou = async (workerId: string) => {
    await addEntry(workerId, { absent: true });
  };

  const handleNameClick = (worker: Worker) => {
    if (worker._id) {
      setSelectedWorkerId(worker._id);
      setIsLogModalOpen(true);
    }
  };

  return (
    <motion.div 
      className="p-6 ml-[var(--sidebar-width,4.5rem)] transition-all duration-300 bg-gray-50 min-h-screen"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ width: "calc(100% - var(--sidebar-width, 4.5rem))" }}
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-black dark:text-white">Controle de Ponto</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Registro de entradas e saídas dos funcionários
          </p>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="bg-white dark:bg-gray-800 border border-gray-300 text-gray-900 dark:text-gray-300 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block pl-10 p-2.5 transition-all duration-200 focus:w-64 w-48"
            placeholder="Buscar funcionário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-900 rounded text-gray-700">
            <th className="py-2 px-4 text-left dark:text-gray-300">Nome</th>
            <th className="py-2 px-4 text-left dark:text-gray-300">Cargo</th>
            <th className="py-2 px-4 text-left dark:text-gray-300">Registro de Ponto</th>
            <th className="py-2 px-4 text-left dark:text-gray-300">Status</th>
            <th className="py-2 px-4 text-left dark:text-gray-300">Ações</th>
          </tr>
        </thead>
        <tbody>
          {workersLoading ? (
            <tr>
              <td colSpan={5} className="py-8 text-center">
                <div className="flex flex-col items-center justify-center">
                  <motion.div
                    className="w-12 h-12 mb-3 border-4 border-gray-200 rounded-full"
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
              <td colSpan={5} className="py-4 text-center text-red-500">
                Erro: {workersError}
              </td>
            </tr>
          ) : filteredWorkers.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-4 text-center text-gray-600">
                {searchTerm
                  ? "Nenhum funcionário encontrado com esse termo de busca."
                  : "Nenhum funcionário encontrado."}
              </td>
            </tr>
          ) : (
            filteredWorkers.map((worker) => (
              <WorkerRow
                key={worker._id}
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
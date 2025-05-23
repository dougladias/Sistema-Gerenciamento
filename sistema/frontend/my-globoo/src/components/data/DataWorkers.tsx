"use client";

import React, { useEffect, useState } from "react";
import useWorker from "@/hooks/useWorkers";
import useLog from "@/hooks/useTimeSheet";
import { motion } from "framer-motion";

function isToday(dateString: string | Date | undefined) {
  if (!dateString) return false;
  const date = new Date(dateString);
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

export default function Dashboard() {
  const { workers, fetchWorkers } = useWorker();
  const { fetchWorkerLogs } = useLog();

  const [presentToday, setPresentToday] = useState(0);
  const [absentToday, setAbsentToday] = useState(0);
  const [delaysToday, setDelaysToday] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      await fetchWorkers();
      setLoading(false);
    }
    fetchData();
  }, [fetchWorkers]);

  useEffect(() => {
    async function calculatePresence() {
      if (!workers || workers.length === 0) {
        setPresentToday(0);
        setAbsentToday(0);
        setDelaysToday(0);
        return;
      }
      setLoading(true);

      let present = 0;
      let delays = 0;

      // For performance, fetch logs in parallel
      await Promise.all(
        workers.map(async (worker) => {
          if (!worker._id) return;
          const logs = await fetchWorkerLogs(worker._id);
          
          // Check for presence today
          const todayLog = Array.isArray(logs) && logs.find((log: any) => isToday(log.entryTime));
          
          if (todayLog) {
            present += 1;
            
            // Check for delay based on entry time or other available properties
            const entryDate = todayLog.entryTime ? new Date(todayLog.entryTime) : null;
            const isLate = 
              // Type assertion to avoid TypeScript errors until proper types are established
              (todayLog as any).isLate || 
              (todayLog as any).lateMinutes > 0 ||
              // Add other lateness checks based on your actual data structure
              false;
              
            if (isLate) {
              delays += 1;
            }
          }
        })
      );

      setPresentToday(present);
      setAbsentToday(workers.length - present);
      setDelaysToday(delays);
      setLoading(false);
    }

    if (workers.length > 0) {
      calculatePresence();
    }
  }, [workers, fetchWorkerLogs]);

  const totalWorkers = workers.length;
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <motion.div 
      className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
          <svg 
            className="w-5 h-5 mr-2 text-cyan-600 dark:text-cyan-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
            />
          </svg>
          Visão Geral
        </h2>
        <p className="text-gray-500 dark:text-gray-400">Resumo da presença dos funcionários para hoje</p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div 
          variants={itemVariants}
          className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-cyan-100 dark:border-gray-600 transition-all hover:shadow-md"
        >
          <div className="flex flex-col">
            <span className="text-gray-500 dark:text-gray-300 text-sm font-medium mb-1">Total de funcionários</span>
            <div className="flex items-center">
              <span className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                {loading ? 
                  <div className="animate-pulse h-6 w-8 bg-cyan-200 dark:bg-cyan-900 rounded"></div> : 
                  totalWorkers
                }
              </span>
              <svg className="w-5 h-5 ml-2 text-cyan-500 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-green-100 dark:border-gray-600 transition-all hover:shadow-md"
        >
          <div className="flex flex-col">
            <span className="text-gray-500 dark:text-gray-300 text-sm font-medium mb-1">Presentes Hoje</span>
            <div className="flex items-center">
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {loading ? 
                  <div className="animate-pulse h-6 w-8 bg-green-200 dark:bg-green-900 rounded"></div> : 
                  presentToday
                }
              </span>
              <svg className="w-5 h-5 ml-2 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-red-100 dark:border-gray-600 transition-all hover:shadow-md"
        >
          <div className="flex flex-col">
            <span className="text-gray-500 dark:text-gray-300 text-sm font-medium mb-1">Ausentes Hoje</span>
            <div className="flex items-center">
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                {loading ? 
                  <div className="animate-pulse h-6 w-8 bg-red-200 dark:bg-red-900 rounded"></div> : 
                  absentToday
                }
              </span>
              <svg className="w-5 h-5 ml-2 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-yellow-100 dark:border-gray-600 transition-all hover:shadow-md"
        >
          <div className="flex flex-col">
            <span className="text-gray-500 dark:text-gray-300 text-sm font-medium mb-1">Atrasos Hoje</span>
            <div className="flex items-center">
              <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {loading ? 
                  <div className="animate-pulse h-6 w-8 bg-yellow-200 dark:bg-yellow-900 rounded"></div> : 
                  delaysToday
                }
              </span>
              <svg className="w-5 h-5 ml-2 text-yellow-500 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </motion.div>
      </div>

      {loading && (
        <div className="mt-4 flex justify-center">
          <div className="loader inline-flex items-center px-4 py-2 text-sm text-cyan-600 dark:text-cyan-400">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Atualizando dados...
          </div>
        </div>
      )}
    </motion.div>
  );
}
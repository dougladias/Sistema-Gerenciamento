"use client";

import React, { useEffect, useState } from "react";
import useWorker from "@/hooks/useWorkers";
import useLog from "@/hooks/useTimeSheet";

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

export default function DashboardPage() {
  const { workers, fetchWorkers, loading: workersLoading } = useWorker();
  const { fetchWorkerLogs } = useLog();

  const [presentToday, setPresentToday] = useState(0);
  const [absentToday, setAbsentToday] = useState(0);
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
        return;
      }
      setLoading(true);

      let present = 0;

      // For performance, fetch logs in parallel
      await Promise.all(
        workers.map(async (worker) => {
          if (!worker._id) return;
          const logs = await fetchWorkerLogs(worker._id);
          const hasLogToday = Array.isArray(logs) && logs.some((log: any) => isToday(log.entryTime));
          if (hasLogToday) present += 1;
        })
      );

      setPresentToday(present);
      setAbsentToday(workers.length - present);
      setLoading(false);
    }

    if (workers.length > 0) {
      calculatePresence();
    }
  }, [workers, fetchWorkerLogs]);

  const totalWorkers = workers.length;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-all">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-4xl">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 flex flex-col items-center border border-gray-100 dark:border-gray-800">
          <span className="text-gray-500 dark:text-gray-400 text-lg mb-2">Total de funcionários</span>
          <span className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">{loading ? "..." : totalWorkers}</span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 flex flex-col items-center border border-gray-100 dark:border-gray-800">
          <span className="text-gray-500 dark:text-gray-400 text-lg mb-2">Presentes Hoje</span>
          <span className="text-3xl font-bold text-green-600 dark:text-green-400">{loading ? "..." : presentToday}</span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 flex flex-col items-center border border-gray-100 dark:border-gray-800">
          <span className="text-gray-500 dark:text-gray-400 text-lg mb-2">Ausentes Hoje</span>
          <span className="text-3xl font-bold text-red-600 dark:text-red-400">{loading ? "..." : absentToday}</span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 flex flex-col items-center border border-gray-100 dark:border-gray-800">
          <span className="text-gray-500 dark:text-gray-400 text-lg mb-2">Atrasos Hoje</span>
          <span className="text-3xl font-bold text-yellow-600 dark:text-yellow-400"> </span>
        </div>
      </div>
    </div>
  );
}
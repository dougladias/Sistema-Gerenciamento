"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineUsers,
  HiOutlineDocumentText,
  HiOutlineChartPie,
  HiOutlineBell,
  HiOutlineCalendar,
  HiOutlineChevronUp,
  HiOutlineCheck,
  HiOutlineClock
} from "react-icons/hi";

// Fake data for the dashboard
const stats = [
  { title: "Funcionários Ativos", value: "142", icon: HiOutlineUsers, change: "+12%", color: "from-blue-500 to-blue-600" },
  { title: "Documentos Processados", value: "3,872", icon: HiOutlineDocumentText, change: "+18%", color: "from-indigo-500 to-indigo-600" },
  { title: "Templates Usados", value: "24", icon: HiOutlineChartPie, change: "+7%", color: "from-purple-500 to-purple-600" },
  { title: "Taxa de Eficiência", value: "93%", icon: HiOutlineCheck, change: "+4%", color: "from-green-500 to-green-600" },
];

const activities = [
  { user: "Carlos Silva", action: "atualizou documento", item: "Contrato 2025-A", time: "12 min atrás", status: "success" },
  { user: "Marina Rocha", action: "criou novo template", item: "Declaração de Imposto", time: "1 hora atrás", status: "info" },
  { user: "Thiago Mendes", action: "cadastrou novo funcionário", item: "Lucas Oliveira", time: "2 horas atrás", status: "success" },
  { user: "Juliana Costa", action: "arquivou documento", item: "Relatório Anual 2024", time: "5 horas atrás", status: "warning" },
];

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setMounted(true);
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    setCurrentDate(now.toLocaleDateString('pt-BR', options));
  }, []);

  // Parent container animation
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

  // Child elements animation
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }
  };

  // Chart animation for the mock chart
  const chartVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { type: "spring", duration: 2, bounce: 0 },
        opacity: { duration: 0.5 }
      }
    }
  };

  return (
    <motion.div 
      className="p-6 ml-[var(--sidebar-width,4.5rem)] transition-all duration-300"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ 
        width: "calc(100% - var(--sidebar-width, 4.5rem))" 
      }}
    >
      {/* Header section */}
      <motion.div 
        className="mb-8"
        variants={itemVariants}
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Dashboard</h1>
        <div className="flex items-center text-gray-500">
          <HiOutlineCalendar className="mr-2" />
          <span className="capitalize">{currentDate}</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${stat.color} bg-opacity-80`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <span className={`text-sm font-medium text-green-600 flex items-center`}>
                  {stat.change}
                  <HiOutlineChevronUp className="ml-1" />
                </span>
              </div>
              <h3 className="text-3xl font-bold text-gray-800">{stat.value}</h3>
              <p className="text-gray-500 text-sm">{stat.title}</p>
            </div>
            <div className="h-1 bg-gradient-to-r w-full opacity-80 ${stat.color}" />
          </motion.div>
        ))}
      </div>

      {/* Main Content Area - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics Chart */}
        <motion.div 
          className="bg-white p-5 rounded-xl shadow-md col-span-2"
          variants={itemVariants}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Visão Geral de Documentos</h2>
            <div className="text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-600">
              Últimos 30 dias
            </div>
          </div>
          
          {/* Mock Chart with SVG */}
          <div className="h-64 w-full">
            <svg width="100%" height="100%" viewBox="0 0 800 300">
              {/* Background grid lines */}
              <g className="grid">
                {[0, 1, 2, 3, 4].map((i) => (
                  <line 
                    key={i}
                    x1="0" 
                    y1={60 + i * 48} 
                    x2="800" 
                    y2={60 + i * 48} 
                    stroke="#e5e7eb" 
                    strokeDasharray="5,5"
                  />
                ))}
              </g>
              
              {/* Chart Lines */}
              <motion.path 
                d="M 0,240 C 50,200 100,180 150,160 S 250,120 300,100 S 400,60 450,40 S 550,80 600,100 S 750,140 800,120" 
                fill="none" 
                stroke="#3b82f6" 
                strokeWidth="3" 
                strokeLinecap="round"
                variants={chartVariants}
                initial="hidden"
                animate="visible"
                custom={1}
              />
              <motion.path 
                d="M 0,280 C 50,260 100,240 150,220 S 250,200 300,190 S 400,160 450,140 S 550,160 600,180 S 750,200 800,180" 
                fill="none" 
                stroke="#8b5cf6" 
                strokeWidth="3" 
                strokeLinecap="round"
                variants={chartVariants}
                initial="hidden"
                animate="visible"
                custom={2}
              />
              
              {/* Circles on line points for emphasis */}
              {[
                { x: 150, y: 160, color: "#3b82f6" },
                { x: 300, y: 100, color: "#3b82f6" },
                { x: 450, y: 40, color: "#3b82f6" },
                { x: 600, y: 100, color: "#3b82f6" },
                { x: 150, y: 220, color: "#8b5cf6" },
                { x: 300, y: 190, color: "#8b5cf6" },
                { x: 450, y: 140, color: "#8b5cf6" },
                { x: 600, y: 180, color: "#8b5cf6" }
              ].map((point, i) => (
                <motion.circle
                  key={i}
                  cx={point.x}
                  cy={point.y}
                  r="5"
                  fill="white"
                  stroke={point.color}
                  strokeWidth="2"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: 1, 
                    opacity: 1,
                    transition: { delay: 1.5 + i * 0.1 }
                  }}
                />
              ))}
            </svg>
          </div>
          
          {/* Legend */}
          <div className="flex justify-center space-x-6 mt-4">
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-blue-500 mr-2"></div>
              <span className="text-sm text-gray-600">Documentos Criados</span>
            </div>
            <div className="flex items-center">
              <div className="h-3 w-3 rounded-full bg-purple-500 mr-2"></div>
              <span className="text-sm text-gray-600">Documentos Processados</span>
            </div>
          </div>
        </motion.div>
        
        {/* Activity Feed */}
        <motion.div 
          className="bg-white p-5 rounded-xl shadow-md"
          variants={itemVariants}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Atividade Recente</h2>
            <div className="p-1.5 rounded-full bg-blue-50 text-blue-500">
              <HiOutlineBell className="h-5 w-5" />
            </div>
          </div>
          
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <motion.div 
                key={index}
                className="border-l-2 border-gray-200 pl-4 py-1"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                whileHover={{ x: 5, transition: { duration: 0.2 } }}
              >
                <p className="text-gray-800 font-medium">
                  {activity.user}{" "}
                  <span className="text-gray-500 font-normal">{activity.action}</span>{" "}
                  <span className="font-medium">{activity.item}</span>
                </p>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <HiOutlineClock className="mr-1.5 h-4 w-4" />
                  {activity.time}
                </div>
              </motion.div>
            ))}
          </div>
          
          <motion.button 
            className="w-full mt-6 py-2.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 text-sm font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Ver todo histórico
          </motion.button>
        </motion.div>
      </div>
      
      {/* Secondary Content - Project Status */}
      <motion.div 
        className="mt-8 bg-white p-5 rounded-xl shadow-md"
        variants={itemVariants}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Progresso dos Projetos</h2>
          <div className="text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-600">
            Este mês
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { name: "Implantação ERP", progress: 75, color: "bg-blue-500" },
            { name: "Digitalização de Arquivos", progress: 45, color: "bg-purple-500" },
            { name: "Treinamento de Equipe", progress: 90, color: "bg-green-500" }
          ].map((project, index) => (
            <motion.div 
              key={index} 
              className="p-4 border border-gray-100 rounded-lg"
              whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)" }}
            >
              <div className="flex justify-between mb-2">
                <h3 className="font-medium text-gray-800">{project.name}</h3>
                <span className="text-sm font-semibold">{project.progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full ${project.color}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${project.progress}%` }}
                  transition={{ duration: 1, delay: 1 + index * 0.2, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
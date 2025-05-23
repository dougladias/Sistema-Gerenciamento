"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/buttonf";
import { UserCog, Users } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function BackofficeIndex() {
  const modules = [
    {
      title: "Gerenciamento de Usuários",
      description: "Adicionar, editar e remover usuários do sistema",
      icon: Users,
      link: "/pages/backoffice/userManagement",
      color: "bg-blue-100 text-blue-700"
    },
    {
      title: "Perfis de Acesso",
      description: "Gerenciar perfis e grupos de usuários",
      icon: UserCog,
      link: "/pages/backoffice/profileManagement",
      color: "bg-green-100 text-green-700"
    }
  ];

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
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">BackOffice</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Sistema de gerenciamento básico para integração
        </p>
      </motion.div>

      {/* Main content with shadow and rounded corners */}
      <motion.div variants={itemVariants} className="grid gap-6 sm:grid-cols-2">
        {modules.map((module, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className="overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-md ${module.color}`}>
                    <module.icon className="h-5 w-5" />
                  </div>
                  <CardTitle>{module.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="min-h-[40px] text-gray-600 dark:text-gray-400">
                  {module.description}
                </CardDescription>
                <Button 
                  className="w-full bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 transition-colors" 
                  asChild
                >
                  <Link href={module.link} className="flex items-center justify-center">
                    Acessar
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
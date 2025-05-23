"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/buttonf";
import { UserPlus } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import UsersTable, { User } from "@/components/backoffice/users/UsersTable";
import UsersFilter from "@/components/backoffice/users/UsersFilter";
import UserForm from "@/components/backoffice/users/UserForm";
import { motion } from "framer-motion";

export default function UsersManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

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

  // Filtra os usuários com base na pesquisa e filtro de cargo
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = !selectedRole || user.role === selectedRole;

    return matchesSearch && matchesRole;
  });

  const handleAddUser = (userData: Pick<User, 'name' | 'email' | 'role' | 'department'>) => {
    // Adicionar novo usuário
    const newUser: User = {
      id: `${users.length + 1}`,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      department: userData.department,
      status: "active"
    };
    
    setUsers([...users, newUser]);
    toast.success(`Usuário ${userData.name} adicionado com sucesso!`);
    setIsAddUserDialogOpen(false);
  };

  return (
    <motion.div 
      className="p-6 ml-[var(--sidebar-width,4.5rem)] transition-all duration-300 bg-gray-50 dark:bg-gray-900 min-h-screen"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ width: "calc(100% - var(--sidebar-width, 4.5rem))" }}
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Usuários</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gerenciamento de usuários do sistema
          </p>
        </div>
        
        <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 transition-colors">
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Usuário</DialogTitle>
              <DialogDescription>
                Preencha os dados para cadastrar um novo usuário no sistema.
              </DialogDescription>
            </DialogHeader>
            <UserForm
              onSubmit={handleAddUser}
              onCancel={() => setIsAddUserDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="shadow-lg border border-gray-100 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle>Gerenciamento de Usuários</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Gerencie os usuários do sistema, seus papéis e permissões.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsersFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              selectedRole={selectedRole}
              onRoleChange={setSelectedRole}
            />
            <UsersTable users={filteredUsers} />
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
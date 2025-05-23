"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/buttonf";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserCog, Plus } from "lucide-react";
import { motion } from "framer-motion";

import ProfilesTable from "@/components/backoffice/profiles/ProfilesTable";
import ProfileForm, { Profile, Permission } from "@/components/backoffice/profiles/ProfileForm";

// Permissões disponíveis para referência - depois serão carregadas do backend
const AVAILABLE_PERMISSIONS: Permission[] = [
  { id: "dashboard.access", name: "Acesso ao Dashboard", category: "Dashboard" },
  { id: "dashboard.edit", name: "Editar Dashboard", category: "Dashboard" },
  { id: "rh.access", name: "Acesso ao RH", category: "RH" },
  { id: "rh.edit", name: "Editar RH", category: "RH" },
  { id: "admin.access", name: "Acesso Administrativo", category: "Administração" },
  { id: "backoffice.access", name: "Acesso ao BackOffice", category: "BackOffice" },
  { id: "manager.users", name: "Gerenciar Usuários", category: "BackOffice" },
  { id: "manager.permissions", name: "Gerenciar Permissões", category: "BackOffice" },
];

export default function Profiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);

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

  // Iniciar criação de novo perfil
  const handleNewProfile = () => {
    setCurrentProfile(null);
    setIsDialogOpen(true);
  };

  // Iniciar edição de perfil existente
  const handleEditProfile = (profile: Profile) => {
    setCurrentProfile(profile);
    setIsDialogOpen(true);
  };

  // Salvar perfil (criar novo ou atualizar existente)
  const handleSaveProfile = (formData: Omit<Profile, 'id' | 'userCount'>) => {
    if (currentProfile) {
      // Atualizar perfil existente
      const updatedProfiles = profiles.map(p => 
        p.id === currentProfile.id 
          ? { ...p, name: formData.name, description: formData.description, permissions: formData.permissions }
          : p
      );
      setProfiles(updatedProfiles);
      toast.success(`Perfil "${formData.name}" atualizado com sucesso`);
    } else {
      // Criar novo perfil
      const newProfile: Profile = {
        id: `${profiles.length + 1}`,
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions,
        userCount: 0
      };
      setProfiles([...profiles, newProfile]);
      toast.success(`Perfil "${formData.name}" criado com sucesso`);
    }

    setIsDialogOpen(false);
  };

  // Remover perfil
  const handleDeleteProfile = (profileId: string) => {
    if (confirm("Tem certeza que deseja excluir este perfil?")) {
      const profile = profiles.find(p => p.id === profileId);
      const updatedProfiles = profiles.filter(p => p.id !== profileId);
      setProfiles(updatedProfiles);
      toast.success(`Perfil "${profile?.name}" removido com sucesso`);
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
      <motion.div variants={itemVariants} className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Perfis de Acesso</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gerencie grupos de permissões para facilitar a administração de usuários.
          </p>
        </div>
        <Button 
          onClick={handleNewProfile}
          className="bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 transition-colors"
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Perfil
        </Button>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card className="shadow-lg border border-gray-100 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle>Perfis Disponíveis</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Lista de perfis configurados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profiles.length === 0 ? (
              <div className="text-center py-8">
                <UserCog className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
                <h3 className="mt-2 text-lg font-medium text-gray-700 dark:text-gray-300">Nenhum perfil criado</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Clique em &quot;Novo Perfil&quot; para criar o primeiro perfil
                </p>
              </div>
            ) : (
              <ProfilesTable 
                profiles={profiles} 
                onEdit={handleEditProfile} 
                onDelete={handleDeleteProfile} 
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentProfile ? "Editar Perfil" : "Novo Perfil"}</DialogTitle>
            <DialogDescription>
              {currentProfile 
                ? "Atualize as informações e permissões deste perfil"
                : "Configure as informações e permissões para o novo perfil"}
            </DialogDescription>
          </DialogHeader>
          
          <ProfileForm 
            profile={currentProfile}
            onSave={handleSaveProfile}
            onCancel={() => setIsDialogOpen(false)}
            availablePermissions={AVAILABLE_PERMISSIONS}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonf";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export interface Permission {
  id: string;
  name: string;
  category: string;
}

export interface Profile {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

interface ProfileFormProps {
  profile: Profile | null;
  onSave: (formData: Omit<Profile, 'id' | 'userCount'>) => void;
  onCancel: () => void;
  availablePermissions: Permission[];
}

export default function ProfileForm({ profile, onSave, onCancel, availablePermissions }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    name: profile?.name || "",
    description: profile?.description || "",
    permissions: profile?.permissions || [] as string[]
  });
  
  // Categorias de permissões
  const categories = [...new Set(availablePermissions.map(p => p.category))];

  // Alternar seleção de permissão
  const togglePermission = (permissionId: string) => {
    setFormData(prev => {
      const permissions = prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId];
      
      return { ...prev, permissions };
    });
  };

  const handleSubmit = () => {
    if (formData.name.trim() === "") {
      toast.error("O nome do perfil é obrigatório");
      return;
    }

    onSave(formData);
  };

  return (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Nome do Perfil</Label>
        <Input 
          id="name" 
          value={formData.name} 
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Ex: Administrador, Gerente, etc."
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Input 
          id="description" 
          value={formData.description} 
          onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Descreva brevemente este perfil"
        />
      </div>
      
      <div className="grid gap-2">
        <Label>Permissões</Label>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {categories.map(category => (
                <div key={category} className="space-y-3">
                  <h3 className="font-medium text-sm">{category}</h3>
                  <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                    {availablePermissions.filter(p => p.category === category).map(permission => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`permission-${permission.id}`}
                          checked={formData.permissions.includes(permission.id)}
                          onCheckedChange={() => togglePermission(permission.id)}
                        />
                        <label htmlFor={`permission-${permission.id}`} className="text-sm">
                          {permission.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSubmit}>
          {profile ? "Salvar Alterações" : "Criar Perfil"}
        </Button>
      </div>
    </div>
  );
}

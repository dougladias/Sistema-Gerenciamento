import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/buttonf";
import { DialogFooter } from "@/components/ui/dialog";

interface UserFormData {
  name: string;
  email: string;
  role: string;
  department: string;
  password: string;
}

interface UserFormProps {
  initialData?: UserFormData;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
}

export default function UserForm({ initialData, onSubmit, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState<UserFormData>(
    initialData || {
      name: "",
      email: "",
      role: "employee",
      department: "",
      password: ""
    }
  );

  const handleChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <>
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nome completo</Label>
          <Input 
            id="name"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Nome do usuário"
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="email@empresa.com"
          />
        </div>
        <div>
          <Label htmlFor="role">Cargo</Label>
          <Select 
            value={formData.role}
            onValueChange={(value) => handleChange("role", value)}
          >
            <SelectTrigger id="role">
              <SelectValue placeholder="Selecione um cargo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="manager">Gerente</SelectItem>
              <SelectItem value="employee">Funcionário</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="department">Departamento</Label>
          <Input 
            id="department"
            value={formData.department}
            onChange={(e) => handleChange("department", e.target.value)}
            placeholder="Departamento"
          />
        </div>
        <div>
          <Label htmlFor="password">Senha</Label>
          <Input 
            id="password" 
            type="password"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            placeholder="••••••••"
          />
        </div>
      </div>
      <DialogFooter className="mt-6">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" onClick={() => onSubmit(formData)}>
          {initialData ? "Salvar" : "Adicionar"}
        </Button>
      </DialogFooter>
    </>
  );
}


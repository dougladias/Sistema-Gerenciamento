import { Search, Filter, Plus, Download, Upload, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/buttonf";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface UsersFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedRole: string | null;
  onRoleChange: (role: string | null) => void;
}

export default function UsersFilter({ 
  searchTerm, 
  onSearchChange,
  selectedRole,
  onRoleChange
}: UsersFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar usuários..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Cargo: {selectedRole ? 
                selectedRole === "admin" ? "Administrador" : 
                selectedRole === "manager" ? "Gerente" : "Funcionário" 
                : "Todos"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRoleChange(null)}>
              Todos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRoleChange("admin")}>
              Administrador
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRoleChange("manager")}>
              Gerente
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRoleChange("employee")}>
              Funcionário
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Opções
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toast.info("Exportando usuários...")}>
              <Download className="h-4 w-4 mr-2" /> Exportar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("Importando usuários...")}>
              <Upload className="h-4 w-4 mr-2" /> Importar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast.info("Atualizando lista...")}>
              <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

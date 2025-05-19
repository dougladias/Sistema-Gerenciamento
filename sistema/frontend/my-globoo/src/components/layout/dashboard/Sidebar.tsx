import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { 
  Users, User, FileText, Settings, BarChart3, 
  Calendar, Briefcase, ChevronRight, LogOut, Utensils
} from "lucide-react";
import { useLocation } from "react-router-dom";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface SidebarLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  collapsed?: boolean;
}

function SidebarLink({ to, icon: Icon, label, active, collapsed }: SidebarLinkProps) {
  return (
    <Link to={to}>
      <Button
        variant="secondary"
        className={cn(
          "w-full justify-start gap-3 font-normal",
          collapsed ? "justify-center px-2" : "px-3",
          active && "bg-sidebar-accent text-sidebar-accent-foreground"
        )}
      >
        <Icon className={cn("h-5 w-5", collapsed && "mr-0")} />
        {!collapsed && <span>{label}</span>}
      </Button>
    </Link>
  );
}

export default function DashboardSidebar({ open, setOpen }: SidebarProps) {
  // Removido useAuth() e substituído por dados simulados ou nenhum dado
  const location = useLocation();
  const path = location.pathname;

  const isActive = (route: string) => {
    return path.startsWith(route);
  };

  const sidebarLinks = [
    {
      to: "/dashboard",
      icon: BarChart3,
      label: "Dashboard",
    },
    {
      to: "/dashboard/funcionarios",
      icon: Users,
      label: "Funcionários",
    },
    {
      to: "/dashboard/marmitas",
      icon: Utensils,
      label: "Marmitas",
    },
    {
      to: "/dashboard/perfil",
      icon: User,
      label: "Meu Perfil",
    },
    {
      to: "/dashboard/folha",
      icon: FileText,
      label: "Folha de Pagamento",
    },
    {
      to: "/dashboard/calendario",
      icon: Calendar,
      label: "Calendário",
    },
    {
      to: "/dashboard/departamentos",
      icon: Briefcase,
      label: "Departamentos",
    },
    {
      to: "/dashboard/configuracoes",
      icon: Settings,
      label: "Configurações",
    }
  ];

  // Mostrar todos os links sem filtrar por permissão
  const visibleLinks = sidebarLinks;

  // Função simples para simular o logout
  const handleLogout = () => {
    // Redirecionar para a página de login ou fazer qualquer outra ação
    window.location.href = "/login";
  };

  return (
    <>
      {/* Overlay para fechamento em dispositivos móveis */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          !open && "lg:w-20"
        )}
      >
        {/* Logo e cabeçalho */}
        <div className="border-b border-sidebar-border p-4">
          <div className="flex items-center justify-between">
            {open ? (
              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                  <span className="font-bold text-primary-foreground">RH</span>
                </div>
                <span className="font-semibold text-sidebar-foreground">
                  Admin Central
                </span>
              </Link>
            ) : (
              <Link to="/dashboard" className="mx-auto">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                  <span className="font-bold text-primary-foreground">RH</span>
                </div>
              </Link>
            )}
            <Button 
              variant="secondary" 
              size="sm" 
              className="text-sidebar-foreground lg:flex hidden"
              onClick={() => setOpen(!open)}
            >
              <ChevronRight className={cn(
                "h-4 w-4 transition-transform", 
                !open && "rotate-180"
              )} />
            </Button>
          </div>
        </div>

        {/* Links de navegação */}
        <nav className="flex-1 overflow-auto py-4">
          <div className="flex flex-col gap-1 px-2">
            {visibleLinks.map((link) => (
              <SidebarLink
                key={link.to}
                to={link.to}
                icon={link.icon}
                label={link.label}
                active={isActive(link.to)}
                collapsed={!open}
              />
            ))}
          </div>
        </nav>

        {/* Rodapé simplificado */}
        <div className="border-t border-sidebar-border p-4">
          {open ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent">
                  <span className="text-sm font-medium text-sidebar-accent-foreground">
                    US
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-sidebar-foreground">
                    Usuário
                  </span>
                  <span className="text-xs text-sidebar-foreground/70">
                    Sem autenticação
                  </span>
                </div>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                className="text-sidebar-foreground hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button 
              variant="secondary" 
              size="sm" 
              className="mx-auto text-sidebar-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}
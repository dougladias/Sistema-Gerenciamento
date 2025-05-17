import React from 'react';
import { useRouter } from 'next/router';
import { Worker } from '@/types/worker';
import Button from '@/components/ui/Button';
import { 
  UserIcon, 
  IdentificationIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  BriefcaseIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

interface WorkerDetailsProps {
  worker: Worker;
  onEdit?: () => void;
  onDelete?: () => void;
}

const WorkerDetails: React.FC<WorkerDetailsProps> = ({ 
  worker, 
  onEdit, 
  onDelete 
}) => {
  const router = useRouter();

  // Função para formatar CPF
  const formatCPF = (cpf: string): string => {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return cpf;
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Função para formatar datas
  const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('pt-BR');
  };

  // Função para formatar status
  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'active': 'Ativo',
      'inactive': 'Inativo',
      'other': 'Outro'
    };
    return statusMap[status] || status;
  };

  // Função para obter a classe de cor baseada no status
  const getStatusColorClass = (status: string): string => {
    const colorMap: Record<string, string> = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-red-100 text-red-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
  };

  // Funções para lidar com eventos de botão
  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else if (worker._id) {
      router.push(`/workers/edit/${worker._id}`);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  const handleBack = () => {
    router.push('/workers');
  };

  // Item de informação reutilizável
  const InfoItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string | React.ReactNode;
  }> = ({ icon, label, value }) => {
    return (
      <div className="flex items-start py-2">
        <div className="flex-shrink-0 mr-3 mt-1">
          <div className="h-6 w-6 text-gray-400">{icon}</div>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-base text-gray-900">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Informações do Funcionário
          </h3>
          <span 
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(worker.status || 'active')}`}
          >
            {formatStatus(worker.status || 'active')}
          </span>
        </div>
      </div>
      
      <div className="px-6 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <InfoItem 
              icon={<UserIcon />}
              label="Nome"
              value={worker.name}
            />
            
            <InfoItem 
              icon={<IdentificationIcon />}
              label="CPF"
              value={formatCPF(worker.cpf)}
            />
            
            <InfoItem 
              icon={<CalendarIcon />}
              label="Data de Nascimento"
              value={formatDate(worker.nascimento)}
            />
            
            <InfoItem 
              icon={<CalendarIcon />}
              label="Data de Admissão"
              value={formatDate(worker.admissao)}
            />
            
            <InfoItem 
              icon={<CurrencyDollarIcon />}
              label="Salário"
              value={`R$ ${worker.salario}`}
            />
            
            {worker.ajuda && (
              <InfoItem 
                icon={<CurrencyDollarIcon />}
                label="Ajuda de Custo"
                value={`R$ ${worker.ajuda}`}
              />
            )}
          </div>
          
          <div>
            <InfoItem 
              icon={<PhoneIcon />}
              label="Telefone"
              value={worker.numero}
            />
            
            <InfoItem 
              icon={<EnvelopeIcon />}
              label="Email"
              value={worker.email}
            />
            
            <InfoItem 
              icon={<MapPinIcon />}
              label="Endereço"
              value={worker.address}
            />
            
            <InfoItem 
              icon={<BriefcaseIcon />}
              label="Cargo"
              value={worker.role}
            />
            
            <InfoItem 
              icon={<BuildingOfficeIcon />}
              label="Departamento"
              value={worker.department}
            />
            
            <InfoItem 
              icon={<BriefcaseIcon />}
              label="Tipo de Contrato"
              value={worker.contract}
            />
          </div>
        </div>
        
        {/* Seção de logs, se houver */}
        {worker.logs && worker.logs.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-900 mb-3">Registros de Entrada/Saída</h4>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entrada
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saída
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {worker.logs.map((log, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {formatDate(log.date?.toString() || '')}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {log.entryTime ? new Date(log.entryTime).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-500">
                        {log.leaveTime ? new Date(log.leaveTime).toLocaleTimeString() : '-'}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        {log.absent ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Ausente
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Presente
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
        <Button 
          variant="secondary"
          onClick={handleBack}
        >
          Voltar
        </Button>
        
        <Button 
          variant="primary"
          onClick={handleEdit}
        >
          Editar
        </Button>
        
        {onDelete && (
          <Button 
            variant="danger"
            onClick={handleDelete}
          >
            Excluir
          </Button>
        )}
      </div>
    </div>
  );
};

export default WorkerDetails;
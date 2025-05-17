import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useWorker } from '@/hooks/useWorkers';
import { Worker } from '@/types/worker';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

const WorkersList: React.FC = () => {
  const router = useRouter();
  const { workers, loading, error, fetchWorkers, deleteWorker } = useWorker();
  const [showDeleteAlert, setShowDeleteAlert] = useState<boolean>(false);
  const [workerToDelete, setWorkerToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkers();
  }, [fetchWorkers]);

  const handleView = (id: string) => {
    router.push(`/workers/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/workers/edit/${id}`);
  };

  const handleDelete = (id: string) => {
    setWorkerToDelete(id);
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    if (workerToDelete) {
      await deleteWorker(workerToDelete);
      setShowDeleteAlert(false);
      setWorkerToDelete(null);
    }
  };

  const formatCPF = (cpf: string): string => {
    // Formata CPF (000.000.000-00)
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return cpf;
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'active': 'Ativo',
      'inactive': 'Inativo',
      'other': 'Outro'
    };
    return statusMap[status] || status;
  };

  if (loading && workers.length === 0) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {error && (
        <Alert
          type="error"
          message={error}
          className="mb-4"
        />
      )}

      {showDeleteAlert && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 mb-2">Tem certeza que deseja excluir este funcionário?</p>
          <div className="flex space-x-2">
            <Button 
              variant="danger" 
              size="sm" 
              onClick={confirmDelete}
              isLoading={loading && Boolean(workerToDelete)}
            >
              Sim, excluir
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setShowDeleteAlert(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {workers.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <p>Nenhum funcionário encontrado.</p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => router.push('/workers/new')}
          >
            Adicionar Funcionário
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CPF
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cargo
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Departamento
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contrato
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workers.map((worker: Worker) => (
                <tr key={worker._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{worker.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatCPF(worker.cpf)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{worker.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{worker.department}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${worker.status === 'active' ? 'bg-green-100 text-green-800' : 
                        worker.status === 'inactive' ? 'bg-red-100 text-red-800' : 
                        'bg-gray-100 text-gray-800'}`}>
                      {formatStatus(worker.status || 'active')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{worker.contract}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleView(worker._id as string)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver detalhes"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(worker._id as string)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Editar"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(worker._id as string)}
                        className="text-red-600 hover:text-red-900"
                        title="Excluir"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default WorkersList;
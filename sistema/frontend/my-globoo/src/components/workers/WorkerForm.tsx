import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Worker, WorkerCreate, WorkerUpdate } from '@/types/worker';
import { useWorker } from '@/hooks/useWorkers';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';

interface WorkerFormProps {
  initialData?: Worker;
  mode: 'create' | 'edit';
}

const WorkerForm: React.FC<WorkerFormProps> = ({ initialData, mode }) => {
  const router = useRouter();
  const { createWorker, updateWorker, loading, error, clearError } = useWorker();

  // Estado do formulário
  const [formData, setFormData] = useState<WorkerCreate | WorkerUpdate>({
    name: '',
    cpf: '',
    nascimento: '',
    admissao: '',
    salario: '',
    ajuda: '',
    numero: '',
    email: '',
    address: '',
    contract: 'CLT',
    role: '',
    department: 'Geral',
    status: 'active'
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Preenche o formulário com dados iniciais quando disponíveis
  useEffect(() => {
    if (initialData && mode === 'edit') {
      // Certifique-se de que as datas estão no formato correto para o input
      const formattedInitialData = {
        ...initialData,
        nascimento: formatDateForInput(initialData.nascimento),
        admissao: formatDateForInput(initialData.admissao)
      };
      
      setFormData(formattedInitialData);
    }
  }, [initialData, mode]);

  // Função para formatar datas para o formato do input
  const formatDateForInput = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toISOString().split('T')[0];
  };

  // Validação do formulário
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Validação do Nome
    if (!formData.name || (formData.name as string).trim().length < 3) {
      errors.name = 'O nome deve ter pelo menos 3 caracteres';
    }
    
    // Validação do CPF (11 dígitos numéricos)
    if (!formData.cpf || !/^\d{11}$/.test(formData.cpf as string)) {
      errors.cpf = 'CPF deve conter 11 dígitos numéricos';
    }
    
    // Validação do Email
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email as string)) {
      errors.email = 'Email inválido';
    }
    
    // Outras validações podem ser adicionadas conforme necessário
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Manipulador de mudança nos campos
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpa o erro específico do campo
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Limpa mensagens
    if (successMessage) setSuccessMessage('');
    if (error) clearError();
  };

  // Manipulador de envio do formulário
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Valida o formulário
    if (!validateForm()) return;
    
    try {
      if (mode === 'create') {
        // Cria novo funcionário
        await createWorker(formData as WorkerCreate);
        setSuccessMessage('Funcionário criado com sucesso!');
        
        // Limpa o formulário após criação bem-sucedida
        if (!error) {
          setFormData({
            name: '',
            cpf: '',
            nascimento: '',
            admissao: '',
            salario: '',
            ajuda: '',
            numero: '',
            email: '',
            address: '',
            contract: 'CLT',
            role: '',
            department: 'Geral',
            status: 'active'
          });
        }
      } else if (mode === 'edit' && initialData?._id) {
        // Atualiza funcionário existente
        await updateWorker(initialData._id, formData);
        setSuccessMessage('Funcionário atualizado com sucesso!');
      }
      
      // Redireciona após alguns segundos
      setTimeout(() => {
        router.push('/workers');
      }, 2000);
    } catch (err) {
      // Os erros já são tratados pelo hook useWorker
      console.error('Erro ao salvar funcionário:', err);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">
        {mode === 'create' ? 'Novo Funcionário' : 'Editar Funcionário'}
      </h2>
      
      {error && (
        <Alert
          type="error"
          message={error}
          className="mb-4"
          onClose={clearError}
        />
      )}
      
      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          className="mb-4"
          onClose={() => setSuccessMessage('')}
        />
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name || ''}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                formErrors.name ? 'border-red-300' : ''
              }`}
              required
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
            )}
          </div>
          
          {/* CPF */}
          <div>
            <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
              CPF <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="cpf"
              id="cpf"
              value={formData.cpf || ''}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                formErrors.cpf ? 'border-red-300' : ''
              }`}
              required
              maxLength={11}
              placeholder="Apenas números"
            />
            {formErrors.cpf && (
              <p className="mt-1 text-sm text-red-600">{formErrors.cpf}</p>
            )}
          </div>
          
          {/* Data de Nascimento */}
          <div>
            <label htmlFor="nascimento" className="block text-sm font-medium text-gray-700">
              Data de Nascimento <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="nascimento"
              id="nascimento"
              value={formData.nascimento || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
          
          {/* Data de Admissão */}
          <div>
            <label htmlFor="admissao" className="block text-sm font-medium text-gray-700">
              Data de Admissão <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="admissao"
              id="admissao"
              value={formData.admissao || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
          
          {/* Salário */}
          <div>
            <label htmlFor="salario" className="block text-sm font-medium text-gray-700">
              Salário <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="salario"
              id="salario"
              value={formData.salario || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
          
          {/* Ajuda de Custo */}
          <div>
            <label htmlFor="ajuda" className="block text-sm font-medium text-gray-700">
              Ajuda de Custo
            </label>
            <input
              type="text"
              name="ajuda"
              id="ajuda"
              value={formData.ajuda || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          
          {/* Telefone */}
          <div>
            <label htmlFor="numero" className="block text-sm font-medium text-gray-700">
              Telefone <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="numero"
              id="numero"
              value={formData.numero || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
          
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email || ''}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                formErrors.email ? 'border-red-300' : ''
              }`}
              required
            />
            {formErrors.email && (
              <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
            )}
          </div>
          
          {/* Endereço */}
          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">
              Endereço <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="address"
              id="address"
              value={formData.address || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
          
          {/* Tipo de Contrato */}
          <div>
            <label htmlFor="contract" className="block text-sm font-medium text-gray-700">
              Tipo de Contrato <span className="text-red-500">*</span>
            </label>
            <select
              name="contract"
              id="contract"
              value={formData.contract || 'CLT'}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            >
              <option value="CLT">CLT</option>
              <option value="PJ">PJ</option>
            </select>
          </div>
          
          {/* Cargo */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Cargo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="role"
              id="role"
              value={formData.role || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
          
          {/* Departamento */}
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">
              Departamento <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="department"
              id="department"
              value={formData.department || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
          
          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              name="status"
              id="status"
              value={formData.status || 'active'}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="other">Outro</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/workers')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={loading}
          >
            {mode === 'create' ? 'Criar Funcionário' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default WorkerForm;
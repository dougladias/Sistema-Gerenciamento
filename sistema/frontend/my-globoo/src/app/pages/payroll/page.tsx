"use client";

import { useEffect, useState } from 'react';
import { usePayroll } from '@/hooks/usePayroll';
import { useWorker } from '@/hooks/useWorkers';
import { PayslipStatus, EmployeeType } from '@/types/payroll';

// Mapeamento de meses para nomes em português
const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Função para formatar valores monetários
const formatCurrency = (value: number): string => {
  return `R$ ${value.toFixed(2)}`;
};

export default function PayrollPage() {
  const {
    payrolls,
    payslips,
    loading,
    error,
    fetchPayrolls,
    fetchPayslipsByPayrollId,
    createPayroll,
    processPayroll,
    setPayslips
  } = usePayroll();

  const { workers, fetchWorkers } = useWorker();

  // Estado local
  const [selectedMonth, setSelectedMonth] = useState<string>(`${new Date().getMonth() + 1} ${new Date().getFullYear()}`);
  const [activeTab, setActiveTab] = useState<string>('CLT');  
  const [notification, setNotification] = useState<{type: 'error' | 'success', message: string} | null>(null);

  // Gerar opções para meses de vários anos (anterior, atual e próximo)
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  const allMonthOptions = [];

  // Para cada ano, gere os meses
  for (const year of years) {
    for (let i = 0; i < months.length; i++) {
      const monthNum = i + 1;
      const existingPayroll = payrolls.find(
        p => p.month === monthNum && p.year === year
      );
      
      allMonthOptions.push({
        value: `${monthNum} ${year}`,
        label: `${months[i]} ${year}`,
        exists: !!existingPayroll,
        id: existingPayroll?._id
      });
    }
  }

  // Efeito para carregar folhas de pagamento
  useEffect(() => {
    fetchPayrolls();
    fetchWorkers(); // Carrega os funcionários ao carregar a página
  }, [fetchPayrolls, fetchWorkers]);

  // Modificar o useEffect para limpar holerites quando não houver folha
  useEffect(() => {
    const selectedMonthParts = selectedMonth.split(' ');
    if (selectedMonthParts.length === 2) {
      const month = parseInt(selectedMonthParts[0]);
      const year = parseInt(selectedMonthParts[1]);

      // Busca a folha de pagamento correspondente
      const payroll = payrolls.find(p => p.month === month && p.year === year);
      if (payroll && payroll._id) {
        fetchPayslipsByPayrollId(payroll._id);
      } else {
        // IMPORTANTE: Limpar os holerites quando não houver folha
        setPayslips([]);
      }
    }
  }, [selectedMonth, payrolls, fetchPayslipsByPayrollId, setPayslips]);

  // Função para criar nova folha de pagamento
  const handleCreatePayroll = async () => {
    try {
      // Usar o mês SELECIONADO pelo usuário, não o mês atual do sistema
      const selectedMonthParts = selectedMonth.split(' ');
      const selectedMonthNum = parseInt(selectedMonthParts[0]);
      const selectedYear = parseInt(selectedMonthParts[1]);
      
      // Busca se já existe folha para o mês SELECIONADO (não o atual)
      const existingPayroll = payrolls.find(
        p => p.month === selectedMonthNum && p.year === selectedYear
      );
      
      if (existingPayroll && existingPayroll._id) {
        // Se já existe, processa novamente - NÃO ALTERE o selectedMonth
        
        // Processar TODOS os funcionários
        const allWorkers = workers.filter(worker => worker._id !== undefined);
        
        // Separar por tipos para informar ao usuário
        const cltWorkers = allWorkers.filter(w => w.contract === 'CLT');
        const pjWorkers = allWorkers.filter(w => w.contract === 'PJ');
        
        const employees = allWorkers.map(worker => ({
          id: worker._id as string,
          name: worker.name,
          position: worker.role || "",
          department: worker.department,
          contractType: worker.contract as EmployeeType,
          baseSalary: Number(worker.salario || 0),
          benefits: worker.ajuda ? [{ name: 'ajuda', value: Number(worker.ajuda) }] : [],
        }));
        
        try {
          await processPayroll(existingPayroll._id, { employees });
          fetchPayslipsByPayrollId(existingPayroll._id);
          setNotification({
            type: 'success',
            message: `Folha de ${months[selectedMonthNum-1]} ${selectedYear} atualizada com sucesso! 
                      Processados ${cltWorkers.length} CLT e ${pjWorkers.length} PJ.`
          });
        } catch (processError: unknown) {
          if (processError instanceof Error && processError.message && processError.message.includes("já processada")) {
            fetchPayslipsByPayrollId(existingPayroll._id);
            setNotification({
              type: 'success',
              message: `Folha de ${months[selectedMonthNum-1]} ${selectedYear} já processada.`
            });
          } else {
            throw processError;
          }
        }
        return;
      }
      
      // Se não existe, cria uma nova folha para o mês SELECIONADO
      await createPayroll({
        month: selectedMonthNum,
        year: selectedYear
      });
      
      await fetchPayrolls();
      
      setNotification({
        type: 'success',
        message: `Folha para ${months[selectedMonthNum-1]} ${selectedYear} criada! Clique em "Processar Folha" para gerar holerites.`
      });
    } catch (error: unknown) {
      console.error('Erro ao criar/processar folha:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao criar/processar folha de pagamento.'
      });
    }
  };

  // Função para processar folha de pagamento (ambos os tipos)
  const handleProcessPayroll = async () => {
    try {
      const selectedMonthParts = selectedMonth.split(' ');
      if (selectedMonthParts.length === 2) {
        const month = parseInt(selectedMonthParts[0]);
        const year = parseInt(selectedMonthParts[1]);

        const payroll = payrolls.find(p => p.month === month && p.year === year);
        if (payroll && payroll._id) {
          // IMPORTANTE: Aqui processamos TODOS os funcionários, independente do tipo
          const allWorkers = workers.filter(worker => worker._id !== undefined);
          
          // Separar por tipos para informar ao usuário
          const cltWorkers = allWorkers.filter(w => w.contract === 'CLT');
          const pjWorkers = allWorkers.filter(w => w.contract === 'PJ');
          
          console.log(`Processando ${cltWorkers.length} funcionários CLT e ${pjWorkers.length} funcionários PJ`);
          
          // Se não tiver funcionários, mostra aviso
          if (allWorkers.length === 0) {
            setNotification({
              type: 'error',
              message: 'Não há funcionários para processar.'
            });
            return;
          }
          
          const employees = allWorkers.map(worker => ({
            id: worker._id as string,
            name: worker.name,
            position: worker.role || "",
            department: worker.department,
            contractType: worker.contract as EmployeeType,
            baseSalary: Number(worker.salario || 0),
            benefits: worker.ajuda ? [{ name: 'ajuda', value: Number(worker.ajuda) }] : [],
          }));
          
          // Processa a folha com TODOS os funcionários
          await processPayroll(payroll._id, { employees });
          
          // Recarrega os holerites
          fetchPayslipsByPayrollId(payroll._id);
          
          setNotification({
            type: 'success',
            message: `Folha de ${months[month-1]} ${year} processada com sucesso! 
                      Processados ${cltWorkers.length} CLT e ${pjWorkers.length} PJ.`
          });
        }
      }
    } catch (error: unknown) {
      console.error('Erro ao processar folha:', error);
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao processar folha de pagamento.'
      });
    }
  };

  // Filtra os holerites pelo tipo de contratação selecionado e mês/ano
  const filteredPayslips = payslips.filter(payslip => {
    // Primeiro, verifica se o holerite é do mês/ano selecionado
    const selectedMonthParts = selectedMonth.split(' ');
    const month = parseInt(selectedMonthParts[0]);
    const year = parseInt(selectedMonthParts[1]);
    
    if (payslip.month !== month || payslip.year !== year) {
      return false;
    }
    
    // Depois filtra por tipo
    return activeTab === 'CLT' 
      ? payslip.employeeType === 'CLT'
      : payslip.employeeType === 'PJ';
  });

  // Função para renderizar o status do holerite
  const renderStatus = (status: PayslipStatus) => {
    if (status === PayslipStatus.PROCESSED) {
      return <span className="bg-green-500 text-white rounded-full px-3 py-1 text-sm">Processado</span>;
    } else if (status === PayslipStatus.PENDING) {
      return <span className="bg-yellow-500 text-white rounded-full px-3 py-1 text-sm">Pendente</span>;
    } else {
      return <span className="bg-blue-500 text-white rounded-full px-3 py-1 text-sm">Pago</span>;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Folha de Pagamento</h1>
        <button
          onClick={handleCreatePayroll}
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded flex items-center"
        >
          <span className="mr-2">Gerar Folha</span>
        </button>
      </div>

      {/* Notificações */}
      {notification && (
        <div className={`mb-4 p-3 rounded-md ${notification.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {notification.message}
          <button 
            className="float-right font-bold" 
            onClick={() => setNotification(null)}
          >
            &times;
          </button>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Folha de Pagamento</h2>
          <p className="text-gray-600">Visualize e gerencie os pagamentos de salários da sua equipe, separados por tipo de contratação.</p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                
                // Verifica se já existe folha para este mês/ano
                const [month, year] = e.target.value.split(' ').map(Number);
                const existingPayroll = payrolls.find(
                  p => p.month === month && p.year === year
                );
                
                // Se existe, carrega os holerites, senão limpa os holerites
                if (existingPayroll && existingPayroll._id) {
                  fetchPayslipsByPayrollId(existingPayroll._id);
                } else {
                  setPayslips([]);
                }
              }}
              className="border rounded px-3 py-2"
            >
              {allMonthOptions.map((option) => (
                <option 
                  key={option.value} 
                  value={option.value}
                  style={{ fontWeight: option.exists ? 'bold' : 'normal' }}
                >
                  {option.label} {option.exists ? '✓' : ''}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleProcessPayroll}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded flex items-center"
          >
            <span>Processar Folha</span>
          </button>
        </div>

        <div className="mb-4">
          <div className="flex border-b border-gray-200">
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'CLT' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('CLT')}
            >
              Funcionários CLT
            </button>
            <button
              className={`py-2 px-4 font-medium ${activeTab === 'CNPJ' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
              onClick={() => setActiveTab('CNPJ')}
            >
              Prestadores CNPJ
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-6">Carregando...</div>
        ) : error ? (
          <div className="text-center py-6 text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="py-3 px-4 text-gray-600">Funcionário</th>
                  <th className="py-3 px-4 text-gray-600">Cargo</th>
                  <th className="py-3 px-4 text-gray-600">Departamento</th>
                  <th className="py-3 px-4 text-gray-600">Salário Base</th>
                  <th className="py-3 px-4 text-gray-600">Descontos</th>
                  <th className="py-3 px-4 text-gray-600">Salário Líquido</th>
                  <th className="py-3 px-4 text-gray-600">Status</th>
                  <th className="py-3 px-4 text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayslips.map((payslip) => (
                  <tr key={payslip._id} className="border-t border-gray-200">
                    <td className="py-3 px-4">{payslip.name}</td>
                    <td className="py-3 px-4">{payslip.position}</td>
                    <td className="py-3 px-4">{payslip.department}</td>
                    <td className="py-3 px-4">{formatCurrency(payslip.baseSalary)}</td>
                    <td className="py-3 px-4">{formatCurrency(payslip.totalDeductions)}</td>
                    <td className="py-3 px-4">{formatCurrency(payslip.netSalary)}</td>
                    <td className="py-3 px-4">{renderStatus(payslip.status)}</td>
                    <td className="py-3 px-4 flex space-x-2">
                      <button className="text-blue-500 hover:text-blue-700" title="Visualizar">
                        Visualizar
                      </button>
                      <button className="text-gray-500 hover:text-gray-700" title="Download">
                        Download
                      </button>
                      <button className="text-gray-500 hover:text-gray-700" title="Imprimir">
                        Imprimir
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredPayslips.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-gray-500">
                      {loading ? 'Carregando holerites...' : 'Nenhum holerite encontrado para este período'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
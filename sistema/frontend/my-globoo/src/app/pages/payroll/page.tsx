'use client';

import { useState, useEffect } from 'react';
import { usePayroll } from '@/hooks/usePayroll';
import { useWorker } from '@/hooks/useWorkers';

export default function SimplePayrollPage() {
  // Hooks
  const payrollHook = usePayroll();
  const workerHook = useWorker();
  
  // Estados
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  
  // Efeito para carregar dados iniciais
  useEffect(() => {
    const fetchInitialData = async () => {
      await workerHook.fetchWorkers();
      await payrollHook.fetchAllPayrolls();
      await payrollHook.fetchAllPaystubs();
      
      showMessage('Sistema pronto para processar folhas e baixar holerites', 'success');
    };
    
    fetchInitialData();
  }, []);

  // Função para processar todas as folhas em rascunho
  const processAllDraftPayrolls = async () => {
    setIsProcessing(true);
    showMessage('Processando folhas de pagamento...', 'success');
    
    try {
      // Busca todas as folhas em rascunho
      await payrollHook.fetchAllPayrolls();
      const draftPayrolls = payrollHook.payrolls.filter(p => p.status === 'draft');
      
      if (draftPayrolls.length === 0) {
        showMessage('Não há folhas de pagamento em rascunho para processar', 'error');
        setIsProcessing(false);
        return;
      }
      
      showMessage(`Processando ${draftPayrolls.length} folhas de pagamento...`, 'success');
      
      // Processa cada folha
      for (const payroll of draftPayrolls) {
        if (!payroll._id) continue;
        
        // Atualiza o status para "processing"
        await payrollHook.updatePayroll(payroll._id, { status: 'processing' });
        
        // Gera os holerites para esta folha
        const paystubs = await payrollHook.generatePaystubs(payroll._id);
        showMessage(`Gerados ${paystubs.length} holerites para a folha ${payroll.month}/${payroll.year}`, 'success');
        
        // Fecha a folha (muda status para "closed")
        await payrollHook.closePayroll(payroll._id);
      }
      
      // Recarrega as folhas após o processamento
      await payrollHook.fetchAllPayrolls();
      
      showMessage(`Processamento concluído! ${draftPayrolls.length} folhas processadas.`, 'success');
    } catch (error) {
      console.error('Erro ao processar folhas:', error);
      showMessage('Erro ao processar folhas de pagamento', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Função para baixar todos os holerites
  const downloadAllPaystubs = async () => {
    setIsDownloading(true);
    showMessage('Preparando holerites para download...', 'success');
    
    try {
      // Busca todos os holerites
      await payrollHook.fetchAllPaystubs();
      
      if (payrollHook.paystubs.length === 0) {
        showMessage('Não há holerites disponíveis para download', 'error');
        setIsDownloading(false);
        return;
      }
      
      showMessage(`Iniciando download de ${payrollHook.paystubs.length} holerites...`, 'success');
      
      // Download de cada holerite
      let downloadCount = 0;
      for (const paystub of payrollHook.paystubs) {
        if (!paystub._id) continue;
        
        const workerName = getWorkerName(paystub.workerId);
        showMessage(`Baixando holerite de ${workerName}...`, 'success');
        
        const blob = await payrollHook.downloadPaystub(paystub._id);
        
        // Cria uma URL para o blob e inicia o download
        if (!blob) {
          console.error(`Falha ao baixar holerite para ${workerName}`);
          continue;
        }
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `holerite-${workerName}-${paystub.month}-${paystub.year}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        downloadCount++;
        
        // Pequeno delay para não sobrecarregar o navegador
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      showMessage(`Download concluído! ${downloadCount} holerites baixados.`, 'success');
    } catch (error) {
      console.error('Erro ao baixar holerites:', error);
      showMessage('Erro ao baixar holerites', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  // Função para obter o nome do funcionário
  const getWorkerName = (workerId: string) => {
    const worker = workerHook.workers.find(w => w._id === workerId);
    return worker ? worker.name : 'Funcionário';
  };

  // Função para exibir mensagens
  const showMessage = (text: string, type: 'success' | 'error' | '') => {
    setMessage(text);
    setMessageType(type);
    
    // Limpa mensagens de sucesso após 5 segundos
    if (type === 'success') {
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-12">Sistema de Folha de Pagamento</h1>
      
      {/* Mensagem */}
      {message && (
        <div className={`${
          messageType === 'success' ? 'bg-green-100 border-green-500 text-green-700' : 
          messageType === 'error' ? 'bg-red-100 border-red-500 text-red-700' : 
          'bg-gray-100 border-gray-500 text-gray-700'
        } border-l-4 p-4 mb-8 rounded-lg`}>
          <p className="font-medium">{message}</p>
        </div>
      )}
      
      {/* Área principal com botões grandes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Botão para Processar Folhas */}
        <div className="bg-green-50 border-2 border-green-500 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
          <h2 className="text-2xl font-bold text-center mb-4 text-green-800">Folhas de Pagamento</h2>
          <p className="text-center mb-6 text-gray-700">
            Processa todas as folhas em rascunho, gera holerites e fecha as folhas.
          </p>
          <div className="flex justify-center">
            <button
              onClick={processAllDraftPayrolls}
              disabled={isProcessing}
              className={`bg-green-600 hover:bg-green-700 text-white text-xl font-bold py-6 px-10 rounded-lg shadow-md transform transition-transform hover:scale-105 ${
                isProcessing ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  PROCESSANDO...
                </span>
              ) : (
                "PROCESSAR FOLHAS"
              )}
            </button>
          </div>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Status: {isProcessing ? 'Processando folhas...' : 'Pronto para processar'}
            </p>
          </div>
        </div>
        
        {/* Botão para Baixar Holerites */}
        <div className="bg-blue-50 border-2 border-blue-500 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
          <h2 className="text-2xl font-bold text-center mb-4 text-blue-800">Holerites</h2>
          <p className="text-center mb-6 text-gray-700">
            Baixa todos os holerites gerados para distribuição aos funcionários.
          </p>
          <div className="flex justify-center">
            <button
              onClick={downloadAllPaystubs}
              disabled={isDownloading}
              className={`bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-6 px-10 rounded-lg shadow-md transform transition-transform hover:scale-105 ${
                isDownloading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isDownloading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  BAIXANDO...
                </span>
              ) : (
                "BAIXAR HOLERITES"
              )}
            </button>
          </div>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Status: {isDownloading ? 'Baixando holerites...' : 'Pronto para download'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Resumo */}
      <div className="bg-gray-50 rounded-lg p-6 shadow mt-8">
        <h3 className="text-xl font-bold mb-4">Resumo do Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <p className="text-gray-600">Folhas em Rascunho</p>
            <p className="text-2xl font-bold">{payrollHook.payrolls.filter(p => p.status === 'draft').length}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-gray-600">Folhas Processadas</p>
            <p className="text-2xl font-bold">{payrollHook.payrolls.filter(p => p.status === 'closed' || p.status === 'paid').length}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <p className="text-gray-600">Holerites Disponíveis</p>
            <p className="text-2xl font-bold">{payrollHook.paystubs.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
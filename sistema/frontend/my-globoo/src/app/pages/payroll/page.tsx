"use client";

import { useEffect, useState } from 'react';
import { motion } from "framer-motion";
import { usePayroll } from '@/hooks/usePayroll';
import { useWorker } from '@/hooks/useWorkers';
import { Payslip, PayslipStatus, EmployeeType, PayrollStatus } from '@/types/payroll';
import { Worker } from '@/types/worker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/buttonf";
import { Download, FileText, Printer } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

// Mapeamento de meses para nomes em português
const months = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Função para formatar valores monetários
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Variantes para animação
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { when: "beforeChildren", staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }
};

export default function PayrollPage() {
  const {
    payrolls,
    currentPayroll,
    payslips,
    loading,    
    fetchPayrolls,
    fetchPayslipsByPayrollId,
    createPayroll,
    processPayroll,
    downloadPayslipPDF,
    viewPayslipPDF,
    setPayslips,
    setCurrentPayroll
  } = usePayroll();

  const { workers, fetchWorkers, loading: workersLoading } = useWorker();

  // Estado local
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [activeTab, setActiveTab] = useState<'CLT' | 'PJ'>('CLT');
  const [processingType, setProcessingType] = useState<'BOTH' | 'CLT' | 'PJ'>('BOTH');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [viewingPayslip, setViewingPayslip] = useState<Payslip | null>(null);
  const [generateDialogOpen, setGenerateDialogOpen] = useState<boolean>(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Gerar opções apenas para os meses do ano atual
  const monthOptions = months.map((month, index) => {
    const monthNum = index + 1;
    const existingPayroll = payrolls.find(
      p => p.month === monthNum && p.year === selectedYear
    );
    
    return {
      value: monthNum,
      label: month,
      exists: !!existingPayroll,
      processed: existingPayroll?.status === PayrollStatus.COMPLETED,
      id: existingPayroll?._id
    };
  });

  // Efeito para carregar folhas de pagamento e funcionários ao iniciar
  useEffect(() => {
    const loadInitialData = async () => {
      await fetchPayrolls();
      await fetchWorkers();
    };
    
    loadInitialData();
  }, [fetchPayrolls, fetchWorkers]);

  // Ajuste o useEffect que controla a carga de holerites quando mudar mês/ano
  useEffect(() => {
    const loadPayrollData = async () => {
      const payroll = payrolls.find(p => p.month === selectedMonth && p.year === selectedYear);
      
      if (payroll && payroll._id) {
        setCurrentPayroll(payroll);
        console.log(`Carregando holerites para folha: ${payroll._id} (${months[selectedMonth-1]}/${selectedYear})`);
        
        try {
          const holerites = await fetchPayslipsByPayrollId(payroll._id);
          console.log(`${holerites.length} holerites carregados`);
          
          // Se não houver holerites e a folha está processada, podemos ter um problema de sincronização
          if (holerites.length === 0 && payroll.status === PayrollStatus.COMPLETED) {
            console.log("Folha processada mas sem holerites. Tentando novamente...");
            // Aguardar um momento e tentar novamente
            setTimeout(() => {
              if (payroll._id) {
                fetchPayslipsByPayrollId(payroll._id);
              }
            }, 1000);
          }
        } catch (error) {
          console.error("Erro ao carregar holerites:", error);
        }
      } else {
        console.log(`Nenhuma folha encontrada para ${months[selectedMonth-1]}/${selectedYear}`);
        setCurrentPayroll(null);
        setPayslips([]);
      }
    };
    
    if (payrolls.length > 0) {
      loadPayrollData();
    }
  }, [selectedMonth, selectedYear, payrolls, fetchPayslipsByPayrollId, setPayslips, setCurrentPayroll]);

  // Limpar URL do PDF ao fechar a visualização
  useEffect(() => {
    if (!viewingPayslip && pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  }, [viewingPayslip, pdfUrl]);

  // Função para preparar dados dos funcionários para processamento
  const prepareEmployeeData = (workerList: Worker[], contractType: 'CLT' | 'PJ' | 'BOTH'): Array<{
    id: string;
    name: string;
    position: string;
    department: string;
    contractType: EmployeeType;
    baseSalary: number;
    dependents?: number;
    benefits?: Array<{
      type: string;
      description: string;
      value: number;
    }>;
  }> => {
    // Filtrar funcionários válidos e com _id definido
    let filteredWorkers = workerList.filter(worker => worker && worker._id);
    
    // Filtrar por tipo de contratação
    if (contractType === 'CLT') {
      filteredWorkers = filteredWorkers.filter(w => w.contract === 'CLT');
    } else if (contractType === 'PJ') {
      filteredWorkers = filteredWorkers.filter(w => w.contract === 'PJ');
    }
    
    // Mapear para o formato esperado pela API
    return filteredWorkers.map(worker => ({
      id: worker._id as string,
      name: worker.name,
      position: worker.role || "",
      department: worker.department || "",
      contractType: (worker.contract || 'CLT') as EmployeeType, // Valor padrão para evitar undefined
      baseSalary: typeof worker.salario === 'string' ? parseFloat(worker.salario) : (worker.salario || 0),
      dependents: 0, // Valor padrão
      benefits: worker.ajuda ? [{ 
        type: 'Vale Refeição',
        description: 'Auxílio Alimentação',
        value: typeof worker.ajuda === 'string' ? parseFloat(worker.ajuda) : (worker.ajuda || 0)
      }] : [],
    }));
  };

  // Função para criar nova folha de pagamento
  const handleCreatePayroll = async () => {
    try {
      // Verificar se já existe folha para o mês selecionado
      const existingPayroll = payrolls.find(
        p => p.month === selectedMonth && p.year === selectedYear
      );
      
      if (existingPayroll) {
        toast.success(`Folha para ${months[selectedMonth-1]} ${selectedYear} já existe! Você pode processá-la agora.`);
        setGenerateDialogOpen(false);
        return;
      }
      
      // Criar nova folha com tratamento específico para o erro de folha já existente
      try {
        await createPayroll({
          month: selectedMonth,
          year: selectedYear
        });
        
        await fetchPayrolls();
        
        toast.success(`Folha para ${months[selectedMonth-1]} ${selectedYear} criada! Selecione o tipo de contratação e clique em "Processar Folha" para gerar holerites.`);
        setGenerateDialogOpen(false);
      } catch (error: unknown) {
        const createError = error as Error;
        // Verificar se é o erro específico de folha já existente
        if (createError.message && createError.message.includes("já existe")) {
          console.log('Folha já existe no backend, atualizando lista local');
          // Se a folha já existe no backend mas não está na lista local, atualize a lista
          await fetchPayrolls();
          toast.success(`Folha para ${months[selectedMonth-1]} ${selectedYear} já existe! Você pode processá-la agora.`);
          setGenerateDialogOpen(false);
        } else {
          // Se for outro tipo de erro, propague-o
          throw createError;
        }
      }
    } catch (error: unknown) {
      console.error('Erro ao criar folha:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar folha de pagamento.');
    }
  };

  // Modifique a função handleProcessPayroll para melhorar o tratamento de folhas existentes
  const handleProcessPayroll = async () => {
    try {
      setIsProcessing(true);
      
      const payroll = payrolls.find(p => p.month === selectedMonth && p.year === selectedYear);
      let payrollId = payroll?._id;
      
      // Se não houver folha existente, tente criar uma antes de processar
      if (!payrollId) {
        try {
          console.log(`Criando folha para ${months[selectedMonth-1]} ${selectedYear}`);
          const newPayroll = await createPayroll({
            month: selectedMonth,
            year: selectedYear
          });
          
          payrollId = newPayroll?._id;
        } catch (error: unknown) {
          const createError = error as Error;
          // Melhoria: Tentar recuperar a folha existente mesmo com erro
          if (createError.message && createError.message.includes("já existe")) {
            // Se a folha já existe, busque-a novamente
            console.log('Folha já existe, atualizando lista local e buscando folha');
            await fetchPayrolls();
            
            // Após atualizar a lista de folhas, busque a folha desejada
            const refreshedPayroll = payrolls.find(p => p.month === selectedMonth && p.year === selectedYear);
            payrollId = refreshedPayroll?._id;
          } else {
            throw createError;
          }
        }
      } else {
        console.log(`Folha já existente encontrada: ${payrollId}`);
      }
      
      if (!payrollId) {
        toast.error(`Não foi possível criar ou encontrar folha para ${months[selectedMonth-1]} ${selectedYear}`);
        setIsProcessing(false);
        return;
      }

      // Preparar dados dos funcionários para processamento
      const employees = prepareEmployeeData(workers, processingType);
      console.log(`Processando ${employees.length} funcionários na folha ${payrollId}`);
      
      if (employees.length === 0) {
        toast.error(`Não há funcionários ${processingType === 'CLT' ? 'CLT' : processingType === 'PJ' ? 'PJ' : ''} para processar.`);
        setIsProcessing(false);
        return;
      }
      
      // Processar a folha
      const processedPayroll = await processPayroll(payrollId, { employees });
      console.log("Folha processada com sucesso:", processedPayroll);
      
      // Importante: Garantir que a folha atual seja atualizada
      setCurrentPayroll(processedPayroll);
      
      // Carregar holerites com um pequeno atraso para garantir que o backend concluiu o processamento
      setTimeout(async () => {
        // Recarregar os holerites explicitamente para a folha processada
        if (payrollId) {
          console.log(`Carregando holerites para a folha processada: ${payrollId}`);
          const holerites = await fetchPayslipsByPayrollId(payrollId);
          console.log(`${holerites.length} holerites carregados`);
        }
        
        // Atualizar a lista de folhas para refletir o novo status
        await fetchPayrolls();
        
        toast.success(`Folha de ${months[selectedMonth-1]} ${selectedYear} processada com sucesso! ${employees.length} funcionários processados.`);
        setIsProcessing(false);
      }, 1000);
    } catch (error: unknown) {
      console.error('Erro ao processar folha:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao processar folha de pagamento.');
      setIsProcessing(false);
    }
  };

  // Função para visualizar o PDF do holerite
  const handleViewPayslip = async (payslip: Payslip) => {
    try {
      setViewingPayslip(payslip);
      if (!payslip._id) return;
      
      const blob = await viewPayslipPDF(payslip._id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        
        // Abrir em uma nova aba
        window.open(url, '_blank');
      }
    } catch (error: unknown) {
      console.error('Erro ao visualizar holerite:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao visualizar holerite.');
    }
  };

  // Função para baixar o PDF do holerite
  const handleDownloadPayslip = async (payslip: Payslip) => {
    try {
      if (!payslip._id) return;
      toast.loading(`Baixando holerite de ${payslip.name}...`);
      
      const blob = await downloadPayslipPDF(payslip._id);
      if (blob) {
        // Criar link de download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `holerite_${payslip.name.replace(/\s+/g, '_')}_${payslip.month}_${payslip.year}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.dismiss();
        toast.success(`Holerite de ${payslip.name} baixado com sucesso!`);
      }
    } catch (error: unknown) {
      console.error('Erro ao baixar holerite:', error);
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : 'Erro ao baixar holerite.');
    }
  };

  // Filtrar os holerites pelo tipo de contratação selecionado e mês/ano
  const filteredPayslips = payslips.filter(payslip => {
    // Verifica se o payslip existe e tem dados válidos
    if (!payslip || !payslip.month || !payslip.year || payslip.employeeType === undefined) {
      console.log("Ignorando holerite inválido:", payslip);
      return false;
    }
    
    // Primeiro verifica se o holerite é do mês/ano selecionado
    if (payslip.month !== selectedMonth || payslip.year !== selectedYear) {
      return false;
    }
    
    // Filtra por tipo de contrato
    if (activeTab === 'CLT') {
      return payslip.employeeType === 'CLT';
    } else if (activeTab === 'PJ') {
      return payslip.employeeType === 'PJ';
    }
    
    return false; // Não deve chegar aqui, mas por segurança
  });

  // Função para renderizar o status do holerite
  const renderStatus = (status: PayslipStatus) => {
    if (status === PayslipStatus.PROCESSED) {
      return <Badge className="bg-green-500">Processado</Badge>;
    } else if (status === PayslipStatus.PENDING) {
      return <Badge className="bg-yellow-500">Pendente</Badge>;
    } else {
      return <Badge className="bg-blue-500">Pago</Badge>;
    }
  };

  // Verificar se há carregamento geral
  const isLoading = loading || workersLoading;

  return (
    <motion.div
      className="p-6 ml-[var(--sidebar-width,4.5rem)] transition-all duration-300 bg-gray-50 dark:bg-gray-900 min-h-screen"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      style={{ width: "calc(100% - var(--sidebar-width, 4.5rem))" }}
    >
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-white">Folha de Pagamento</h1>
          <Button onClick={() => setGenerateDialogOpen(true)}>
            Criar Nova Folha
          </Button>
        </div>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-cyan-700 dark:bg-gray-800"
      >
        <Card className="bg-transparent shadow-none border-none">
          <CardHeader>
            <CardTitle className="text-gray-800 dark:text-white">Folha de Pagamento</CardTitle>
            <CardDescription className="text-gray-500 dark:text-gray-400">
              Visualize e gerencie os pagamentos de salários da sua equipe, separados por tipo de contratação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-6">
              <div className="flex space-x-4">
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(value) => setSelectedMonth(Number(value))}
                  disabled={isLoading || isProcessing}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((option) => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value.toString()}
                      >
                        {option.label} {option.exists ? (option.processed ? '✓ (Processada)' : '✓') : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(Number(value))}
                  disabled={isLoading || isProcessing}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex space-x-4">
                <Select
                  value={processingType}
                  onValueChange={(value) => setProcessingType(value as 'BOTH' | 'CLT' | 'PJ')}
                  disabled={isLoading || isProcessing}
                >
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Tipo de processamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOTH">Todos os Funcionários</SelectItem>
                    <SelectItem value="CLT">Apenas CLT</SelectItem>
                    <SelectItem value="PJ">Apenas PJ</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  onClick={handleProcessPayroll}
                  disabled={isLoading || isProcessing}
                  className={`${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isProcessing ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processando...
                    </span>
                  ) : (
                    <span>
                      {currentPayroll?.status === PayrollStatus.COMPLETED
                        ? 'Reprocessar Folha'
                        : 'Processar Folha'
                      }
                    </span>
                  )}
                </Button>
              </div>
            </div>

            <Tabs defaultValue="CLT" onValueChange={(value) => setActiveTab(value as 'CLT' | 'PJ')}> 
              <TabsContent value="CLT">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Funcionário</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Departamento</TableHead>
                        <TableHead className="text-right">Salário Base</TableHead>
                        <TableHead className="text-right">Descontos</TableHead>
                        <TableHead className="text-right">Salário Líquido</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading || isProcessing ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-10">
                            <div className="flex justify-center items-center">
                              <svg className="animate-spin h-8 w-8 text-primary mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>{isProcessing ? 'Processando folha...' : 'Carregando...'}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredPayslips.length > 0 ? (
                        filteredPayslips.map((payslip) => (
                          <TableRow key={payslip._id}>
                            <TableCell className="font-medium">{payslip.name}</TableCell>
                            <TableCell>{payslip.position}</TableCell>
                            <TableCell>{payslip.department}</TableCell>
                            <TableCell className="text-right">{formatCurrency(payslip.baseSalary)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(payslip.totalDeductions)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(payslip.netSalary)}</TableCell>
                            <TableCell>{renderStatus(payslip.status)}</TableCell>
                            <TableCell>
                              <div className="flex justify-center space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleViewPayslip(payslip)}
                                  title="Visualizar"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleDownloadPayslip(payslip)}
                                  title="Download"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  title="Imprimir"
                                  onClick={() => {
                                    handleViewPayslip(payslip);
                                    setTimeout(() => {
                                      if (pdfUrl) window.open(pdfUrl, '_blank')?.print();
                                    }, 1000);
                                  }}
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                            {currentPayroll 
                              ? `Nenhum holerite CLT encontrado para ${months[selectedMonth-1]}/${selectedYear}` 
                              : `Não existe folha de pagamento para ${months[selectedMonth-1]}/${selectedYear}`}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="PJ">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prestador</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Departamento</TableHead>
                        <TableHead className="text-right">Valor Base</TableHead>
                        <TableHead className="text-right">Descontos</TableHead>
                        <TableHead className="text-right">Valor Líquido</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading || isProcessing ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-10">
                            <div className="flex justify-center items-center">
                              <svg className="animate-spin h-8 w-8 text-primary mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              <span>{isProcessing ? 'Processando folha...' : 'Carregando...'}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredPayslips.length > 0 ? (
                        filteredPayslips.map((payslip) => (
                          <TableRow key={payslip._id}>
                            <TableCell className="font-medium">{payslip.name}</TableCell>
                            <TableCell>{payslip.position}</TableCell>
                            <TableCell>{payslip.department}</TableCell>
                            <TableCell className="text-right">{formatCurrency(payslip.baseSalary)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(payslip.totalDeductions)}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(payslip.netSalary)}</TableCell>
                            <TableCell>{renderStatus(payslip.status)}</TableCell>
                            <TableCell>
                              <div className="flex justify-center space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleViewPayslip(payslip)}
                                  title="Visualizar"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleDownloadPayslip(payslip)}
                                  title="Download"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  title="Imprimir"
                                  onClick={() => {
                                    handleViewPayslip(payslip);
                                    setTimeout(() => {
                                      if (pdfUrl) window.open(pdfUrl, '_blank')?.print();
                                    }, 1000);
                                  }}
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                            {currentPayroll 
                              ? `Nenhum holerite PJ encontrado para ${months[selectedMonth-1]}/${selectedYear}` 
                              : `Não existe folha de pagamento para ${months[selectedMonth-1]}/${selectedYear}`}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>

      {/* Diálogo para gerar folha de pagamento */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border dark:border-cyan-700">
          <DialogHeader>
            <DialogTitle>Gerar Folha de Pagamento</DialogTitle>
            <DialogDescription>
              Selecione o período e tipo de contratação para gerar a folha.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-2">
                <label htmlFor="month" className="text-sm font-medium">Mês</label>
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(value) => setSelectedMonth(Number(value))}
                >
                  <SelectTrigger id="month">
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={index} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col space-y-2">
                <label htmlFor="year" className="text-sm font-medium">Ano</label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(Number(value))}
                >
                  <SelectTrigger id="year">
                    <SelectValue placeholder="Selecione o ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              <label htmlFor="processingType" className="text-sm font-medium">Tipo de Contratação</label>
              <Select
                value={processingType}
                onValueChange={(value) => setProcessingType(value as 'BOTH' | 'CLT' | 'PJ')}
              >
                <SelectTrigger id="processingType">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOTH">Todos os funcionários</SelectItem>
                  <SelectItem value="CLT">Apenas CLT</SelectItem>
                  <SelectItem value="PJ">Apenas PJ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreatePayroll}>
              Gerar Folha
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo para visualizar holerite */}
      {viewingPayslip && (
        <Dialog open={!!viewingPayslip} onOpenChange={(open) => !open && setViewingPayslip(null)}>
          <DialogContent className="sm:max-w-3xl bg-white dark:bg-gray-900 border dark:border-cyan-700">
            <DialogHeader>
              <DialogTitle className="flex justify-between">
                <span>Holerite - {months[viewingPayslip.month - 1]}/{viewingPayslip.year}</span>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => {
                    if (pdfUrl) window.open(pdfUrl, '_blank')?.print();
                  }}>
                    <Printer className="h-4 w-4 mr-2" />
                    Imprimir
                  </Button>
                  <Button size="sm" onClick={() => handleDownloadPayslip(viewingPayslip)}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="border rounded-lg p-6">
              <div className="mb-6 text-center border-b pb-4">
                <h2 className="text-xl font-bold">SISTEMA DE HOLERITES</h2>
                <p className="text-muted-foreground">CNPJ: 12.345.678/0001-90</p>
                <p className="text-muted-foreground">Empresa XYZ Technologies</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p><strong>Nome:</strong> {viewingPayslip.name}</p>
                  <p><strong>Cargo:</strong> {viewingPayslip.position}</p>
                  <p><strong>Departamento:</strong> {viewingPayslip.department}</p>
                </div>
                <div className="text-right">
                  <p><strong>Tipo:</strong> {viewingPayslip.employeeType}</p>
                  <p><strong>Mês/Ano:</strong> {months[viewingPayslip.month - 1]}/{viewingPayslip.year}</p>
                  <p><strong>Status:</strong> {viewingPayslip.status}</p>
                </div>
              </div>
              
              <div className="border rounded-md mb-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Referência</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Salário Base</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="text-right">{formatCurrency(viewingPayslip.baseSalary)}</TableCell>
                    </TableRow>
                    {viewingPayslip.benefits && viewingPayslip.benefits.length > 0 && viewingPayslip.benefits.map((benefit, index) => (
                      <TableRow key={`benefit-${index}`}>
                        <TableCell>{benefit.description || benefit.type}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell className="text-right">{formatCurrency(benefit.value)}</TableCell>
                      </TableRow>
                    ))}
                    {viewingPayslip.deductions && viewingPayslip.deductions.length > 0 && viewingPayslip.deductions.map((deduction, index) => (
                      <TableRow key={`deduction-${index}`}>
                        <TableCell>{deduction.description || deduction.type}</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell className="text-right text-red-500">-{formatCurrency(deduction.value)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold">
                      <TableCell>Total Líquido</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell className="text-right">{formatCurrency(viewingPayslip.netSalary)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="border rounded p-3 text-center">
                  <p className="text-sm text-muted-foreground">Salário Base</p>
                  <p className="font-bold">{formatCurrency(viewingPayslip.baseSalary)}</p>
                </div>
                <div className="border rounded p-3 text-center">
                  <p className="text-sm text-muted-foreground">Descontos</p>
                  <p className="font-bold">{formatCurrency(viewingPayslip.totalDeductions)}</p>
                </div>
                <div className="border rounded p-3 text-center bg-primary/10">
                  <p className="text-sm text-muted-foreground">Valor Líquido</p>
                  <p className="font-bold">{formatCurrency(viewingPayslip.netSalary)}</p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
                <p>Este documento é meramente informativo e não possui valor fiscal.</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}
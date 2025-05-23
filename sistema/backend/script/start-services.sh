#!/bin/bash
# filepath: /home/pedro/globoo-adm/backend/script/start-services.sh
#!/bin/bash
# Script para iniciar todos os microsserviços

# Cores para saída no terminal
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Obter o caminho absoluto do diretório base
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Diretório de logs com caminho absoluto
LOGS_DIR="../logs"

# Lista de serviços para iniciar
SERVICES=(  
  "auth-service"   
  "visitor-service" 
  "invoice-service" 
  "template-service"
  "payroll-service"  
  "worker-service"
  "provider-service"
  "web-socket"  
  

  #Sempre deixe o api-gateway por último
  # pois ele depende dos outros microsserviços
  "api-gateway"  
)

# Armazenar PIDs dos processos
declare -A SERVICE_PIDS

# Flag para controlar se o monitor deve continuar executando
MONITOR_RUNNING=true

# Função para iniciar um serviço
start_service() {
  local service=$1
  local service_dir="${BASE_DIR}/${service}"
  
  echo -e "${YELLOW}Iniciando ${service}...${NC}"
  
  # Verificar se o diretório existe
  if [ ! -d "$service_dir" ]; then
    echo -e "${RED}Diretório $service_dir não encontrado! Pulando...${NC}"
    return 1
  fi
  
  # Entrar no diretório do serviço
  cd "$service_dir" || return 1
  
  # Verificar se existe package.json e script dev
  if [ -f "package.json" ]; then
    if grep -q '"dev"' "package.json"; then
      echo -e "Iniciando serviço com 'npm run dev'..."
      
      # Iniciar o serviço em background e capturar saída
      npm run dev > "${LOGS_DIR}/${service}.log" 2>&1 &
      
      # Armazenar PID do processo
      local pid=$!
      SERVICE_PIDS[$service]=$pid
      
      echo -e "${GREEN}Serviço ${service} iniciado! (PID: $pid)${NC}"
      echo -e "Logs sendo gravados em: ${LOGS_DIR}/${service}.log"
      
      # Aguardar um momento para verificar se o processo continua em execução
      sleep 2
      if kill -0 $pid 2>/dev/null; then
        echo -e "${GREEN}Serviço ${service} está rodando corretamente.${NC}"
      else
        echo -e "${RED}Serviço ${service} falhou ao iniciar!${NC}"
        return 1
      fi
      
    else
      echo -e "${RED}Script 'dev' não encontrado no package.json de ${service}!${NC}"
      cd - > /dev/null
      return 1
    fi
  else
    echo -e "${RED}Arquivo package.json não encontrado em ${service_dir}!${NC}"
    cd - > /dev/null
    return 1
  fi
  
  # Voltar para o diretório original
  cd - > /dev/null
  return 0
}

# Função para encerrar todos os serviços
stop_services() {
  echo -e "\n${YELLOW}Encerrando todos os serviços...${NC}"
  
  # Parar o monitor
  MONITOR_RUNNING=false
  
  for service in "${!SERVICE_PIDS[@]}"; do
    local pid=${SERVICE_PIDS[$service]}
    if kill -0 $pid 2>/dev/null; then
      echo -e "Encerrando ${service} (PID: $pid)..."
      kill $pid
      wait $pid 2>/dev/null || true
      echo -e "${GREEN}${service} encerrado.${NC}"
    else
      echo -e "${YELLOW}${service} (PID: $pid) já não está em execução.${NC}"
    fi
  done
  
  # Verificar se há processos node órfãos e encerrar
  local node_pids=$(ps aux | grep '[n]pm run dev' | awk '{print $2}')
  if [ -n "$node_pids" ]; then
    echo -e "${YELLOW}Encontrados processos Node.js órfãos. Encerrando...${NC}"
    echo $node_pids | xargs kill -9 2>/dev/null || true
  fi
  
  echo -e "${GREEN}Todos os serviços foram encerrados.${NC}"
  
  if [ "$1" != "noexit" ]; then
    exit 0
  fi
}

# Função para monitorar os serviços em execução
monitor_services() {
  echo -e "${GREEN}Iniciando monitor de serviços...${NC}"
  
  while [ "$MONITOR_RUNNING" = true ]; do
    local all_running=true
    
    # Verificar cada serviço
    for service in "${!SERVICE_PIDS[@]}"; do
      local pid=${SERVICE_PIDS[$service]}
      
      if ! kill -0 $pid 2>/dev/null; then
        echo -e "\n${RED}Serviço $service (PID: $pid) foi encerrado inesperadamente!${NC}"
        all_running=false
        break
      fi
    done
    
    # Se algum serviço não estiver mais em execução, parar todos
    if [ "$all_running" = false ]; then
      echo -e "${YELLOW}Um serviço terminou inesperadamente. Encerrando todos os serviços...${NC}"
      stop_services "noexit"
      echo -e "${RED}Todos os serviços foram encerrados devido a uma falha. Verifique os logs para mais detalhes.${NC}"
      exit 1
    fi
    
    # Aguardar antes da próxima verificação
    sleep 2
  done
}

# Configura trap para capturar Ctrl+C e outras sinais de término
trap stop_services INT TERM QUIT

# Função principal
main() {
  echo -e "${YELLOW}========================================${NC}"
  echo -e "${YELLOW}   Iniciando todos os microsserviços   ${NC}"
  echo -e "${YELLOW}========================================${NC}"
  
  # Criar diretório de logs
  mkdir -p "${LOGS_DIR}"
  echo -e "${GREEN}Diretório de logs criado em: ${LOGS_DIR}${NC}"
  
  # Iniciar cada serviço
  local active_services=0
  
  for service in "${SERVICES[@]}"; do
    echo -e "\n${BLUE}===== Iniciando $service =====${NC}"
    
    if start_service "$service"; then
      ((active_services++))
    fi
  done
  
  # Resumo
  echo -e "\n${GREEN}===== Resumo =====${NC}"
  echo -e "Total de serviços: ${#SERVICES[@]}"
  echo -e "Serviços ativos: ${active_services}"
  
  if [ $active_services -eq ${#SERVICES[@]} ]; then
    echo -e "${GREEN}Todos os serviços foram iniciados com sucesso!${NC}"
  else
    echo -e "${YELLOW}Alguns serviços não puderam ser iniciados. Verifique os logs.${NC}"
  fi
  
  # Iniciar o monitor em background
  monitor_services &
  MONITOR_PID=$!
  
  # Manter o script em execução e mostrar logs
  echo -e "\n${YELLOW}Pressione Ctrl+C para encerrar todos os serviços.${NC}"
  echo -e "${YELLOW}Mostrando logs combinados (os serviços serão encerrados automaticamente se qualquer um falhar):${NC}\n"
  
  # Usar aspas duplas ao redor do caminho completo
  tail -f "${LOGS_DIR}"/*.log
  
  # Se chegamos aqui, tail foi interrompido
  stop_services
}

# Executar a função principal
main
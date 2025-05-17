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
  "worker-service"  
  "template-service"


  #Sempre deixe o api-gateway por último
  # pois ele depende dos outros microsserviços
  "api-gateway"  
)

# Armazenar PIDs dos processos
declare -A SERVICE_PIDS

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
  
  for service in "${!SERVICE_PIDS[@]}"; do
    local pid=${SERVICE_PIDS[$service]}
    if kill -0 $pid 2>/dev/null; then
      echo -e "Encerrando ${service} (PID: $pid)..."
      kill $pid
      wait $pid 2>/dev/null
      echo -e "${GREEN}${service} encerrado.${NC}"
    fi
  done
  
  echo -e "${GREEN}Todos os serviços foram encerrados.${NC}"
  exit 0
}

# Configura trap para capturar Ctrl+C
trap stop_services INT

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
  
  # Manter o script em execução e mostrar logs
  echo -e "\n${YELLOW}Pressione Ctrl+C para encerrar todos os serviços.${NC}"
  echo -e "${YELLOW}Mostrando logs combinados:${NC}\n"
  
  # CORREÇÃO: Usar aspas duplas ao redor do caminho completo
  tail -f "${LOGS_DIR}"/*.log
}

# Executar a função principal
main
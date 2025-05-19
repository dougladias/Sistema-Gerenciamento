#!/bin/bash
# Script para instalar todas as dependencias dos microsserviços


# Cores para saída no terminal
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Diretório base
BASE_DIR="../../backend"

# Lista de serviços
SERVICES=(
  "api-gateway"  
  "payroll-service"
  "worker-service"
  "template-service"
)

# Função para instalar dependências em um serviço
install_dependencies() {
  local service=$1
  local service_dir="${BASE_DIR}/${service}"
  
  echo -e "${YELLOW}Instalando dependências para ${service}...${NC}"
  
  # Verificar se o diretório existe
  if [ ! -d "$service_dir" ]; then
    echo -e "${RED}Diretório $service_dir não encontrado! Pulando...${NC}"
    return 1
  fi
  
  # Entrar no diretório do serviço
  cd "$service_dir" || return 1
  
  # Instalar dependências com npm
  if [ -f "package.json" ]; then
    echo -e "Encontrado package.json, instalando dependências com npm..."
    npm install
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}Dependências instaladas com sucesso para ${service}!${NC}"
    else
      echo -e "${RED}Erro ao instalar dependências para ${service}!${NC}"
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

# Função principal
main() {
  echo -e "${YELLOW}Iniciando instalação de dependências para todos os microsserviços...${NC}"
  
  # Verificar se o diretório base existe
  if [ ! -d "$BASE_DIR" ]; then
    echo -e "${RED}Diretório base $BASE_DIR não encontrado!${NC}"
    exit 1
  fi
  
  # Contador para serviços com sucesso
  local success_count=0
  
  # Instalar dependências para cada serviço
  for service in "${SERVICES[@]}"; do
    echo -e "\n${YELLOW}===== Processando $service =====${NC}"
    
    if install_dependencies "$service"; then
      ((success_count++))
    fi
  done
  
  # Resumo final
  echo -e "\n${GREEN}===== Resumo da Instalação =====${NC}"
  echo -e "Serviços processados: ${#SERVICES[@]}"
  echo -e "Instalações com sucesso: ${success_count}"
  echo -e "Instalações com falha: $((${#SERVICES[@]} - success_count))"
  
  if [ $success_count -eq ${#SERVICES[@]} ]; then
    echo -e "${GREEN}Todas as dependências foram instaladas com sucesso!${NC}"
  else
    echo -e "${YELLOW}Algumas instalações falharam. Verifique os logs acima.${NC}"
  fi
}

# Executar a função principal
main
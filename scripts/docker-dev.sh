#!/bin/bash

# Script para gestionar el entorno de desarrollo con Docker
# Uso: ./scripts/docker-dev.sh [comando]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}🐳 Bingo La Perla - Docker Development Manager${NC}"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  start     - Iniciar entorno de desarrollo"
    echo "  stop      - Detener entorno de desarrollo"
    echo "  restart   - Reiniciar entorno de desarrollo"
    echo "  logs      - Mostrar logs de todos los servicios"
    echo "  backend   - Logs solo del backend"
    echo "  frontend  - Logs solo del frontend"
    echo "  db        - Logs de la base de datos"
    echo "  build     - Rebuild containers"
    echo "  clean     - Limpiar containers, networks y volumes"
    echo "  status    - Mostrar estado de los servicios"
    echo "  shell     - Abrir shell en container del backend"
    echo "  psql      - Conectar a PostgreSQL"
    echo "  redis     - Conectar a Redis CLI"
    echo "  help      - Mostrar esta ayuda"
    echo ""
    echo "URLs de desarrollo:"
    echo "  🎮 Frontend:     http://localhost:5173"
    echo "  🚀 Backend:      http://localhost:3001"
    echo "  📊 Adminer:      http://localhost:8080"
    echo "  🔴 Redis UI:     http://localhost:8081"
    echo ""
}

# Función para verificar si Docker está corriendo
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker no está corriendo. Por favor inicia Docker Desktop.${NC}"
        exit 1
    fi
}

# Función para crear .env si no existe
setup_env() {
    if [ ! -f .env ]; then
        echo -e "${YELLOW}⚠️  Archivo .env no encontrado. Creando desde .env.example...${NC}"
        cp .env.example .env
        echo -e "${GREEN}✅ Archivo .env creado. Revisa y ajusta las variables si es necesario.${NC}"
    fi
}

# Comandos principales
case "$1" in
    "start")
        echo -e "${BLUE}🚀 Iniciando entorno de desarrollo...${NC}"
        check_docker
        setup_env
        docker-compose -f docker-compose.dev.yml up -d
        echo -e "${GREEN}✅ Entorno iniciado exitosamente!${NC}"
        echo ""
        echo -e "${BLUE}URLs disponibles:${NC}"
        echo -e "  🎮 Frontend:     ${GREEN}http://localhost:5173${NC}"
        echo -e "  🚀 Backend:      ${GREEN}http://localhost:3001${NC}"
        echo -e "  📊 Adminer:      ${GREEN}http://localhost:8080${NC}"
        echo -e "  🔴 Redis UI:     ${GREEN}http://localhost:8081${NC}"
        echo ""
        echo -e "${YELLOW}💡 Usa '$0 logs' para ver logs en tiempo real${NC}"
        ;;
    
    "stop")
        echo -e "${YELLOW}🛑 Deteniendo entorno de desarrollo...${NC}"
        docker-compose -f docker-compose.dev.yml down
        echo -e "${GREEN}✅ Entorno detenido.${NC}"
        ;;
    
    "restart")
        echo -e "${YELLOW}🔄 Reiniciando entorno de desarrollo...${NC}"
        docker-compose -f docker-compose.dev.yml down
        docker-compose -f docker-compose.dev.yml up -d
        echo -e "${GREEN}✅ Entorno reiniciado.${NC}"
        ;;
    
    "logs")
        echo -e "${BLUE}📋 Mostrando logs de todos los servicios...${NC}"
        docker-compose -f docker-compose.dev.yml logs -f
        ;;
    
    "backend")
        echo -e "${BLUE}📋 Logs del backend...${NC}"
        docker-compose -f docker-compose.dev.yml logs -f backend-dev
        ;;
    
    "frontend")
        echo -e "${BLUE}📋 Logs del frontend...${NC}"
        docker-compose -f docker-compose.dev.yml logs -f frontend-dev
        ;;
    
    "db")
        echo -e "${BLUE}📋 Logs de PostgreSQL...${NC}"
        docker-compose -f docker-compose.dev.yml logs -f postgres-dev
        ;;
    
    "build")
        echo -e "${BLUE}🔨 Rebuilding containers...${NC}"
        docker-compose -f docker-compose.dev.yml build --no-cache
        echo -e "${GREEN}✅ Build completado.${NC}"
        ;;
    
    "clean")
        echo -e "${RED}🧹 Limpiando entorno (esto eliminará datos)...${NC}"
        read -p "¿Estás seguro? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose -f docker-compose.dev.yml down -v --remove-orphans
            docker system prune -f
            echo -e "${GREEN}✅ Limpieza completada.${NC}"
        else
            echo -e "${YELLOW}❌ Operación cancelada.${NC}"
        fi
        ;;
    
    "status")
        echo -e "${BLUE}📊 Estado de los servicios:${NC}"
        docker-compose -f docker-compose.dev.yml ps
        ;;
    
    "shell")
        echo -e "${BLUE}🐚 Abriendo shell en backend...${NC}"
        docker-compose -f docker-compose.dev.yml exec backend-dev sh
        ;;
    
    "psql")
        echo -e "${BLUE}🐘 Conectando a PostgreSQL...${NC}"
        docker-compose -f docker-compose.dev.yml exec postgres-dev psql -U bingo_dev -d bingo_development
        ;;
    
    "redis")
        echo -e "${BLUE}🔴 Conectando a Redis CLI...${NC}"
        docker-compose -f docker-compose.dev.yml exec redis-dev redis-cli
        ;;
    
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    
    *)
        echo -e "${RED}❌ Comando desconocido: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
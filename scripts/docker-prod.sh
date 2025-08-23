#!/bin/bash

# Script para gestionar el entorno de producción con Docker
# Uso: ./scripts/docker-prod.sh [comando]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}🚀 Bingo La Perla - Docker Production Manager${NC}"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  deploy    - Deploy completo a producción"
    echo "  start     - Iniciar servicios de producción"
    echo "  stop      - Detener servicios de producción"
    echo "  restart   - Reiniciar servicios de producción"
    echo "  logs      - Mostrar logs de todos los servicios"
    echo "  backend   - Logs solo del backend"
    echo "  frontend  - Logs solo del frontend"
    echo "  db        - Logs de la base de datos"
    echo "  build     - Build containers para producción"
    echo "  status    - Mostrar estado de los servicios"
    echo "  backup    - Backup de la base de datos"
    echo "  restore   - Restaurar backup de BD (requiere archivo)"
    echo "  migrate   - Ejecutar migraciones de BD"
    echo "  health    - Check de salud de todos los servicios"
    echo "  update    - Actualizar servicios (pull + restart)"
    echo "  scale     - Escalar servicios (ej: scale backend=3)"
    echo "  help      - Mostrar esta ayuda"
    echo ""
    echo "⚠️  IMPORTANTE: Este script es para PRODUCCIÓN"
    echo "   Asegúrate de tener configurado .env correctamente"
    echo ""
}

# Función para verificar si Docker está corriendo
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker no está corriendo.${NC}"
        exit 1
    fi
}

# Función para verificar .env
check_env() {
    if [ ! -f .env ]; then
        echo -e "${RED}❌ Archivo .env no encontrado.${NC}"
        echo -e "${YELLOW}💡 Copia .env.example a .env y configura las variables de producción.${NC}"
        exit 1
    fi
    
    # Verificar variables críticas
    source .env
    if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-super-secure-jwt-secret-change-in-production" ]; then
        echo -e "${RED}❌ JWT_SECRET no está configurado para producción.${NC}"
        exit 1
    fi
}

# Función para backup de BD
backup_database() {
    echo -e "${BLUE}💾 Creando backup de la base de datos...${NC}"
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    docker-compose exec -T postgres pg_dump -U ${POSTGRES_USER:-bingo_user} -d ${POSTGRES_DB:-bingo_production} > "backups/$BACKUP_FILE"
    echo -e "${GREEN}✅ Backup creado: backups/$BACKUP_FILE${NC}"
}

# Función para health check
health_check() {
    echo -e "${BLUE}🏥 Verificando salud de los servicios...${NC}"
    
    # Backend health
    if curl -f http://localhost:${BACKEND_PORT:-3001}/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend: OK${NC}"
    else
        echo -e "${RED}❌ Backend: FAILED${NC}"
    fi
    
    # Frontend health
    if curl -f http://localhost:${FRONTEND_PORT:-3000}/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend: OK${NC}"
    else
        echo -e "${RED}❌ Frontend: FAILED${NC}"
    fi
    
    # Database
    if docker-compose exec -T postgres pg_isready -U ${POSTGRES_USER:-bingo_user} >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL: OK${NC}"
    else
        echo -e "${RED}❌ PostgreSQL: FAILED${NC}"
    fi
    
    # Redis
    if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis: OK${NC}"
    else
        echo -e "${RED}❌ Redis: FAILED${NC}"
    fi
}

# Comandos principales
case "$1" in
    "deploy")
        echo -e "${BLUE}🚀 Iniciando deploy completo a producción...${NC}"
        check_docker
        check_env
        
        # Crear directorio de backups si no existe
        mkdir -p backups
        
        # Backup antes del deploy
        if docker-compose ps postgres | grep -q "Up"; then
            backup_database
        fi
        
        # Build y start
        echo -e "${BLUE}🔨 Building containers...${NC}"
        docker-compose build --no-cache
        
        echo -e "${BLUE}🚀 Starting services...${NC}"
        docker-compose up -d
        
        # Ejecutar migraciones
        echo -e "${BLUE}📊 Ejecutando migraciones...${NC}"
        sleep 10 # Esperar que la DB esté lista
        docker-compose exec backend npx prisma migrate deploy
        
        echo -e "${GREEN}✅ Deploy completado exitosamente!${NC}"
        health_check
        ;;
    
    "start")
        echo -e "${BLUE}🚀 Iniciando servicios de producción...${NC}"
        check_docker
        check_env
        docker-compose up -d
        echo -e "${GREEN}✅ Servicios iniciados.${NC}"
        ;;
    
    "stop")
        echo -e "${YELLOW}🛑 Deteniendo servicios de producción...${NC}"
        docker-compose down
        echo -e "${GREEN}✅ Servicios detenidos.${NC}"
        ;;
    
    "restart")
        echo -e "${YELLOW}🔄 Reiniciando servicios de producción...${NC}"
        docker-compose restart
        echo -e "${GREEN}✅ Servicios reiniciados.${NC}"
        ;;
    
    "logs")
        echo -e "${BLUE}📋 Mostrando logs de todos los servicios...${NC}"
        docker-compose logs -f --tail=100
        ;;
    
    "backend")
        echo -e "${BLUE}📋 Logs del backend...${NC}"
        docker-compose logs -f --tail=100 backend
        ;;
    
    "frontend")
        echo -e "${BLUE}📋 Logs del frontend...${NC}"
        docker-compose logs -f --tail=100 frontend
        ;;
    
    "db")
        echo -e "${BLUE}📋 Logs de PostgreSQL...${NC}"
        docker-compose logs -f --tail=100 postgres
        ;;
    
    "build")
        echo -e "${BLUE}🔨 Building containers para producción...${NC}"
        docker-compose build --no-cache
        echo -e "${GREEN}✅ Build completado.${NC}"
        ;;
    
    "status")
        echo -e "${BLUE}📊 Estado de los servicios:${NC}"
        docker-compose ps
        ;;
    
    "backup")
        check_env
        mkdir -p backups
        backup_database
        ;;
    
    "restore")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Especifica el archivo de backup: $0 restore backup_file.sql${NC}"
            exit 1
        fi
        echo -e "${YELLOW}⚠️  Restaurando backup: $2${NC}"
        docker-compose exec -T postgres psql -U ${POSTGRES_USER:-bingo_user} -d ${POSTGRES_DB:-bingo_production} < "$2"
        echo -e "${GREEN}✅ Backup restaurado.${NC}"
        ;;
    
    "migrate")
        echo -e "${BLUE}📊 Ejecutando migraciones...${NC}"
        docker-compose exec backend npx prisma migrate deploy
        echo -e "${GREEN}✅ Migraciones completadas.${NC}"
        ;;
    
    "health")
        health_check
        ;;
    
    "update")
        echo -e "${BLUE}🔄 Actualizando servicios...${NC}"
        check_env
        backup_database
        docker-compose pull
        docker-compose up -d
        echo -e "${GREEN}✅ Servicios actualizados.${NC}"
        ;;
    
    "scale")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ Especifica el servicio y número: $0 scale backend=3${NC}"
            exit 1
        fi
        echo -e "${BLUE}📈 Escalando servicios: $2${NC}"
        docker-compose up -d --scale $2
        echo -e "${GREEN}✅ Escalado completado.${NC}"
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
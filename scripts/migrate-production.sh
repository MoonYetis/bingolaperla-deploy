#!/bin/bash

# Script para migración de base de datos en producción
# Uso: ./scripts/migrate-production.sh [comando]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
BACKEND_DIR="/opt/bingo-production/backend"
BACKUP_DIR="/opt/bingo-backups/migrations"
POSTGRES_USER="bingo_user"
POSTGRES_DB="bingo_production"

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}🔄 Migration Manager - Bingo La Perla${NC}"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  migrate   - Ejecutar migraciones pendientes"
    echo "  rollback  - Hacer rollback de migraciones"
    echo "  status    - Ver estado de migraciones"
    echo "  backup    - Crear backup antes de migrar"
    echo "  reset     - Reset completo de la BD (PELIGROSO)"
    echo "  seed      - Ejecutar seeders de producción"
    echo "  help      - Mostrar esta ayuda"
    echo ""
}

# Función para verificar entorno
check_environment() {
    echo -e "${BLUE}🔍 Verificando entorno...${NC}"
    
    # Verificar que estamos en el directorio correcto
    if [ ! -d "$BACKEND_DIR" ]; then
        echo -e "${RED}❌ Directorio backend no encontrado: $BACKEND_DIR${NC}"
        exit 1
    fi
    
    # Verificar conexión a PostgreSQL
    if ! docker-compose exec -T postgres pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" &>/dev/null; then
        echo -e "${RED}❌ No se puede conectar a PostgreSQL${NC}"
        echo -e "${YELLOW}💡 Asegúrate de que Docker Compose esté corriendo${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Entorno verificado${NC}"
}

# Función para crear backup pre-migración
create_migration_backup() {
    echo -e "${BLUE}💾 Creando backup pre-migración...${NC}"
    
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/pre-migration-$(date +%Y%m%d_%H%M%S).sql"
    
    # Crear backup
    docker-compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backup creado: $BACKUP_FILE${NC}"
        echo "$BACKUP_FILE" > "$BACKUP_DIR/latest_backup.txt"
    else
        echo -e "${RED}❌ Error creando backup${NC}"
        exit 1
    fi
}

# Función para ver estado de migraciones
show_migration_status() {
    echo -e "${BLUE}📊 Estado de migraciones:${NC}"
    echo ""
    
    cd "$BACKEND_DIR"
    
    # Mostrar migraciones aplicadas
    echo -e "${GREEN}Migraciones aplicadas:${NC}"
    docker-compose exec backend npx prisma migrate status
    
    echo ""
    echo -e "${YELLOW}Información de la base de datos:${NC}"
    docker-compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
        SELECT 
            schemaname,
            tablename,
            tableowner
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename;
    "
}

# Función para ejecutar migraciones
run_migrations() {
    echo -e "${BLUE}🚀 Ejecutando migraciones...${NC}"
    
    cd "$BACKEND_DIR"
    
    # Crear backup antes de migrar
    create_migration_backup
    
    # Ejecutar migraciones
    echo -e "${YELLOW}Aplicando migraciones pendientes...${NC}"
    if docker-compose exec backend npx prisma migrate deploy; then
        echo -e "${GREEN}✅ Migraciones aplicadas exitosamente${NC}"
        
        # Generar cliente Prisma actualizado
        echo -e "${YELLOW}Generando cliente Prisma...${NC}"
        docker-compose exec backend npx prisma generate
        
        # Verificar integridad
        echo -e "${YELLOW}Verificando integridad de la base de datos...${NC}"
        docker-compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
            DO \$\$
            DECLARE
                r RECORD;
            BEGIN
                FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
                LOOP
                    EXECUTE 'SELECT COUNT(*) FROM ' || quote_ident(r.tablename);
                END LOOP;
                RAISE NOTICE 'Verificación de integridad completada';
            END
            \$\$;
        "
        
        echo -e "${GREEN}✅ Migración completada correctamente${NC}"
    else
        echo -e "${RED}❌ Error ejecutando migraciones${NC}"
        
        # Ofrecer rollback automático
        echo -e "${YELLOW}¿Deseas hacer rollback automático? (y/N)${NC}"
        read -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rollback_migrations
        fi
        exit 1
    fi
}

# Función para rollback
rollback_migrations() {
    echo -e "${YELLOW}⚠️  Iniciando rollback de migraciones...${NC}"
    
    # Verificar si existe backup reciente
    if [ ! -f "$BACKUP_DIR/latest_backup.txt" ]; then
        echo -e "${RED}❌ No se encontró backup reciente para rollback${NC}"
        exit 1
    fi
    
    LATEST_BACKUP=$(cat "$BACKUP_DIR/latest_backup.txt")
    
    if [ ! -f "$LATEST_BACKUP" ]; then
        echo -e "${RED}❌ Archivo de backup no encontrado: $LATEST_BACKUP${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Restaurando desde: $LATEST_BACKUP${NC}"
    
    # Crear backup del estado actual antes del rollback
    ROLLBACK_BACKUP="$BACKUP_DIR/pre-rollback-$(date +%Y%m%d_%H%M%S).sql"
    docker-compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "$ROLLBACK_BACKUP"
    
    # Restaurar backup
    docker-compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$LATEST_BACKUP"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Rollback completado${NC}"
        echo -e "${YELLOW}💡 Backup del estado anterior guardado en: $ROLLBACK_BACKUP${NC}"
    else
        echo -e "${RED}❌ Error durante el rollback${NC}"
        exit 1
    fi
}

# Función para reset completo (PELIGROSO)
reset_database() {
    echo -e "${RED}⚠️  ADVERTENCIA: Esto eliminará TODOS los datos${NC}"
    echo -e "${YELLOW}¿Estás completamente seguro? Escribe 'RESET' para continuar:${NC}"
    read confirmation
    
    if [ "$confirmation" != "RESET" ]; then
        echo -e "${YELLOW}❌ Operación cancelada${NC}"
        exit 0
    fi
    
    echo -e "${RED}🗑️  Ejecutando reset completo...${NC}"
    
    cd "$BACKEND_DIR"
    
    # Crear backup final
    FINAL_BACKUP="$BACKUP_DIR/final-backup-before-reset-$(date +%Y%m%d_%H%M%S).sql"
    docker-compose exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "$FINAL_BACKUP"
    
    # Reset Prisma
    docker-compose exec backend npx prisma migrate reset --force
    
    echo -e "${GREEN}✅ Reset completado${NC}"
    echo -e "${YELLOW}💡 Backup final guardado en: $FINAL_BACKUP${NC}"
}

# Función para ejecutar seeders
run_seeders() {
    echo -e "${BLUE}🌱 Ejecutando seeders de producción...${NC}"
    
    cd "$BACKEND_DIR"
    
    # Verificar si existe archivo de seed
    if [ ! -f "prisma/seed.ts" ]; then
        echo -e "${YELLOW}⚠️  No se encontró archivo de seed${NC}"
        return 0
    fi
    
    # Ejecutar seeders
    if docker-compose exec backend npm run prisma:seed; then
        echo -e "${GREEN}✅ Seeders ejecutados correctamente${NC}"
    else
        echo -e "${RED}❌ Error ejecutando seeders${NC}"
        exit 1
    fi
}

# Función para verificar y reparar migraciones
verify_and_repair() {
    echo -e "${BLUE}🔧 Verificando y reparando migraciones...${NC}"
    
    cd "$BACKEND_DIR"
    
    # Verificar estado de Prisma
    echo -e "${YELLOW}Verificando estado de Prisma...${NC}"
    docker-compose exec backend npx prisma migrate status
    
    # Verificar diferencias en esquema
    echo -e "${YELLOW}Verificando diferencias en esquema...${NC}"
    docker-compose exec backend npx prisma db pull
    
    # Generar migración si hay diferencias
    echo -e "${YELLOW}¿Generar migración para diferencias encontradas? (y/N)${NC}"
    read -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose exec backend npx prisma migrate dev --name "auto-repair-$(date +%Y%m%d_%H%M%S)"
    fi
}

# Comando principal
case "$1" in
    "migrate")
        check_environment
        run_migrations
        ;;
    
    "rollback")
        check_environment
        rollback_migrations
        ;;
    
    "status")
        check_environment
        show_migration_status
        ;;
    
    "backup")
        check_environment
        create_migration_backup
        ;;
    
    "reset")
        check_environment
        reset_database
        ;;
    
    "seed")
        check_environment
        run_seeders
        ;;
    
    "verify")
        check_environment
        verify_and_repair
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
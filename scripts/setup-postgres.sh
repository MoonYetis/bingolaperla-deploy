#!/bin/bash

# Script para configurar PostgreSQL en producción
# Uso: ./scripts/setup-postgres.sh [install|config|backup|restore|optimize]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables de configuración
POSTGRES_VERSION="15"
DB_NAME="bingo_production"
DB_USER="bingo_user"
BACKUP_DIR="/opt/bingo-backups/postgres"
CONFIG_DIR="/etc/postgresql/$POSTGRES_VERSION/main"
DATA_DIR="/var/lib/postgresql/$POSTGRES_VERSION/main"

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}🐘 PostgreSQL Setup - Bingo La Perla${NC}"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  install   - Instalar PostgreSQL $POSTGRES_VERSION"
    echo "  config    - Configurar PostgreSQL para producción"
    echo "  create    - Crear base de datos y usuario"
    echo "  backup    - Crear backup de la base de datos"
    echo "  restore   - Restaurar backup (requiere archivo)"
    echo "  optimize  - Optimizar configuración para producción"
    echo "  monitor   - Configurar monitoring de PostgreSQL"
    echo "  help      - Mostrar esta ayuda"
    echo ""
    echo "Variables de entorno requeridas:"
    echo "  POSTGRES_PASSWORD - Password para el usuario de la BD"
    echo ""
}

# Función para verificar requisitos
check_requirements() {
    # Verificar que se ejecuta como root
    if [[ $EUID -ne 0 ]]; then
        echo -e "${RED}❌ Este script debe ejecutarse como root${NC}"
        exit 1
    fi
    
    # Verificar password
    if [[ -z "$POSTGRES_PASSWORD" ]]; then
        echo -e "${RED}❌ Variable POSTGRES_PASSWORD es requerida${NC}"
        echo "Ejemplo: POSTGRES_PASSWORD=mi_password_seguro $0 install"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Requisitos verificados${NC}"
}

# Función para instalar PostgreSQL
install_postgres() {
    echo -e "${BLUE}📦 Instalando PostgreSQL $POSTGRES_VERSION...${NC}"
    
    # Actualizar repositorios
    apt-get update
    
    # Instalar PostgreSQL
    apt-get install -y postgresql-$POSTGRES_VERSION postgresql-contrib-$POSTGRES_VERSION
    
    # Instalar herramientas adicionales
    apt-get install -y postgresql-client-$POSTGRES_VERSION pgbouncer
    
    # Iniciar y habilitar servicio
    systemctl enable postgresql
    systemctl start postgresql
    
    echo -e "${GREEN}✅ PostgreSQL $POSTGRES_VERSION instalado${NC}"
}

# Función para configurar PostgreSQL
configure_postgres() {
    echo -e "${BLUE}⚙️ Configurando PostgreSQL para producción...${NC}"
    
    # Backup de configuración original
    cp "$CONFIG_DIR/postgresql.conf" "$CONFIG_DIR/postgresql.conf.backup"
    cp "$CONFIG_DIR/pg_hba.conf" "$CONFIG_DIR/pg_hba.conf.backup"
    
    # Obtener información del sistema
    TOTAL_RAM=$(free -m | awk 'NR==2{printf "%.0f\n", $2}')
    SHARED_BUFFERS=$((TOTAL_RAM / 4))
    EFFECTIVE_CACHE_SIZE=$((TOTAL_RAM * 3 / 4))
    WORK_MEM=$((TOTAL_RAM / 32))
    MAINTENANCE_WORK_MEM=$((TOTAL_RAM / 16))
    
    # Configurar postgresql.conf
    cat >> "$CONFIG_DIR/postgresql.conf" << EOF

# ==============================================
# CONFIGURACIÓN PARA PRODUCCIÓN - BINGO LA PERLA
# ==============================================

# Conexiones
max_connections = 200
superuser_reserved_connections = 3

# Memoria
shared_buffers = ${SHARED_BUFFERS}MB
effective_cache_size = ${EFFECTIVE_CACHE_SIZE}MB
work_mem = ${WORK_MEM}MB
maintenance_work_mem = ${MAINTENANCE_WORK_MEM}MB

# Checkpoints
checkpoint_segments = 32
checkpoint_completion_target = 0.9
wal_buffers = 16MB

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 10MB

# Performance
random_page_cost = 1.1
effective_io_concurrency = 200
default_statistics_target = 100

# WAL
wal_level = replica
max_wal_senders = 3
archive_mode = on
archive_command = 'test ! -f /opt/bingo-backups/wal/%f && cp %p /opt/bingo-backups/wal/%f'

# Replicación (preparado para el futuro)
hot_standby = on

# SSL
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'

# Autovacuum
autovacuum = on
autovacuum_naptime = 1min
autovacuum_vacuum_threshold = 50
autovacuum_analyze_threshold = 50
autovacuum_vacuum_scale_factor = 0.2
autovacuum_analyze_scale_factor = 0.1
autovacuum_vacuum_cost_delay = 20ms
autovacuum_vacuum_cost_limit = 200

# Background writer
bgwriter_delay = 200ms
bgwriter_lru_maxpages = 100
bgwriter_lru_multiplier = 2.0
EOF

    # Configurar pg_hba.conf para seguridad
    cat > "$CONFIG_DIR/pg_hba.conf" << EOF
# PostgreSQL Client Authentication Configuration File
# ===================================================

# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
local   all             postgres                                peer
local   all             all                                     peer

# IPv4 local connections:
host    all             postgres        127.0.0.1/32            md5
host    $DB_NAME        $DB_USER        127.0.0.1/32            md5
host    $DB_NAME        $DB_USER        172.16.0.0/12           md5  # Docker networks

# IPv6 local connections:
host    all             postgres        ::1/128                 md5
host    $DB_NAME        $DB_USER        ::1/128                 md5

# Deny all other connections
host    all             all             0.0.0.0/0               reject
host    all             all             ::/0                    reject
EOF

    # Crear directorios necesarios
    mkdir -p /opt/bingo-backups/wal
    chown postgres:postgres /opt/bingo-backups/wal
    
    # Configurar logrotate para PostgreSQL
    cat > /etc/logrotate.d/postgresql-bingo << EOF
/var/log/postgresql/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    su postgres postgres
}
EOF

    echo -e "${GREEN}✅ PostgreSQL configurado${NC}"
}

# Función para crear base de datos y usuario
create_database() {
    echo -e "${BLUE}🗄️ Creando base de datos y usuario...${NC}"
    
    # Ejecutar como usuario postgres
    sudo -u postgres psql << EOF
-- Crear usuario
CREATE USER $DB_USER WITH PASSWORD '$POSTGRES_PASSWORD';

-- Crear base de datos
CREATE DATABASE $DB_NAME OWNER $DB_USER;

-- Otorgar privilegios
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Configurar extensiones útiles
\c $DB_NAME
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Configurar permisos en esquemas
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;

-- Configurar permisos por defecto
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;

\q
EOF

    echo -e "${GREEN}✅ Base de datos $DB_NAME creada con usuario $DB_USER${NC}"
}

# Función para optimizar configuración
optimize_postgres() {
    echo -e "${BLUE}🚀 Optimizando PostgreSQL para Bingo La Perla...${NC}"
    
    # Crear índices específicos para el juego de bingo
    sudo -u postgres psql -d $DB_NAME << EOF
-- Índices para optimizar consultas de bingo
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at);
CREATE INDEX IF NOT EXISTS idx_bingo_cards_game_id ON bingo_cards(game_id);
CREATE INDEX IF NOT EXISTS idx_bingo_cards_user_id ON bingo_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_ball_calls_game_id ON ball_calls(game_id);
CREATE INDEX IF NOT EXISTS idx_ball_calls_number ON ball_calls(number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Configurar estadísticas automáticas
ANALYZE;

-- Configurar maintenance
VACUUM ANALYZE;
EOF

    # Configurar tareas de mantenimiento automático
    cat > /etc/cron.d/postgresql-maintenance << EOF
# PostgreSQL maintenance tasks for Bingo La Perla
0 2 * * 0 postgres /usr/bin/vacuumdb -a -z -q
0 3 * * * postgres /usr/bin/reindexdb -a -q
EOF

    echo -e "${GREEN}✅ PostgreSQL optimizado${NC}"
}

# Función para configurar monitoring
setup_monitoring() {
    echo -e "${BLUE}📊 Configurando monitoring de PostgreSQL...${NC}"
    
    # Habilitar pg_stat_statements
    sudo -u postgres psql << EOF
-- Configurar pg_stat_statements
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET pg_stat_statements.max = 10000;
EOF

    # Script para métricas de PostgreSQL
    cat > /opt/bingo-backups/postgres-metrics.sh << 'EOF'
#!/bin/bash
# Script para obtener métricas de PostgreSQL

DB_NAME="bingo_production"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$TIMESTAMP] PostgreSQL Metrics:"
echo "=================================="

# Conexiones activas
ACTIVE_CONNECTIONS=$(sudo -u postgres psql -d $DB_NAME -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';")
echo "Active connections: $ACTIVE_CONNECTIONS"

# Tamaño de la base de datos
DB_SIZE=$(sudo -u postgres psql -d $DB_NAME -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));")
echo "Database size: $DB_SIZE"

# Consultas más lentas
echo "Slowest queries (last reset):"
sudo -u postgres psql -d $DB_NAME -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 5;"

# Cache hit ratio
CACHE_HIT=$(sudo -u postgres psql -d $DB_NAME -t -c "SELECT round(sum(blks_hit)*100/sum(blks_hit+blks_read), 2) FROM pg_stat_database WHERE datname='$DB_NAME';")
echo "Cache hit ratio: $CACHE_HIT%"

echo ""
EOF

    chmod +x /opt/bingo-backups/postgres-metrics.sh
    
    # Configurar logrotate para métricas
    echo "0 */6 * * * root /opt/bingo-backups/postgres-metrics.sh >> /var/log/postgres-metrics.log" >> /etc/crontab
    
    echo -e "${GREEN}✅ Monitoring configurado${NC}"
}

# Función para backup
create_backup() {
    echo -e "${BLUE}💾 Creando backup de PostgreSQL...${NC}"
    
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Crear backup completo
    sudo -u postgres pg_dump -d $DB_NAME -f "$BACKUP_FILE"
    
    # Comprimir backup
    gzip "$BACKUP_FILE"
    
    # Limpiar backups antiguos (mantener 30 días)
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
    
    echo -e "${GREEN}✅ Backup creado: ${BACKUP_FILE}.gz${NC}"
}

# Función para restaurar backup
restore_backup() {
    if [ -z "$1" ]; then
        echo -e "${RED}❌ Especifica el archivo de backup: $0 restore backup_file.sql.gz${NC}"
        exit 1
    fi
    
    BACKUP_FILE="$1"
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}❌ Archivo de backup no encontrado: $BACKUP_FILE${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}⚠️  Restaurando backup: $BACKUP_FILE${NC}"
    
    # Crear backup actual antes de restaurar
    create_backup
    
    # Descomprimir si es necesario
    if [[ "$BACKUP_FILE" == *.gz ]]; then
        gunzip -c "$BACKUP_FILE" | sudo -u postgres psql -d $DB_NAME
    else
        sudo -u postgres psql -d $DB_NAME < "$BACKUP_FILE"
    fi
    
    echo -e "${GREEN}✅ Backup restaurado${NC}"
}

# Reiniciar PostgreSQL
restart_postgres() {
    echo -e "${BLUE}🔄 Reiniciando PostgreSQL...${NC}"
    systemctl restart postgresql
    sleep 5
    
    if systemctl is-active --quiet postgresql; then
        echo -e "${GREEN}✅ PostgreSQL reiniciado correctamente${NC}"
    else
        echo -e "${RED}❌ Error al reiniciar PostgreSQL${NC}"
        exit 1
    fi
}

# Comando principal
case "$1" in
    "install")
        check_requirements
        install_postgres
        configure_postgres
        restart_postgres
        create_database
        optimize_postgres
        setup_monitoring
        echo -e "${GREEN}🎉 PostgreSQL configurado completamente!${NC}"
        ;;
    
    "config")
        check_requirements
        configure_postgres
        restart_postgres
        ;;
    
    "create")
        check_requirements
        create_database
        ;;
    
    "backup")
        create_backup
        ;;
    
    "restore")
        restore_backup "$2"
        ;;
    
    "optimize")
        optimize_postgres
        ;;
    
    "monitor")
        setup_monitoring
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
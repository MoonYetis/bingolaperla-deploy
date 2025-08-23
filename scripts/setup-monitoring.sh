#!/bin/bash

# Script para configurar sistema de monitoreo para Bingo La Perla
# Uso: ./scripts/setup-monitoring.sh [comando]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables de configuración
MONITORING_DIR="/opt/bingo-monitoring"
COMPOSE_FILE="monitoring/docker-compose.monitoring.yml"
GRAFANA_PASSWORD="${GRAFANA_PASSWORD:-admin123}"
ALERT_EMAIL="${ALERT_EMAIL:-admin@bingolaperla.com}"

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}📊 Monitoring Setup - Bingo La Perla${NC}"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  setup     - Configuración completa del monitoreo"
    echo "  start     - Iniciar servicios de monitoreo"
    echo "  stop      - Detener servicios de monitoreo"
    echo "  restart   - Reiniciar servicios de monitoreo"
    echo "  status    - Estado de los servicios"
    echo "  logs      - Ver logs de monitoreo"
    echo "  backup    - Backup de configuraciones y datos"
    echo "  restore   - Restaurar desde backup"
    echo "  update    - Actualizar configuraciones"
    echo "  help      - Mostrar esta ayuda"
    echo ""
    echo "Variables de entorno opcionales:"
    echo "  GRAFANA_PASSWORD - Password para Grafana (default: admin123)"
    echo "  ALERT_EMAIL      - Email para alertas (default: admin@bingolaperla.com)"
    echo ""
    echo "URLs de acceso (después del setup):"
    echo "  📊 Grafana:     http://localhost:3001 (admin/\$GRAFANA_PASSWORD)"
    echo "  🔍 Prometheus: http://localhost:9090"
    echo "  🚨 AlertManager: http://localhost:9093"
    echo "  ⏰ Uptime Kuma: http://localhost:3002"
    echo ""
}

# Función para verificar requisitos
check_requirements() {
    echo -e "${BLUE}🔍 Verificando requisitos...${NC}"
    
    # Verificar Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker no está instalado${NC}"
        exit 1
    fi
    
    # Verificar Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose no está instalado${NC}"
        exit 1
    fi
    
    # Verificar que el archivo compose existe
    if [ ! -f "$COMPOSE_FILE" ]; then
        echo -e "${RED}❌ Archivo de compose no encontrado: $COMPOSE_FILE${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Requisitos verificados${NC}"
}

# Función para setup completo
setup_monitoring() {
    echo -e "${BLUE}🚀 Configurando sistema de monitoreo...${NC}"
    
    # Crear directorio de monitoreo
    mkdir -p "$MONITORING_DIR"
    cd "$MONITORING_DIR"
    
    # Copiar configuraciones
    echo -e "${YELLOW}Copiando configuraciones...${NC}"
    cp -r ../monitoring/* .
    
    # Configurar permisos
    chown -R 1000:1000 ./grafana
    chmod -R 755 ./prometheus
    
    # Generar archivo .env para monitoreo
    cat > .env << EOF
# Variables de entorno para monitoreo
GRAFANA_PASSWORD=$GRAFANA_PASSWORD
POSTGRES_USER=${POSTGRES_USER:-bingo_user}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-change_this_password}
POSTGRES_DB=${POSTGRES_DB:-bingo_production}
REDIS_PASSWORD=${REDIS_PASSWORD:-change_this_password}
ALERT_EMAIL=$ALERT_EMAIL
EOF
    
    # Configurar Prometheus targets dinámicamente
    echo -e "${YELLOW}Configurando targets de Prometheus...${NC}"
    configure_prometheus_targets
    
    # Configurar dashboards de Grafana
    echo -e "${YELLOW}Configurando dashboards de Grafana...${NC}"
    setup_grafana_dashboards
    
    # Configurar alertas personalizadas
    echo -e "${YELLOW}Configurando sistema de alertas...${NC}"
    configure_alerting
    
    echo -e "${GREEN}✅ Configuración de monitoreo completada${NC}"
}

# Función para configurar targets de Prometheus
configure_prometheus_targets() {
    # Detectar servicios disponibles y actualizar prometheus.yml
    if docker network ls | grep -q bingo-network; then
        echo -e "${GREEN}Red bingo-network detectada${NC}"
        
        # Actualizar prometheus.yml con targets reales
        sed -i "s/backend:3001/$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' bingo-backend):3001/g" prometheus/prometheus.yml 2>/dev/null || true
        sed -i "s/frontend:3000/$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' bingo-frontend):3000/g" prometheus/prometheus.yml 2>/dev/null || true
    fi
}

# Función para configurar dashboards de Grafana
setup_grafana_dashboards() {
    mkdir -p grafana/dashboards
    
    # Dashboard principal de Bingo La Perla
    cat > grafana/dashboards/bingo-overview.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "Bingo La Perla - Overview",
    "tags": ["bingo", "overview"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Usuarios Activos",
        "type": "stat",
        "targets": [
          {
            "expr": "active_users_total",
            "legendFormat": "Usuarios Activos"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Juegos en Progreso",
        "type": "stat",
        "targets": [
          {
            "expr": "active_games_total",
            "legendFormat": "Juegos Activos"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
EOF

    # Configurar provisioning de dashboards
    mkdir -p grafana/provisioning/dashboards
    cat > grafana/provisioning/dashboards/dashboard.yml << 'EOF'
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF

    # Configurar datasources
    mkdir -p grafana/provisioning/datasources
    cat > grafana/provisioning/datasources/datasource.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    
  - name: Loki
    type: loki
    access: proxy
    url: http://loki:3100
EOF
}

# Función para configurar alerting
configure_alerting() {
    # Configurar AlertManager con email real si está disponible
    if [[ "$ALERT_EMAIL" != "admin@bingolaperla.com" ]]; then
        sed -i "s/admin@bingolaperla.com/$ALERT_EMAIL/g" alertmanager/alertmanager.yml
    fi
    
    # Configurar notificaciones de Slack si está disponible
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        sed -i "s|https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK|$SLACK_WEBHOOK_URL|g" alertmanager/alertmanager.yml
    fi
}

# Función para iniciar servicios
start_monitoring() {
    echo -e "${BLUE}🚀 Iniciando servicios de monitoreo...${NC}"
    
    cd "$MONITORING_DIR"
    
    # Crear networks si no existen
    docker network create monitoring 2>/dev/null || true
    
    # Iniciar servicios
    docker-compose -f docker-compose.monitoring.yml up -d
    
    # Esperar que los servicios estén listos
    echo -e "${YELLOW}Esperando que los servicios estén listos...${NC}"
    sleep 30
    
    # Verificar estado
    check_services_health
    
    echo -e "${GREEN}✅ Servicios de monitoreo iniciados${NC}"
    show_access_info
}

# Función para detener servicios
stop_monitoring() {
    echo -e "${YELLOW}🛑 Deteniendo servicios de monitoreo...${NC}"
    
    cd "$MONITORING_DIR"
    docker-compose -f docker-compose.monitoring.yml down
    
    echo -e "${GREEN}✅ Servicios detenidos${NC}"
}

# Función para verificar salud de servicios
check_services_health() {
    echo -e "${BLUE}🏥 Verificando salud de servicios...${NC}"
    
    # Prometheus
    if curl -s http://localhost:9090/-/healthy >/dev/null; then
        echo -e "${GREEN}✅ Prometheus: OK${NC}"
    else
        echo -e "${RED}❌ Prometheus: FAILED${NC}"
    fi
    
    # Grafana
    if curl -s http://localhost:3001/api/health >/dev/null; then
        echo -e "${GREEN}✅ Grafana: OK${NC}"
    else
        echo -e "${RED}❌ Grafana: FAILED${NC}"
    fi
    
    # AlertManager
    if curl -s http://localhost:9093/-/healthy >/dev/null; then
        echo -e "${GREEN}✅ AlertManager: OK${NC}"
    else
        echo -e "${RED}❌ AlertManager: FAILED${NC}"
    fi
}

# Función para mostrar información de acceso
show_access_info() {
    echo ""
    echo -e "${BLUE}🌐 URLs de acceso:${NC}"
    echo -e "  📊 Grafana:       ${GREEN}http://localhost:3001${NC} (admin/$GRAFANA_PASSWORD)"
    echo -e "  🔍 Prometheus:    ${GREEN}http://localhost:9090${NC}"
    echo -e "  🚨 AlertManager:  ${GREEN}http://localhost:9093${NC}"
    echo -e "  ⏰ Uptime Kuma:   ${GREEN}http://localhost:3002${NC}"
    echo -e "  📈 cAdvisor:      ${GREEN}http://localhost:8080${NC}"
    echo ""
    echo -e "${YELLOW}💡 Para acceso externo, configura tu firewall para permitir estos puertos${NC}"
}

# Función para mostrar estado
show_status() {
    echo -e "${BLUE}📊 Estado del sistema de monitoreo:${NC}"
    echo ""
    
    cd "$MONITORING_DIR"
    docker-compose -f docker-compose.monitoring.yml ps
    
    echo ""
    check_services_health
}

# Función para mostrar logs
show_logs() {
    echo -e "${BLUE}📋 Logs del sistema de monitoreo...${NC}"
    echo -e "${YELLOW}Presiona Ctrl+C para salir${NC}"
    echo ""
    
    cd "$MONITORING_DIR"
    docker-compose -f docker-compose.monitoring.yml logs -f
}

# Función para backup
create_backup() {
    echo -e "${BLUE}💾 Creando backup del sistema de monitoreo...${NC}"
    
    BACKUP_DIR="/opt/bingo-backups/monitoring"
    BACKUP_FILE="$BACKUP_DIR/monitoring-backup-$(date +%Y%m%d_%H%M%S).tar.gz"
    
    mkdir -p "$BACKUP_DIR"
    
    # Crear backup
    tar -czf "$BACKUP_FILE" -C "$MONITORING_DIR" \
        grafana/provisioning \
        prometheus \
        alertmanager \
        .env
    
    echo -e "${GREEN}✅ Backup creado: $BACKUP_FILE${NC}"
}

# Función para restaurar backup
restore_backup() {
    if [ -z "$1" ]; then
        echo -e "${RED}❌ Especifica el archivo de backup: $0 restore backup_file.tar.gz${NC}"
        exit 1
    fi
    
    BACKUP_FILE="$1"
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}❌ Archivo de backup no encontrado: $BACKUP_FILE${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}⚠️  Restaurando backup: $BACKUP_FILE${NC}"
    
    # Detener servicios
    stop_monitoring
    
    # Restaurar configuraciones
    tar -xzf "$BACKUP_FILE" -C "$MONITORING_DIR"
    
    # Reiniciar servicios
    start_monitoring
    
    echo -e "${GREEN}✅ Backup restaurado${NC}"
}

# Comando principal
case "$1" in
    "setup")
        check_requirements
        setup_monitoring
        start_monitoring
        ;;
    
    "start")
        check_requirements
        start_monitoring
        ;;
    
    "stop")
        stop_monitoring
        ;;
    
    "restart")
        stop_monitoring
        sleep 5
        start_monitoring
        ;;
    
    "status")
        show_status
        ;;
    
    "logs")
        show_logs
        ;;
    
    "backup")
        create_backup
        ;;
    
    "restore")
        restore_backup "$2"
        ;;
    
    "update")
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
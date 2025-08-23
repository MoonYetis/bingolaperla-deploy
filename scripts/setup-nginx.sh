#!/bin/bash

# Script para configurar Nginx para Bingo La Perla
# Uso: ./scripts/setup-nginx.sh [install|config|ssl|reload|test]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables de configuración
NGINX_CONF_DIR="/etc/nginx"
SITES_AVAILABLE="$NGINX_CONF_DIR/sites-available"
SITES_ENABLED="$NGINX_CONF_DIR/sites-enabled"
SSL_DIR="/etc/letsencrypt/live"
CACHE_DIR="/var/cache/nginx"
LOG_DIR="/var/log/nginx"

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}🌐 Nginx Setup - Bingo La Perla${NC}"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  install   - Instalar y configurar Nginx"
    echo "  config    - Configurar sitio para dominio"
    echo "  ssl       - Configurar SSL con Let's Encrypt"
    echo "  reload    - Recargar configuración"
    echo "  test      - Probar configuración"
    echo "  status    - Mostrar estado de Nginx"
    echo "  logs      - Mostrar logs en tiempo real"
    echo "  optimize  - Optimizar configuración"
    echo "  help      - Mostrar esta ayuda"
    echo ""
    echo "Variables de entorno requeridas para config:"
    echo "  DOMAIN    - Dominio del sitio (ej: bingolaperla.com)"
    echo "  EMAIL     - Email para certificados SSL"
    echo ""
}

# Función para verificar requisitos
check_requirements() {
    # Verificar que se ejecuta como root
    if [[ $EUID -ne 0 ]]; then
        echo -e "${RED}❌ Este script debe ejecutarse como root${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Requisitos verificados${NC}"
}

# Función para instalar Nginx
install_nginx() {
    echo -e "${BLUE}📦 Instalando Nginx...${NC}"
    
    # Actualizar repositorios
    apt-get update
    
    # Instalar Nginx
    apt-get install -y nginx
    
    # Instalar certbot para SSL
    apt-get install -y certbot python3-certbot-nginx
    
    # Crear directorios necesarios
    mkdir -p "$CACHE_DIR/bingo"
    mkdir -p "/var/www/html"
    chown -R www-data:www-data "$CACHE_DIR"
    chown -R www-data:www-data "/var/www/html"
    
    # Habilitar y iniciar Nginx
    systemctl enable nginx
    systemctl start nginx
    
    echo -e "${GREEN}✅ Nginx instalado${NC}"
}

# Función para configurar el sitio
configure_site() {
    echo -e "${BLUE}⚙️ Configurando sitio para $DOMAIN...${NC}"
    
    if [[ -z "$DOMAIN" ]]; then
        echo -e "${RED}❌ Variable DOMAIN es requerida${NC}"
        echo "Ejemplo: DOMAIN=bingolaperla.com $0 config"
        exit 1
    fi
    
    # Copiar configuración principal de Nginx
    echo -e "${YELLOW}Configurando nginx.conf principal...${NC}"
    cp "nginx/nginx.conf" "$NGINX_CONF_DIR/nginx.conf"
    
    # Configurar sitio específico
    echo -e "${YELLOW}Configurando sitio para $DOMAIN...${NC}"
    cp "nginx/sites-available/bingo-la-perla.conf" "$SITES_AVAILABLE/bingo-la-perla"
    
    # Reemplazar placeholder del dominio
    sed -i "s/DOMAIN_PLACEHOLDER/$DOMAIN/g" "$SITES_AVAILABLE/bingo-la-perla"
    
    # Habilitar sitio
    ln -sf "$SITES_AVAILABLE/bingo-la-perla" "$SITES_ENABLED/"
    
    # Deshabilitar sitio por defecto
    rm -f "$SITES_ENABLED/default"
    
    # Crear página de mantenimiento básica
    cat > /var/www/html/50x.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Bingo La Perla - Mantenimiento</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { color: #e74c3c; }
        p { color: #666; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎲 Bingo La Perla</h1>
        <h2>Temporalmente en Mantenimiento</h2>
        <p>Estamos trabajando para mejorar tu experiencia de juego.</p>
        <p>Vuelve en unos minutos. ¡Gracias por tu paciencia!</p>
    </div>
</body>
</html>
EOF
    
    # Probar configuración
    if nginx -t; then
        echo -e "${GREEN}✅ Configuración de Nginx válida${NC}"
    else
        echo -e "${RED}❌ Error en configuración de Nginx${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Sitio configurado para $DOMAIN${NC}"
}

# Función para configurar SSL
setup_ssl() {
    echo -e "${BLUE}🔒 Configurando SSL para $DOMAIN...${NC}"
    
    if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
        echo -e "${RED}❌ Variables DOMAIN y EMAIL son requeridas${NC}"
        echo "Ejemplo: DOMAIN=bingolaperla.com EMAIL=admin@bingolaperla.com $0 ssl"
        exit 1
    fi
    
    # Detener nginx temporalmente
    systemctl stop nginx
    
    # Obtener certificado SSL
    echo -e "${YELLOW}Obteniendo certificado SSL...${NC}"
    if certbot certonly \
        --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --domains "$DOMAIN,www.$DOMAIN"; then
        
        echo -e "${GREEN}✅ Certificado SSL obtenido${NC}"
    else
        echo -e "${RED}❌ Error obteniendo certificado SSL${NC}"
        systemctl start nginx
        exit 1
    fi
    
    # Reiniciar nginx
    systemctl start nginx
    
    # Configurar renovación automática
    echo -e "${YELLOW}Configurando renovación automática...${NC}"
    echo "0 3 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'" | crontab -
    
    # Probar renovación
    certbot renew --dry-run
    
    echo -e "${GREEN}✅ SSL configurado y renovación automática activada${NC}"
}

# Función para optimizar Nginx
optimize_nginx() {
    echo -e "${BLUE}🚀 Optimizando configuración de Nginx...${NC}"
    
    # Crear configuración optimizada para logs
    cat > "$NGINX_CONF_DIR/conf.d/log-optimization.conf" << EOF
# Optimización de logs para Bingo La Perla
log_format json_combined escape=json '{'
    '"time_local":"\$time_local",'
    '"remote_addr":"\$remote_addr",'
    '"request":"\$request",'
    '"status":\$status,'
    '"body_bytes_sent":\$body_bytes_sent,'
    '"request_time":\$request_time,'
    '"upstream_response_time":"\$upstream_response_time",'
    '"upstream_connect_time":"\$upstream_connect_time",'
    '"upstream_header_time":"\$upstream_header_time",'
    '"http_referer":"\$http_referer",'
    '"http_user_agent":"\$http_user_agent"'
'}';

# Buffer para logs
access_log /var/log/nginx/access_json.log json_combined buffer=64k;
EOF

    # Configurar logrotate para logs de Nginx
    cat > /etc/logrotate.d/nginx-bingo << EOF
/var/log/nginx/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    sharedscripts
    postrotate
        if [ -f /var/run/nginx.pid ]; then
            kill -USR1 \$(cat /var/run/nginx.pid)
        fi
    endscript
}
EOF

    # Configurar monitoreo básico
    cat > /opt/nginx-monitor.sh << 'EOF'
#!/bin/bash
# Monitor básico para Nginx

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$TIMESTAMP] Nginx Status Check"

# Verificar si Nginx está corriendo
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
    
    # Estadísticas de conexiones
    ACTIVE_CONNECTIONS=$(curl -s http://localhost/nginx_status | grep "Active connections" | awk '{print $3}')
    echo "Active connections: $ACTIVE_CONNECTIONS"
    
    # Verificar logs por errores recientes
    ERROR_COUNT=$(tail -100 /var/log/nginx/error.log | grep "$(date '+%Y/%m/%d')" | wc -l)
    if [ "$ERROR_COUNT" -gt 10 ]; then
        echo "⚠️  High error count in logs: $ERROR_COUNT"
    fi
else
    echo "❌ Nginx is not running"
    systemctl start nginx
fi
EOF

    chmod +x /opt/nginx-monitor.sh
    
    # Configurar cron para monitoreo
    echo "*/5 * * * * root /opt/nginx-monitor.sh >> /var/log/nginx-monitor.log" >> /etc/crontab
    
    echo -e "${GREEN}✅ Nginx optimizado${NC}"
}

# Función para recargar configuración
reload_nginx() {
    echo -e "${BLUE}🔄 Recargando configuración de Nginx...${NC}"
    
    # Probar configuración antes de recargar
    if nginx -t; then
        systemctl reload nginx
        echo -e "${GREEN}✅ Configuración recargada${NC}"
    else
        echo -e "${RED}❌ Error en configuración, no se puede recargar${NC}"
        exit 1
    fi
}

# Función para probar configuración
test_nginx() {
    echo -e "${BLUE}🧪 Probando configuración de Nginx...${NC}"
    
    # Probar sintaxis
    if nginx -t; then
        echo -e "${GREEN}✅ Sintaxis correcta${NC}"
    else
        echo -e "${RED}❌ Error de sintaxis${NC}"
        return 1
    fi
    
    # Probar conectividad básica
    if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✅ Nginx responde correctamente${NC}"
    else
        echo -e "${RED}❌ Nginx no responde${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✅ Todas las pruebas pasaron${NC}"
}

# Función para mostrar estado
show_status() {
    echo -e "${BLUE}📊 Estado de Nginx:${NC}"
    echo ""
    
    # Estado del servicio
    systemctl status nginx --no-pager
    
    echo ""
    echo -e "${YELLOW}Configuración activa:${NC}"
    nginx -T | grep -E "(server_name|listen|proxy_pass)" | head -20
    
    echo ""
    echo -e "${YELLOW}Procesos activos:${NC}"
    ps aux | grep nginx | grep -v grep
    
    echo ""
    echo -e "${YELLOW}Puertos en uso:${NC}"
    netstat -tlnp | grep nginx
}

# Función para mostrar logs
show_logs() {
    echo -e "${BLUE}📋 Logs de Nginx en tiempo real...${NC}"
    echo -e "${YELLOW}Presiona Ctrl+C para salir${NC}"
    echo ""
    
    tail -f "$LOG_DIR/access.log" "$LOG_DIR/error.log" "$LOG_DIR/bingo-access.log" "$LOG_DIR/bingo-error.log"
}

# Comando principal
case "$1" in
    "install")
        check_requirements
        install_nginx
        ;;
    
    "config")
        check_requirements
        configure_site
        reload_nginx
        ;;
    
    "ssl")
        check_requirements
        setup_ssl
        ;;
    
    "reload")
        reload_nginx
        ;;
    
    "test")
        test_nginx
        ;;
    
    "optimize")
        check_requirements
        optimize_nginx
        reload_nginx
        ;;
    
    "status")
        show_status
        ;;
    
    "logs")
        show_logs
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
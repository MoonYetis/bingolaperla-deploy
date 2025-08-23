#!/bin/bash

# Script para configurar servidor de producción para Bingo La Perla
# Uso: ./scripts/deploy-server.sh [setup|deploy|rollback]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables de configuración
DEPLOY_USER="bingo"
DEPLOY_DIR="/opt/bingo-production"
NGINX_CONF="/etc/nginx/sites-available/bingo-la-perla"
SSL_DIR="/etc/ssl/bingo"
BACKUP_DIR="/opt/bingo-backups"

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}🚀 Bingo La Perla - Production Server Setup${NC}"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  setup     - Configuración inicial del servidor"
    echo "  deploy    - Deploy de nueva versión"
    echo "  rollback  - Rollback a versión anterior"
    echo "  ssl       - Configurar SSL/HTTPS"
    echo "  monitor   - Configurar monitoring"
    echo "  backup    - Crear backup completo"
    echo "  restore   - Restaurar desde backup"
    echo "  help      - Mostrar esta ayuda"
    echo ""
    echo "Variables de entorno requeridas:"
    echo "  DOMAIN        - Dominio del sitio (ej: bingolaperla.com)"
    echo "  EMAIL         - Email para certificados SSL"
    echo "  DB_PASSWORD   - Password de PostgreSQL"
    echo ""
}

# Función para verificar requisitos
check_requirements() {
    echo -e "${BLUE}🔍 Verificando requisitos del sistema...${NC}"
    
    # Verificar que se ejecuta como root
    if [[ $EUID -ne 0 ]]; then
        echo -e "${RED}❌ Este script debe ejecutarse como root${NC}"
        exit 1
    fi
    
    # Verificar variables de entorno
    if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
        echo -e "${RED}❌ Variables DOMAIN y EMAIL son requeridas${NC}"
        echo "Ejemplo: DOMAIN=bingolaperla.com EMAIL=admin@bingolaperla.com $0 setup"
        exit 1
    fi
    
    # Verificar sistema operativo
    if ! command -v apt-get &> /dev/null; then
        echo -e "${RED}❌ Este script está diseñado para sistemas Ubuntu/Debian${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Requisitos verificados${NC}"
}

# Función para configuración inicial del servidor
setup_server() {
    echo -e "${BLUE}🔧 Configurando servidor para producción...${NC}"
    
    # Actualizar sistema
    echo -e "${YELLOW}📦 Actualizando sistema...${NC}"
    apt-get update && apt-get upgrade -y
    
    # Instalar dependencias básicas
    echo -e "${YELLOW}📦 Instalando dependencias...${NC}"
    apt-get install -y \
        curl \
        wget \
        unzip \
        git \
        nginx \
        certbot \
        python3-certbot-nginx \
        ufw \
        fail2ban \
        htop \
        tree \
        jq
    
    # Instalar Docker
    echo -e "${YELLOW}🐳 Instalando Docker...${NC}"
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
        
        # Instalar Docker Compose
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    # Crear usuario de deployment
    echo -e "${YELLOW}👤 Configurando usuario de deployment...${NC}"
    if ! id "$DEPLOY_USER" &>/dev/null; then
        useradd -m -s /bin/bash "$DEPLOY_USER"
        usermod -aG docker "$DEPLOY_USER"
    fi
    
    # Crear directorios
    echo -e "${YELLOW}📁 Creando estructura de directorios...${NC}"
    mkdir -p "$DEPLOY_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$SSL_DIR"
    chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"
    chown -R "$DEPLOY_USER:$DEPLOY_USER" "$BACKUP_DIR"
    
    # Configurar firewall
    echo -e "${YELLOW}🔥 Configurando firewall...${NC}"
    ufw --force enable
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Configurar fail2ban
    echo -e "${YELLOW}🔒 Configurando fail2ban...${NC}"
    systemctl enable fail2ban
    systemctl start fail2ban
    
    # Configurar SSH (opcional, mejorar seguridad)
    echo -e "${YELLOW}🔑 Mejorando configuración SSH...${NC}"
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    systemctl restart ssh
    
    echo -e "${GREEN}✅ Configuración inicial completada${NC}"
}

# Función para configurar Nginx
setup_nginx() {
    echo -e "${BLUE}🌐 Configurando Nginx...${NC}"
    
    cat > "$NGINX_CONF" << EOF
upstream backend {
    server localhost:3001;
    # Para load balancing, agregar más servidores:
    # server localhost:3002;
    # server localhost:3003;
}

server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration
    ssl_certificate $SSL_DIR/fullchain.pem;
    ssl_certificate_key $SSL_DIR/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' wss: ws:;";
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate no_last_modified no_etag auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
    
    # Frontend (React app)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Fallback para React Router
        try_files \$uri \$uri/ /index.html;
    }
    
    # API Backend
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts para WebSocket
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
    
    # WebSocket para Socket.IO
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket timeouts
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }
    
    # Static files caching
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://backend/health;
        access_log off;
    }
    
    # Block access to hidden files
    location ~ /\\. {
        deny all;
    }
}
EOF
    
    # Habilitar sitio
    ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test configuración
    nginx -t
    
    echo -e "${GREEN}✅ Nginx configurado${NC}"
}

# Función para configurar SSL
setup_ssl() {
    echo -e "${BLUE}🔒 Configurando SSL con Let's Encrypt...${NC}"
    
    # Detener nginx temporalmente
    systemctl stop nginx
    
    # Obtener certificado
    certbot certonly --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN" \
        -d "www.$DOMAIN"
    
    # Copiar certificados a directorio personalizado
    cp /etc/letsencrypt/live/"$DOMAIN"/fullchain.pem "$SSL_DIR/"
    cp /etc/letsencrypt/live/"$DOMAIN"/privkey.pem "$SSL_DIR/"
    chown -R www-data:www-data "$SSL_DIR"
    
    # Configurar renovación automática
    echo "0 3 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'" | crontab -
    
    # Reiniciar nginx
    systemctl start nginx
    systemctl reload nginx
    
    echo -e "${GREEN}✅ SSL configurado correctamente${NC}"
}

# Función para deploy
deploy_application() {
    echo -e "${BLUE}🚀 Desplegando aplicación...${NC}"
    
    # Cambiar a usuario de deployment
    sudo -u "$DEPLOY_USER" bash << EOF
        cd "$DEPLOY_DIR"
        
        # Crear backup antes del deploy
        if [ -f docker-compose.yml ]; then
            echo "📦 Creando backup pre-deploy..."
            docker-compose exec -T postgres pg_dump -U \$POSTGRES_USER -d \$POSTGRES_DB > "$BACKUP_DIR/pre-deploy-\$(date +%Y%m%d_%H%M%S).sql" || true
        fi
        
        # Pull de nuevas imágenes
        echo "📥 Descargando nuevas imágenes..."
        docker-compose pull
        
        # Deploy con zero-downtime
        echo "🔄 Actualizando servicios..."
        docker-compose up -d --remove-orphans
        
        # Ejecutar migraciones
        echo "📊 Ejecutando migraciones..."
        sleep 15  # Esperar que la DB esté lista
        docker-compose exec -T backend npx prisma migrate deploy || true
        
        # Health check
        echo "🏥 Verificando salud de los servicios..."
        sleep 30
        if curl -f http://localhost:3001/health; then
            echo "✅ Deploy exitoso"
        else
            echo "❌ Health check falló"
            exit 1
        fi
EOF
    
    # Restart nginx para aplicar cambios
    systemctl reload nginx
    
    echo -e "${GREEN}✅ Deploy completado${NC}"
}

# Función para monitoring
setup_monitoring() {
    echo -e "${BLUE}📊 Configurando monitoring...${NC}"
    
    # Instalar node_exporter para Prometheus
    if ! command -v node_exporter &> /dev/null; then
        wget https://github.com/prometheus/node_exporter/releases/latest/download/node_exporter-*linux-amd64.tar.gz
        tar xvf node_exporter-*linux-amd64.tar.gz
        cp node_exporter-*/node_exporter /usr/local/bin/
        rm -rf node_exporter-*
        
        # Crear servicio systemd
        cat > /etc/systemd/system/node_exporter.service << EOF
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=nobody
Group=nobody
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF
        
        systemctl daemon-reload
        systemctl enable node_exporter
        systemctl start node_exporter
    fi
    
    # Configurar logrotate
    cat > /etc/logrotate.d/bingo-la-perla << EOF
$DEPLOY_DIR/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $DEPLOY_USER $DEPLOY_USER
    postrotate
        docker-compose -f $DEPLOY_DIR/docker-compose.yml restart backend || true
    endscript
}
EOF
    
    echo -e "${GREEN}✅ Monitoring configurado${NC}"
}

# Función para backup completo
create_backup() {
    echo -e "${BLUE}💾 Creando backup completo...${NC}"
    
    BACKUP_NAME="backup-$(date +%Y%m%d_%H%M%S)"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    mkdir -p "$BACKUP_PATH"
    
    # Backup de base de datos
    sudo -u "$DEPLOY_USER" docker-compose -f "$DEPLOY_DIR/docker-compose.yml" exec -T postgres \
        pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "$BACKUP_PATH/database.sql"
    
    # Backup de configuración
    cp -r "$DEPLOY_DIR" "$BACKUP_PATH/app"
    cp "$NGINX_CONF" "$BACKUP_PATH/nginx.conf"
    
    # Backup de certificados SSL
    cp -r "$SSL_DIR" "$BACKUP_PATH/ssl"
    
    # Crear archivo comprimido
    tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$BACKUP_DIR" "$BACKUP_NAME"
    rm -rf "$BACKUP_PATH"
    
    echo -e "${GREEN}✅ Backup creado: $BACKUP_DIR/$BACKUP_NAME.tar.gz${NC}"
}

# Función para rollback
rollback_deployment() {
    echo -e "${YELLOW}🔄 Iniciando rollback...${NC}"
    
    if [ -z "$1" ]; then
        echo -e "${RED}❌ Especifica el archivo de backup: $0 rollback backup_file.tar.gz${NC}"
        exit 1
    fi
    
    BACKUP_FILE="$1"
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}❌ Archivo de backup no encontrado: $BACKUP_FILE${NC}"
        exit 1
    fi
    
    # Crear backup del estado actual antes del rollback
    create_backup
    
    # Extraer backup
    RESTORE_DIR="/tmp/restore-$(date +%s)"
    mkdir -p "$RESTORE_DIR"
    tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"
    
    # Detener servicios
    sudo -u "$DEPLOY_USER" docker-compose -f "$DEPLOY_DIR/docker-compose.yml" down
    
    # Restaurar aplicación
    rm -rf "$DEPLOY_DIR"
    cp -r "$RESTORE_DIR"/*app "$DEPLOY_DIR"
    chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"
    
    # Restaurar nginx
    cp "$RESTORE_DIR/nginx.conf" "$NGINX_CONF"
    
    # Restaurar SSL
    cp -r "$RESTORE_DIR/ssl/"* "$SSL_DIR/"
    
    # Restaurar base de datos
    sudo -u "$DEPLOY_USER" bash << EOF
        cd "$DEPLOY_DIR"
        docker-compose up -d postgres
        sleep 30
        docker-compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$RESTORE_DIR/database.sql"
        docker-compose up -d
EOF
    
    # Restart nginx
    systemctl reload nginx
    
    # Cleanup
    rm -rf "$RESTORE_DIR"
    
    echo -e "${GREEN}✅ Rollback completado${NC}"
}

# Comando principal
case "$1" in
    "setup")
        check_requirements
        setup_server
        setup_nginx
        setup_ssl
        setup_monitoring
        echo -e "${GREEN}🎉 Servidor configurado completamente!${NC}"
        echo -e "${YELLOW}💡 Siguiente paso: configurar variables de entorno y hacer deploy${NC}"
        ;;
    
    "deploy")
        deploy_application
        ;;
    
    "ssl")
        setup_ssl
        ;;
    
    "monitor")
        setup_monitoring
        ;;
    
    "backup")
        create_backup
        ;;
    
    "rollback")
        rollback_deployment "$2"
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
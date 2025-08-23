#!/bin/bash

# Script para configurar GitHub Actions y Secrets
# Uso: ./scripts/setup-github-actions.sh

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Configurador de GitHub Actions - Bingo La Perla${NC}"
echo ""

# Verificar si gh CLI está instalado
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) no está instalado.${NC}"
    echo -e "${YELLOW}💡 Instala con: ${NC}"
    echo "  macOS: brew install gh"
    echo "  Ubuntu: curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg"
    echo "         sudo apt-get update && sudo apt-get install gh"
    exit 1
fi

# Verificar autenticación
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}🔑 Necesitas autenticarte con GitHub...${NC}"
    gh auth login
fi

# Función para obtener input del usuario
get_input() {
    local prompt="$1"
    local var_name="$2"
    local default="$3"
    local secret="${4:-false}"
    
    if [ "$secret" = "true" ]; then
        echo -n -e "${YELLOW}$prompt${NC}"
        read -s value
        echo ""
    else
        echo -n -e "${YELLOW}$prompt${NC}"
        if [ -n "$default" ]; then
            echo -n " [$default]: "
        else
            echo -n ": "
        fi
        read value
        if [ -z "$value" ] && [ -n "$default" ]; then
            value="$default"
        fi
    fi
    
    eval "$var_name='$value'"
}

# Función para crear o actualizar secret
set_secret() {
    local name="$1"
    local value="$2"
    local description="$3"
    
    echo -e "  🔐 Configurando secret: ${BLUE}$name${NC}"
    if gh secret set "$name" --body "$value"; then
        echo -e "    ✅ $description"
    else
        echo -e "    ❌ Error configurando $name"
    fi
}

# Obtener información del repositorio
REPO_INFO=$(gh repo view --json owner,name)
REPO_OWNER=$(echo "$REPO_INFO" | jq -r '.owner.login')
REPO_NAME=$(echo "$REPO_INFO" | jq -r '.name')

echo -e "${GREEN}📁 Repositorio detectado: $REPO_OWNER/$REPO_NAME${NC}"
echo ""

# Configuración de producción
echo -e "${BLUE}🏭 Configuración de Producción${NC}"
echo ""

get_input "Dominio de producción (ej: bingolaperla.com)" PRODUCTION_DOMAIN
get_input "Host del servidor de producción (IP o dominio)" PRODUCTION_HOST
get_input "Usuario SSH para producción" PRODUCTION_USER "bingo"
get_input "Email para certificados SSL" SSL_EMAIL
get_input "Llave SSH privada para producción (pega todo el contenido)" PRODUCTION_SSH_KEY "" true

echo ""
echo -e "${BLUE}🧪 Configuración de Staging (opcional)${NC}"
echo ""

get_input "¿Configurar entorno de staging? (y/N)" SETUP_STAGING
if [[ $SETUP_STAGING =~ ^[Yy]$ ]]; then
    get_input "Host del servidor de staging" STAGING_HOST
    get_input "Usuario SSH para staging" STAGING_USER "bingo"
    get_input "Llave SSH privada para staging" STAGING_SSH_KEY "" true
fi

echo ""
echo -e "${BLUE}🔗 URLs de la aplicación${NC}"
echo ""

get_input "URL base del API en producción" VITE_API_BASE_URL "https://api.$PRODUCTION_DOMAIN"
get_input "URL de WebSocket en producción" VITE_SOCKET_URL "https://api.$PRODUCTION_DOMAIN"

echo ""
echo -e "${BLUE}🔐 Configurando GitHub Secrets...${NC}"
echo ""

# Secrets de producción obligatorios
set_secret "PRODUCTION_HOST" "$PRODUCTION_HOST" "Host del servidor de producción"
set_secret "PRODUCTION_USER" "$PRODUCTION_USER" "Usuario SSH de producción"
set_secret "PRODUCTION_SSH_KEY" "$PRODUCTION_SSH_KEY" "Llave SSH para acceso al servidor"

# URLs de la aplicación
set_secret "VITE_API_BASE_URL" "$VITE_API_BASE_URL" "URL base del API"
set_secret "VITE_SOCKET_URL" "$VITE_SOCKET_URL" "URL de WebSocket"

# Secrets de staging (si se configuró)
if [[ $SETUP_STAGING =~ ^[Yy]$ ]]; then
    set_secret "STAGING_HOST" "$STAGING_HOST" "Host del servidor de staging"
    set_secret "STAGING_USER" "$STAGING_USER" "Usuario SSH de staging"
    set_secret "STAGING_SSH_KEY" "$STAGING_SSH_KEY" "Llave SSH para staging"
fi

echo ""
echo -e "${BLUE}🌐 Configurando entornos de GitHub...${NC}"

# Crear entorno de producción
echo -e "  🏭 Configurando entorno de producción..."
if gh api repos/$REPO_OWNER/$REPO_NAME/environments/production -X PUT --input - << EOF > /dev/null 2>&1
{
  "protection_rules": [
    {
      "type": "required_reviewers",
      "reviewers": []
    }
  ],
  "deployment_branch_policy": {
    "protected_branches": true,
    "custom_branch_policies": false
  }
}
EOF
then
    echo -e "    ✅ Entorno de producción configurado"
else
    echo -e "    ⚠️  Entorno de producción ya existe o error en configuración"
fi

# Crear entorno de staging (si se configuró)
if [[ $SETUP_STAGING =~ ^[Yy]$ ]]; then
    echo -e "  🧪 Configurando entorno de staging..."
    if gh api repos/$REPO_OWNER/$REPO_NAME/environments/staging -X PUT --input - << EOF > /dev/null 2>&1
{
  "deployment_branch_policy": {
    "protected_branches": false,
    "custom_branch_policies": true
  }
}
EOF
    then
        echo -e "    ✅ Entorno de staging configurado"
    else
        echo -e "    ⚠️  Entorno de staging ya existe o error en configuración"
    fi
fi

echo ""
echo -e "${BLUE}🔍 Configurando branch protection...${NC}"

# Configurar protección de rama main
echo -e "  🛡️  Configurando protección para rama main..."
if gh api repos/$REPO_OWNER/$REPO_NAME/branches/main/protection -X PUT --input - << EOF > /dev/null 2>&1
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "test-backend",
      "test-frontend", 
      "lint-and-format",
      "security-scan"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
then
    echo -e "    ✅ Protección de rama main configurada"
else
    echo -e "    ⚠️  Error configurando protección de rama o ya existe"
fi

echo ""
echo -e "${BLUE}📋 Generando template de compose para servidor...${NC}"

# Crear template de Docker Compose para el servidor
cat > docker-compose.production.yml.template << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped
    networks:
      - bingo-network

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - bingo-network

  backend:
    image: ${BACKEND_IMAGE}
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      FRONTEND_URL: https://${DOMAIN}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - bingo-network
    ports:
      - "3001:3001"

  frontend:
    image: ${FRONTEND_IMAGE}
    restart: unless-stopped
    networks:
      - bingo-network
    ports:
      - "3000:3000"

volumes:
  postgres_data:
  redis_data:

networks:
  bingo-network:
    driver: bridge
EOF

echo -e "    ✅ Template creado: docker-compose.production.yml.template"

echo ""
echo -e "${BLUE}📝 Creando guía de deployment...${NC}"

cat > DEPLOYMENT_GUIDE.md << EOF
# Guía de Deployment - Bingo La Perla

## 🚀 Configuración Inicial del Servidor

### 1. Preparar el servidor

\`\`\`bash
# En el servidor de producción (como root)
DOMAIN=$PRODUCTION_DOMAIN EMAIL=$SSL_EMAIL ./scripts/deploy-server.sh setup
\`\`\`

### 2. Configurar variables de entorno

\`\`\`bash
# En el servidor, como usuario bingo
cd /opt/bingo-production
cp .env.production .env

# Generar secretos seguros
./scripts/generate-secrets.sh

# Editar .env con tu configuración específica
nano .env
\`\`\`

### 3. Configurar Docker Compose para producción

\`\`\`bash
# Copiar template y configurar
cp docker-compose.production.yml.template docker-compose.yml

# Configurar variables para el template
export DOMAIN=$PRODUCTION_DOMAIN
export BACKEND_IMAGE=ghcr.io/$REPO_OWNER/$REPO_NAME-backend:latest
export FRONTEND_IMAGE=ghcr.io/$REPO_OWNER/$REPO_NAME-frontend:latest
# ... otras variables del .env

# Aplicar variables al template
envsubst < docker-compose.production.yml.template > docker-compose.yml
\`\`\`

## 🔄 Proceso de Deployment

### Automático (GitHub Actions)
- Push a rama \`main\` → Deploy automático a producción
- Push a rama \`develop\` → Deploy automático a staging
- Crear release → Deploy de versión estable

### Manual
\`\`\`bash
# En el servidor
cd /opt/bingo-production
./scripts/docker-prod.sh deploy
\`\`\`

## 🔧 Comandos Útiles

\`\`\`bash
# Ver logs
./scripts/docker-prod.sh logs

# Ver estado
./scripts/docker-prod.sh status

# Crear backup
./scripts/docker-prod.sh backup

# Reiniciar servicios
./scripts/docker-prod.sh restart

# Health check
./scripts/docker-prod.sh health
\`\`\`

## 🆘 Troubleshooting

### Verificar servicios
\`\`\`bash
# Backend
curl https://api.$PRODUCTION_DOMAIN/health

# Frontend
curl https://$PRODUCTION_DOMAIN

# Logs detallados
docker-compose logs -f backend
docker-compose logs -f frontend
\`\`\`

### Rollback
\`\`\`bash
# Listar backups disponibles
ls -la /opt/bingo-backups/

# Hacer rollback
./scripts/deploy-server.sh rollback /opt/bingo-backups/backup-file.tar.gz
\`\`\`
EOF

echo -e "    ✅ Guía creada: DEPLOYMENT_GUIDE.md"

echo ""
echo -e "${GREEN}🎉 Configuración de GitHub Actions completada!${NC}"
echo ""
echo -e "${YELLOW}📋 Próximos pasos:${NC}"
echo "1. 📤 Hacer push de los cambios a tu repositorio"
echo "2. 🏭 Configurar tu servidor de producción usando DEPLOYMENT_GUIDE.md"
echo "3. 🔗 Configurar tu dominio para apuntar al servidor"
echo "4. 🚀 Hacer push a main para trigger el primer deployment"
echo ""
echo -e "${BLUE}📁 Archivos creados:${NC}"
echo "- .github/workflows/ci.yml"
echo "- .github/workflows/release.yml" 
echo "- docker-compose.production.yml.template"
echo "- DEPLOYMENT_GUIDE.md"
echo ""
echo -e "${YELLOW}💡 Recuerda:${NC}"
echo "- Configurar tu servidor antes del primer deploy"
echo "- Verificar que todos los secrets estén configurados"
echo "- Probar en staging antes de producción"
echo "- Hacer backups regulares"
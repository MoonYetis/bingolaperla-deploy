#!/bin/bash

# Script para generar secretos seguros para producción
# Uso: ./scripts/generate-secrets.sh

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔐 Generador de Secretos Seguros - Bingo La Perla${NC}"
echo ""

# Función para generar secreto seguro
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Función para generar password seguro
generate_password() {
    openssl rand -base64 24 | tr -d "=+/"
}

echo -e "${YELLOW}Generando secretos seguros...${NC}"
echo ""

# Generar secretos
JWT_SECRET=$(generate_secret)
JWT_REFRESH_SECRET=$(generate_secret)
POSTGRES_PASSWORD=$(generate_password)
REDIS_PASSWORD=$(generate_password)

echo -e "${GREEN}✅ Secretos generados exitosamente:${NC}"
echo ""

echo "# JWT Secrets"
echo "JWT_SECRET=$JWT_SECRET"
echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
echo ""

echo "# Database Passwords"
echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD"
echo "REDIS_PASSWORD=$REDIS_PASSWORD"
echo ""

echo -e "${YELLOW}💡 Copia estos valores a tu archivo .env de producción${NC}"
echo -e "${YELLOW}💡 NUNCA compartas estos secretos públicamente${NC}"
echo ""

# Opción para escribir directamente a un archivo
read -p "¿Deseas escribir estos secretos a .env.production? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f .env.production ]; then
        # Backup del archivo existente
        cp .env.production .env.production.backup
        echo -e "${YELLOW}⚠️  Backup creado: .env.production.backup${NC}"
    fi
    
    # Actualizar secretos en .env.production
    sed -i.bak \
        -e "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" \
        -e "s/JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET/" \
        -e "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" \
        -e "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" \
        .env.production
    
    rm .env.production.bak
    echo -e "${GREEN}✅ Secretos actualizados en .env.production${NC}"
    echo -e "${YELLOW}💡 Revisa y ajusta otros valores como dominios y URLs${NC}"
else
    echo -e "${YELLOW}❌ No se modificó ningún archivo.${NC}"
fi

echo ""
echo -e "${BLUE}🔒 Recuerda:${NC}"
echo "  • Usa HTTPS en producción"
echo "  • Cambia las URLs por tu dominio real"
echo "  • Configura tu firewall correctamente"
echo "  • Haz backups regulares de la base de datos"
# Deployment Architecture - Bingo La Perla

## 🚀 Deployment Overview

Bingo La Perla utiliza una arquitectura de despliegue moderna basada en contenedores con soporte para múltiples entornos, desde desarrollo local hasta producción escalable con alta disponibilidad.

### Estrategia de Despliegue
- **Containerización**: Docker + Docker Compose
- **Orquestación**: Kubernetes ready
- **CI/CD**: GitHub Actions automatizado
- **Monitoreo**: Prometheus + Grafana + AlertManager
- **Proxy Reverso**: Nginx con SSL termination
- **Base de Datos**: PostgreSQL con replicas de lectura

## 🏗️ Arquitectura de Infraestructura

```mermaid
graph TB
    subgraph "Load Balancer Layer"
        LB[Load Balancer/CDN]
        WAF[Web Application Firewall]
    end
    
    subgraph "Reverse Proxy"
        NGINX[Nginx Proxy]
        SSL[SSL Termination]
    end
    
    subgraph "Application Layer"
        FE1[Frontend Instance 1]
        FE2[Frontend Instance 2]
        BE1[Backend Instance 1]
        BE2[Backend Instance 2]
        BE3[Backend Instance 3]
    end
    
    subgraph "WebSocket Layer"
        WS1[Socket.IO Instance 1]
        WS2[Socket.IO Instance 2]
    end
    
    subgraph "Cache Layer"
        REDIS[Redis Cluster]
        REDIS_REPLICA[Redis Replica]
    end
    
    subgraph "Database Layer"
        DB_MASTER[PostgreSQL Master]
        DB_REPLICA1[PostgreSQL Replica 1]
        DB_REPLICA2[PostgreSQL Replica 2]
    end
    
    subgraph "Monitoring"
        PROMETHEUS[Prometheus]
        GRAFANA[Grafana]
        ALERTMANAGER[AlertManager]
    end
    
    subgraph "Storage"
        MINIO[MinIO S3 Storage]
        BACKUP[Backup Storage]
    end
    
    LB --> NGINX
    WAF --> NGINX
    NGINX --> FE1
    NGINX --> FE2
    NGINX --> BE1
    NGINX --> BE2
    NGINX --> BE3
    
    BE1 --> WS1
    BE2 --> WS2
    
    BE1 --> REDIS
    BE2 --> REDIS
    BE3 --> REDIS_REPLICA
    
    BE1 --> DB_MASTER
    BE2 --> DB_REPLICA1
    BE3 --> DB_REPLICA2
    
    PROMETHEUS --> BE1
    PROMETHEUS --> BE2
    PROMETHEUS --> BE3
    GRAFANA --> PROMETHEUS
    ALERTMANAGER --> PROMETHEUS
    
    BE1 --> MINIO
    DB_MASTER --> BACKUP
```

## 📦 Containerización con Docker

### Frontend Dockerfile
```dockerfile
# Multi-stage build for React frontend
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Backend Dockerfile
```dockerfile
FROM node:18-alpine

# Install dependencies for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --only=production
RUN npx prisma generate

# Copy source code
COPY . .
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S bingo -u 1001
USER bingo

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

EXPOSE 3001
CMD ["node", "dist/server.js"]
```

### Docker Compose para Desarrollo
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=development
    volumes:
      - ./frontend/src:/app/src
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://bingo:password@postgres:5432/bingo_dev
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=dev_secret_change_in_production
    volumes:
      - ./backend/src:/app/src
      - ./backend/prisma:/app/prisma
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=bingo_dev
      - POSTGRES_USER=bingo
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  redis_data:
```

## 🔄 CI/CD con GitHub Actions

### Workflow Principal
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: |
            frontend/package-lock.json
            backend/package-lock.json

      - name: Install dependencies
        run: |
          cd frontend && npm ci
          cd ../backend && npm ci

      - name: Run tests
        run: |
          cd frontend && npm run test:coverage
          cd ../backend && npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to DockerHub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      
      - name: Build and push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: bingolaperla/frontend:${{ github.sha }},bingolaperla/frontend:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Build and push backend
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: bingolaperla/backend:${{ github.sha }},bingolaperla/backend:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Deploy to production
        run: |
          echo "Deploying to production server"
          # Kubernetes deployment or similar
```

### Estrategias de Despliegue
1. **Blue-Green Deployment**: Cero downtime
2. **Rolling Updates**: Actualización gradual
3. **Canary Releases**: Validación progresiva
4. **Feature Flags**: Control granular de características

## ☸️ Kubernetes Configuration

### Namespace y ConfigMap
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: bingo-production

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: bingo-config
  namespace: bingo-production
data:
  NODE_ENV: "production"
  FRONTEND_URL: "https://bingo-la-perla.com"
  REDIS_URL: "redis://redis-service:6379"
  DATABASE_URL: "postgresql://bingo:password@postgres-service:5432/bingo_prod"
```

### Backend Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bingo-backend
  namespace: bingo-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bingo-backend
  template:
    metadata:
      labels:
        app: bingo-backend
    spec:
      containers:
      - name: backend
        image: bingolaperla/backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: bingo-config
              key: NODE_ENV
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: bingo-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: bingo-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10

---
apiVersion: v1
kind: Service
metadata:
  name: bingo-backend-service
  namespace: bingo-production
spec:
  selector:
    app: bingo-backend
  ports:
  - port: 3001
    targetPort: 3001
  type: ClusterIP
```

### Frontend Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bingo-frontend
  namespace: bingo-production
spec:
  replicas: 2
  selector:
    matchLabels:
      app: bingo-frontend
  template:
    metadata:
      labels:
        app: bingo-frontend
    spec:
      containers:
      - name: frontend
        image: bingolaperla/frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"

---
apiVersion: v1
kind: Service
metadata:
  name: bingo-frontend-service
  namespace: bingo-production
spec:
  selector:
    app: bingo-frontend
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
```

### Ingress Configuration
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: bingo-ingress
  namespace: bingo-production
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/websocket-services: "bingo-backend-service"
spec:
  tls:
  - hosts:
    - bingo-la-perla.com
    - www.bingo-la-perla.com
    secretName: bingo-tls
  rules:
  - host: bingo-la-perla.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: bingo-backend-service
            port:
              number: 3001
      - path: /socket.io
        pathType: Prefix
        backend:
          service:
            name: bingo-backend-service
            port:
              number: 3001
      - path: /
        pathType: Prefix
        backend:
          service:
            name: bingo-frontend-service
            port:
              number: 80
```

## 📊 Monitoreo y Observabilidad

### Prometheus Configuration
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/bingo-alerts.yml"

scrape_configs:
  - job_name: 'bingo-backend'
    static_configs:
      - targets: ['bingo-backend-service:3001']
    metrics_path: '/api/performance/metrics'
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### Grafana Dashboards
```json
{
  "dashboard": {
    "title": "Bingo La Perla - System Overview",
    "panels": [
      {
        "title": "Active Games",
        "type": "stat",
        "targets": [
          {
            "expr": "bingo_active_games_total"
          }
        ]
      },
      {
        "title": "Connected Users",
        "type": "graph",
        "targets": [
          {
            "expr": "bingo_connected_users_total"
          }
        ]
      },
      {
        "title": "Transaction Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(bingo_transactions_total[5m])"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(bingo_errors_total[5m])"
          }
        ]
      }
    ]
  }
}
```

### AlertManager Rules
```yaml
groups:
- name: bingo-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(bingo_errors_total[5m]) > 0.1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value }} errors per second"

  - alert: DatabaseDown
    expr: up{job="postgres"} == 0
    for: 0m
    labels:
      severity: critical
    annotations:
      summary: "PostgreSQL database is down"
      description: "Database has been down for more than 1 minute"

  - alert: HighMemoryUsage
    expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage"
      description: "Memory usage is above 90%"
```

## 🛡️ Seguridad en Producción

### SSL/TLS Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name bingo-la-perla.com www.bingo-la-perla.com;

    # SSL certificates
    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    location /api/ {
        proxy_pass http://bingo-backend-service:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://bingo-backend-service:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://bingo-frontend-service:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Caching for static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name bingo-la-perla.com www.bingo-la-perla.com;
    return 301 https://$server_name$request_uri;
}
```

## 💾 Backup y Disaster Recovery

### Estrategia de Backup
```bash
#!/bin/bash
# backup-script.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
S3_BUCKET="bingo-backups"

# Database backup
pg_dump -h postgres-service -U bingo -d bingo_prod > $BACKUP_DIR/database_$DATE.sql
gzip $BACKUP_DIR/database_$DATE.sql

# Redis backup
redis-cli -h redis-service --rdb $BACKUP_DIR/redis_$DATE.rdb

# Upload to S3
aws s3 cp $BACKUP_DIR/database_$DATE.sql.gz s3://$S3_BUCKET/database/
aws s3 cp $BACKUP_DIR/redis_$DATE.rdb s3://$S3_BUCKET/redis/

# Cleanup local files older than 7 days
find $BACKUP_DIR -type f -mtime +7 -delete

# Verify backup integrity
gunzip -t $BACKUP_DIR/database_$DATE.sql.gz && echo "Database backup OK"
```

### Disaster Recovery Plan
1. **RTO (Recovery Time Objective)**: 4 horas
2. **RPO (Recovery Point Objective)**: 1 hora
3. **Backup Frequency**: Cada 6 horas
4. **Cross-Region Replication**: AWS S3 Cross-Region Replication
5. **Failover Process**: Automático con health checks

## 📈 Scaling Strategy

### Horizontal Pod Autoscaler
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: bingo-backend-hpa
  namespace: bingo-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: bingo-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Vertical Pod Autoscaler
```yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: bingo-backend-vpa
  namespace: bingo-production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: bingo-backend
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: backend
      maxAllowed:
        cpu: 1
        memory: 2Gi
      minAllowed:
        cpu: 100m
        memory: 128Mi
```

## 🌍 Multi-Environment Configuration

### Environment Matrix
| Environment | Frontend Replicas | Backend Replicas | Database | Redis | SSL |
|-------------|------------------|------------------|----------|-------|-----|
| Development | 1 | 1 | SQLite | Single | Self-signed |
| Staging | 1 | 2 | PostgreSQL | Single | Let's Encrypt |
| Production | 2 | 3 | PostgreSQL + Replicas | Cluster | Commercial |

### Deployment Pipeline
```
Development → Testing → Staging → Production
     ↓           ↓         ↓          ↓
   Local     Unit Tests  E2E Tests  Blue-Green
   Docker    Integration Load Tests  Deployment
            Security    Performance
            Tests       Tests
```

---

**Deployment Architecture Version**: 1.0.0
**Container Registry**: Docker Hub / AWS ECR
**Orchestration**: Kubernetes 1.28+
**Cloud Provider**: Multi-cloud ready (AWS, GCP, Azure)
**Infrastructure as Code**: Terraform + Helm Charts
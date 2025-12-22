# FreeMonitor 部署架构

## 部署概览

本系统采用容器化部署策略，支持多种部署环境，包括开发、测试和生产环境。

## 部署架构图

```mermaid
graph TB
    subgraph "负载均衡层"
        LB[负载均衡器]
    end
    
    subgraph "应用层"
        APP1[应用实例1]
        APP2[应用实例2]
        APP3[应用实例N]
    end
    
    subgraph "缓存层"
        REDIS[Redis集群]
    end
    
    subgraph "数据库层"
        DB[PostgreSQL主库]
        DB_REPLICA[PostgreSQL从库]
    end
    
    subgraph "存储层"
        S3[对象存储]
    end
    
    LB --> APP1
    LB --> APP2
    LB --> APP3
    
    APP1 --> REDIS
    APP2 --> REDIS
    APP3 --> REDIS
    
    APP1 --> DB
    APP2 --> DB
    APP3 --> DB
    
    DB --> DB_REPLICA
    
    APP1 --> S3
    APP2 --> S3
    APP3 --> S3
```

## 容器化配置

### Dockerfile

```dockerfile
# 多阶段构建
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# 生产镜像
FROM node:20-alpine AS production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

WORKDIR /app
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@postgres:5432/freemonitor
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=freemonitor
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

## Kubernetes部署

### 应用部署配置

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: freemonitor-app
  labels:
    app: freemonitor
spec:
  replicas: 3
  selector:
    matchLabels:
      app: freemonitor
  template:
    metadata:
      labels:
        app: freemonitor
    spec:
      containers:
      - name: freemonitor
        image: freemonitor/app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: freemonitor-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: freemonitor-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: freemonitor-service
spec:
  selector:
    app: freemonitor
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
```

### Ingress配置

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: freemonitor-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - api.freemonitor.com
    secretName: freemonitor-tls
  rules:
  - host: api.freemonitor.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: freemonitor-service
            port:
              number: 80
```

## 环境配置

### 开发环境

```bash
# 启动开发环境
npm run start:dev

# 启动数据库
docker-compose up -d postgres redis

# 运行迁移
npm run migration:run

# 填充种子数据
npm run seed:run
```

### 测试环境

```bash
# 构建测试镜像
docker build -t freemonitor/app:test .

# 部署到测试环境
kubectl apply -f k8s/test/
```

### 生产环境

```bash
# 构建生产镜像
docker build -t freemonitor/app:latest .

# 推送到镜像仓库
docker push freemonitor/app:latest

# 部署到生产环境
kubectl apply -f k8s/prod/
```

## 监控和日志

### 应用监控

- **Prometheus**: 指标收集
- **Grafana**: 可视化仪表板
- **AlertManager**: 告警管理

### 日志管理

- **ELK Stack**: 日志收集、存储、分析
- **Fluentd**: 日志转发
- **Kibana**: 日志查询和可视化

### 健康检查

```typescript
// 健康检查端点
@Controller('health')
export class HealthController {
  constructor(
    private database: DatabaseService,
    private redis: RedisService
  ) {}

  @Get()
  async check() {
    const dbHealth = await this.database.checkHealth();
    const redisHealth = await this.redis.checkHealth();
    
    return {
      status: dbHealth && redisHealth ? 'healthy' : 'unhealthy',
      timestamp: new Date(),
      services: {
        database: dbHealth ? 'up' : 'down',
        redis: redisHealth ? 'up' : 'down'
      }
    };
  }
}
```

## 备份和恢复

### 数据库备份

```bash
# 每日备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups/postgres"
DB_NAME="freemonitor"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
pg_dump $DB_NAME | gzip > $BACKUP_DIR/freemonitor_$DATE.sql.gz

# 清理旧备份（保留30天）
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

### 数据恢复

```bash
# 恢复数据库
gunzip -c /backups/postgres/freemonitor_20231201.sql.gz | psql freemonitor
```

---

*本文档由架构文档生成器自动生成，请勿手动编辑*

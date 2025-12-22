/**
 * 架构文档生成器
 * 
 * 用于生成项目的整体架构文档，包括系统架构、模块关系、数据流等
 * 支持多种架构视图和不同层次的架构描述
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

/**
 * 架构文档类型
 */
export enum ArchitectureDocumentType {
  OVERVIEW = 'overview',
  MODULES = 'modules',
  DATA_FLOW = 'data_flow',
  DEPLOYMENT = 'deployment',
  SECURITY = 'security',
  PERFORMANCE = 'performance'
}

/**
 * 架构文档配置
 */
export interface ArchitectureDocumentConfig {
  /** 项目名称 */
  projectName: string;
  /** 项目描述 */
  projectDescription: string;
  /** 技术栈 */
  techStack: string[];
  /** 架构模式 */
  architecturePattern: string;
  /** 作者 */
  author?: string;
  /** 版本 */
  version?: string;
  /** 输出目录 */
  outputDir: string;
  /** 源代码目录 */
  sourceDir: string;
}

/**
 * 模块信息
 */
export interface ModuleInfo {
  /** 模块名称 */
  name: string;
  /** 模块路径 */
  path: string;
  /** 模块类型 */
  type: 'feature' | 'shared' | 'core' | 'infrastructure';
  /** 模块描述 */
  description?: string;
  /** 依赖模块 */
  dependencies: string[];
  /** 导出模块 */
  exports: string[];
  /** 控制器 */
  controllers: string[];
  /** 服务 */
  services: string[];
}

/**
 * 架构文档生成器类
 */
export class ArchitectureDocumentGenerator {
  private config: ArchitectureDocumentConfig;

  constructor(config: ArchitectureDocumentConfig) {
    this.config = config;
  }

  /**
   * 生成所有架构文档
   */
  async generateAllDocuments(): Promise<void> {
    console.log('开始生成架构文档...');
    
    // 确保输出目录存在
    this.ensureDirectoryExists(this.config.outputDir);
    
    // 生成各种架构文档
    await this.generateOverviewDocument();
    await this.generateModulesDocument();
    await this.generateDataFlowDocument();
    await this.generateDeploymentDocument();
    await this.generateSecurityDocument();
    await this.generatePerformanceDocument();
    
    console.log('架构文档生成完成');
  }

  /**
   * 生成系统概览文档
   */
  private async generateOverviewDocument(): Promise<void> {
    const content = this.generateOverviewContent();
    const outputPath = path.join(this.config.outputDir, 'overview.md');
    
    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`系统概览文档已生成: ${outputPath}`);
  }

  /**
   * 生成系统概览内容
   */
  private generateOverviewContent(): string {
    return `# ${this.config.projectName} 系统架构概览

## 项目简介

${this.config.projectDescription}

## 技术栈

${this.config.techStack.map(tech => `- ${tech}`).join('\n')}

## 架构模式

${this.config.architecturePattern}

## 系统架构图

\`\`\`mermaid
graph TB
    subgraph "前端层"
        WEB[Web应用]
        MOBILE[移动应用]
    end
    
    subgraph "API网关层"
        GATEWAY[API网关]
    end
    
    subgraph "应用层"
        AUTH[认证服务]
        DEVICE[设备服务]
        DASHBOARD[仪表板服务]
        NOTIFICATION[通知服务]
    end
    
    subgraph "数据层"
        POSTGRES[(PostgreSQL)]
        REDIS[(Redis)]
    end
    
    subgraph "基础设施层"
        MONITOR[监控服务]
        LOG[日志服务]
    end
    
    WEB --> GATEWAY
    MOBILE --> GATEWAY
    
    GATEWAY --> AUTH
    GATEWAY --> DEVICE
    GATEWAY --> DASHBOARD
    GATEWAY --> NOTIFICATION
    
    AUTH --> POSTGRES
    DEVICE --> POSTGRES
    DASHBOARD --> POSTGRES
    NOTIFICATION --> POSTGRES
    
    AUTH --> REDIS
    DEVICE --> REDIS
    DASHBOARD --> REDIS
    NOTIFICATION --> REDIS
    
    AUTH --> MONITOR
    DEVICE --> MONITOR
    DASHBOARD --> MONITOR
    NOTIFICATION --> MONITOR
    
    AUTH --> LOG
    DEVICE --> LOG
    DASHBOARD --> LOG
    NOTIFICATION --> LOG
\`\`\`

## 核心组件

### 前端层
- **Web应用**: 基于React的Web管理界面
- **移动应用**: 基于React Native的移动应用

### API网关层
- **API网关**: 统一入口，负责路由、认证、限流等

### 应用层
- **认证服务**: 用户认证、授权、JWT管理
- **设备服务**: 设备注册、管理、数据采集
- **仪表板服务**: 数据可视化、报表生成
- **通知服务**: 消息推送、邮件通知

### 数据层
- **PostgreSQL**: 主数据库，存储业务数据
- **Redis**: 缓存层，提高访问性能

### 基础设施层
- **监控服务**: 系统监控、性能分析
- **日志服务**: 日志收集、分析、查询

## 设计原则

1. **分层架构**: 严格的分层设计，确保职责分离
2. **微服务**: 服务拆分，独立部署、扩展
3. **API优先**: 所有功能通过API提供
4. **数据一致性**: 通过事务和事件保证数据一致性
5. **高可用**: 服务冗余、故障转移
6. **安全性**: 认证、授权、数据加密

---

*本文档由架构文档生成器自动生成，请勿手动编辑*
`;
  }

  /**
   * 生成模块文档
   */
  private async generateModulesDocument(): Promise<void> {
    const content = this.generateModulesContent();
    const outputPath = path.join(this.config.outputDir, 'modules.md');
    
    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`模块文档已生成: ${outputPath}`);
  }

  /**
   * 生成模块内容
   */
  private generateModulesContent(): string {
    const modules = this.analyzeModules();
    
    return `# ${this.config.projectName} 模块架构

## 模块概览

本系统采用模块化设计，各模块职责明确，依赖关系清晰。

## 模块依赖图

\`\`\`mermaid
graph TD
    subgraph "核心模块"
        AUTH[认证模块]
        COMMON[公共模块]
    end
    
    subgraph "业务模块"
        DEVICE[设备模块]
        DASHBOARD[仪表板模块]
        NOTIFICATION[通知模块]
    end
    
    subgraph "基础设施模块"
        WEBSOCKET[WebSocket模块]
        MONITOR[监控模块]
    end
    
    DEVICE --> AUTH
    DEVICE --> COMMON
    DASHBOARD --> AUTH
    DASHBOARD --> COMMON
    NOTIFICATION --> AUTH
    NOTIFICATION --> COMMON
    
    WEBSOCKET --> AUTH
    WEBSOCKET --> COMMON
    
    MONITOR --> COMMON
\`\`\`

## 模块详情

${modules.map(module => this.generateModuleSection(module)).join('\n')}

---

*本文档由架构文档生成器自动生成，请勿手动编辑*
`;
  }

  /**
   * 生成模块章节
   */
  private generateModuleSection(module: ModuleInfo): string {
    return `
### ${module.name} 模块

**类型**: ${this.getModuleTypeLabel(module.type)}  
**路径**: \`${module.path}\`

#### 模块职责
${this.generateModuleResponsibilities(module)}

#### 模块组件
${module.controllers.length > 0 ? `
- **控制器**: ${module.controllers.join(', ')}
` : ''}${module.services.length > 0 ? `
- **服务**: ${module.services.join(', ')}
` : ''}

#### 依赖关系
${module.dependencies.length > 0 ? `
- **依赖模块**: ${module.dependencies.join(', ')}
` : ''}

#### 模块接口
\`\`\`typescript
// TODO: 添加模块接口定义
\`\`\`
`;
  }

  /**
   * 获取模块类型标签
   */
  private getModuleTypeLabel(type: string): string {
    switch (type) {
      case 'feature': return '功能模块';
      case 'shared': return '共享模块';
      case 'core': return '核心模块';
      case 'infrastructure': return '基础设施模块';
      default: return '未知类型';
    }
  }

  /**
   * 生成模块职责
   */
  private generateModuleResponsibilities(module: ModuleInfo): string {
    const responsibilities: { [key: string]: string[] } = {
      'auth': [
        '用户认证和授权',
        'JWT令牌管理',
        '密码加密和验证',
        '角色权限控制'
      ],
      'devices': [
        '设备注册和管理',
        '设备状态监控',
        '设备数据采集',
        '设备告警处理'
      ],
      'dashboard': [
        '仪表板数据聚合',
        '系统状态展示',
        '性能指标统计',
        '可视化图表生成'
      ],
      'notification': [
        '通知消息管理',
        '多渠道消息推送',
        '通知模板管理',
        '消息历史记录'
      ],
      'common': [
        '公共工具函数',
        '通用装饰器',
        '异常过滤器',
        '请求拦截器'
      ],
      'websocket': [
        'WebSocket连接管理',
        '实时消息推送',
        '客户端状态维护',
        '事件广播处理'
      ]
    };
    
    const moduleResponsibilities = responsibilities[module.name] || ['待完善'];
    return moduleResponsibilities.map(r => `- ${r}`).join('\n');
  }

  /**
   * 生成数据流文档
   */
  private async generateDataFlowDocument(): Promise<void> {
    const content = this.generateDataFlowContent();
    const outputPath = path.join(this.config.outputDir, 'data-flow.md');
    
    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`数据流文档已生成: ${outputPath}`);
  }

  /**
   * 生成数据流内容
   */
  private generateDataFlowContent(): string {
    return `# ${this.config.projectName} 数据流架构

## 数据流概览

本系统采用分层的数据流架构，确保数据在各层之间有序流动，同时保证数据的一致性和完整性。

## 核心数据流

### 用户认证流程

\`\`\`mermaid
sequenceDiagram
    participant C as 客户端
    participant A as AuthController
    participant S as AuthService
    participant D as 数据库
    participant R as Redis
    
    C->>A: 登录请求
    A->>S: 验证凭据
    S->>D: 查询用户信息
    D-->>S: 返回用户数据
    S->>S: 验证密码
    S->>R: 存储会话信息
    S-->>A: 返回JWT令牌
    A-->>C: 返回认证结果
\`\`\`

### 设备数据采集流程

\`\`\`mermaid
sequenceDiagram
    participant D as 设备
    participant W as WebSocket网关
    participant S as DeviceService
    participant DB as 数据库
    participant N as 通知服务
    
    D->>W: 发送设备数据
    W->>S: 处理设备数据
    S->>DB: 存储设备数据
    S->>S: 分析数据阈值
    alt 超出阈值
        S->>N: 触发告警
        N->>N: 发送通知
    end
    S-->>W: 返回处理结果
    W-->>D: 确认接收
\`\`\`

### 仪表板数据聚合流程

\`\`\`mermaid
sequenceDiagram
    participant C as 客户端
    participant DC as DashboardController
    participant DS as DashboardService
    participant DV as DeviceService
    participant NS as NotificationService
    participant DB as 数据库
    participant R as Redis缓存
    
    C->>DC: 请求仪表板数据
    DC->>DS: 获取聚合数据
    DS->>R: 检查缓存
    alt 缓存命中
        R-->>DS: 返回缓存数据
    else 缓存未命中
        DS->>DV: 获取设备数据
        DS->>NS: 获取通知数据
        DV->>DB: 查询设备信息
        NS->>DB: 查询通知信息
        DB-->>DV: 返回设备数据
        DB-->>NS: 返回通知数据
        DV-->>DS: 返回设备统计
        NS-->>DS: 返回通知统计
        DS->>R: 更新缓存
    end
    DS-->>DC: 返回聚合数据
    DC-->>C: 返回仪表板数据
\`\`\`

## 数据模型

### 核心实体关系

\`\`\`mermaid
erDiagram
    User ||--o{ Device : owns
    User ||--o{ Alert : receives
    Device ||--o{ Metric : generates
    Device ||--o{ Alert : triggers
    Alert ||--o{ AlertHistory : tracks
    
    User {
        string id PK
        string email
        string password
        string role
        datetime createdAt
        datetime updatedAt
    }
    
    Device {
        string id PK
        string name
        string type
        string status
        string ownerId FK
        datetime lastSeen
        datetime createdAt
        datetime updatedAt
    }
    
    Metric {
        string id PK
        string deviceId FK
        string name
        number value
        string unit
        datetime timestamp
    }
    
    Alert {
        string id PK
        string deviceId FK
        string userId FK
        string type
        string message
        string severity
        boolean acknowledged
        datetime createdAt
        datetime updatedAt
    }
    
    AlertHistory {
        string id PK
        string alertId FK
        string action
        string userId FK
        datetime timestamp
    }
\`\`\`

## 数据访问模式

### Repository模式

系统采用Repository模式封装数据访问逻辑，确保业务逻辑与数据访问解耦：

\`\`\`typescript
// 设备Repository示例
@Injectable()
export class DeviceRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateDeviceDto): Promise<Device> {
    return this.prisma.device.create({ data });
  }

  async findById(id: string): Promise<Device | null> {
    return this.prisma.device.findUnique({ where: { id } });
  }

  async findByOwner(ownerId: string): Promise<Device[]> {
    return this.prisma.device.findMany({ where: { ownerId } });
  }

  async update(id: string, data: UpdateDeviceDto): Promise<Device> {
    return this.prisma.device.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Device> {
    return this.prisma.device.delete({ where: { id } });
  }
}
\`\`\`

### 缓存策略

系统采用多级缓存策略提高数据访问性能：

1. **内存缓存**: 应用级别的热点数据缓存
2. **Redis缓存**: 分布式缓存，支持集群部署
3. **数据库缓存**: 数据库查询结果缓存

\`\`\`typescript
// 缓存服务示例
@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    return this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.cacheManager.store.keys(pattern);
    await Promise.all(keys.map(key => this.cacheManager.del(key)));
  }
}
\`\`\`

## 数据一致性保证

### 事务管理

系统使用数据库事务确保数据一致性：

\`\`\`typescript
// 事务示例
async transferDeviceOwnership(
  deviceId: string,
  fromUserId: string,
  toUserId: string
): Promise<void> {
  await this.prisma.$transaction(async (tx) => {
    // 更新设备所有者
    await tx.device.update({
      where: { id: deviceId },
      data: { ownerId: toUserId }
    });

    // 记录转移历史
    await tx.deviceTransferHistory.create({
      data: {
        deviceId,
        fromUserId,
        toUserId,
        transferredAt: new Date()
      }
    });

    // 更新用户设备计数
    await Promise.all([
      tx.user.update({
        where: { id: fromUserId },
        data: { deviceCount: { decrement: 1 } }
      }),
      tx.user.update({
        where: { id: toUserId },
        data: { deviceCount: { increment: 1 } }
      })
    ]);
  });
}
\`\`\`

### 事件溯源

关键业务操作采用事件溯源模式，确保操作的可追溯性：

\`\`\`typescript
// 事件存储示例
@Injectable()
export class EventStore {
  async saveEvent(event: DomainEvent): Promise<void> {
    await this.prisma.event.create({
      data: {
        id: uuid(),
        type: event.constructor.name,
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        data: JSON.stringify(event),
        version: event.version,
        createdAt: new Date()
      }
    });
  }

  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    const events = await this.prisma.event.findMany({
      where: { aggregateId },
      orderBy: { version: 'asc' }
    });

    return events.map(e => JSON.parse(e.data));
  }
}
\`\`\`

## 数据安全

### 数据加密

- **传输加密**: 所有API通信使用HTTPS/TLS加密
- **存储加密**: 敏感数据在数据库中使用AES-256加密存储
- **密码加密**: 用户密码使用bcrypt进行单向哈希

### 数据脱敏

在日志和监控中，敏感数据会被脱敏处理：

\`\`\`typescript
// 数据脱敏示例
export class DataMasking {
  static maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    const maskedUsername = username.slice(0, 2) + '*'.repeat(username.length - 2);
    return maskedUsername + '@' + domain;
  }

  static maskPhone(phone: string): string {
    return phone.replace(/(\\d{3})\\d{4}(\\d{4})/, '$1****$2');
  }

  static maskApiKey(apiKey: string): string {
    return apiKey.slice(0, 8) + '*'.repeat(apiKey.length - 8);
  }
}
\`\`\`

---

*本文档由架构文档生成器自动生成，请勿手动编辑*
`;
  }

  /**
   * 生成部署文档
   */
  private async generateDeploymentDocument(): Promise<void> {
    const content = this.generateDeploymentContent();
    const outputPath = path.join(this.config.outputDir, 'deployment.md');
    
    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`部署文档已生成: ${outputPath}`);
  }

  /**
   * 生成部署内容
   */
  private generateDeploymentContent(): string {
    return `# ${this.config.projectName} 部署架构

## 部署概览

本系统采用容器化部署策略，支持多种部署环境，包括开发、测试和生产环境。

## 部署架构图

\`\`\`mermaid
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
\`\`\`

## 容器化配置

### Dockerfile

\`\`\`dockerfile
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
\`\`\`

### Docker Compose

\`\`\`yaml
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
\`\`\`

## Kubernetes部署

### 应用部署配置

\`\`\`yaml
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
\`\`\`

### Ingress配置

\`\`\`yaml
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
\`\`\`

## 环境配置

### 开发环境

\`\`\`bash
# 启动开发环境
npm run start:dev

# 启动数据库
docker-compose up -d postgres redis

# 运行迁移
npm run migration:run

# 填充种子数据
npm run seed:run
\`\`\`

### 测试环境

\`\`\`bash
# 构建测试镜像
docker build -t freemonitor/app:test .

# 部署到测试环境
kubectl apply -f k8s/test/
\`\`\`

### 生产环境

\`\`\`bash
# 构建生产镜像
docker build -t freemonitor/app:latest .

# 推送到镜像仓库
docker push freemonitor/app:latest

# 部署到生产环境
kubectl apply -f k8s/prod/
\`\`\`

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

\`\`\`typescript
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
\`\`\`

## 备份和恢复

### 数据库备份

\`\`\`bash
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
\`\`\`

### 数据恢复

\`\`\`bash
# 恢复数据库
gunzip -c /backups/postgres/freemonitor_20231201.sql.gz | psql freemonitor
\`\`\`

---

*本文档由架构文档生成器自动生成，请勿手动编辑*
`;
  }

  /**
   * 生成安全文档
   */
  private async generateSecurityDocument(): Promise<void> {
    const content = this.generateSecurityContent();
    const outputPath = path.join(this.config.outputDir, 'security.md');
    
    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`安全文档已生成: ${outputPath}`);
  }

  /**
   * 生成安全内容
   */
  private generateSecurityContent(): string {
    return `# ${this.config.projectName} 安全架构

## 安全概览

本系统采用多层安全防护策略，从网络层到应用层，全面保护系统和数据安全。

## 安全架构图

\`\`\`mermaid
graph TB
    subgraph "网络安全层"
        WAF[Web应用防火墙]
        LB[负载均衡器]
    end
    
    subgraph "应用安全层"
        AUTH[认证服务]
        AUTHZ[授权服务]
        RATE[限流服务]
        CSRF[CSRF防护]
    end
    
    subgraph "数据安全层"
        ENCRYPT[数据加密]
        MASK[数据脱敏]
        AUDIT[审计日志]
    end
    
    subgraph "基础设施安全层"
        CONT[容器安全]
        NET[网络隔离]
        SEC[密钥管理]
    end
    
    WAF --> LB
    LB --> AUTH
    AUTH --> AUTHZ
    AUTHZ --> RATE
    RATE --> CSRF
    CSRF --> ENCRYPT
    ENCRYPT --> MASK
    MASK --> AUDIT
    AUDIT --> CONT
    CONT --> NET
    NET --> SEC
\`\`\`

## 认证和授权

### JWT认证

\`\`\`typescript
// JWT策略实现
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    
    // 检查用户状态
    if (!user.isActive) {
      throw new UnauthorizedException('用户已被禁用');
    }
    
    return user;
  }
}
\`\`\`

### 基于角色的访问控制

\`\`\`typescript
// 角色守卫实现
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// 角色装饰器
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// 使用示例
@Post()
@Roles(Role.Admin)
@UseGuards(JwtAuthGuard, RolesGuard)
createDevice(@Body() createDeviceDto: CreateDeviceDto) {
  return this.deviceService.create(createDeviceDto);
}
\`\`\`

### 多因素认证

\`\`\`typescript
// 多因素认证服务
@Injectable()
export class MfaService {
  async generateTotpSecret(user: User): Promise<string> {
    const secret = authenticator.generateSecret();
    await this.userService.updateMfaSecret(user.id, secret);
    return secret;
  }

  async generateQrCode(secret: string, email: string): Promise<string> {
    const otpauthUrl = authenticator.keyuri(email, 'FreeMonitor', secret);
    return toDataURL(otpauthUrl);
  }

  async verifyTotpToken(secret: string, token: string): Promise<boolean> {
    return authenticator.verify({ token, secret });
  }

  async enableMfa(userId: string, token: string): Promise<void> {
    const user = await this.userService.findById(userId);
    if (!user.mfaSecret) {
      throw new BadRequestException('MFA未设置');
    }

    const isValid = await this.verifyTotpToken(user.mfaSecret, token);
    if (!isValid) {
      throw new UnauthorizedException('无效的MFA令牌');
    }

    await this.userService.enableMfa(userId);
  }
}
\`\`\`

## 数据保护

### 数据加密

\`\`\`typescript
// 敏感数据加密服务
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;

  constructor(
    @Inject('ENCRYPTION_KEY') private readonly encryptionKey: string
  ) {}

  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
    cipher.setAAD(Buffer.from('freemonitor', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  decrypt(encryptedData: {
    encrypted: string;
    iv: string;
    tag: string;
  }): string {
    const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
    decipher.setAAD(Buffer.from('freemonitor', 'utf8'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
\`\`\`

### 数据脱敏

\`\`\`typescript
// 数据脱敏拦截器
@Injectable()
export class DataMaskingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => this.maskSensitiveData(data))
    );
  }

  private maskSensitiveData(data: any): any {
    if (!data) return data;

    if (Array.isArray(data)) {
      return data.map(item => this.maskSensitiveData(item));
    }

    if (typeof data === 'object') {
      const masked = { ...data };
      
      // 脱敏邮箱
      if (masked.email) {
        masked.email = this.maskEmail(masked.email);
      }
      
      // 脱敏手机号
      if (masked.phone) {
        masked.phone = this.maskPhone(masked.phone);
      }
      
      // 脱敏身份证号
      if (masked.idCard) {
        masked.idCard = this.maskIdCard(masked.idCard);
      }
      
      // 脱敏银行卡号
      if (masked.bankCard) {
        masked.bankCard = this.maskBankCard(masked.bankCard);
      }
      
      return masked;
    }

    return data;
  }

  private maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    const maskedUsername = username.slice(0, 2) + '*'.repeat(username.length - 2);
    return maskedUsername + '@' + domain;
  }

  private maskPhone(phone: string): string {
    return phone.replace(/(\\d{3})\\d{4}(\\d{4})/, '$1****$2');
  }

  private maskIdCard(idCard: string): string {
    return idCard.replace(/(\\d{6})\\d{8}(\\d{4})/, '$1********$2');
  }

  private maskBankCard(bankCard: string): string {
    return bankCard.replace(/(\\d{4})\\d+(\\d{4})/, '$1****$2');
  }
}
\`\`\`

## API安全

### 请求验证

\`\`\`typescript
// 请求验证管道
@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const errorMessages = errors.map(error => {
        const constraints = Object.values(error.constraints || {});
        return constraints.join(', ');
      });
      
      throw new BadRequestException({
        message: '输入验证失败',
        errors: errorMessages
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
\`\`\`

### SQL注入防护

\`\`\`typescript
// 安全查询构建器
@Injectable()
export class SafeQueryBuilder {
  constructor(private prisma: PrismaService) {}

  async findUsers(filters: UserFilters): Promise<User[]> {
    const where: any = {};

    // 安全的字符串过滤
    if (filters.name) {
      where.name = {
        contains: filters.name,
        mode: 'insensitive'
      };
    }

    // 安全的ID过滤
    if (filters.id) {
      where.id = filters.id;
    }

    // 安全的枚举过滤
    if (filters.status) {
      where.status = filters.status;
    }

    // 安全的日期范围过滤
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    return this.prisma.user.findMany({ where });
  }
}
\`\`\`

### XSS防护

\`\`\`typescript
// XSS防护中间件
@Injectable()
export class XssProtectionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 设置XSS防护头
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'self'");

    // 清理请求数据
    if (req.body) {
      req.body = this.sanitizeInput(req.body);
    }

    if (req.query) {
      req.query = this.sanitizeInput(req.query);
    }

    next();
  }

  private sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return this.sanitizeString(input);
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }

    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const key in input) {
        sanitized[key] = this.sanitizeInput(input[key]);
      }
      return sanitized;
    }

    return input;
  }

  private sanitizeString(str: string): string {
    return str
      .replace(/<script\\b[^<]*(?:(?!<\\/script>)<[^<]*)*<\\/script>/gi, '')
      .replace(/<iframe\\b[^<]*(?:(?!<\\/iframe>)<[^<]*)*<\\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\\w+\\s*=/gi, '');
  }
}
\`\`\`

## 网络安全

### HTTPS配置

\`\`\`typescript
// HTTPS服务器配置
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // HTTPS配置
  const httpsOptions = {
    key: fs.readFileSync('./ssl/private-key.pem'),
    cert: fs.readFileSync('./ssl/certificate.pem'),
    ca: fs.readFileSync('./ssl/ca-bundle.pem'),
  };

  await app.listen(3000, '0.0.0.0', httpsOptions);
}
\`\`\`

### CORS配置

\`\`\`typescript
// CORS配置
@Injectable()
export class CorsConfig {
  static getOptions(): CorsOptions {
    return {
      origin: (origin, callback) => {
        const allowedOrigins = [
          'https://app.freemonitor.com',
          'https://admin.freemonitor.com'
        ];

        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('不允许的CORS来源'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 86400, // 24小时
    };
  }
}
\`\`\`

### 限流配置

\`\`\`typescript
// 限流配置
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1分钟
        limit: 100, // 100次请求
      },
      {
        name: 'auth',
        ttl: 60000, // 1分钟
        limit: 5,   // 5次登录尝试
      },
      {
        name: 'password-reset',
        ttl: 900000, // 15分钟
        limit: 3,    // 3次密码重置
      },
    ]),
  ],
})
export class AppModule {}
\`\`\`

## 安全监控

### 安全事件日志

\`\`\`typescript
// 安全事件日志服务
@Injectable()
export class SecurityAuditService {
  constructor(
    @Inject('SECURITY_LOGGER') private readonly logger: Logger
  ) {}

  logAuthEvent(event: AuthEvent): void {
    this.logger.log('auth', {
      type: event.type,
      userId: event.userId,
      ip: event.ip,
      userAgent: event.userAgent,
      timestamp: new Date(),
      success: event.success,
      reason: event.reason,
    });
  }

  logDataAccessEvent(event: DataAccessEvent): void {
    this.logger.log('data_access', {
      type: event.type,
      userId: event.userId,
      resource: event.resource,
      action: event.action,
      ip: event.ip,
      timestamp: new Date(),
    });
  }

  logSecurityViolation(event: SecurityViolationEvent): void {
    this.logger.warn('security_violation', {
      type: event.type,
      userId: event.userId,
      ip: event.ip,
      description: event.description,
      severity: event.severity,
      timestamp: new Date(),
    });
  }
}
\`\`\`

### 异常检测

\`\`\`typescript
// 异常行为检测服务
@Injectable()
export class AnomalyDetectionService {
  constructor(
    private redisService: RedisService,
    private notificationService: NotificationService
  ) {}

  async detectSuspiciousActivity(userId: string, activity: UserActivity): Promise<void> {
    const key = 'user_activity:' + userId;
    const recentActivities = await this.redisService.lrange(key, 0, 9);

    // 检测异常登录位置
    if (activity.type === 'login') {
      const recentLogins = recentActivities
        .filter(a => a.type === 'login')
        .map(a => JSON.parse(a));

      if (this.isUnusualLocation(activity.ip, recentLogins)) {
        await this.notificationService.sendSecurityAlert({
          userId,
          type: 'unusual_location',
          details: activity.ip,
        });
      }
    }

    // 检测异常访问频率
    if (this.isUnusualFrequency(recentActivities)) {
      await this.notificationService.sendSecurityAlert({
        userId,
        type: 'unusual_frequency',
        details: activity,
      });
    }

    // 记录活动
    await this.redisService.lpush(key, JSON.stringify(activity));
    await this.redisService.expire(key, 3600); // 1小时过期
  }

  private isUnusualLocation(currentIp: string, recentLogins: any[]): boolean {
    if (recentLogins.length === 0) return false;

    const recentIps = recentLogins.map(login => login.ip);
    return !recentIps.includes(currentIp);
  }

  private isUnusualFrequency(activities: string[]): boolean {
    return activities.length > 50; // 1小时内超过50次活动
  }
}
\`\`\`

---

*本文档由架构文档生成器自动生成，请勿手动编辑*
`;
  }

  /**
   * 生成性能文档
   */
  private async generatePerformanceDocument(): Promise<void> {
    const content = this.generatePerformanceContent();
    const outputPath = path.join(this.config.outputDir, 'performance.md');
    
    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`性能文档已生成: ${outputPath}`);
  }

  /**
   * 生成性能内容
   */
  private generatePerformanceContent(): string {
    return `# ${this.config.projectName} 性能优化

## 性能概览

本系统采用多层次性能优化策略，从代码层面到架构层面，全面提升系统性能和用户体验。

## 性能优化架构

\`\`\`mermaid
graph TB
    subgraph "前端优化"
        LAZY[懒加载]
        CACHE[缓存策略]
        BUNDLE[代码分割]
    end
    
    subgraph "网络优化"
        CDN[CDN加速]
        COMPRESS[资源压缩]
        HTTP2[HTTP/2]
    end
    
    subgraph "应用优化"
        ASYNC[异步处理]
        POOL[连接池]
        BATCH[批量处理]
    end
    
    subgraph "数据优化"
        INDEX[索引优化]
        PARTITION[数据分区]
        REDIS_CACHE[Redis缓存]
    end
    
    subgraph "基础设施优化"
        CLUSTER[集群部署]
        LB[负载均衡]
        SCALE[自动扩缩容]
    end
    
    LAZY --> CACHE
    CACHE --> BUNDLE
    
    CDN --> COMPRESS
    COMPRESS --> HTTP2
    
    ASYNC --> POOL
    POOL --> BATCH
    
    INDEX --> PARTITION
    PARTITION --> REDIS_CACHE
    
    CLUSTER --> LB
    LB --> SCALE
\`\`\`

## 前端性能优化

### 代码分割和懒加载

\`\`\`typescript
// 路由级别的代码分割
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Devices = lazy(() => import('./pages/Devices'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Router>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
\`\`\`

### 组件级别的懒加载

\`\`\`typescript
// 组件懒加载
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function ParentComponent() {
  const [showHeavy, setShowHeavy] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowHeavy(true)}>
        加载重型组件
      </button>
      
      {showHeavy && (
        <Suspense fallback={<Loading />}>
          <HeavyComponent />
        </Suspense>
      )}
    </div>
  );
}
\`\`\`

### 虚拟滚动

\`\`\`typescript
// 虚拟滚动组件
import { FixedSizeList as List } from 'react-window';

const VirtualizedList = ({ items }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      {items[index].content}
    </div>
  );

  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </List>
  );
};
\`\`\`

## 后端性能优化

### 数据库查询优化

\`\`\`typescript
// 分页查询优化
@Injectable()
export class DeviceService {
  async findDevices(pagination: PaginationDto): Promise<PaginatedResult<Device>> {
    const { page, limit, cursor } = pagination;
    
    // 使用游标分页替代OFFSET
    const devices = await this.prisma.device.findMany({
      take: limit + 1, // 多取一条判断是否有下一页
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: 'asc' },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    const hasMore = devices.length > limit;
    const items = hasMore ? devices.slice(0, -1) : devices;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return {
      items,
      nextCursor,
      hasMore
    };
  }
}
\`\`\`

### 批量处理

\`\`\`typescript
// 批量插入优化
@Injectable()
export class MetricService {
  async saveMetrics(metrics: CreateMetricDto[]): Promise<void> {
    // 使用事务批量插入
    await this.prisma.$transaction(async (tx) => {
      // 分批处理，避免单次事务过大
      const batchSize = 1000;
      for (let i = 0; i < metrics.length; i += batchSize) {
        const batch = metrics.slice(i, i + batchSize);
        await tx.metric.createMany({
          data: batch
        });
      }
    });
  }
}
\`\`\`

### 连接池优化

\`\`\`typescript
// 数据库连接池配置
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['query', 'info', 'warn', 'error'],
  // 连接池配置
  __internal: {
    engine: {
      // 连接池大小
      connectionLimit: 20,
      // 连接超时
      connectTimeout: 10000,
      // 查询超时
      queryTimeout: 30000,
    },
  },
});
\`\`\`

## 缓存策略

### 多级缓存

\`\`\`typescript
// 多级缓存实现
@Injectable()
export class MultiLevelCacheService {
  private memoryCache = new Map<string, { data: any; expiry: number }>();

  constructor(
    @Inject(CACHE_MANAGER) private redisCache: Cache,
    private prisma: PrismaService
  ) {}

  async get<T>(key: string): Promise<T | null> {
    // 1. 检查内存缓存
    const memoryItem = this.memoryCache.get(key);
    if (memoryItem && memoryItem.expiry > Date.now()) {
      return memoryItem.data;
    }

    // 2. 检查Redis缓存
    const redisItem = await this.redisCache.get<T>(key);
    if (redisItem) {
      // 回填内存缓存
      this.memoryCache.set(key, {
        data: redisItem,
        expiry: Date.now() + 5 * 60 * 1000 // 5分钟
      });
      return redisItem;
    }

    // 3. 从数据库获取
    const dbItem = await this.fetchFromDatabase<T>(key);
    if (dbItem) {
      // 设置Redis缓存
      await this.redisCache.set(key, dbItem, 60 * 60); // 1小时
      // 设置内存缓存
      this.memoryCache.set(key, {
        data: dbItem,
        expiry: Date.now() + 5 * 60 * 1000 // 5分钟
      });
    }

    return dbItem;
  }

  private async fetchFromDatabase<T>(key: string): Promise<T | null> {
    // 根据key从数据库获取数据
    // 实现略...
    return null;
  }
}
\`\`\`

### 缓存预热

\`\`\`typescript
// 缓存预热服务
@Injectable()
export class CacheWarmupService {
  constructor(
    private cacheService: MultiLevelCacheService,
    private deviceService: DeviceService,
    private dashboardService: DashboardService
  ) {}

  async warmupCache(): Promise<void> {
    console.log('开始缓存预热...');
    
    // 预热热门设备数据
    const popularDevices = await this.deviceService.findPopularDevices(100);
    await Promise.all(
      popularDevices.map(device => 
        this.cacheService.set(\`device:\${device.id}\`, device)
      )
    );

    // 预热仪表板数据
    const dashboardData = await this.dashboardService.getAggregatedData();
    await this.cacheService.set('dashboard:aggregated', dashboardData);
    
    console.log('缓存预热完成');
  }
}
\`\`\`

## 异步处理

### 消息队列

\`\`\`typescript
// 消息队列配置
@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    BullModule.registerQueue({
      name: 'notification',
    }),
    BullModule.registerQueue({
      name: 'report',
    }),
  ],
})
export class QueueModule {}

// 队列处理器
@Processor('notification')
export class NotificationProcessor {
  constructor(private notificationService: NotificationService) {}

  @Process('send-email')
  async handleSendEmail(job: Job<EmailJob>) {
    const { to, subject, template, data } = job.data;
    
    try {
      await this.notificationService.sendEmail(to, subject, template, data);
    } catch (error) {
      throw new Error(\`发送邮件失败: \${error.message}\`);
    }
  }
}
\`\`\`

### 后台任务

\`\`\`typescript
// 后台任务调度
@Injectable()
export class TaskSchedulerService {
  constructor(
    @InjectQueue('notification') private notificationQueue: Queue,
    @InjectQueue('report') private reportQueue: Queue
  ) {}

  @Cron('0 0 * * *') // 每天午夜执行
  async generateDailyReport() {
    await this.reportQueue.add('generate-daily', {
      reportType: 'daily',
      date: new Date(),
    });
  }

  @Cron('0 8 * * 1') // 每周一早上8点执行
  async sendWeeklySummary() {
    await this.notificationQueue.add('send-weekly-summary', {
      type: 'weekly',
      date: new Date(),
    });
  }
}
\`\`\`

## 监控和性能分析

### 性能指标收集

\`\`\`typescript
// 性能监控中间件
@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      // 记录性能指标
      this.recordMetrics({
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        timestamp: new Date(),
      });
    });
    
    next();
  }

  private recordMetrics(metrics: PerformanceMetrics) {
    // 发送到监控系统
    // 实现略...
  }
}
\`\`\`

### APM集成

\`\`\`typescript
// APM集成
import * as apm from 'elastic-apm-node';

// 初始化APM
apm.start({
  serviceName: 'freemonitor-api',
  secretToken: process.env.ELASTIC_APM_SECRET_TOKEN,
  serverUrl: process.env.ELASTIC_APM_SERVER_URL,
  environment: process.env.NODE_ENV,
});

// 自定义事务追踪
@Injectable()
export class ApmService {
  startTransaction(name: string, type: string) {
    return apm.startTransaction(name, type);
  }

  setCustomContext(context: any) {
    apm.setCustomContext(context);
  }

  captureError(error: Error) {
    apm.captureError(error);
  }
}
\`\`\`

## 性能测试

### 负载测试

\`\`\`typescript
// 负载测试脚本
import { check, sleep } from 'k6';
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // 2分钟内增加到100用户
    { duration: '5m', target: 100 }, // 保持100用户5分钟
    { duration: '2m', target: 200 }, // 2分钟内增加到200用户
    { duration: '5m', target: 200 }, // 保持200用户5分钟
    { duration: '2m', target: 0 },   // 2分钟内减少到0用户
  ],
};

export default function() {
  let response = http.get('https://api.freemonitor.com/devices');
  
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}
\`\`\`

---

*本文档由架构文档生成器自动生成，请勿手动编辑*
`;
  }

  /**
   * 分析项目模块
   */
  private analyzeModules(): ModuleInfo[] {
    // 这里应该实现实际的模块分析逻辑
    // 为了示例，返回模拟数据
    return [
      {
        name: 'auth',
        path: 'src/auth',
        type: 'core',
        description: '认证和授权模块',
        dependencies: ['common'],
        exports: ['AuthModule', 'JwtStrategy', 'RolesGuard'],
        controllers: ['AuthController'],
        services: ['AuthService', 'MfaService']
      },
      {
        name: 'devices',
        path: 'src/devices',
        type: 'feature',
        description: '设备管理模块',
        dependencies: ['auth', 'common'],
        exports: ['DevicesModule'],
        controllers: ['DeviceController'],
        services: ['DeviceService', 'MetricService']
      },
      {
        name: 'dashboard',
        path: 'src/dashboard',
        type: 'feature',
        description: '仪表板模块',
        dependencies: ['auth', 'devices', 'common'],
        exports: ['DashboardModule'],
        controllers: ['DashboardController'],
        services: ['DashboardService']
      },
      {
        name: 'notification',
        path: 'src/notification',
        type: 'feature',
        description: '通知模块',
        dependencies: ['auth', 'common'],
        exports: ['NotificationModule'],
        controllers: ['NotificationController'],
        services: ['NotificationService']
      },
      {
        name: 'common',
        path: 'src/common',
        type: 'shared',
        description: '公共模块',
        dependencies: [],
        exports: ['CommonModule'],
        controllers: [],
        services: ['CacheService', 'EncryptionService']
      },
      {
        name: 'websocket',
        path: 'src/websocket',
        type: 'infrastructure',
        description: 'WebSocket模块',
        dependencies: ['auth', 'common'],
        exports: ['WebSocketModule'],
        controllers: [],
        services: ['WebSocketGateway']
      }
    ];
  }

  /**
   * 确保目录存在
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}

/**
 * 使用示例
 * 
 * ```typescript
 * // 创建架构文档生成器
 * const generator = new ArchitectureDocumentGenerator({
 *   projectName: 'FreeMonitor',
 *   projectDescription: '免费监控系统',
 *   techStack: ['NestJS', 'TypeScript', 'Prisma', 'PostgreSQL', 'Redis'],
 *   architecturePattern: '分层架构',
 *   author: '开发团队',
 *   version: '1.0.0',
 *   outputDir: './docs/architecture',
 *   sourceDir: './src'
 * });
 * 
 * // 生成所有架构文档
 * await generator.generateAllDocuments();
 * ```
 */
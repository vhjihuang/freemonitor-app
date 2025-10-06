#!/bin/bash
# docker/production/deploy.sh

set -e

echo "🚀 开始部署 FreeMonitor 应用..."

# 检查必要工具
echo "🔧 检查必要工具..."
if ! command -v docker &> /dev/null; then
    echo "❌ 未找到 Docker，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ 未找到 docker-compose，请先安装 docker-compose"
    exit 1
fi

echo "✅ Docker 和 docker-compose 已安装"

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️  未找到 .env 文件，将使用默认配置"
    echo "💡 部署前必须执行以下操作："
    echo "   1. 复制 .env.example 并修改配置："
    echo "      cp .env.example .env"
    echo "   2. 修改 .env 文件中的敏感配置："
    echo "      - POSTGRES_PASSWORD: 修改为强密码"
    echo "      - JWT_SECRET: 修改为强随机密钥（至少32字符）"
    echo "      - JWT_REFRESH_SECRET: 修改为强随机密钥（至少32字符）"
    echo "      - CSRF_SECRET: 修改为强随机密钥（至少32字符）"
fi

# 停止现有服务
echo "🛑 停止现有服务..."
docker-compose -f docker-compose.prod.yml down

# 清理未使用的镜像和容器
echo "🧹 清理未使用的资源..."
docker system prune -f

# 构建镜像
echo "🔨 构建 Docker 镜像..."
docker-compose -f docker-compose.prod.yml build

# 启动服务
echo "🚀 启动服务..."
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "📋 检查服务状态..."
docker-compose -f docker-compose.prod.yml ps

# 等待后端服务健康检查通过
echo "🔍 等待后端服务健康检查..."
for i in {1..30}; do
    if docker-compose -f docker-compose.prod.yml exec backend node -e "require('http').get('http://localhost:3001/api/health/live', (res) => {process.exit(res.statusCode === 200 ? 0 : 1)}).on('error', () => process.exit(1))" &> /dev/null; then
        echo "✅ 后端服务健康检查通过"
        break
    fi
    echo "⏳ 等待后端服务健康检查... ($i/30)"
    sleep 2
done

# 等待前端服务健康检查通过
echo "🔍 等待前端服务健康检查..."
for i in {1..30}; do
    if docker-compose -f docker-compose.prod.yml exec frontend wget --no-verbose --tries=1 --spider http://localhost:3000/health &> /dev/null; then
        echo "✅ 前端服务健康检查通过"
        break
    fi
    echo "⏳ 等待前端服务健康检查... ($i/30)"
    sleep 2
done

echo "✅ 部署完成！"
echo "🌐 前端访问地址: http://localhost:3000"
echo "🔧 后端 API 地址: http://localhost:3001"
echo "📊 数据库地址: localhost:5432"
echo "💾 Redis 地址: localhost:6379"

# 显示日志
echo "📝 查看日志:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
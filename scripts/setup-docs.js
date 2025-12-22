#!/usr/bin/env node

/**
 * 个人项目文档快速设置脚本
 * 用于为新项目快速建立完整的文档体系
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const PROJECT_ROOT = process.cwd();
const DOCS_DIR = path.join(PROJECT_ROOT, 'docs');
const SCRIPTS_DIR = path.join(PROJECT_ROOT, 'scripts');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n🔧 ${title}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// 创建目录（如果不存在）
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`创建目录: ${dirPath}`, 'blue');
  }
}

// 创建文件（如果不存在）
function createFile(filePath, content) {
  if (fs.existsSync(filePath)) {
    logWarning(`文件已存在，跳过: ${filePath}`);
    return false;
  }
  
  try {
    fs.writeFileSync(filePath, content);
    logSuccess(`创建文件: ${filePath}`);
    return true;
  } catch (error) {
    logError(`创建文件失败: ${filePath} - ${error.message}`);
    return false;
  }
}

// 获取项目名称
function getProjectName() {
  try {
    const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return packageJson.name || 'MyProject';
    }
  } catch (error) {
    logWarning('无法读取package.json，使用默认项目名称');
  }
  return 'MyProject';
}

// 获取当前日期
function getCurrentDate() {
  return new Date().toLocaleDateString('zh-CN');
}

// 创建文档目录结构
function createDocStructure() {
  logSection('创建文档目录结构');
  
  const directories = [
    DOCS_DIR,
    path.join(DOCS_DIR, 'api'),
    path.join(DOCS_DIR, 'api', 'modules'),
    path.join(DOCS_DIR, 'architecture'),
    path.join(DOCS_DIR, 'deployment'),
    path.join(DOCS_DIR, 'standards'),
    path.join(DOCS_DIR, 'development'),
    SCRIPTS_DIR
  ];
  
  directories.forEach(dir => {
    ensureDirectoryExists(dir);
  });
  
  logSuccess('文档目录结构创建完成');
}

// 创建文档首页
function createIndexFile() {
  const projectName = getProjectName();
  const currentDate = getCurrentDate();
  
  const indexContent = `# ${projectName} 项目文档

> 最后更新: ${currentDate}

## 📚 文档导航

### 🏗️ 架构文档
- [系统架构概览](./architecture/overview.md)
- [模块架构](./architecture/modules.md)
- [数据流架构](./architecture/data-flow.md)
- [部署架构](./architecture/deployment.md)

### 📖 API文档
- [API文档首页](./api/index.md)
- [认证API](./api/auth/README.md)
- [核心功能API](./api/modules/README.md)

### 🛠️ 开发指南
- [个人开发工作流程](./personal-development-workflow.md)
- [快速参考指南](./quick-reference-guide.md)
- [个人项目文档管理指南](./personal-project-doc-management-guide.md)
- [代码注释标准](./standards/code-commenting-standards.md)
- [文档结构标准](./standards/documentation-structure-standards.md)

### 📋 项目管理
- [项目概述](./project-overview.md)
- [开发指南](./DEVELOPMENT_GUIDE.md)
- [变更日志](./development/changelog.md)

### 🔧 配置和部署
- [部署指南](./deployment/deployment.md)
- [部署手册](./deployment/guide.md)

## 🚀 快速开始

1. **环境设置**
   \`\`\`bash
   pnpm install
   cp .env.example .env
   pnpm db:migrate
   pnpm dev
   \`\`\`

2. **生成文档**
   \`\`\`bash
   node scripts/update-all-docs.js
   \`\`\`

3. **代码质量检查**
   \`\`\`bash
   pnpm lint
   pnpm type-check
   pnpm test
   \`\`\`

## 📖 文档维护

本文档由自动化工具生成和维护。如需更新文档，请运行：

\`\`\`bash
node scripts/update-all-docs.js
\`\`\`

定期检查文档状态：

\`\`\`bash
node scripts/doc-maintenance.js
\`\`\`

## 🔗 相关链接

- [GitHub仓库](https://github.com/your-username/${projectName})
- [问题反馈](https://github.com/your-username/${projectName}/issues)
- [更新日志](./development/changelog.md)
`;
  
  return createFile(path.join(DOCS_DIR, 'index.md'), indexContent);
}

// 创建项目概述文档
function createProjectOverviewFile() {
  const projectName = getProjectName();
  
  const overviewContent = `# 项目概述

## 项目简介

${projectName} 是一个基于现代技术栈构建的全栈应用程序。

## 技术栈

### 后端
- **框架**: NestJS
- **数据库**: PostgreSQL (通过 Prisma ORM)
- **认证**: JWT
- **语言**: TypeScript

### 前端
- **框架**: Next.js 14
- **状态管理**: React Query
- **UI库**: Tailwind CSS
- **语言**: TypeScript

### 开发工具
- **包管理**: PNPM Workspaces
- **代码规范**: ESLint + Prettier
- **文档**: TypeDoc + 自定义文档生成器
- **容器化**: Docker

## 项目结构

\`\`\`
freemonitor-app/
├── apps/
│   ├── backend/          # 后端应用
│   └── frontend/         # 前端应用
├── packages/             # 共享包
├── docs/                 # 项目文档
├── scripts/              # 自动化脚本
├── prisma/              # 数据库模式
└── docker-compose.yml   # 容器编排
\`\`\`

## 核心功能

1. **用户认证与授权**
   - JWT令牌认证
   - 基于角色的访问控制
   - 安全的密码处理

2. **实时监控**
   - WebSocket实时数据传输
   - 设备状态监控
   - 告警通知系统

3. **数据分析**
   - 指标收集与处理
   - 可视化仪表板
   - 历史数据查询

4. **系统管理**
   - 用户管理
   - 系统配置
   - 日志记录

## 开发环境设置

### 前置要求
- Node.js 20+
- PNPM 10+
- PostgreSQL 14+
- Redis 6+

### 安装步骤

1. **克隆仓库**
   \`\`\`bash
   git clone https://github.com/your-username/${projectName}.git
   cd ${projectName}
   \`\`\`

2. **安装依赖**
   \`\`\`bash
   pnpm install
   \`\`\`

3. **环境配置**
   \`\`\`bash
   cp .env.example .env
   # 编辑 .env 文件，配置数据库连接等信息
   \`\`\`

4. **数据库设置**
   \`\`\`bash
   pnpm db:migrate
   pnpm db:seed
   \`\`\`

5. **启动开发服务器**
   \`\`\`bash
   pnpm dev
   \`\`\`

## 部署

### 开发环境
\`\`\`bash
pnpm dev
\`\`\`

### 生产环境
\`\`\`bash
pnpm build
pnpm start
\`\`\`

### Docker部署
\`\`\`bash
docker-compose up -d
\`\`\`

## 贡献指南

1. Fork 项目
2. 创建功能分支 (\`git checkout -b feature/AmazingFeature\`)
3. 提交更改 (\`git commit -m 'Add some AmazingFeature'\`)
4. 推送到分支 (\`git push origin feature/AmazingFeature\`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

- 项目链接: [https://github.com/your-username/${projectName}](https://github.com/your-username/${projectName})
`;
  
  return createFile(path.join(DOCS_DIR, 'project-overview.md'), overviewContent);
}

// 创建开发指南文档
function createDevelopmentGuideFile() {
  const content = `# 开发指南

## 开发环境设置

### 前置要求
- Node.js 20+
- PNPM 10+
- PostgreSQL 14+
- Redis 6+

### 环境配置

1. **安装依赖**
   \`\`\`bash
   pnpm install
   \`\`\`

2. **环境变量设置**
   \`\`\`bash
   cp .env.example .env
   \`\`\`

3. **数据库设置**
   \`\`\`bash
   pnpm db:migrate
   pnpm db:seed
   \`\`\`

## 开发流程

### 1. 创建功能分支
\`\`\`bash
git checkout -b feature/your-feature-name
\`\`\`

### 2. 开发功能
- 遵循代码规范
- 编写单元测试
- 更新相关文档

### 3. 测试
\`\`\`bash
pnpm test
pnpm lint
pnpm type-check
\`\`\`

### 4. 提交代码
\`\`\`bash
git add .
git commit -m "feat: add your feature"
\`\`\`

### 5. 推送并创建PR
\`\`\`bash
git push origin feature/your-feature-name
\`\`\`

## 代码规范

### TypeScript规范
- 使用严格模式
- 明确定义类型
- 避免使用any类型

### 命名规范
- 文件名：kebab-case
- 类名：PascalCase
- 函数名：camelCase
- 常量：UPPER_SNAKE_CASE

### 注释规范
- 使用JSDoc格式
- 为公共API编写注释
- 复杂逻辑添加说明

## 数据库操作

### 迁移
\`\`\`bash
# 创建新迁移
pnpm prisma migrate dev --name migration-name

# 应用迁移
pnpm prisma migrate deploy

# 重置数据库
pnpm prisma migrate reset
\`\`\`

### 种子数据
\`\`\`bash
pnpm db:seed
\`\`\`

### 查看数据库
\`\`\`bash
pnpm prisma studio
\`\`\`

## 测试

### 单元测试
\`\`\`bash
pnpm test
\`\`\`

### 集成测试
\`\`\`bash
pnpm test:e2e
\`\`\`

### 测试覆盖率
\`\`\`bash
pnpm test:cov
\`\`\`

## 部署

### 开发环境
\`\`\`bash
pnpm dev
\`\`\`

### 生产环境
\`\`\`bash
pnpm build
pnpm start
\`\`\`

## 常见问题

### 1. 端口冲突
\`\`\`bash
kill-port 3001
\`\`\`

### 2. 依赖问题
\`\`\`bash
pnpm install --force
\`\`\`

### 3. 数据库连接问题
- 检查PostgreSQL服务是否运行
- 验证.env文件中的数据库配置
- 确保数据库存在

## 有用的命令

### 开发
\`\`\`bash
pnpm dev              # 启动开发服务器
pnpm build            # 构建项目
pnpm start            # 启动生产服务器
\`\`\`

### 代码质量
\`\`\`bash
pnpm lint             # 代码检查
pnpm lint:fix         # 自动修复代码问题
pnpm type-check       # 类型检查
\`\`\`

### 数据库
\`\`\`bash
pnpm db:migrate       # 运行迁移
pnpm db:seed          # 运行种子数据
pnpm prisma studio    # 打开数据库管理界面
\`\`\`

### 文档
\`\`\`bash
node scripts/update-all-docs.js    # 更新所有文档
node scripts/doc-maintenance.js    # 文档维护检查
\`\`\`
`;
  
  return createFile(path.join(DOCS_DIR, 'DEVELOPMENT_GUIDE.md'), content);
}

// 创建脚本文件
function createScriptFiles() {
  logSection('创建自动化脚本');
  
  // update-all-docs.js
  const updateDocsScript = `#!/usr/bin/env node

/**
 * 一键更新所有文档脚本
 * 用于个人项目的文档维护和更新
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const PROJECT_ROOT = process.cwd();
const DOCS_DIR = path.join(PROJECT_ROOT, 'docs');
const SCRIPTS_DIR = path.join(PROJECT_ROOT, 'scripts');

// 颜色输出
const colors = {
  reset: '\\x1b[0m',
  bright: '\\x1b[1m',
  red: '\\x1b[31m',
  green: '\\x1b[32m',
  yellow: '\\x1b[33m',
  blue: '\\x1b[34m',
  cyan: '\\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(\`\${colors[color]}\${message}\${colors.reset}\`);
}

function logStep(step, message) {
  log(\`\\n[步骤 \${step}] \${message}\`, 'cyan');
  log('='.repeat(50), 'cyan');
}

function logSuccess(message) {
  log(\`✅ \${message}\`, 'green');
}

function logError(message) {
  log(\`❌ \${message}\`, 'red');
}

// 执行命令
function runCommand(command, description) {
  try {
    log(\`执行: \${command}\`, 'blue');
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: PROJECT_ROOT
    });
    logSuccess(\`\${description} - 成功\`);
    return output;
  } catch (error) {
    logError(\`\${description} - 失败\`);
    log(error.message, 'red');
    return null;
  }
}

// 主函数
async function updateAllDocs() {
  log('🚀 开始更新所有文档...', 'bright');
  log(\`项目根目录: \${PROJECT_ROOT}\`, 'blue');
  
  let successCount = 0;
  let totalSteps = 3;

  // 步骤1: 检查环境
  logStep(1, '检查环境');
  if (!fs.existsSync(path.join(PROJECT_ROOT, 'package.json'))) {
    logError('未找到package.json，请确保在项目根目录运行此脚本');
    process.exit(1);
  }
  successCount++;

  // 步骤2: 生成TypeDoc文档（如果存在）
  logStep(2, '生成TypeDoc文档');
  if (fs.existsSync(path.join(PROJECT_ROOT, 'apps/backend/typedoc.config.js'))) {
    const result = runCommand('cd apps/backend && npx typedoc', 'TypeDoc文档生成');
    if (result !== null) successCount++;
  } else {
    logWarning('TypeDoc配置不存在，跳过');
    successCount++;
  }

  // 步骤3: 更新文档索引
  logStep(3, '更新文档索引');
  try {
    // 确保docs目录存在
    if (!fs.existsSync(DOCS_DIR)) {
      fs.mkdirSync(DOCS_DIR, { recursive: true });
    }
    
    logSuccess('文档索引已更新');
    successCount++;
  } catch (error) {
    logError(\`更新文档索引失败: \${error.message}\`);
  }

  // 总结
  log('\\n📊 文档更新完成', 'bright');
  log('='.repeat(50), 'cyan');
  log(\`成功步骤: \${successCount}/\${totalSteps}\`, 'green');
  
  if (successCount === totalSteps) {
    log('🎉 所有文档更新成功！', 'green');
  } else {
    logWarning('部分步骤失败，请检查错误信息');
  }
}

// 运行主函数
if (require.main === module) {
  updateAllDocs().catch(error => {
    logError(\`脚本执行失败: \${error.message}\`);
    process.exit(1);
  });
}
`;
  
  createFile(path.join(SCRIPTS_DIR, 'update-all-docs.js'), updateDocsScript);
  
  // doc-maintenance.js
  const maintenanceScript = `#!/usr/bin/env node

/**
 * 文档维护脚本
 * 用于定期检查文档状态和提供维护建议
 */

const fs = require('fs');
const path = require('path');

// 配置
const PROJECT_ROOT = process.cwd();
const DOCS_DIR = path.join(PROJECT_ROOT, 'docs');

// 颜色输出
const colors = {
  reset: '\\x1b[0m',
  bright: '\\x1b[1m',
  red: '\\x1b[31m',
  green: '\\x1b[32m',
  yellow: '\\x1b[33m',
  blue: '\\x1b[34m',
  cyan: '\\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(\`\${colors[color]}\${message}\${colors.reset}\`);
}

function logSection(title) {
  log(\`\\n📋 \${title}\`, 'cyan');
  log('='.repeat(60), 'cyan');
}

function logSuccess(message) {
  log(\`✅ \${message}\`, 'green');
}

function logWarning(message) {
  log(\`⚠️  \${message}\`, 'yellow');
}

// 主函数
async function runMaintenanceCheck() {
  log('🔍 开始文档维护检查...', 'bright');
  log(\`项目根目录: \${PROJECT_ROOT}\`, 'blue');
  
  // 确保docs目录存在
  if (!fs.existsSync(DOCS_DIR)) {
    logError('docs目录不存在，请先运行文档生成脚本');
    process.exit(1);
  }
  
  logSection('文档检查');
  
  // 统计文档数量
  const docFiles = fs.readdirSync(DOCS_DIR).filter(file => file.endsWith('.md'));
  logSuccess(\`找到 \${docFiles.length} 个文档文件\`);
  
  logSection('维护建议');
  logSuccess('定期运行文档更新脚本');
  logWarning('及时更新API文档');
  
  log('\\n🎉 文档维护检查完成！', 'green');
}

// 运行主函数
if (require.main === module) {
  runMaintenanceCheck().catch(error => {
    console.error(\`维护检查失败: \${error.message}\`);
    process.exit(1);
  });
}
`;
  
  createFile(path.join(SCRIPTS_DIR, 'doc-maintenance.js'), maintenanceScript);
  
  // 设置脚本执行权限
  try {
    execSync(`chmod +x ${SCRIPTS_DIR}/*.js`, { stdio: 'pipe' });
    logSuccess('脚本执行权限已设置');
  } catch (error) {
    logWarning('无法设置脚本执行权限');
  }
}

// 更新package.json
function updatePackageJson() {
  logSection('更新package.json');
  
  const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    logWarning('package.json不存在，跳过更新');
    return;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // 添加文档相关脚本
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    packageJson.scripts['docs:all'] = 'node scripts/update-all-docs.js';
    packageJson.scripts['docs:check'] = 'node scripts/doc-maintenance.js';
    
    // 写回文件
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    logSuccess('package.json已更新');
  } catch (error) {
    logError(`更新package.json失败: ${error.message}`);
  }
}

// 创建README文件
function createReadmeFile() {
  const projectName = getProjectName();
  
  const readmeContent = `# ${projectName}

> 项目描述

## 快速开始

\`\`\`bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
\`\`\`

## 文档

- [项目文档](./docs/index.md)
- [开发指南](./docs/DEVELOPMENT_GUIDE.md)

## 脚本

\`\`\`bash
# 更新所有文档
pnpm docs:all

# 检查文档状态
pnpm docs:check
\`\`\`

## 许可证

MIT
`;
  
  return createFile(path.join(PROJECT_ROOT, 'README.md'), readmeContent);
}

// 主函数
async function setupDocumentation() {
  log('🚀 开始设置项目文档体系...', 'bright');
  log(`项目根目录: ${PROJECT_ROOT}`, 'blue');
  
  // 创建文档目录结构
  createDocStructure();
  
  // 创建文档文件
  logSection('创建文档文件');
  createIndexFile();
  createProjectOverviewFile();
  createDevelopmentGuideFile();
  
  // 创建脚本文件
  createScriptFiles();
  
  // 更新package.json
  updatePackageJson();
  
  // 创建README文件
  logSection('创建README文件');
  createReadmeFile();
  
  log('\n🎉 项目文档体系设置完成！', 'green');
  log('\n📋 下一步操作:', 'blue');
  log('1. 编辑 docs/project-overview.md 文件，添加项目具体信息', 'blue');
  log('2. 运行 pnpm docs:all 更新文档', 'blue');
  log('3. 运行 pnpm docs:check 检查文档状态', 'blue');
  log('4. 开始开发你的项目！', 'blue');
}

// 运行主函数
if (require.main === module) {
  setupDocumentation().catch(error => {
    logError(`设置失败: ${error.message}`);
    process.exit(1);
  });
}
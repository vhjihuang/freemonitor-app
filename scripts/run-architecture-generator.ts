import { ArchitectureDocumentGenerator } from './architecture-document-generator';

// 创建架构文档生成器
const generator = new ArchitectureDocumentGenerator({
  projectName: 'FreeMonitor',
  projectDescription: '免费监控系统',
  techStack: ['NestJS', 'TypeScript', 'Prisma', 'PostgreSQL', 'Redis'],
  architecturePattern: '分层架构',
  author: '开发团队',
  version: '1.0.0',
  outputDir: './docs/architecture',
  sourceDir: './src'
});

// 生成所有架构文档
generator.generateAllDocuments()
  .then(() => {
    console.log('架构文档生成完成');
  })
  .catch(err => {
    console.error('生成文档时出错:', err);
  });
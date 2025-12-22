/**
 * TypeDoc配置文件
 * 
 * 用于自动生成API文档，基于JSDoc注释
 * 配置包含输入源、输出格式、插件和主题设置
 */

module.exports = {
  // 输入配置
  entryPoints: [
    './src/**/*.ts'
  ],
  entryPointStrategy: 'expand',
  
  // 输出配置
  out: './docs/api',
  
  // 项目配置
  name: 'FreeMonitor Backend API',
  includeVersion: true,
  
  // 插件配置
  plugin: [
    'typedoc-plugin-markdown',
    'typedoc-plugin-mermaid'
  ],
  
  // Markdown配置
  disableSources: false,
  
  // 输出格式
  theme: 'default',
  gitRevision: 'main',
  
  // 文档配置
  excludeExternals: true,
  excludeNotDocumented: false,
  excludePrivate: true,
  excludeProtected: false,
  
  // 分类配置
  categoryOrder: [
    'Auth',
    'Devices',
    'Dashboard',
    'Common',
    'WebSocket',
    '*'
  ],
  
  // 类型文档配置
  sort: ['source-order'],
  sortEntryPoints: true,
  
  // 注释配置
  commentStyle: 'jsdoc',
  
  // 输出选项
  watch: false,
  preserveWatchOutput: true,
  
  // 高级配置
  logLevel: 'Info'
};
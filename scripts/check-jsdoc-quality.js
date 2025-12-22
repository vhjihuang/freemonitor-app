#!/usr/bin/env node

/**
 * JSDoc质量检查工具
 * 用于检查TypeScript源文件中的JSDoc注释质量
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// 日志工具
const log = {
  error: (msg) => console.error(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: (msg) => console.warn(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.info(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.cyan}=== ${msg} ===${colors.reset}`)
};

// JSDoc检查规则
const jsdocRules = {
  // 控制器方法必须有描述和参数注释
  controllerMethod: {
    requiresDescription: true,
    requiresParamTags: true,
    requiresReturnTag: true
  },
  // 服务类方法必须有描述
  serviceMethod: {
    requiresDescription: true,
    requiresParamTags: true,
    requiresReturnTag: true
  },
  // DTO类必须有属性注释
  dtoClass: {
    requiresPropertyDescription: true
  },
  // 实体类必须有属性注释
  entityClass: {
    requiresPropertyDescription: true
  }
};

// 检查结果
const checkResults = {
  totalFiles: 0,
  filesWithIssues: 0,
  totalIssues: 0,
  issues: []
};

/**
 * 解析TypeScript文件，提取类、方法等信息
 */
function parseTypeScriptFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const result = {
      classes: [],
      methods: [],
      interfaces: [],
      enums: []
    };
    
    // 简单的解析逻辑（实际项目中应使用TypeScript编译器API）
    let inClass = false;
    let inInterface = false;
    let inEnum = false;
    let currentClass = null;
    let currentInterface = null;
    let currentEnum = null;
    let jsdocComment = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 检测JSDoc注释
      if (line.startsWith('/**')) {
        jsdocComment = line;
        continue;
      } else if (jsdocComment && (line.startsWith('*/') || line.startsWith('*'))) {
        jsdocComment += '\n' + line;
        if (line.startsWith('*/')) {
          jsdocComment += '\n';
        }
        continue;
      } else if (jsdocComment && !line.startsWith('*')) {
        // JSDoc注释结束
        const nextLine = line;
        
        // 检测类
        if (nextLine.includes('class ') && !nextLine.includes('abstract')) {
          const className = nextLine.match(/class\s+(\w+)/);
          if (className) {
            currentClass = {
              name: className[1],
              line: i + 1,
              jsdoc: jsdocComment,
              methods: []
            };
            
            // 判断是否为DTO或实体类
            if (className[1].endsWith('Dto') || className[1].endsWith('DTO')) {
              currentClass.type = 'dto';
            } else if (className[1].endsWith('Entity')) {
              currentClass.type = 'entity';
            } else {
              currentClass.type = 'class';
            }
            
            result.classes.push(currentClass);
            inClass = true;
          }
        }
        
        // 检测接口
        if (nextLine.includes('interface ')) {
          const interfaceName = nextLine.match(/interface\s+(\w+)/);
          if (interfaceName) {
            currentInterface = {
              name: interfaceName[1],
              line: i + 1,
              jsdoc: jsdocComment,
              methods: []
            };
            result.interfaces.push(currentInterface);
            inInterface = true;
          }
        }
        
        // 检测枚举
        if (nextLine.includes('enum ')) {
          const enumName = nextLine.match(/enum\s+(\w+)/);
          if (enumName) {
            currentEnum = {
              name: enumName[1],
              line: i + 1,
              jsdoc: jsdocComment
            };
            result.enums.push(currentEnum);
            inEnum = true;
          }
        }
        
        // 检测方法
        if ((inClass || inInterface) && (nextLine.includes('public ') || nextLine.includes('private ') || nextLine.includes('protected ') || nextLine.match(/^\s*\w+\s*\(/))) {
          // 简化的方法检测
          const methodMatch = nextLine.match(/(?:public|private|protected)?\s*(?:async\s+)?(\w+)\s*\(/);
          if (methodMatch) {
            const method = {
              name: methodMatch[1],
              line: i + 1,
              jsdoc: jsdocComment,
              isController: false,
              isService: false
            };
            
            // 判断是否为控制器方法
            if (nextLine.includes('@') || nextLine.includes('Get(') || nextLine.includes('Post(') || nextLine.includes('Put(') || nextLine.includes('Delete(')) {
              method.isController = true;
            }
            
            // 判断是否为服务方法
            if (currentClass && currentClass.name.includes('Service')) {
              method.isService = true;
            }
            
            result.methods.push(method);
            
            if (inClass && currentClass) {
              currentClass.methods.push(method);
            } else if (inInterface && currentInterface) {
              currentInterface.methods.push(method);
            }
          }
        }
        
        jsdocComment = '';
      }
      
      // 检测类/接口/枚举结束
      if (inClass && line === '}') {
        inClass = false;
        currentClass = null;
      }
      if (inInterface && line === '}') {
        inInterface = false;
        currentInterface = null;
      }
      if (inEnum && line === '}') {
        inEnum = false;
        currentEnum = null;
      }
    }
    
    return result;
  } catch (error) {
    log.error(`解析文件失败 ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * 检查JSDoc注释质量
 */
function checkJSDocQuality(jsdoc, type, _name, _filePath, line) {
  const issues = [];
  
  if (!jsdoc || !jsdoc.trim()) {
    issues.push({
      type: 'missing_jsdoc',
      message: `缺少JSDoc注释`,
      severity: 'error'
    });
    return issues;
  }
  
  // 检查描述
  if (type === 'method' && (jsdocRules.controllerMethod.requiresDescription || jsdocRules.serviceMethod.requiresDescription)) {
    const hasDescription = /\/\*\*\s*\n\s*\*\s*[^@]/.test(jsdoc);
    if (!hasDescription) {
      issues.push({
        type: 'missing_description',
        message: `缺少方法描述`,
        severity: 'warning'
      });
    }
  }
  
  // 检查参数标签
  if (type === 'method' && (jsdocRules.controllerMethod.requiresParamTags || jsdocRules.serviceMethod.requiresParamTags)) {
    // 简化检查：查找是否有参数但没有@param标签
    const hasParams = /\([^)]*\w+[^)]*\)/.test(jsdoc); // 简化的参数检测
    const hasParamTags = /@param/.test(jsdoc);
    
    if (hasParams && !hasParamTags) {
      issues.push({
        type: 'missing_param_tags',
        message: `缺少参数注释 (@param)`,
        severity: 'warning'
      });
    }
  }
  
  // 检查返回标签
  if (type === 'method' && (jsdocRules.controllerMethod.requiresReturnTag || jsdocRules.serviceMethod.requiresReturnTag)) {
    const hasReturn = /:?\s*\w+[\[\]]*\s*(?=\{)/.test(jsdoc); // 简化的返回值检测
    const hasReturnTag = /@returns?/.test(jsdoc);
    
    if (hasReturn && !hasReturnTag) {
      issues.push({
        type: 'missing_return_tag',
        message: `缺少返回值注释 (@returns)`,
        severity: 'warning'
      });
    }
  }
  
  return issues;
}

/**
 * 检查单个文件
 */
function checkFile(filePath) {
  log.info(`检查文件: ${filePath}`);
  
  const parseResult = parseTypeScriptFile(filePath);
  if (!parseResult) {
    return false;
  }
  
  let fileHasIssues = false;
  
  // 检查类
  for (const cls of parseResult.classes) {
    const issues = checkJSDocQuality(cls.jsdoc, 'class', cls.name, filePath, cls.line);
    if (issues.length > 0) {
      fileHasIssues = true;
      checkResults.totalIssues += issues.length;
      
      for (const issue of issues) {
        checkResults.issues.push({
          file: filePath,
          line: cls.line,
          entity: `类 ${cls.name}`,
          ...issue
        });
        
        if (issue.severity === 'error') {
          log.error(`${filePath}:${cls.line} - ${cls.name}: ${issue.message}`);
        } else {
          log.warn(`${filePath}:${cls.line} - ${cls.name}: ${issue.message}`);
        }
      }
    }
    
    // 检查类方法
    for (const method of cls.methods) {
      const methodType = method.isController ? 'controller' : (method.isService ? 'service' : 'method');
      const issues = checkJSDocQuality(method.jsdoc, 'method', method.name, filePath, method.line);
      
      if (issues.length > 0) {
        fileHasIssues = true;
        checkResults.totalIssues += issues.length;
        
        for (const issue of issues) {
          checkResults.issues.push({
            file: filePath,
            line: method.line,
            entity: `方法 ${cls.name}.${method.name}`,
            ...issue
          });
          
          if (issue.severity === 'error') {
            log.error(`${filePath}:${method.line} - ${cls.name}.${method.name}: ${issue.message}`);
          } else {
            log.warn(`${filePath}:${method.line} - ${cls.name}.${method.name}: ${issue.message}`);
          }
        }
      }
    }
  }
  
  // 检查接口
  for (const iface of parseResult.interfaces) {
    const issues = checkJSDocQuality(iface.jsdoc, 'interface', iface.name, filePath, iface.line);
    if (issues.length > 0) {
      fileHasIssues = true;
      checkResults.totalIssues += issues.length;
      
      for (const issue of issues) {
        checkResults.issues.push({
          file: filePath,
          line: iface.line,
          entity: `接口 ${iface.name}`,
          ...issue
        });
        
        if (issue.severity === 'error') {
          log.error(`${filePath}:${iface.line} - ${iface.name}: ${issue.message}`);
        } else {
          log.warn(`${filePath}:${iface.line} - ${iface.name}: ${issue.message}`);
        }
      }
    }
  }
  
  // 检查枚举
  for (const enumItem of parseResult.enums) {
    const issues = checkJSDocQuality(enumItem.jsdoc, 'enum', enumItem.name, filePath, enumItem.line);
    if (issues.length > 0) {
      fileHasIssues = true;
      checkResults.totalIssues += issues.length;
      
      for (const issue of issues) {
        checkResults.issues.push({
          file: filePath,
          line: enumItem.line,
          entity: `枚举 ${enumItem.name}`,
          ...issue
        });
        
        if (issue.severity === 'error') {
          log.error(`${filePath}:${enumItem.line} - ${enumItem.name}: ${issue.message}`);
        } else {
          log.warn(`${filePath}:${enumItem.line} - ${enumItem.name}: ${issue.message}`);
        }
      }
    }
  }
  
  return fileHasIssues;
}

/**
 * 生成检查报告
 */
function generateReport() {
  log.title('JSDoc质量检查报告');
  
  console.log(`总文件数: ${checkResults.totalFiles}`);
  console.log(`有问题的文件数: ${checkResults.filesWithIssues}`);
  console.log(`总问题数: ${checkResults.totalIssues}`);
  
  if (checkResults.totalIssues > 0) {
    // 按严重程度统计
    const errors = checkResults.issues.filter(i => i.severity === 'error').length;
    const warnings = checkResults.issues.filter(i => i.severity === 'warning').length;
    
    console.log(`错误数: ${errors}`);
    console.log(`警告数: ${warnings}`);
    
    // 按类型统计
    const issueTypes = {};
    for (const issue of checkResults.issues) {
      if (!issueTypes[issue.type]) {
        issueTypes[issue.type] = 0;
      }
      issueTypes[issue.type]++;
    }
    
    console.log('\n问题类型分布:');
    for (const [type, count] of Object.entries(issueTypes)) {
      console.log(`  ${type}: ${count}`);
    }
    
    // 输出JSON报告
    const reportPath = 'jsdoc-quality-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(checkResults, null, 2));
    log.info(`详细报告已保存到: ${reportPath}`);
  }
}

/**
 * 主函数
 */
function main() {
  const sourcePath = process.argv[2];
  
  if (!sourcePath) {
    log.error('请指定源代码路径');
    process.exit(1);
  }
  
  log.title('JSDoc质量检查工具');
  
  // 查找所有TypeScript文件
  const pattern = path.join(sourcePath, '**/*.ts');
  const files = glob.sync(pattern, {
    ignore: ['**/node_modules/**', '**/*.spec.ts', '**/*.test.ts']
  });
  
  if (files.length === 0) {
    log.error('未找到TypeScript文件');
    process.exit(1);
  }
  
  log.info(`找到 ${files.length} 个TypeScript文件`);
  
  // 检查每个文件
  for (const file of files) {
    checkResults.totalFiles++;
    const hasIssues = checkFile(file);
    if (hasIssues) {
      checkResults.filesWithIssues++;
    }
  }
  
  // 生成报告
  generateReport();
  
  // 根据检查结果设置退出码
  const hasErrors = checkResults.issues.some(i => i.severity === 'error');
  if (hasErrors) {
    log.error('发现JSDoc质量错误');
    process.exit(1);
  } else if (checkResults.totalIssues > 0) {
    log.warn('发现JSDoc质量警告');
    process.exit(0);
  } else {
    log.success('JSDoc质量检查通过');
    process.exit(0);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = {
  checkJSDocQuality,
  parseTypeScriptFile,
  checkFile
};
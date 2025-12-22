/**
 * API文档模板验证器
 * 
 * 用于验证API文档模板的质量和完整性
 * 确保所有生成的文档模板符合项目的文档标准
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * 验证结果类型
 */
export interface ValidationResult {
  /** 是否通过验证 */
  passed: boolean;
  /** 错误信息列表 */
  errors: ValidationError[];
  /** 警告信息列表 */
  warnings: ValidationWarning[];
  /** 建议信息列表 */
  suggestions: ValidationSuggestion[];
}

/**
 * 验证错误
 */
export interface ValidationError {
  /** 错误类型 */
  type: string;
  /** 错误消息 */
  message: string;
  /** 文件路径 */
  filePath: string;
  /** 行号 */
  line?: number;
  /** 列号 */
  column?: number;
}

/**
 * 验证警告
 */
export interface ValidationWarning {
  /** 警告类型 */
  type: string;
  /** 警告消息 */
  message: string;
  /** 文件路径 */
  filePath: string;
  /** 行号 */
  line?: number;
  /** 列号 */
  column?: number;
}

/**
 * 验证建议
 */
export interface ValidationSuggestion {
  /** 建议类型 */
  type: string;
  /** 建议消息 */
  message: string;
  /** 文件路径 */
  filePath: string;
  /** 行号 */
  line?: number;
  /** 列号 */
  column?: number;
}

/**
 * 验证规则配置
 */
export interface ValidationRulesConfig {
  /** 是否强制要求作者信息 */
  requireAuthor: boolean;
  /** 是否强制要求版本信息 */
  requireVersion: boolean;
  /** 是否强制要求示例代码 */
  requireExamples: boolean;
  /** 是否强制要求错误处理说明 */
  requireErrorHandling: boolean;
  /** 是否强制要求权限说明 */
  requirePermissions: boolean;
  /** 是否强制要求安全说明 */
  requireSecurity: boolean;
  /** 是否强制要求关联方法说明 */
  requireSeeReferences: boolean;
  /** 最小描述长度 */
  minDescriptionLength: number;
  /** 最大描述长度 */
  maxDescriptionLength: number;
}

/**
 * API文档模板验证器类
 */
export class ApiDocumentTemplateValidator {
  private readonly defaultRules: ValidationRulesConfig = {
    requireAuthor: true,
    requireVersion: true,
    requireExamples: true,
    requireErrorHandling: true,
    requirePermissions: true,
    requireSecurity: true,
    requireSeeReferences: true,
    minDescriptionLength: 10,
    maxDescriptionLength: 500
  };

  /**
   * 验证文档模板文件
   * @param filePath 文件路径
   * @param rules 验证规则配置
   * @returns 验证结果
   */
  validateFile(filePath: string, rules?: Partial<ValidationRulesConfig>): ValidationResult {
    const validationRules = { ...this.defaultRules, ...rules };
    const result: ValidationResult = {
      passed: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      if (!fs.existsSync(filePath)) {
        result.passed = false;
        result.errors.push({
          type: 'FILE_NOT_FOUND',
          message: `文件不存在: ${filePath}`,
          filePath
        });
        return result;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      // 验证文件结构
      this.validateFileStructure(content, filePath, result);
      
      // 验证JSDoc注释
      this.validateJSDocComments(lines, filePath, validationRules, result);
      
      // 验证方法文档
      this.validateMethodDocumentation(lines, filePath, validationRules, result);
      
      // 验证属性文档
      this.validatePropertyDocumentation(lines, filePath, validationRules, result);
      
      // 验证示例代码
      this.validateExampleCode(lines, filePath, validationRules, result);
      
      // 验证错误处理
      this.validateErrorHandling(lines, filePath, validationRules, result);
      
      // 验证权限和安全
      this.validatePermissionsAndSecurity(lines, filePath, validationRules, result);
      
      // 验证关联引用
      this.validateSeeReferences(lines, filePath, validationRules, result);

      // 更新验证结果状态
      result.passed = result.errors.length === 0;
    } catch (error) {
      result.passed = false;
      result.errors.push({
        type: 'VALIDATION_ERROR',
        message: `验证过程中发生错误: ${error.message}`,
        filePath
      });
    }

    return result;
  }

  /**
   * 验证目录中的所有文档模板文件
   * @param dirPath 目录路径
   * @param pattern 文件匹配模式
   * @param rules 验证规则配置
   * @returns 验证结果
   */
  validateDirectory(
    dirPath: string,
    pattern: string = '**/*.ts',
    rules?: Partial<ValidationRulesConfig>
  ): ValidationResult {
    const result: ValidationResult = {
      passed: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    try {
      if (!fs.existsSync(dirPath)) {
        result.passed = false;
        result.errors.push({
          type: 'DIRECTORY_NOT_FOUND',
          message: `目录不存在: ${dirPath}`,
          filePath: dirPath
        });
        return result;
      }

      const files = this.getFiles(dirPath, pattern);
      
      if (files.length === 0) {
        result.warnings.push({
          type: 'NO_FILES_FOUND',
          message: `在目录 ${dirPath} 中未找到匹配 ${pattern} 的文件`,
          filePath: dirPath
        });
        return result;
      }

      for (const file of files) {
        const fileResult = this.validateFile(file, rules);
        
        // 合并验证结果
        result.errors.push(...fileResult.errors);
        result.warnings.push(...fileResult.warnings);
        result.suggestions.push(...fileResult.suggestions);
        
        if (!fileResult.passed) {
          result.passed = false;
        }
      }
    } catch (error) {
      result.passed = false;
      result.errors.push({
        type: 'VALIDATION_ERROR',
        message: `验证过程中发生错误: ${error.message}`,
        filePath: dirPath
      });
    }

    return result;
  }

  /**
   * 验证文件结构
   * @private
   */
  private validateFileStructure(content: string, filePath: string, result: ValidationResult): void {
    // 检查是否有基本的类定义
    if (!content.includes('class ')) {
      result.errors.push({
        type: 'MISSING_CLASS_DEFINITION',
        message: '文件中未找到类定义',
        filePath
      });
    }

    // 检查是否有基本的JSDoc注释
    if (!content.includes('/**')) {
      result.errors.push({
        type: 'MISSING_JSDOC_COMMENTS',
        message: '文件中未找到JSDoc注释',
        filePath
      });
    }
  }

  /**
   * 验证JSDoc注释
   * @private
   */
  private validateJSDocComments(
    lines: string[],
    filePath: string,
    rules: ValidationRulesConfig,
    result: ValidationResult
  ): void {
    let inJSDoc = false;
    let currentJSDoc: string[] = [];
    let jsdocStartLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 检测JSDoc开始
      if (line === '/**') {
        inJSDoc = true;
        currentJSDoc = [];
        jsdocStartLine = i + 1;
        continue;
      }
      
      // 检测JSDoc结束
      if (inJSDoc && line === '*/') {
        inJSDoc = false;
        this.validateJSDocBlock(currentJSDoc, jsdocStartLine, filePath, rules, result);
        currentJSDoc = [];
        continue;
      }
      
      // 收集JSDoc内容
      if (inJSDoc) {
        currentJSDoc.push(line);
      }
    }
  }

  /**
   * 验证JSDoc块
   * @private
   */
  private validateJSDocBlock(
    jsdocLines: string[],
    startLine: number,
    filePath: string,
    rules: ValidationRulesConfig,
    result: ValidationResult
  ): void {
    const jsdocContent = jsdocLines.join('\n');
    
    // 检查是否有描述
    const hasDescription = jsdocLines.some(line => 
      line.startsWith('* ') && !line.startsWith('* @') && line.length > 2
    );
    
    if (!hasDescription) {
      result.errors.push({
        type: 'MISSING_DESCRIPTION',
        message: 'JSDoc注释缺少描述',
        filePath,
        line: startLine
      });
    }
    
    // 检查作者信息
    if (rules.requireAuthor && !jsdocContent.includes('@author')) {
      result.warnings.push({
        type: 'MISSING_AUTHOR',
        message: 'JSDoc注释缺少作者信息 (@author)',
        filePath,
        line: startLine
      });
    }
    
    // 检查版本信息
    if (rules.requireVersion && !jsdocContent.includes('@version')) {
      result.warnings.push({
        type: 'MISSING_VERSION',
        message: 'JSDoc注释缺少版本信息 (@version)',
        filePath,
        line: startLine
      });
    }
    
    // 检查模块信息
    if (!jsdocContent.includes('@module')) {
      result.warnings.push({
        type: 'MISSING_MODULE',
        message: 'JSDoc注释缺少模块信息 (@module)',
        filePath,
        line: startLine
      });
    }
    
    // 检查类信息
    if (!jsdocContent.includes('@class')) {
      result.warnings.push({
        type: 'MISSING_CLASS',
        message: 'JSDoc注释缺少类信息 (@class)',
        filePath,
        line: startLine
      });
    }
  }

  /**
   * 验证方法文档
   * @private
   */
  private validateMethodDocumentation(
    lines: string[],
    filePath: string,
    rules: ValidationRulesConfig,
    result: ValidationResult
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 检查方法定义
      if (line.includes('async ') || line.includes('function ') || line.includes('=>')) {
        // 检查方法是否有JSDoc注释
        const hasJSDoc = i > 0 && lines[i - 1].trim() === '*/';
        
        if (!hasJSDoc) {
          result.warnings.push({
            type: 'MISSING_METHOD_JSDOC',
            message: '方法缺少JSDoc注释',
            filePath,
            line: i + 1
          });
          continue;
        }
        
        // 查找JSDoc块
        let jsdocStartLine = i - 1;
        while (jsdocStartLine > 0 && !lines[jsdocStartLine].trim().startsWith('/**')) {
          jsdocStartLine--;
        }
        
        if (jsdocStartLine >= 0) {
          const jsdocLines = [];
          for (let j = jsdocStartLine; j < i; j++) {
            jsdocLines.push(lines[j]);
          }
          
          this.validateMethodJSDoc(jsdocLines, jsdocStartLine + 1, filePath, rules, result);
        }
      }
    }
  }

  /**
   * 验证方法JSDoc
   * @private
   */
  private validateMethodJSDoc(
    jsdocLines: string[],
    startLine: number,
    filePath: string,
    rules: ValidationRulesConfig,
    result: ValidationResult
  ): void {
    const jsdocContent = jsdocLines.join('\n');
    
    // 检查参数文档
    const paramMatches = jsdocContent.match(/@param\s+\w+/g);
    // 参数数量可用于更详细的验证
    const paramCount = paramMatches ? paramMatches.length : 0;
    console.debug(`Found ${paramCount} parameters in documentation`);
    
    // 检查返回值文档
    if (!jsdocContent.includes('@returns') && !jsdocContent.includes('@return')) {
      result.warnings.push({
        type: 'MISSING_RETURN_DOCUMENTATION',
        message: '方法缺少返回值文档 (@returns)',
        filePath,
        line: startLine
      });
    }
    
    // 检查示例代码
    if (rules.requireExamples && !jsdocContent.includes('@example')) {
      result.warnings.push({
        type: 'MISSING_EXAMPLE',
        message: '方法缺少示例代码 (@example)',
        filePath,
        line: startLine
      });
    }
    
    // 检查错误处理
    if (rules.requireErrorHandling && !jsdocContent.includes('@throws')) {
      result.warnings.push({
        type: 'MISSING_ERROR_HANDLING',
        message: '方法缺少错误处理文档 (@throws)',
        filePath,
        line: startLine
      });
    }
  }

  /**
   * 验证属性文档
   * @private
   */
  private validatePropertyDocumentation(
    lines: string[],
    filePath: string,
    _rules: ValidationRulesConfig,
    result: ValidationResult
  ): void {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 检查属性定义
      if (line.includes(': ') && !line.includes('function ') && !line.includes('=>')) {
        // 检查属性是否有JSDoc注释
        const hasJSDoc = i > 0 && lines[i - 1].trim() === '*/';
        
        if (!hasJSDoc) {
          result.warnings.push({
            type: 'MISSING_PROPERTY_JSDOC',
            message: '属性缺少JSDoc注释',
            filePath,
            line: i + 1
          });
        }
      }
    }
  }

  /**
   * 验证示例代码
   * @private
   */
  private validateExampleCode(
    lines: string[],
    filePath: string,
    rules: ValidationRulesConfig,
    result: ValidationResult
  ): void {
    if (!rules.requireExamples) return;
    
    let inExample = false;
    let exampleLines: string[] = [];
    let exampleStartLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 检测示例开始
      if (line.includes('@example')) {
        inExample = true;
        exampleLines = [];
        exampleStartLine = i + 1;
        continue;
      }
      
      // 检测示例结束
      if (inExample && (line.startsWith('* @') || line === '*/')) {
        inExample = false;
        this.validateExampleBlock(exampleLines, exampleStartLine, filePath, result);
        exampleLines = [];
        continue;
      }
      
      // 收集示例内容
      if (inExample) {
        exampleLines.push(line);
      }
    }
  }

  /**
   * 验证示例块
   * @private
   */
  private validateExampleBlock(
    exampleLines: string[],
    startLine: number,
    filePath: string,
    result: ValidationResult
  ): void {
    const exampleContent = exampleLines.join('\n');
    
    // 检查示例是否为空
    if (exampleLines.length === 0) {
      result.errors.push({
        type: 'EMPTY_EXAMPLE',
        message: '示例代码为空',
        filePath,
        line: startLine
      });
      return;
    }
    
    // 检查示例是否有代码块
    if (!exampleContent.includes('```')) {
      result.warnings.push({
        type: 'MISSING_CODE_BLOCK',
        message: '示例代码缺少代码块标记 (```)',
        filePath,
        line: startLine
      });
    }
  }

  /**
   * 验证错误处理
   * @private
   */
  private validateErrorHandling(
    lines: string[],
    filePath: string,
    rules: ValidationRulesConfig,
    result: ValidationResult
  ): void {
    if (!rules.requireErrorHandling) return;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 检查@throws标签
      if (line.includes('@throws')) {
        // 检查是否有异常类型
        if (!line.match(/@throws\s+\w+/)) {
          result.warnings.push({
            type: 'MISSING_EXCEPTION_TYPE',
            message: '@throws标签缺少异常类型',
            filePath,
            line: i + 1
          });
        }
        
        // 检查是否有描述
        if (!line.match(/@throws\s+\w+\s+.+/)) {
          result.warnings.push({
            type: 'MISSING_EXCEPTION_DESCRIPTION',
            message: '@throws标签缺少描述',
            filePath,
            line: i + 1
          });
        }
      }
    }
  }

  /**
   * 验证权限和安全
   * @private
   */
  private validatePermissionsAndSecurity(
    lines: string[],
    filePath: string,
    rules: ValidationRulesConfig,
    result: ValidationResult
  ): void {
    // 检查权限文档
    if (rules.requirePermissions) {
      let hasPermission = false;
      for (const line of lines) {
        if (line.includes('@permission')) {
          hasPermission = true;
          break;
        }
      }
      
      if (!hasPermission) {
        result.suggestions.push({
          type: 'MISSING_PERMISSION',
          message: '建议添加权限文档 (@permission)',
          filePath
        });
      }
    }
    
    // 检查安全文档
    if (rules.requireSecurity) {
      let hasSecurity = false;
      for (const line of lines) {
        if (line.includes('@security')) {
          hasSecurity = true;
          break;
        }
      }
      
      if (!hasSecurity) {
        result.suggestions.push({
          type: 'MISSING_SECURITY',
          message: '建议添加安全文档 (@security)',
          filePath
        });
      }
    }
  }

  /**
   * 验证关联引用
   * @private
   */
  private validateSeeReferences(
    lines: string[],
    filePath: string,
    rules: ValidationRulesConfig,
    result: ValidationResult
  ): void {
    if (!rules.requireSeeReferences) return;
    
    let hasSeeReference = false;
    for (const line of lines) {
      if (line.includes('@see')) {
        hasSeeReference = true;
        break;
      }
    }
    
    if (!hasSeeReference) {
      result.suggestions.push({
        type: 'MISSING_SEE_REFERENCE',
        message: '建议添加关联引用 (@see)',
        filePath
      });
    }
  }

  /**
   * 获取目录下的所有文件
   * @private
   */
  private getFiles(dirPath: string, pattern: string): string[] {
    const files: string[] = [];
    
    function traverse(currentPath: string): void {
      const items = fs.readdirSync(currentPath);
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          traverse(itemPath);
        } else if (stat.isFile() && item.match(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'))) {
          files.push(itemPath);
        }
      }
    }
    
    traverse(dirPath);
    return files;
  }

  /**
   * 生成验证报告
   * @param results 验证结果列表
   * @param outputPath 输出路径
   */
  generateReport(results: ValidationResult[], outputPath: string): void {
    const report = {
      summary: {
        totalFiles: results.length,
        passedFiles: results.filter(r => r.passed).length,
        failedFiles: results.filter(r => !r.passed).length,
        totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
        totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
        totalSuggestions: results.reduce((sum, r) => sum + r.suggestions.length, 0)
      },
      details: results.map((result, index) => ({
        fileIndex: index + 1,
        passed: result.passed,
        errors: result.errors,
        warnings: result.warnings,
        suggestions: result.suggestions
      }))
    };
    
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`验证报告已生成: ${outputPath}`);
  }
}


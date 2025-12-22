/**
 * API文档模板生成器
 * 
 * 用于生成标准化的API文档模板，确保所有API文档的一致性和完整性
 * 支持控制器、服务、DTO等不同类型的文档模板生成
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * 文档模板类型
 */
export enum DocumentTemplateType {
  CONTROLLER = 'controller',
  SERVICE = 'service',
  DTO = 'dto',
  ENTITY = 'entity',
  MODULE = 'module',
  GUARD = 'guard',
  INTERCEPTOR = 'interceptor',
  FILTER = 'filter',
  MIDDLEWARE = 'middleware'
}

/**
 * API文档模板配置
 */
export interface DocumentTemplateConfig {
  /** 模板类型 */
  type: DocumentTemplateType;
  /** 模块名称 */
  moduleName: string;
  /** 类名 */
  className: string;
  /** 文件路径 */
  filePath: string;
  /** 作者 */
  author?: string;
  /** 版本 */
  version?: string;
  /** 自定义标签 */
  customTags?: string[];
}

/**
 * API文档模板生成器类
 */
export class ApiDocumentTemplateGenerator {
  private readonly templatesPath: string;
  private readonly outputDir: string;

  constructor(
    templatesPath: string = path.resolve(__dirname, '../templates'),
    outputDir: string = path.resolve(__dirname, '../generated-templates')
  ) {
    this.templatesPath = templatesPath;
    this.outputDir = outputDir;
    this.ensureDirectoryExists(this.templatesPath);
    this.ensureDirectoryExists(this.outputDir);
  }

  /**
   * 生成API文档模板
   * @param config 文档模板配置
   * @returns 生成的模板内容
   */
  generateTemplate(config: DocumentTemplateConfig): string {
    const { type, moduleName, className, author, version, customTags } = config;
    
    switch (type) {
      case DocumentTemplateType.CONTROLLER:
        return this.generateControllerTemplate(moduleName, className, author, version, customTags);
      case DocumentTemplateType.SERVICE:
        return this.generateServiceTemplate(moduleName, className, author, version, customTags);
      case DocumentTemplateType.DTO:
        return this.generateDtoTemplate(moduleName, className, author, version, customTags);
      case DocumentTemplateType.ENTITY:
        return this.generateEntityTemplate(moduleName, className, author, version, customTags);
      case DocumentTemplateType.MODULE:
        return this.generateModuleTemplate(moduleName, className, author, version, customTags);
      default:
        throw new Error(`不支持的文档模板类型: ${type}`);
    }
  }

  /**
   * 生成控制器文档模板
   */
  private generateControllerTemplate(
    moduleName: string,
    className: string,
    author?: string,
    version?: string,
    customTags?: string[]
  ): string {
    const authorTag = author ? ` * @author ${author}` : '';
    const versionTag = version ? ` * @version ${version}` : '';
    const customTagsStr = customTags ? customTags.map(tag => ` * @${tag}`).join('\n') : '';

    return `/**
 * ${moduleName}模块控制器
 * 
 * 负责${moduleName}模块的HTTP请求处理和响应返回
 * 提供RESTful API接口，处理${moduleName}相关的业务逻辑
 * 
 * @module ${moduleName}
 * @class ${className}
${authorTag}
${versionTag}
 * @since 1.0.0
${customTagsStr}
 */
export class ${className} {
  /**
   * 构造函数
   * @param ${moduleName.toLowerCase()}Service ${moduleName}服务实例
   */
  constructor(private readonly ${moduleName.toLowerCase()}Service: ${moduleName}Service) {}

  /**
   * 获取${moduleName}列表
   * 
   * 支持分页查询和过滤条件
   * 
   * @param query 查询参数，包含分页和过滤条件
   * @param req 请求对象，包含用户信息
   * @returns 返回${moduleName}列表和分页信息
   * 
   * @example
   * \`\`\`typescript
   * // 请求示例
   * GET /api/${moduleName}?page=1&limit=10&search=keyword
   * 
   * // 响应示例
   * {
   *   "success": true,
   *   "data": {
   *     "items": [...],
   *     "total": 100,
   *     "page": 1,
   *     "limit": 10
   *   }
   * }
   * \`\`\`
   * 
   * @throws {BadRequestException} 当查询参数无效时抛出
   * @throws {UnauthorizedException} 当用户未认证时抛出
   * @throws {ForbiddenException} 当用户权限不足时抛出
   * 
   * @security bearerAuth - 需要Bearer Token认证
   * @permission ${moduleName.toUpperCase()}:READ - 需要${moduleName}读取权限
   * 
   * @see {@link ${moduleName}Service.findAll} 关联的服务方法
   */
  @Get()
  @ApiOperation({ summary: '获取${moduleName}列表' })
  @ApiCommonResponses()
  @Roles(Role.ADMIN, Role.OPERATOR, Role.USER)
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async findAll(
    @Query() query: Query${moduleName}Dto,
    @Req() req: RequestWithUser
  ): Promise<PaginatedResponse<${moduleName}Dto>> {
    // 实现逻辑...
  }

  /**
   * 根据ID获取${moduleName}详情
   * 
   * @param id ${moduleName}ID
   * @param req 请求对象，包含用户信息
   * @returns 返回${moduleName}详情
   * 
   * @example
   * \`\`\`typescript
   * // 请求示例
   * GET /api/${moduleName}/123e4567-e89b-12d3-a456-426614174000
   * 
   * // 响应示例
   * {
   *   "success": true,
   *   "data": {
   *     "id": "123e4567-e89b-12d3-a456-426614174000",
   *     "name": "示例${moduleName}",
   *     "createdAt": "2023-01-01T00:00:00.000Z",
   *     "updatedAt": "2023-01-01T00:00:00.000Z"
   *   }
   * }
   * \`\`\`
   * 
   * @throws {NotFoundException} 当${moduleName}不存在时抛出
   * @throws {UnauthorizedException} 当用户未认证时抛出
   * @throws {ForbiddenException} 当用户权限不足时抛出
   * 
   * @security bearerAuth - 需要Bearer Token认证
   * @permission ${moduleName.toUpperCase()}:READ - 需要${moduleName}读取权限
   * 
   * @see {@link ${moduleName}Service.findOne} 关联的服务方法
   */
  @Get(':id')
  @ApiOperation({ summary: '获取${moduleName}详情' })
  @ApiCommonResponses()
  @Roles(Role.ADMIN, Role.OPERATOR, Role.USER)
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithUser
  ): Promise<${moduleName}Dto> {
    // 实现逻辑...
  }

  /**
   * 创建新的${moduleName}
   * 
   * @param create${moduleName}Dto 创建${moduleName}的数据传输对象
   * @param req 请求对象，包含用户信息
   * @returns 返回创建的${moduleName}信息
   * 
   * @example
   * \`\`\`typescript
   * // 请求示例
   * POST /api/${moduleName}
   * {
   *   "name": "新${moduleName}",
   *   "description": "${moduleName}描述"
   * }
   * 
   * // 响应示例
   * {
   *   "success": true,
   *   "data": {
   *     "id": "123e4567-e89b-12d3-a456-426614174000",
   *     "name": "新${moduleName}",
   *     "description": "${moduleName}描述",
   *     "createdAt": "2023-01-01T00:00:00.000Z",
   *     "updatedAt": "2023-01-01T00:00:00.000Z"
   *   }
   * }
   * \`\`\`
   * 
   * @throws {BadRequestException} 当请求数据无效时抛出
   * @throws {UnauthorizedException} 当用户未认证时抛出
   * @throws {ForbiddenException} 当用户权限不足时抛出
   * @throws {ConflictException} 当${moduleName}已存在时抛出
   * 
   * @security bearerAuth - 需要Bearer Token认证
   * @permission ${moduleName.toUpperCase()}:CREATE - 需要${moduleName}创建权限
   * 
   * @see {@link ${moduleName}Service.create} 关联的服务方法
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建${moduleName}' })
  @ApiCommonResponses()
  @Roles(Role.ADMIN, Role.OPERATOR, Role.USER)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async create(
    @Body() create${moduleName}Dto: Create${moduleName}Dto,
    @Req() req: RequestWithUser
  ): Promise<${moduleName}Dto> {
    // 实现逻辑...
  }

  /**
   * 更新${moduleName}
   * 
   * @param id ${moduleName}ID
   * @param update${moduleName}Dto 更新${moduleName}的数据传输对象
   * @param req 请求对象，包含用户信息
   * @returns 返回更新后的${moduleName}信息
   * 
   * @example
   * \`\`\`typescript
   * // 请求示例
   * PATCH /api/${moduleName}/123e4567-e89b-12d3-a456-426614174000
   * {
   *   "name": "更新的${moduleName}名称",
   *   "description": "更新的${moduleName}描述"
   * }
   * 
   * // 响应示例
   * {
   *   "success": true,
   *   "data": {
   *     "id": "123e4567-e89b-12d3-a456-426614174000",
   *     "name": "更新的${moduleName}名称",
   *     "description": "更新的${moduleName}描述",
   *     "createdAt": "2023-01-01T00:00:00.000Z",
   *     "updatedAt": "2023-01-02T00:00:00.000Z"
   *   }
   * }
   * \`\`\`
   * 
   * @throws {BadRequestException} 当请求数据无效时抛出
   * @throws {UnauthorizedException} 当用户未认证时抛出
   * @throws {ForbiddenException} 当用户权限不足时抛出
   * @throws {NotFoundException} 当${moduleName}不存在时抛出
   * 
   * @security bearerAuth - 需要Bearer Token认证
   * @permission ${moduleName.toUpperCase()}:UPDATE - 需要${moduleName}更新权限
   * 
   * @see {@link ${moduleName}Service.update} 关联的服务方法
   */
  @Patch(':id')
  @ApiOperation({ summary: '更新${moduleName}' })
  @ApiCommonResponses()
  @Roles(Role.ADMIN, Role.OPERATOR, Role.USER)
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  async update(
    @Param('id') id: string,
    @Body() update${moduleName}Dto: Update${moduleName}Dto,
    @Req() req: RequestWithUser
  ): Promise<${moduleName}Dto> {
    // 实现逻辑...
  }

  /**
   * 删除${moduleName}
   * 
   * 支持软删除和硬删除
   * 
   * @param id ${moduleName}ID
   * @param req 请求对象，包含用户信息
   * @returns 返回删除结果
   * 
   * @example
   * \`\`\`typescript
   * // 请求示例
   * DELETE /api/${moduleName}/123e4567-e89b-12d3-a456-426614174000
   * 
   * // 响应示例
   * {
   *   "success": true,
   *   "data": {
   *     "id": "123e4567-e89b-12d3-a456-426614174000",
   *     "deleted": true,
   *     "deletedAt": "2023-01-02T00:00:00.000Z"
   *   }
   * }
   * \`\`\`
   * 
   * @throws {BadRequestException} 当${moduleName}ID无效时抛出
   * @throws {UnauthorizedException} 当用户未认证时抛出
   * @throws {ForbiddenException} 当用户权限不足时抛出
   * @throws {NotFoundException} 当${moduleName}不存在时抛出
   * 
   * @security bearerAuth - 需要Bearer Token认证
   * @permission ${moduleName.toUpperCase()}:DELETE - 需要${moduleName}删除权限
   * 
   * @see {@link ${moduleName}Service.remove} 关联的服务方法
   */
  @Delete(':id')
  @ApiOperation({ summary: '删除${moduleName}' })
  @ApiCommonResponses()
  @Roles(Role.ADMIN, Role.OPERATOR, Role.USER)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithUser
  ): Promise<DeleteResult> {
    // 实现逻辑...
  }
}`;
  }

  /**
   * 生成服务文档模板
   */
  private generateServiceTemplate(
    moduleName: string,
    className: string,
    author?: string,
    version?: string,
    customTags?: string[]
  ): string {
    const authorTag = author ? ` * @author ${author}` : '';
    const versionTag = version ? ` * @version ${version}` : '';
    const customTagsStr = customTags ? customTags.map(tag => ` * @${tag}`).join('\n') : '';

    return `/**
 * ${moduleName}模块服务
 * 
 * 负责${moduleName}模块的业务逻辑处理和数据操作
 * 提供${moduleName}的CRUD操作和业务规则实现
 * 
 * @module ${moduleName}
 * @class ${className}
${authorTag}
${versionTag}
 * @since 1.0.0
${customTagsStr}
 */
@Injectable()
export class ${className} {
  private readonly logger = new Logger(${className}.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly appLoggerService: AppLoggerService
  ) {
    this.logger = appLoggerService.createLogger(${className}.name);
    this.logger.debug('${className}初始化完成');
  }

  /**
   * 查询${moduleName}列表
   * 
   * 支持分页查询、搜索和过滤
   * 
   * @param userId 用户ID，用于权限控制
   * @param search 搜索关键词，支持模糊匹配
   * @param status 状态过滤条件
   * @param page 页码，从1开始
   * @param limit 每页数量，最大100
   * @param sortBy 排序字段
   * @param sortOrder 排序方向，asc或desc
   * @returns 返回分页的${moduleName}列表
   * 
   * @example
   * \`\`\`typescript
   * // 使用示例
   * const result = await this.${moduleName.toLowerCase()}Service.findAll(
   *   'user123',
   *   'keyword',
   *   'ACTIVE',
   *   1,
   *   10,
   *   'name',
   *   'asc'
   * );
   * 
   * // 返回结果
   * {
   *   data: [...],
   *   total: 100,
   *   page: 1,
   *   limit: 10,
   *   totalPages: 10
   * }
   * \`\`\`
   * 
   * @throws {BadRequestException} 当查询参数无效时抛出
   * @throws {InternalServerErrorException} 当数据库查询失败时抛出
   */
  async findAll(
    userId: string,
    search?: string,
    status?: string,
    page: number = 1,
    limit: number = 10,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedResult<${moduleName}>> {
    const startTime = Date.now();
    
    try {
      // 参数验证
      const validatedPage = page && page > 0 ? page : 1;
      const validatedLimit = limit && limit > 0 && limit <= 100 ? limit : 10;
      
      this.logger.debug('查询${moduleName}列表', {
        userId,
        page: validatedPage,
        limit: validatedLimit,
        search,
        status,
        sortBy,
        sortOrder
      });
      
      // 构建查询条件
      const where: Prisma.${moduleName}WhereInput = {
        ...this.buildUserFilter(userId),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        }),
        ...(status && { status: status as ${moduleName}Status })
      };
      
      // 执行查询
      const [data, total] = await Promise.all([
        this.prisma.${moduleName.toLowerCase()}.findMany({
          where,
          skip: (validatedPage - 1) * validatedLimit,
          take: validatedLimit,
          orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' }
        }),
        this.prisma.${moduleName.toLowerCase()}.count({ where })
      ]);
      
      const executionTime = Date.now() - startTime;
      
      this.logger.debug('${moduleName}列表查询成功', {
        userId,
        count: data.length,
        total,
        executionTime
      });
      
      return {
        data,
        total,
        page: validatedPage,
        limit: validatedLimit,
        totalPages: Math.ceil(total / validatedLimit)
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.logger.error('查询${moduleName}列表失败', error.stack, {
        errorType: error.constructor.name,
        errorMessage: error.message,
        userId,
        executionTime
      });
      
      throw new InternalServerErrorException('查询${moduleName}列表失败，请稍后重试');
    }
  }

  /**
   * 根据ID查询单个${moduleName}
   * 
   * @param id ${moduleName}ID
   * @param userId 用户ID，用于权限控制
   * @returns 返回${moduleName}详情
   * 
   * @example
   * \`\`\`typescript
   * // 使用示例
   * const ${moduleName.toLowerCase()} = await this.${moduleName.toLowerCase()}Service.findOne(
   *   '123e4567-e89b-12d3-a456-426614174000',
   *   'user123'
   * );
   * \`\`\`
   * 
   * @throws {BadRequestException} 当ID无效时抛出
   * @throws {NotFoundException} 当${moduleName}不存在时抛出
   * @throws {InternalServerErrorException} 当数据库查询失败时抛出
   */
  async findOne(id: string, userId: string): Promise<${moduleName}> {
    const startTime = Date.now();
    
    try {
      // ID验证
      if (!id || id.trim().length === 0) {
        throw new BadRequestException('${moduleName}ID不能为空');
      }
      
      this.logger.debug('查询${moduleName}详情', { id, userId });
      
      const ${moduleName.toLowerCase()} = await this.prisma.${moduleName.toLowerCase()}.findFirst({
        where: {
          id,
          ...this.buildUserFilter(userId)
        }
      });
      
      const executionTime = Date.now() - startTime;
      
      if (!${moduleName.toLowerCase()}) {
        this.logger.warn('${moduleName}不存在', { id, userId, executionTime });
        throw new NotFoundException('${moduleName}不存在');
      }
      
      this.logger.debug('${moduleName}详情查询成功', { id, userId, executionTime });
      
      return ${moduleName.toLowerCase()};
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        this.logger.warn(error.message, { id, userId, executionTime });
        throw error;
      }
      
      this.logger.error('查询${moduleName}详情失败', error.stack, {
        errorType: error.constructor.name,
        errorMessage: error.message,
        id,
        userId,
        executionTime
      });
      
      throw new InternalServerErrorException('查询${moduleName}详情失败，请稍后重试');
    }
  }

  /**
   * 创建新的${moduleName}
   * 
   * @param create${moduleName}Dto 创建${moduleName}的数据
   * @param userId 创建者用户ID
   * @returns 返回创建的${moduleName}
   * 
   * @example
   * \`\`\`typescript
   * // 使用示例
   * const ${moduleName.toLowerCase()} = await this.${moduleName.toLowerCase()}Service.create(
   *   {
   *     name: '新${moduleName}',
   *     description: '${moduleName}描述'
   *   },
   *   'user123'
   * );
   * \`\`\`
   * 
   * @throws {BadRequestException} 当请求数据无效时抛出
   * @throws {ConflictException} 当${moduleName}已存在时抛出
   * @throws {InternalServerErrorException} 当数据库操作失败时抛出
   */
  async create(create${moduleName}Dto: Create${moduleName}Dto, userId: string): Promise<${moduleName}> {
    const startTime = Date.now();
    
    try {
      this.logger.log('创建${moduleName}', {
        userId,
        ${moduleName.toLowerCase()}Name: create${moduleName}Dto.name
      });
      
      // 数据验证和业务规则检查
      await this.validateCreateData(create${moduleName}Dto, userId);
      
      // 创建${moduleName}
      const ${moduleName.toLowerCase()} = await this.prisma.${moduleName.toLowerCase()}.create({
        data: {
          ...create${moduleName}Dto,
          createdBy: userId
        }
      });
      
      const executionTime = Date.now() - startTime;
      
      this.logger.log('${moduleName}创建成功', {
        ${moduleName.toLowerCase()}Id: ${moduleName.toLowerCase()}.id,
        userId,
        executionTime
      });
      
      return ${moduleName.toLowerCase()};
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        this.logger.warn(error.message, { userId, executionTime });
        throw error;
      }
      
      this.logger.error('创建${moduleName}失败', error.stack, {
        errorType: error.constructor.name,
        errorMessage: error.message,
        userId,
        executionTime
      });
      
      throw new InternalServerErrorException('创建${moduleName}失败，请稍后重试');
    }
  }

  /**
   * 更新${moduleName}
   * 
   * @param id ${moduleName}ID
   * @param update${moduleName}Dto 更新数据
   * @param userId 操作者用户ID
   * @returns 返回更新后的${moduleName}
   * 
   * @example
   * \`\`\`typescript
   * // 使用示例
   * const ${moduleName.toLowerCase()} = await this.${moduleName.toLowerCase()}Service.update(
   *   '123e4567-e89b-12d3-a456-426614174000',
   *   {
   *     name: '更新的${moduleName}名称',
   *     description: '更新的${moduleName}描述'
   *   },
   *   'user123'
   * );
   * \`\`\`
   * 
   * @throws {BadRequestException} 当请求数据无效时抛出
   * @throws {NotFoundException} 当${moduleName}不存在时抛出
   * @throws {InternalServerErrorException} 当数据库操作失败时抛出
   */
  async update(id: string, update${moduleName}Dto: Update${moduleName}Dto, userId: string): Promise<${moduleName}> {
    const startTime = Date.now();
    
    try {
      // ID验证
      if (!id || id.trim().length === 0) {
        throw new BadRequestException('${moduleName}ID不能为空');
      }
      
      this.logger.log('更新${moduleName}', {
        id,
        userId,
        updateData: update${moduleName}Dto
      });
      
      // 检查${moduleName}是否存在
      const existing${moduleName} = await this.findOne(id, userId);
      
      // 数据验证和业务规则检查
      await this.validateUpdateData(update${moduleName}Dto, existing${moduleName}, userId);
      
      // 更新${moduleName}
      const ${moduleName.toLowerCase()} = await this.prisma.${moduleName.toLowerCase()}.update({
        where: { id },
        data: {
          ...update${moduleName}Dto,
          updatedBy: userId
        }
      });
      
      const executionTime = Date.now() - startTime;
      
      this.logger.log('${moduleName}更新成功', {
        id,
        userId,
        executionTime
      });
      
      return ${moduleName.toLowerCase()};
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        this.logger.warn(error.message, { id, userId, executionTime });
        throw error;
      }
      
      this.logger.error('更新${moduleName}失败', error.stack, {
        errorType: error.constructor.name,
        errorMessage: error.message,
        id,
        userId,
        executionTime
      });
      
      throw new InternalServerErrorException('更新${moduleName}失败，请稍后重试');
    }
  }

  /**
   * 删除${moduleName}
   * 
   * 支持软删除，将${moduleName}标记为已删除状态
   * 
   * @param id ${moduleName}ID
   * @param userId 操作者用户ID
   * @returns 返回删除结果
   * 
   * @example
   * \`\`\`typescript
   * // 使用示例
   * const result = await this.${moduleName.toLowerCase()}Service.remove(
   *   '123e4567-e89b-12d3-a456-426614174000',
   *   'user123'
   * );
   * \`\`\`
   * 
   * @throws {BadRequestException} 当ID无效时抛出
   * @throws {NotFoundException} 当${moduleName}不存在时抛出
   * @throws {InternalServerErrorException} 当数据库操作失败时抛出
   */
  async remove(id: string, userId: string): Promise<DeleteResult> {
    const startTime = Date.now();
    
    try {
      // ID验证
      if (!id || id.trim().length === 0) {
        throw new BadRequestException('${moduleName}ID不能为空');
      }
      
      this.logger.log('删除${moduleName}', { id, userId });
      
      // 检查${moduleName}是否存在
      await this.findOne(id, userId);
      
      // 软删除${moduleName}
      const result = await this.prisma.${moduleName.toLowerCase()}.update({
        where: { id },
        data: {
          status: '${moduleName.toUpperCase()}_DELETED',
          deletedBy: userId,
          deletedAt: new Date()
        }
      });
      
      const executionTime = Date.now() - startTime;
      
      this.logger.log('${moduleName}删除成功', {
        id,
        userId,
        executionTime
      });
      
      return {
        id,
        deleted: true,
        deletedAt: result.deletedAt
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        this.logger.warn(error.message, { id, userId, executionTime });
        throw error;
      }
      
      this.logger.error('删除${moduleName}失败', error.stack, {
        errorType: error.constructor.name,
        errorMessage: error.message,
        id,
        userId,
        executionTime
      });
      
      throw new InternalServerErrorException('删除${moduleName}失败，请稍后重试');
    }
  }

  /**
   * 构建用户过滤条件
   * 
   * @private
   * @param userId 用户ID
   * @returns 返回用户过滤条件
   */
  private buildUserFilter(userId: string): Prisma.${moduleName}WhereInput {
    // 根据业务需求实现用户权限过滤逻辑
    return {
      // 示例：只返回用户自己创建的${moduleName}
      // createdBy: userId
      
      // 示例：根据用户角色返回不同的${moduleName}
      // 这里可以根据实际业务需求进行调整
    };
  }

  /**
   * 验证创建数据
   * 
   * @private
   * @param create${moduleName}Dto 创建数据
   * @param userId 用户ID
   */
  private async validateCreateData(create${moduleName}Dto: Create${moduleName}Dto, userId: string): Promise<void> {
    // 实现创建数据的业务规则验证
    // 例如：检查名称唯一性、验证关联数据等
  }

  /**
   * 验证更新数据
   * 
   * @private
   * @param update${moduleName}Dto 更新数据
   * @param existing${moduleName} 现有${moduleName}数据
   * @param userId 用户ID
   */
  private async validateUpdateData(
    update${moduleName}Dto: Update${moduleName}Dto,
    existing${moduleName}: ${moduleName},
    userId: string
  ): Promise<void> {
    // 实现更新数据的业务规则验证
    // 例如：检查状态转换是否合法、验证关联数据等
  }
}`;
  }

  /**
   * 生成DTO文档模板
   */
  private generateDtoTemplate(
    moduleName: string,
    className: string,
    author?: string,
    version?: string,
    customTags?: string[]
  ): string {
    const authorTag = author ? ` * @author ${author}` : '';
    const versionTag = version ? ` * @version ${version}` : '';
    const customTagsStr = customTags ? customTags.map(tag => ` * @${tag}`).join('\n') : '';

    return `/**
 * 创建${moduleName}数据传输对象
 * 
 * 用于创建${moduleName}时的请求数据验证和传输
 * 包含${moduleName}创建所需的必要字段和可选字段
 * 
 * @module ${moduleName}
 * @class ${className}
${authorTag}
${versionTag}
 * @since 1.0.0
${customTagsStr}
 */
export class Create${moduleName}Dto {
  /**
   * ${moduleName}名称
   * 
   * @description ${moduleName}的显示名称，用于标识和展示
   * @example "示例${moduleName}"
   * @format string
   * @minLength 2
   * @maxLength 100
   */
  @ApiProperty({ 
    example: '示例${moduleName}', 
    description: '${moduleName}名称' 
  })
  @IsString({ message: '${moduleName}名称必须是字符串' })
  @Length(2, 100, { message: '${moduleName}名称长度应在 2-100 之间' })
  name: string;

  /**
   * ${moduleName}描述
   * 
   * @description ${moduleName}的详细描述信息，用于说明${moduleName}的用途和功能
   * @example "这是一个示例${moduleName}，用于演示功能"
   * @format string
   * @maxLength 500
   */
  @ApiProperty({ 
    example: '这是一个示例${moduleName}，用于演示功能', 
    description: '${moduleName}描述',
    required: false
  })
  @IsString({ message: '${moduleName}描述必须是字符串' })
  @IsOptional()
  @MaxLength(500, { message: '${moduleName}描述长度不能超过 500 字符' })
  description?: string;

  /**
   * ${moduleName}状态
   * 
   * @description ${moduleName}的当前状态，用于控制${moduleName}的可用性
   * @example "ACTIVE"
   * @enum ${moduleName}Status
   */
  @ApiProperty({ 
    example: '${moduleName.toUpperCase()}_ACTIVE', 
    description: '${moduleName}状态',
    enum: ${moduleName}Status,
    required: false
  })
  @IsEnum(${moduleName}Status, { message: '${moduleName}状态值无效' })
  @IsOptional()
  status?: ${moduleName}Status;

  /**
   * ${moduleName}标签
   * 
   * @description 用于分类和搜索的标签数组
   * @example ["tag1", "tag2"]
   * @format array<string>
   */
  @ApiProperty({ 
    example: ['tag1', 'tag2'], 
    description: '${moduleName}标签',
    type: [String],
    required: false
  })
  @IsArray({ message: '标签必须是字符串数组' })
  @IsString({ each: true, message: '每个标签必须是字符串' })
  @IsOptional()
  tags?: string[];

  /**
   * ${moduleName}类型
   * 
   * @description ${moduleName}的类型分类，用于区分不同类型的${moduleName}
   * @example "STANDARD"
   * @enum ${moduleName}Type
   */
  @ApiProperty({ 
    example: 'STANDARD', 
    description: '${moduleName}类型',
    enum: ${moduleName}Type,
    required: false
  })
  @IsEnum(${moduleName}Type, { message: '${moduleName}类型值无效' })
  @IsOptional()
  type?: ${moduleName}Type;
}

/**
 * 更新${moduleName}数据传输对象
 * 
 * 用于更新${moduleName}时的请求数据验证和传输
 * 所有字段都是可选的，只更新提供的字段
 * 
 * @module ${moduleName}
 * @class Update${moduleName}Dto
 * @extends PartialType<Create${moduleName}Dto>
${authorTag}
${versionTag}
 * @since 1.0.0
${customTagsStr}
 */
export class Update${moduleName}Dto extends PartialType(Create${moduleName}Dto) {
  /**
   * 更新时间戳
   * 
   * @description 自动设置的时间戳，用于记录更新时间
   * @example "2023-01-01T00:00:00.000Z"
   * @format date-time
   * @readonly
   */
  @ApiProperty({ 
    example: '2023-01-01T00:00:00.000Z', 
    description: '更新时间戳',
    readOnly: true
  })
  updatedAt?: Date;
}

/**
 * 查询${moduleName}数据传输对象
 * 
 * 用于查询${moduleName}列表时的参数验证和传输
 * 支持分页、搜索和过滤功能
 * 
 * @module ${moduleName}
 * @class Query${moduleName}Dto
${authorTag}
${versionTag}
 * @since 1.0.0
${customTagsStr}
 */
export class Query${moduleName}Dto {
  /**
   * 页码
   * 
   * @description 当前页码，从1开始
   * @example 1
   * @format number
   * @minimum 1
   */
  @ApiProperty({ 
    example: 1, 
    description: '页码，从1开始',
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码必须大于0' })
  page?: number = 1;

  /**
   * 每页数量
   * 
   * @description 每页返回的记录数量，最大值为100
   * @example 10
   * @format number
   * @minimum 1
   * @maximum 100
   */
  @ApiProperty({ 
    example: 10, 
    description: '每页数量，最大值为100',
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '每页数量必须是整数' })
  @Min(1, { message: '每页数量必须大于0' })
  @Max(100, { message: '每页数量不能超过100' })
  limit?: number = 10;

  /**
   * 搜索关键词
   * 
   * @description 用于搜索${moduleName}名称和描述的关键词
   * @example "关键词"
   * @format string
   */
  @ApiProperty({ 
    example: '关键词', 
    description: '搜索关键词',
    required: false
  })
  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  search?: string;

  /**
   * 状态过滤
   * 
   * @description 按状态过滤${moduleName}
   * @example "ACTIVE"
   * @enum ${moduleName}Status
   */
  @ApiProperty({ 
    example: '${moduleName.toUpperCase()}_ACTIVE', 
    description: '状态过滤',
    enum: ${moduleName}Status,
    required: false
  })
  @IsOptional()
  @IsEnum(${moduleName}Status, { message: '状态值无效' })
  status?: ${moduleName}Status;

  /**
   * 类型过滤
   * 
   * @description 按类型过滤${moduleName}
   * @example "STANDARD"
   * @enum ${moduleName}Type
   */
  @ApiProperty({ 
    example: 'STANDARD', 
    description: '类型过滤',
    enum: ${moduleName}Type,
    required: false
  })
  @IsOptional()
  @IsEnum(${moduleName}Type, { message: '类型值无效' })
  type?: ${moduleName}Type;

  /**
   * 排序字段
   * 
   * @description 指定排序的字段名
   * @example "createdAt"
   * @format string
   */
  @ApiProperty({ 
    example: 'createdAt', 
    description: '排序字段',
    required: false
  })
  @IsOptional()
  @IsString({ message: '排序字段必须是字符串' })
  sortBy?: string;

  /**
   * 排序方向
   * 
   * @description 排序方向，升序或降序
   * @example "desc"
   * @enum "asc" | "desc"
   */
  @ApiProperty({ 
    example: 'desc', 
    description: '排序方向',
    enum: ['asc', 'desc'],
    required: false
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: '排序方向必须是 asc 或 desc' })
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * ${moduleName}响应数据传输对象
 * 
 * 用于返回${moduleName}数据时的标准化响应格式
 * 包含${moduleName}的基本信息和关联数据
 * 
 * @module ${moduleName}
 * @class ${moduleName}Dto
${authorTag}
${versionTag}
 * @since 1.0.0
${customTagsStr}
 */
export class ${moduleName}Dto {
  /**
   * ${moduleName}ID
   * 
   * @description ${moduleName}的唯一标识符
   * @example "123e4567-e89b-12d3-a456-426614174000"
   * @format uuid
   */
  @ApiProperty({ 
    example: '123e4567-e89b-12d3-a456-426614174000', 
    description: '${moduleName}ID' 
  })
  id: string;

  /**
   * ${moduleName}名称
   * 
   * @description ${moduleName}的显示名称
   * @example "示例${moduleName}"
   * @format string
   */
  @ApiProperty({ 
    example: '示例${moduleName}', 
    description: '${moduleName}名称' 
  })
  name: string;

  /**
   * ${moduleName}描述
   * 
   * @description ${moduleName}的详细描述信息
   * @example "这是一个示例${moduleName}"
   * @format string
   */
  @ApiProperty({ 
    example: '这是一个示例${moduleName}', 
    description: '${moduleName}描述' 
  })
  description?: string;

  /**
   * ${moduleName}状态
   * 
   * @description ${moduleName}的当前状态
   * @example "ACTIVE"
   * @enum ${moduleName}Status
   */
  @ApiProperty({ 
    example: '${moduleName.toUpperCase()}_ACTIVE', 
    description: '${moduleName}状态',
    enum: ${moduleName}Status
  })
  status: ${moduleName}Status;

  /**
   * ${moduleName}类型
   * 
   * @description ${moduleName}的类型分类
   * @example "STANDARD"
   * @enum ${moduleName}Type
   */
  @ApiProperty({ 
    example: 'STANDARD', 
    description: '${moduleName}类型',
    enum: ${moduleName}Type
  })
  type?: ${moduleName}Type;

  /**
   * ${moduleName}标签
   * 
   * @description 用于分类和搜索的标签数组
   * @example ["tag1", "tag2"]
   * @format array<string>
   */
  @ApiProperty({ 
    example: ['tag1', 'tag2'], 
    description: '${moduleName}标签',
    type: [String]
  })
  tags?: string[];

  /**
   * 创建时间
   * 
   * @description ${moduleName}的创建时间
   * @example "2023-01-01T00:00:00.000Z"
   * @format date-time
   */
  @ApiProperty({ 
    example: '2023-01-01T00:00:00.000Z', 
    description: '创建时间' 
  })
  createdAt: Date;

  /**
   * 更新时间
   * 
   * @description ${moduleName}的最后更新时间
   * @example "2023-01-01T00:00:00.000Z"
   * @format date-time
   */
  @ApiProperty({ 
    example: '2023-01-01T00:00:00.000Z', 
    description: '更新时间' 
  })
  updatedAt: Date;
}`;
  }

  /**
   * 生成实体文档模板
   */
  private generateEntityTemplate(
    moduleName: string,
    className: string,
    author?: string,
    version?: string,
    customTags?: string[]
  ): string {
    const authorTag = author ? ` * @author ${author}` : '';
    const versionTag = version ? ` * @version ${version}` : '';
    const customTagsStr = customTags ? customTags.map(tag => ` * @${tag}`).join('\n') : '';

    return `/**
 * ${moduleName}实体模型
 * 
 * 定义${moduleName}在数据库中的结构和关系
 * 包含${moduleName}的所有字段和数据库映射配置
 * 
 * @module ${moduleName}
 * @class ${className}
${authorTag}
${versionTag}
 * @since 1.0.0
${customTagsStr}
 */
@Entity('${moduleName.toLowerCase()}')
export class ${className} {
  /**
   * 主键ID
   * 
   * @description ${moduleName}的唯一标识符，使用UUID格式
   * @example "123e4567-e89b-12d3-a456-426614174000"
   * @format uuid
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * ${moduleName}名称
   * 
   * @description ${moduleName}的显示名称，用于标识和展示
   * @example "示例${moduleName}"
   * @format string
   * @maxLength 100
   */
  @Column({ 
    type: 'varchar', 
    length: 100,
    comment: '${moduleName}名称'
  })
  name: string;

  /**
   * ${moduleName}描述
   * 
   * @description ${moduleName}的详细描述信息，用于说明${moduleName}的用途和功能
   * @example "这是一个示例${moduleName}，用于演示功能"
   * @format text
   * @maxLength 500
   */
  @Column({ 
    type: 'text', 
    nullable: true,
    comment: '${moduleName}描述'
  })
  description?: string;

  /**
   * ${moduleName}状态
   * 
   * @description ${moduleName}的当前状态，用于控制${moduleName}的可用性
   * @example "${moduleName.toUpperCase()}_ACTIVE"
   * @enum ${moduleName}Status
   * @default "${moduleName.toUpperCase()}_ACTIVE"
   */
  @Column({ 
    type: 'enum', 
    enum: ${moduleName}Status,
    default: ${moduleName}Status.${moduleName.toUpperCase()}_ACTIVE,
    comment: '${moduleName}状态'
  })
  status: ${moduleName}Status = ${moduleName}Status.${moduleName.toUpperCase()}_ACTIVE;

  /**
   * ${moduleName}类型
   * 
   * @description ${moduleName}的类型分类，用于区分不同类型的${moduleName}
   * @example "STANDARD"
   * @enum ${moduleName}Type
   * @default "STANDARD"
   */
  @Column({ 
    type: 'enum', 
    enum: ${moduleName}Type,
    default: ${moduleName}Type.STANDARD,
    nullable: true,
    comment: '${moduleName}类型'
  })
  type?: ${moduleName}Type;

  /**
   * ${moduleName}标签
   * 
   * @description 用于分类和搜索的标签数组，以JSON格式存储
   * @example ["tag1", "tag2"]
   * @format json
   */
  @Column({ 
    type: 'json', 
    nullable: true,
    comment: '${moduleName}标签'
  })
  tags?: string[];

  /**
   * 创建者ID
   * 
   * @description 创建${moduleName}的用户ID
   * @example "123e4567-e89b-12d3-a456-426614174000"
   * @format uuid
   */
  @Column({ 
    type: 'uuid', 
    nullable: true,
    comment: '创建者ID'
  })
  createdBy?: string;

  /**
   * 更新者ID
   * 
   * @description 最后更新${moduleName}的用户ID
   * @example "123e4567-e89b-12d3-a456-426614174000"
   * @format uuid
   */
  @Column({ 
    type: 'uuid', 
    nullable: true,
    comment: '更新者ID'
  })
  updatedBy?: string;

  /**
   * 删除者ID
   * 
   * @description 删除${moduleName}的用户ID
   * @example "123e4567-e89b-12d3-a456-426614174000"
   * @format uuid
   */
  @Column({ 
    type: 'uuid', 
    nullable: true,
    comment: '删除者ID'
  })
  deletedBy?: string;

  /**
   * 创建时间
   * 
   * @description ${moduleName}的创建时间，自动设置
   * @example "2023-01-01T00:00:00.000Z"
   * @format date-time
   */
  @CreateDateColumn({ 
    type: 'timestamp',
    comment: '创建时间'
  })
  createdAt: Date;

  /**
   * 更新时间
   * 
   * @description ${moduleName}的最后更新时间，自动更新
   * @example "2023-01-01T00:00:00.000Z"
   * @format date-time
   */
  @UpdateDateColumn({ 
    type: 'timestamp',
    comment: '更新时间'
  })
  updatedAt: Date;

  /**
   * 删除时间
   * 
   * @description ${moduleName}的删除时间，软删除时设置
   * @example "2023-01-01T00:00:00.000Z"
   * @format date-time
   */
  @Column({ 
    type: 'timestamp', 
    nullable: true,
    comment: '删除时间'
  })
  deletedAt?: Date;

  // 关联关系定义

  /**
   * 创建者用户
   * 
   * @description 创建${moduleName}的用户信息
   */
  @ManyToOne(() => User, user => user.created${moduleName}s)
  @JoinColumn({ name: 'createdBy' })
  creator?: User;

  /**
   * 更新者用户
   * 
   * @description 最后更新${moduleName}的用户信息
   */
  @ManyToOne(() => User, user => user.updated${moduleName}s)
  @JoinColumn({ name: 'updatedBy' })
  updater?: User;

  /**
   * 删除者用户
   * 
   * @description 删除${moduleName}的用户信息
   */
  @ManyToOne(() => User, user => user.deleted${moduleName}s)
  @JoinColumn({ name: 'deletedBy' })
  deleter?: User;

  // 索引定义

  /**
   * 名称索引
   * 
   * @description 基于名称的索引，用于提高搜索性能
   */
  @Index(['name'])
  
  /**
   * 状态索引
   * 
   * @description 基于状态的索引，用于提高过滤性能
   */
  @Index(['status'])
  
  /**
   * 创建者索引
   * 
   * @description 基于创建者的索引，用于提高用户相关查询性能
   */
  @Index(['createdBy'])
  
  /**
   * 复合索引
   * 
   * @description 基于状态和创建时间的复合索引，用于提高列表查询性能
   */
  @Index(['status', 'createdAt'])
}`;
  }

  /**
   * 生成模块文档模板
   */
  private generateModuleTemplate(
    moduleName: string,
    className: string,
    author?: string,
    version?: string,
    customTags?: string[]
  ): string {
    const authorTag = author ? ` * @author ${author}` : '';
    const versionTag = version ? ` * @version ${version}` : '';
    const customTagsStr = customTags ? customTags.map(tag => ` * @${tag}`).join('\n') : '';

    return `/**
 * ${moduleName}模块
 * 
 * 负责${moduleName}相关的功能模块组织
 * 包含${moduleName}控制器、服务、DTO等组件的依赖注入配置
 * 
 * @module ${moduleName}
 * @class ${className}
${authorTag}
${versionTag}
 * @since 1.0.0
${customTagsStr}
 */
@Module({
  imports: [
    // 数据库相关模块
    PrismaModule,
    
    // 公共模块
    CommonModule,
    
    // 认证授权模块
    AuthModule,
    
    // 其他依赖模块
    // 根据实际需求添加
  ],
  controllers: [
    ${moduleName}Controller,
  ],
  providers: [
    ${moduleName}Service,
    
    // 其他服务提供者
    // 根据实际需求添加
  ],
  exports: [
    ${moduleName}Service,
  ],
})
export class ${className} {}`;
  }

  /**
   * 保存模板到文件
   * @param config 文档模板配置
   * @param content 模板内容
   */
  saveTemplateToFile(config: DocumentTemplateConfig, content: string): void {
    const { type, moduleName, className } = config;
    const fileName = `${className.toLowerCase()}.template.ts`;
    const typeDir = this.getTypeDirectory(type);
    const moduleDir = path.join(this.outputDir, typeDir, moduleName.toLowerCase());
    
    this.ensureDirectoryExists(moduleDir);
    
    const filePath = path.join(moduleDir, fileName);
    fs.writeFileSync(filePath, content, 'utf8');
    
    console.log(`模板已保存到: ${filePath}`);
  }

  /**
   * 获取类型对应的目录名
   * @param type 文档模板类型
   * @returns 目录名
   */
  private getTypeDirectory(type: DocumentTemplateType): string {
    const typeMap = {
      [DocumentTemplateType.CONTROLLER]: 'controllers',
      [DocumentTemplateType.SERVICE]: 'services',
      [DocumentTemplateType.DTO]: 'dtos',
      [DocumentTemplateType.ENTITY]: 'entities',
      [DocumentTemplateType.MODULE]: 'modules',
      [DocumentTemplateType.GUARD]: 'guards',
      [DocumentTemplateType.INTERCEPTOR]: 'interceptors',
      [DocumentTemplateType.FILTER]: 'filters',
      [DocumentTemplateType.MIDDLEWARE]: 'middleware'
    };
    
    return typeMap[type] || 'others';
  }

  /**
   * 确保目录存在
   * @param dirPath 目录路径
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
 * \`\`\`typescript
 * // 创建模板生成器
 * const generator = new ApiDocumentTemplateGenerator();
 * 
 * // 生成控制器模板
 * const controllerConfig: DocumentTemplateConfig = {
 *   type: DocumentTemplateType.CONTROLLER,
 *   moduleName: 'Device',
 *   className: 'DeviceController',
 *   author: '开发团队',
 *   version: '1.0.0',
 *   customTags: ['deprecated', 'experimental']
 * };
 * 
 * const controllerTemplate = generator.generateTemplate(controllerConfig);
 * generator.saveTemplateToFile(controllerConfig, controllerTemplate);
 * 
 * // 生成服务模板
 * const serviceConfig: DocumentTemplateConfig = {
 *   type: DocumentTemplateType.SERVICE,
 *   moduleName: 'Device',
 *   className: 'DeviceService',
 *   author: '开发团队',
 *   version: '1.0.0'
 * };
 * 
 * const serviceTemplate = generator.generateTemplate(serviceConfig);
 * generator.saveTemplateToFile(serviceConfig, serviceTemplate);
 * \`\`\`
 */
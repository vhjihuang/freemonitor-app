import { Injectable, Inject, BadRequestException, UnauthorizedException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenResponse, UserResponseDto, Role } from '@freemonitor/types';
import { PrismaService } from '../../prisma/prisma.service';
import { BcryptHashingService } from '../hashing/hashing.service';
import { HASHING_SERVICE } from '../hashing/hashing.service.token';
import { JwtConfig } from '../config/jwt.config';
import { MailService } from '../mail/mail.service';
import { AppLoggerService } from '../common/services/logger.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private logger;
  
  constructor(
    private prisma: PrismaService,
    @Inject(HASHING_SERVICE) private hashingService: BcryptHashingService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
    private tokenBlacklistService: TokenBlacklistService,
    private appLoggerService: AppLoggerService
  ) {
    this.logger = appLoggerService.createLogger(AuthService.name);
    this.logger.debug('AuthService初始化完成');
  }

  /**
   * 验证用户凭据
   * @param email 邮箱
   * @param password 明文密码
   * @returns 用户对象（不含密码）
   */
  async validateUser(email: string, password: string ): Promise< UserResponseDto | null> {
    const startTime = Date.now();
    
    // 输入验证
    if (!email || !password) {
      this.logger.warn('用户验证失败: 邮箱或密码为空');
      return null;
    }
    
    this.logger.debug(`开始验证用户: ${email}`);

    try {
      // 查找用户
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          role: true,
          isActive: true,
          deletedAt: true
        }
      });
      
      this.logger.debug('用户查询完成', { email, userFound: !!user });

      // 检查用户是否存在
      if (!user) {
        const executionTime = Date.now() - startTime;
        this.logger.warn('用户验证失败: 用户不存在', {
          email,
          executionTime
        });
        return null;
      }

      // 检查用户是否被删除或禁用
      if (user.deletedAt !== null || !user.isActive) {
        const executionTime = Date.now() - startTime;
        this.logger.warn('用户验证失败: 用户已被删除或禁用', {
          email,
          userId: user.id,
          isActive: user.isActive,
          deletedAt: user.deletedAt,
          executionTime
        });
        return null;
      }

      // 验证密码
      const isPasswordValid = await this.hashingService.compare(password, user.password);
      
      const executionTime = Date.now() - startTime;
      
      if (!isPasswordValid) {
        this.logger.warn('用户验证失败: 密码不正确', {
          email,
          userId: user.id,
          executionTime
        });
        return null;
      }

      // 验证成功，不返回密码
      const userResponse: UserResponseDto = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as Role
      };

      this.logger.log('用户验证成功', undefined, {
        userId: user.id,
        email: user.email,
        role: user.role,
        executionTime
      });

      return userResponse;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        '用户验证过程中发生错误', 
        error.stack,
        undefined,
        {
          email,
          errorType: error.constructor.name,
          errorMessage: error.message,
          executionTime
        }
      );
      throw error;
    }
  }

  /**
   * 生成访问令牌
   * @param userId 用户ID
   * @param email 用户邮箱
   * @returns 访问令牌和过期时间
   */
  private generateAccessToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    const jwtConfig = this.configService.get<JwtConfig>('jwt');
    
    return this.jwtService.sign(payload, {
      expiresIn: jwtConfig.expiresIn
    });
  }

  /**
   * 生成并存储刷新令牌
   * @param userId 用户ID
   * @param ipAddress IP地址
   * @param userAgent 用户代理
   * @returns 刷新令牌
   */
  private async generateRefreshToken(
    userId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<string> {
    const startTime = Date.now();
    
    this.logger.debug('开始生成刷新令牌', { userId, ipAddress, userAgent });
    
    try {
      // 生成随机刷新令牌
      const refreshToken = this.jwtService.sign({}, {
        expiresIn: '7d', // 刷新令牌有效期7天
        secret: this.configService.get('JWT_REFRESH_SECRET') || 'default-refresh-secret'
      });

      // 计算过期时间（7天）
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // 存储刷新令牌到数据库
      await this.prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId,
          expiresAt,
          ipAddress,
          userAgent
        }
      });
      
      const executionTime = Date.now() - startTime;
      this.logger.debug('刷新令牌生成并存储成功', undefined, {
        userId,
        executionTime
      });

      return refreshToken;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        '生成刷新令牌过程中发生错误', 
        error.stack,
        undefined,
        {
          userId,
          ipAddress,
          userAgent,
          errorType: error.constructor.name,
          errorMessage: error.message,
          executionTime
        }
      );
      throw error;
    }
  }

  /**
   * 用户登录
   * @param loginDto 登录信息
   * @param ipAddress IP地址
   * @param userAgent 用户代理
   * @returns 访问令牌和用户信息
   */
  async login(loginDto: LoginDto, ipAddress: string, userAgent: string): Promise<TokenResponse> {
    const startTime = Date.now();
    const requestInfo = { email: loginDto.email, ipAddress, userAgent };
    
    this.logger.debug('开始用户登录流程', requestInfo);
    
    // 输入验证
    if (!loginDto.email || !loginDto.password) {
      this.logger.warn('登录请求失败: 邮箱或密码为空', requestInfo);
      throw new BadRequestException('邮箱和密码不能为空');
    }

    try {
      // 验证用户凭据
      const user = await this.validateUser(loginDto.email, loginDto.password);
      
      if (!user) {
        this.logger.warn('登录失败: 无效的邮箱或密码', requestInfo);
        throw new UnauthorizedException('无效的邮箱或密码');
      }

      // 更新用户最后登录时间
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
      
      // 生成访问令牌
      const accessToken = this.generateAccessToken(user.id, user.email);
      
      // 生成并存储刷新令牌
      const refreshToken = await this.generateRefreshToken(user.id, ipAddress, userAgent);
      
      const executionTime = Date.now() - startTime;
      this.logger.log('用户登录成功', undefined, {
        userId: user.id,
        email: user.email,
        role: user.role,
        executionTime
      });

      return {
        accessToken,
        refreshToken,
        expiresIn: this.configService.get<number>('JWT_EXPIRES_IN_SECONDS', 900),
        user
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // 如果是我们主动抛出的异常，保留其原始错误类型和消息
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        this.logger.warn(error.message, {
          ...requestInfo,
          executionTime
        });
        throw error;
      }
      
      // 其他错误视为系统错误
      this.logger.error(
        '用户登录过程中发生错误', 
        error.stack,
        undefined,
        {
          ...requestInfo,
          errorType: error.constructor.name,
          errorMessage: error.message,
          executionTime
        }
      );
      throw new InternalServerErrorException('登录失败，请稍后再试');
    }
  }

  /**
   * 用户注册
   * @param registerDto 注册信息
   * @returns 访问令牌和用户信息
   */
  async register(registerDto: RegisterDto, ipAddress: string, userAgent: string) {
    // 检查用户是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email }
    });

    if (existingUser) {
      throw new ConflictException('邮箱已被注册');
    }

    // 密码加密
    const hashedPassword = await this.hashingService.hash(registerDto.password);

    // 创建新用户
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        name: registerDto.name,
        // 默认为普通用户角色，如果需要管理员可以另外设置
        role: 'USER',
        isActive: true,
        lastLoginAt: new Date()
      },
      select: { 
        id: true, 
        email: true, 
        name: true,
        role: true
      }
    });

    // 生成JWT令牌
    const payload = { sub: user.id, email: user.email };
    const jwtConfig = this.configService.get<JwtConfig>('jwt');
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: jwtConfig.expiresIn
    });

    // 生成并存储刷新令牌
    const refreshToken = await this.generateRefreshToken(user.id, ipAddress, userAgent);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get<number>('JWT_EXPIRES_IN_SECONDS', 900),
      user: {
        ...user,
        role: user.role as Role
      }
    };
  }

  /**
   * 刷新 access token
   */
  async refresh(token: string, ipAddress: string, userAgent: string): Promise<{ accessToken: string; user: UserResponseDto, expiresIn: number }> {
    const startTime = Date.now();
    const requestInfo = { ipAddress, userAgent };
    
    this.logger.debug('开始刷新访问令牌', requestInfo);
    
    try {
      // 检查token是否为空
      if (!token) {
        this.logger.warn('刷新令牌验证失败: 刷新令牌为空', requestInfo);
        throw new UnauthorizedException('刷新令牌无效');
      }
      
      this.logger.debug(`获取到刷新令牌: ${token.substring(0, 10)}...`);

      // 检查令牌是否在黑名单中
      if (await this.tokenBlacklistService.isTokenBlacklisted(token)) {
        this.logger.warn('刷新令牌验证失败: 令牌已被撤销', requestInfo);
        throw new UnauthorizedException('刷新令牌已被撤销');
      }
      
      // 验证刷新令牌
      let decodedToken: any;
      try {
        decodedToken = this.jwtService.verify(token, {
          secret: this.configService.get('JWT_REFRESH_SECRET') || 'default-refresh-secret'
        });
      } catch (error) {
        this.logger.warn('刷新令牌验证失败: 令牌已过期或无效', { 
          ...requestInfo,
          errorType: error.constructor.name 
        });
        throw new UnauthorizedException('刷新令牌无效');
      }
      
      this.logger.debug('刷新令牌验证成功', requestInfo);

      // 查找令牌记录
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!tokenRecord || tokenRecord.revoked || tokenRecord.expiresAt < new Date()) {
        this.logger.warn('刷新令牌验证失败: 令牌记录无效或已过期', { 
          ...requestInfo,
          tokenExists: !!tokenRecord,
          tokenRevoked: tokenRecord?.revoked,
          tokenExpired: tokenRecord?.expiresAt < new Date()
        });
        throw new UnauthorizedException('刷新令牌无效');
      }

      // 检查用户状态
      const user = tokenRecord.user;
      if (!user.isActive || user.deletedAt !== null) {
        this.logger.warn('刷新令牌验证失败: 用户状态异常', { 
          ...requestInfo,
          userId: user.id,
          isActive: user.isActive,
          deletedAt: user.deletedAt
        });
        throw new UnauthorizedException('用户状态异常');
      }

      // 撤销旧的刷新令牌
      await this.prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revoked: true }
      });
      
      this.logger.debug('旧的刷新令牌已成功撤销', { 
        ...requestInfo,
        tokenId: tokenRecord.id 
      });

      // 生成新的访问令牌
      const newAccessToken = this.generateAccessToken(user.id, user.email);
      
      // 生成新的刷新令牌
      const newRefreshToken = await this.generateRefreshToken(user.id, ipAddress, userAgent);
      
      const executionTime = Date.now() - startTime;
      this.logger.log('访问令牌刷新成功', undefined, {
        userId: user.id,
        email: user.email,
        role: user.role,
        executionTime
      });

      return {
        accessToken: newAccessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as Role
        },
        expiresIn: this.configService.get<number>('JWT_EXPIRES_IN_SECONDS', 900)
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // 如果是我们主动抛出的异常，保留其原始错误类型和消息
      if (error instanceof UnauthorizedException) {
        this.logger.warn(error.message, { ...requestInfo, executionTime });
        throw error;
      }
      
      // 其他错误视为系统错误
      this.logger.error(
        '刷新令牌验证失败', 
        error.stack,
        undefined,
        {
          ...requestInfo,
          errorType: error.constructor.name,
          errorMessage: error.message,
          executionTime: executionTime
        }
      );
      throw new UnauthorizedException('刷新令牌无效');
    }
  }

  /**
   * 用户登出，撤销刷新令牌
   */
  async logout(refreshToken: string): Promise<void> {
    const startTime = Date.now();
    
    this.logger.debug('开始用户登出流程');
    
    // 检查刷新令牌是否为空
    if (!refreshToken) {
      this.logger.warn('登出失败: 刷新令牌为空');
      throw new BadRequestException('刷新令牌不能为空');
    }
    
    this.logger.debug(`获取到刷新令牌: ${refreshToken.substring(0, 10)}...`);

    try {
      // 查找并撤销刷新令牌
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken }
      });
      
      this.logger.debug('刷新令牌数据库查询完成');

      if (tokenRecord && !tokenRecord.revoked) {
        // 标记刷新令牌为已撤销
        await this.prisma.refreshToken.update({
          where: { id: tokenRecord.id },
          data: { revoked: true }
        });
        
        const executionTime = Date.now() - startTime;
        this.logger.log(`用户登出成功: 用户ID ${tokenRecord.userId}`, {
          userId: tokenRecord.userId,
          tokenId: tokenRecord.id,
          executionTime: executionTime
        });
      } else {
        this.logger.warn('登出请求处理: 无效的或已撤销的刷新令牌', {
          tokenExists: !!tokenRecord,
          tokenRevoked: tokenRecord?.revoked
        });
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        '用户登出过程中发生错误', 
        error.stack,
        undefined,
        {
          errorType: error.constructor.name,
          errorMessage: error.message,
          executionTime: executionTime
        }
      );
      // 不抛出错误，确保即使在异常情况下用户也能登出
    }
  }

  /**
   * 生成密码重置令牌
   * @param email 用户邮箱
   */
  async generatePasswordResetToken(email: string): Promise<void> {
    const startTime = Date.now();
    const requestInfo = { email };
    
    this.logger.debug('开始密码重置令牌生成流程', requestInfo);
    
    // 验证邮箱格式
    if (!email || !email.includes('@')) {
      this.logger.warn('密码重置请求失败: 无效的邮箱格式', requestInfo);
      throw new BadRequestException('请提供有效的邮箱地址');
    }

    try {
      // 查找用户
      const user = await this.prisma.user.findUnique({
        where: { email, isActive: true },
      });

      this.logger.debug('用户查询完成', { ...requestInfo, userFound: !!user });

      if (!user) {
        // 为了安全，即使用户不存在也不透露信息
        this.logger.warn('密码重置请求处理: 未找到活跃用户', requestInfo);
        return;
      }

      // 生成随机令牌
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      // 设置令牌过期时间（1小时）
      const expiresAt = new Date(Date.now() + 3600000);

      this.logger.debug('生成密码重置令牌', {
        userId: user.id,
        email: user.email,
        tokenSnippet: token.substring(0, 10) + '...',
        expiresAt: expiresAt
      });

      // 保存令牌和过期时间到数据库
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: token,
          passwordResetExpiresAt: expiresAt,
        },
      });

      this.logger.debug('密码重置令牌已保存到数据库', { userId: user.id });

      // 发送包含重置链接的邮件给用户
      await this.mailService.sendPasswordResetEmail(user.email, token);
      
      const executionTime = Date.now() - startTime;
      this.logger.log('密码重置令牌生成成功并已发送邮件', {
        userId: user.id,
        email: user.email,
        executionTime: executionTime
      });
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        '生成密码重置令牌过程中发生错误', 
        error.stack,
        undefined,
        {
          ...requestInfo,
          errorType: error.constructor.name,
          errorMessage: error.message,
          executionTime: executionTime
        }
      );
      throw new InternalServerErrorException('生成密码重置令牌失败，请稍后再试');
    }
  }

  /**
   * 根据邮箱获取重置令牌（仅用于测试）
   * @param email 用户邮箱
   * @returns 重置令牌
   */
  async getResetTokenByEmail(email: string): Promise<string | null> {
    const startTime = Date.now();
    const requestInfo = { email };
    
    this.logger.debug('开始获取重置令牌（测试方法）', requestInfo);
    
    // 验证邮箱格式
    if (!email || !email.includes('@')) {
      this.logger.warn('获取重置令牌失败: 无效的邮箱格式', requestInfo);
      return null;
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { email }
      });
      
      const executionTime = Date.now() - startTime;
      this.logger.debug('获取重置令牌完成（测试方法）', {
        ...requestInfo,
        userFound: !!user,
        tokenExists: !!user?.passwordResetToken,
        executionTime: executionTime
      });
      
      return user?.passwordResetToken || null;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(
        '获取重置令牌过程中发生错误（测试方法）', 
        error.stack,
        undefined,
        {
          ...requestInfo,
          errorType: error.constructor.name,
          errorMessage: error.message,
          executionTime: executionTime
        }
      );
      return null;
    }
  }

  /**
   * 使用重置令牌更新密码
   * @param token 重置令牌
   * @param password 新密码
   */
  async updatePasswordWithResetToken(token: string, password: string): Promise<void> {
    const startTime = Date.now();
    const requestInfo = { token: token.substring(0, 10) + '...' };
    
    this.logger.debug('开始使用重置令牌更新密码流程', requestInfo);
    
    // 验证输入
    if (!token || !password) {
      this.logger.warn('密码重置请求失败: 令牌或新密码为空', requestInfo);
      throw new BadRequestException('令牌和新密码不能为空');
    }
    
    // 密码强度验证
    if (password.length < 8) {
      this.logger.warn('密码重置请求失败: 密码长度不足', requestInfo);
      throw new BadRequestException('新密码至少需要8个字符');
    }

    try {
      // 查找令牌有效且未过期的用户
      const user = await this.prisma.user.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpiresAt: {
            gte: new Date(),
          },
          isActive: true,
        },
      });

      this.logger.debug('用户查询完成', { ...requestInfo, userFound: !!user });

      if (!user) {
        this.logger.warn('密码重置请求失败: 无效或已过期的重置令牌', requestInfo);
        throw new BadRequestException('无效或已过期的重置令牌');
      }

      // 加密新密码
      const hashedPassword = await this.hashingService.hash(password);
      
      this.logger.debug('密码加密完成', { userId: user.id });

      // 更新用户密码并清除重置令牌
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpiresAt: null,
        },
      });
      
      const executionTime = Date.now() - startTime;
      this.logger.log('用户密码重置成功', {
        userId: user.id,
        email: user.email,
        executionTime: executionTime
      });
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // 如果是我们主动抛出的异常，保留其原始错误类型和消息
      if (error instanceof BadRequestException) {
        this.logger.warn(error.message, {
          ...requestInfo,
          executionTime: executionTime
        });
        throw error;
      }
      
      // 其他错误视为系统错误
      this.logger.error(
        '更新密码过程中发生错误', 
        error.stack,
        undefined,
        {
          ...requestInfo,
          errorType: error.constructor.name,
          errorMessage: error.message,
          executionTime: executionTime
        }
      );
      throw new InternalServerErrorException('更新密码失败，请稍后再试');
    }
  }
}
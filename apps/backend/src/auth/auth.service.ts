import { Injectable, Inject, Logger, UnauthorizedException, ConflictException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { BcryptHashingService } from "../hashing/hashing.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from '@nestjs/config'
import { UserResponseDto } from './dto/user.response.dto'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { TokenResponse } from '@freemonitor/types'
import { HASHING_SERVICE } from '../hashing/hashing.service.token'
import { JwtConfig } from '../config/jwt.config'
import { MailService } from '../mail/mail.service'

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name)
  constructor(
    private prisma: PrismaService,
    @Inject(HASHING_SERVICE) private hashingService: BcryptHashingService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService
  ) {}

  /**
   * 验证用户凭据
   * @param email 邮箱
   * @param password 明文密码
   * @returns 用户对象（不含密码）
   */
  async validateUser(email: string, password: string ) : Promise< UserResponseDto | null> {
    if (!email || !password ) return null;
    try {
      const user = await this.prisma.user.findUnique({
        where: { email, deletedAt: null, isActive: true },
        select: { id: true, email: true, name: true, password: true }
      })

      if (!user?.password) return null;

      const isPasswordValid  = await this.hashingService.compare(password, user.password);
      if(!isPasswordValid) return null;

      return new UserResponseDto({
        id: String(user.id),
        email: user.email,
        name: user.name ?? undefined
      })

    } catch(error) {
       this.logger.error(`登录失败: ${email}`, error.stack);
      throw error;
    }
  }

  async login(loginDto: LoginDto){
    if (!loginDto.email || !loginDto.password) throw new UnauthorizedException('邮箱和密码不能为空');
    const user = await this.validateUser(loginDto.email, loginDto.password)
    if (!user) throw new UnauthorizedException('邮箱或密码错误')

    const payload = { sub: user.id, email: user.email }
    const jwtConfig = this.configService.get<JwtConfig>('jwt');
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: jwtConfig.expiresIn
    })

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: jwtConfig.refreshIn
    })

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get<number>('JWT_EXPIRES_IN_SECONDS', 900),
      user
    }
  }

  /**
   * 用户注册
   * @param registerDto 注册信息
   * @returns 访问令牌和用户信息
   */
  async register(registerDto: RegisterDto) {
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
        isActive: true
      },
      select: { 
        id: true, 
        email: true, 
        name: true 
      }
    });

    // 生成JWT令牌
    const payload = { sub: user.id, email: user.email };
    const jwtConfig = this.configService.get<JwtConfig>('jwt');
    
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: jwtConfig.expiresIn
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: jwtConfig.refreshIn
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get<number>('JWT_EXPIRES_IN_SECONDS', 900),
      user: new UserResponseDto({
        id: String(user.id),
        email: user.email,
        name: user.name ?? undefined
      })
    };
  }

  /**
   * 刷新 access token（可选实现）
   */
  async refresh(token: string): Promise<{ accessToken: string; user: UserResponseDto }> {
    try {
      const jwtConfig = this.configService.get<JwtConfig>('jwt')
      const payload = this.jwtService.verify(token, {
        secret: jwtConfig.secret
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub, deletedAt: null, isActive: true },
        select: { id: true, email: true, name: true },
      });

      if (!user) {
        throw new UnauthorizedException('无效的刷新令牌');
      }

      const accessToken = this.jwtService.sign(
        { sub: user.id, email: user.email },
        { expiresIn: jwtConfig.expiresIn },
      );

      return { accessToken, user: new UserResponseDto({ id: user.id, email: user.email, name: user.name }), };
    } catch (error) {
      this.logger.warn('Refresh token validation failed', error.stack);
      throw new UnauthorizedException('刷新令牌无效');
    }
  }

  /**
   * 生成密码重置令牌
   * @param email 用户邮箱
   */
  async generatePasswordResetToken(email: string): Promise<void> {
    this.logger.log(`Processing forgot password request for email: ${email}`);
    
    // 查找用户
    const user = await this.prisma.user.findUnique({
      where: { email, isActive: true },
    });

    if (!user) {
      this.logger.log(`No active user found for email: ${email}`);
      // 为了安全，即使用户不存在也不透露信息
      return;
    }

    // 生成随机令牌
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    // 设置令牌过期时间（1小时）
    const expiresAt = new Date(Date.now() + 3600000);

    this.logger.log(`Generated reset token for user ${email}: ${token}`);
    this.logger.log(`Token expires at: ${expiresAt}`);

    // 保存令牌和过期时间到数据库
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpiresAt: expiresAt,
      },
    });

    // 发送包含重置链接的邮件给用户
    await this.mailService.sendPasswordResetEmail(user.email, token);
    this.logger.log(`Password reset email sent to user ${email}`);
  }

  /**
   * 根据邮箱获取重置令牌（仅用于测试）
   * @param email 用户邮箱
   * @returns 重置令牌
   */
  async getResetTokenByEmail(email: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });
    
    return user?.passwordResetToken || null;
  }

  /**
   * 使用重置令牌更新密码
   * @param token 重置令牌
   * @param password 新密码
   */
  async updatePasswordWithResetToken(token: string, password: string): Promise<void> {
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

    if (!user) {
      throw new BadRequestException('无效或已过期的重置令牌');
    }

    // 加密新密码
    const hashedPassword = await this.hashingService.hash(password);

    // 更新用户密码并清除重置令牌
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });
  }
}
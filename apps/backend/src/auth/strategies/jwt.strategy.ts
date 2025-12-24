import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtConfig } from '../../config/jwt.config';
import { TokenBlacklistService } from '../token-blacklist.service';
import { Request } from 'express';
import { Strategy, ExtractJwt, VerifiedCallback } from 'passport-jwt';
import { AppLoggerService } from '../../common/services/logger.service';

export interface JwtPayload {
  sub: string;
  email: string;
}

/**
 * JWT策略
 * 用于验证JWT令牌并提取用户信息
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger: AppLoggerService;
  
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private tokenBlacklistService: TokenBlacklistService,
    private appLoggerService: AppLoggerService
  ) {
    const jwtConfig = configService.get<JwtConfig>('jwt');
    
    super({
      // 优先从Cookie中提取JWT令牌，如果没有则从Authorization头中提取
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => {
          // 尝试从Cookie中获取JWT令牌
          if (request && request.cookies) {
            const token = request.cookies['accessToken'];
            if (token) {
              return token;
            }
          }
          
          // 如果Cookie中没有，则尝试从Authorization头中获取
          return ExtractJwt.fromAuthHeaderAsBearerToken()(request);
        }
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
      // 通过passReqToCallback选项来获取请求对象
      passReqToCallback: true,
    });
    
    this.logger = appLoggerService.createLogger(JwtStrategy.name);
  }

  /**
   * 验证JWT令牌
   * @param req 请求对象
   * @param payload JWT载荷
   * @param done 验证完成回调
   */
  async validate(req: Request, payload: JwtPayload, done: VerifiedCallback): Promise<void> {
    const startTime = Date.now();
    const requestInfo = {
      method: req.method,
      path: req.path,
      userId: payload.sub,
      email: payload.email
    };
    
    try {
      this.logger.debug(`开始JWT令牌验证: ${JSON.stringify(requestInfo)}`);
      
      // 1. 获取请求中的原始令牌
      let token = null;
      
      // 优先从Cookie中获取令牌
      if (req.cookies && req.cookies['accessToken']) {
        token = req.cookies['accessToken'];
        this.logger.debug('从Cookie中获取JWT令牌');
      } else {
        // 如果Cookie中没有，则尝试从Authorization头中获取
        token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        this.logger.debug('从Authorization头中获取JWT令牌');
      }
      
      // 如果没有提供令牌，则验证失败
      if (!token) {
        this.logger.warn('JWT令牌验证失败: 未提供令牌', undefined, requestInfo);
        return done(new Error('No token provided'), false);
      }
      
      this.logger.debug(`获取到令牌: ${token.substring(0, 10)}...`);

      // 2. 检查令牌是否在黑名单中
      if (await this.tokenBlacklistService.isTokenBlacklisted(token)) {
        this.logger.warn('JWT令牌验证失败: 令牌已被撤销', undefined, {
          ...requestInfo,
          tokenLength: token.length
        });
        return done(new Error('Token has been revoked'), false);
      }

      // 3. 验证payload完整性
      if (!payload.sub || !payload.email) {
        this.logger.warn('JWT令牌验证失败: 载荷不完整', undefined, {
          ...requestInfo,
          payloadKeys: Object.keys(payload)
        });
        return done(new Error('Invalid token payload'), false);
      }

      // 4. 验证用户状态
      const user = await this.prisma.user.findUnique({
        where: { 
          id: payload.sub,
          deletedAt: null,
          isActive: true 
        }
      });

      // 如果用户不存在或状态异常，则验证失败
      if (!user) {
        this.logger.warn('JWT令牌验证失败: 用户不存在或状态异常', undefined, {
          ...requestInfo,
          userIdExists: false
        });
        return done(new Error('User not found or inactive'), false);
      }
      
      // 5. 验证用户邮箱是否匹配
      if (user.email !== payload.email) {
        this.logger.warn('JWT令牌验证失败: 邮箱不匹配', undefined, {
          ...requestInfo,
          userEmail: user.email,
          payloadEmail: payload.email
        });
        return done(new Error('Email mismatch'), false);
      }
      
      // 记录验证成功信息
      const executionTime = Date.now() - startTime;
      this.logger.debug(
        `JWT令牌验证成功: 用户 ${user.email} (ID: ${user.id})`, 
        undefined, 
        {
          ...requestInfo,
          userRole: user.role,
          executionTime: executionTime
        }
      );

      // 验证成功，调用done函数传入用户信息
      return done(null, user);
    } catch (error) {
      // 捕获任何验证过程中的错误
      const executionTime = Date.now() - startTime;
      this.logger.error(
        'JWT令牌验证过程中发生错误', 
        error.stack,
        undefined,
        {
          ...requestInfo,
          errorType: error.constructor.name,
          errorMessage: error.message,
          executionTime: executionTime
        }
      );
      return done(error, false);
    }
  }
}
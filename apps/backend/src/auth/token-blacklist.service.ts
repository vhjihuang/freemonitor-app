
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../common/services/logger.service';

/**
 * 令牌黑名单服务
 * 用于管理已撤销的 JWT 访问令牌
 */
@Injectable()
export class TokenBlacklistService {
  private readonly logger: AppLoggerService;
  
  constructor(
    private readonly prisma: PrismaService,
    private readonly appLoggerService: AppLoggerService
  ) {
    this.logger = appLoggerService.createLogger(TokenBlacklistService.name);
  }

  /**
   * 检查 JWT token 是否已被撤销
   * @param token JWT 令牌
   * @returns 是否已被撤销
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      // 记录详细的调试信息
      this.logger.debug(`检查令牌是否在黑名单中: ${token.substring(0, 10)}...`);
      
      // 检查是否存在已撤销的刷新令牌记录
      const refreshTokenRecord = await this.prisma.refreshToken.findFirst({
        where: {
          token: token,
          revoked: true
        }
      });

      const isBlacklisted = !!refreshTokenRecord;
      
      // 记录操作结果
      this.logger.debug(
        `令牌黑名单检查结果: ${isBlacklisted ? '已列入黑名单' : '未列入黑名单'}`,
        undefined,
        { tokenLength: token.length, executionTime: Date.now() - startTime }
      );
      
      this.logger.logDbOperation('findFirst', 'refreshToken', true, Date.now() - startTime);
      
      return isBlacklisted;
    } catch (error) {
      this.logger.error(
        '检查令牌黑名单状态失败', 
        error.stack,
        undefined,
        { errorType: error.constructor.name, tokenLength: token.length || 0 }
      );
      
      this.logger.logDbOperation('findFirst', 'refreshToken', false, Date.now() - startTime, { error: error.message });
      
      // 发生错误时保守处理，默认认为令牌有效
      return false;
    }
  }

  /**
   * 清理过期的刷新令牌记录
   * 可以定期调用此方法以优化数据库性能
   */
  async cleanupExpiredTokens(): Promise<void> {
    const startTime = Date.now();
    
    try {
      this.logger.debug('开始清理过期的刷新令牌记录');
      
      const now = new Date();
      const deletedCount = await this.prisma.refreshToken.deleteMany({
        where: {
          expiresAt: { lte: now }
        }
      });

      if (deletedCount.count > 0) {
        this.logger.log(`清理了 ${deletedCount.count} 条过期的刷新令牌记录`);
      } else {
        this.logger.debug('没有发现需要清理的过期刷新令牌记录');
      }
      
      this.logger.logDbOperation('deleteMany', 'refreshToken', true, Date.now() - startTime, { deletedCount: deletedCount.count });
      
    } catch (error) {
      this.logger.error(
        '清理过期令牌失败', 
        error.stack,
        undefined,
        { errorType: error.constructor.name }
      );
      
      this.logger.logDbOperation('deleteMany', 'refreshToken', false, Date.now() - startTime, { error: error.message });
    }
  }
}
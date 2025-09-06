// packages/types/src/auth/token.response.dto.ts
import { UserResponseDto } from './user.response.dto';

/**
 * 认证成功后返回的令牌响应结构
 */
export interface TokenResponse {
  /** JWT 访问令牌*/
  accessToken: string;

  /**  刷新令牌（可选） */
  refreshToken?: string;

  /** access token 过期时间（秒）*/
  expiresIn: number;

  /**  用户基本信息 */
  user: UserResponseDto;
}
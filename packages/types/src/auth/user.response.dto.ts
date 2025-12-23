/// <reference types="node" />
import { Role } from '../roles';

export interface UserResponseDto {
  id: string;
  email: string;
  name?: string;
  role?: Role;
}

// 扩展的请求接口，包含用户信息
export interface RequestWithUser {
  user: UserResponseDto;
}
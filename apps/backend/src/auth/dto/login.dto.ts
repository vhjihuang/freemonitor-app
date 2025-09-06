import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }) => value.trim().toLowerCase())
  @IsEmail({}, { message: '请输入有效的邮箱' })
  email: string;

  @Transform(({ value }) => value.trim())
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码至少 6 位' })
  password: string;
}
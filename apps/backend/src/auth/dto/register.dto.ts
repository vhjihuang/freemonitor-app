import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength, Matches } from 'class-validator';
import { PASSWORD_REGEX } from '@freemonitor/types';

export class RegisterDto {
  @Transform(({ value }) => value.trim().toLowerCase())
  @IsEmail({}, { message: '请输入有效的邮箱' })
  email: string;

  @Transform(({ value }) => value.trim())
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码至少 6 位' })
  @Matches(PASSWORD_REGEX, {
    message: '密码必须包含大小写字母、数字和特殊字符',
  })
  password: string;

  @Transform(({ value }) => value.trim())
  @IsString({ message: '姓名必须是字符串' })
  @MinLength(1, { message: '请输入姓名' })
  name: string;
}
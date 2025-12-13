import { Transform } from 'class-transformer';
import { IsString, MinLength, Matches } from 'class-validator';
import { PASSWORD_REGEX } from '@freemonitor/types';

export class ResetPasswordDto {
  @IsString({ message: '令牌必须是字符串' })
  token: string;

  @Transform(({ value }) => value.trim())
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码至少 6 位' })
  @Matches(PASSWORD_REGEX, {
    message: '密码必须包含大小写字母、数字和特殊字符',
  })
  password: string;
}
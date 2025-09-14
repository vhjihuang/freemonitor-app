import { Transform } from 'class-transformer';
import { IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: '令牌必须是字符串' })
  token: string;

  @Transform(({ value }) => value.trim())
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码至少 6 位' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: '密码必须包含大小写字母、数字和特殊字符',
  })
  password: string;
}
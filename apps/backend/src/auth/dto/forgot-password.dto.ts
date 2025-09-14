import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @Transform(({ value }) => value.trim().toLowerCase())
  @IsEmail({}, { message: '请输入有效的邮箱' }) 
  email: string;
}
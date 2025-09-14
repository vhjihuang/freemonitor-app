import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    // 在实际实现中，这里会使用真实的邮件服务如Nodemailer、SendGrid等
    // 当前仅记录日志，后续可以替换为真实的邮件发送逻辑
    
    const resetUrl = `http://localhost:3000/auth/reset-password?token=${token}`;
    
    console.log('=====================================');
    console.log('发送密码重置邮件:');
    console.log(`收件人: ${email}`);
    console.log(`重置链接: ${resetUrl}`);
    console.log('=====================================');
    
    // TODO: 实现真实的邮件发送逻辑
    // 示例:
    // await this.mailerService.sendMail({
    //   to: email,
    //   subject: '密码重置',
    //   template: 'password-reset',
    //   context: {
    //     resetUrl,
    //   },
    // });
  }
}
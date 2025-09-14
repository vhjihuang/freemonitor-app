import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    // 当前实现仅为开发测试用，将邮件内容输出到控制台
    // TODO: 集成真实的邮件服务（如Nodemailer、SendGrid等）以发送真实邮件
    
    const resetUrl = `http://localhost:3000/auth/reset-password?token=${token}`;
    
    console.log('=====================================');
    console.log('发送密码重置邮件:');
    console.log(`收件人: ${email}`);
    console.log(`重置链接: ${resetUrl}`);
    console.log('=====================================');
    
    // 真实邮件服务实现示例:
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
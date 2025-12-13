import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter | null = null;
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    // 从环境变量加载SMTP配置
    const smtpHost = this.configService.get<string>('SMTP_HOST');
    const smtpPort = this.configService.get<number>('SMTP_PORT', 587);
    const smtpSecure = this.configService.get<boolean>('SMTP_SECURE', false);
    const smtpUser = this.configService.get<string>('SMTP_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS');
    
    this.fromEmail = this.configService.get<string>('FROM_EMAIL', smtpUser);

    // 只有当配置了SMTP主机和用户时才初始化传输器
    if (smtpHost && smtpUser) {
      // QQ邮箱特殊配置
      const transporterConfig: any = {
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      };

      // 如果是QQ邮箱，添加TLS配置
      if (smtpHost === 'smtp.qq.com') {
        transporterConfig.tls = {
          // 禁用证书验证（开发环境）
          rejectUnauthorized: false,
          // 指定TLS版本
          minVersion: 'TLSv1.2'
        };
        
        // 对于端口587，确保使用STARTTLS
        if (smtpPort === 587) {
          transporterConfig.secure = false; // 强制使用STARTTLS
        }
      }

      this.transporter = nodemailer.createTransport(transporterConfig);
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    // 如果没有配置SMTP，则回退到控制台输出
    if (!this.transporter || this.configService.get('SMTP_HOST') === 'smtp.example.com') {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
      const resetUrl = frontendUrl + `/auth/reset-password?token=${token}`;
      
      console.log('=====================================');
      console.log('📧 密码重置邮件 (开发模式):');
      console.log(`收件人: ${email}`);
      console.log(`重置链接: ${resetUrl}`);
      console.log(`重置令牌: ${token}`);
      console.log('=====================================');
      
      this.logger.warn('SMTP未配置或使用默认配置，邮件仅输出到控制台。请配置SMTP环境变量以启用真实邮件发送。');
      
      // 开发环境下，即使SMTP未配置也返回成功，避免影响用户体验
      return;
    }
    
    try {
      // 使用前端应用链接，确保用户可以正确访问
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
      const resetUrl = frontendUrl + `/auth/reset-password?token=${token}`;
      
      const mailOptions = {
        from: this.fromEmail,
        to: email,
        subject: '密码重置',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">密码重置请求</h2>
            <p>您好，</p>
            <p>您收到此邮件是因为您请求重置您的密码。</p>
            <p>请点击下面的链接来重置您的密码：</p>
            <p>
              <a href="${resetUrl}" 
                 style="background-color: #007bff; color: white; padding: 10px 20px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                重置密码
              </a>
            </p>
            <p>如果您无法点击上面的按钮，请复制以下链接到浏览器地址栏：</p>
            <p>${resetUrl}</p>
            <p><strong>注意：此链接将在1小时后过期。</strong></p>
            <p>如果您没有请求密码重置，请忽略此邮件。</p>
            <hr style="margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              此邮件由系统自动发送，请勿回复。
            </p>
          </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`密码重置邮件发送成功`, {
        to: email,
        messageId: info.messageId,
      });
    } catch (error) {
      this.logger.error(`发送密码重置邮件失败: ${error.message}`, {
        to: email,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`邮件发送失败: ${error.message}`);
    }
  }
}
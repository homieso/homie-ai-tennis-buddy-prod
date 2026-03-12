/**
 * 邮件发送工具
 * 提供统一的邮件发送接口，支持多种邮件服务
 */

import { Resend } from 'resend';
import {
  EMAIL_SERVICES,
  EMAIL_TYPES,
  ENV_KEYS,
  DEFAULT_EMAIL_FROM,
  DEFAULTS,
} from '@/lib/constants';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  userId?: string;
  emailType?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  service?: string;
  message?: string;
  data?: unknown;
  error?: string;
}

/**
 * 邮件发送服务类
 */
export class EmailService {
  private static instance: EmailService;
  private resend?: Resend;
  private service: string;

  private constructor() {
    this.service = process.env[ENV_KEYS.EMAIL_SERVICE] || EMAIL_SERVICES.RESEND;

    if (this.service === EMAIL_SERVICES.RESEND) {
      const apiKey = process.env[ENV_KEYS.RESEND_API_KEY];
      if (apiKey) {
        this.resend = new Resend(apiKey);
      }
    }
  }

  /**
   * 获取邮件服务实例（单例模式）
   */
  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * 检查邮件服务是否配置就绪
   */
  public isConfigured(): boolean {
    if (this.service === EMAIL_SERVICES.RESEND) {
      return !!this.resend;
    } else if (this.service === EMAIL_SERVICES.SENDGRID) {
      return !!process.env[ENV_KEYS.SENDGRID_API_KEY];
    }
    return false;
  }

  /**
   * 获取配置状态信息
   */
  public getConfigStatus(): {
    service: string;
    configured: boolean;
    missingKeys: string[];
  } {
    const missingKeys: string[] = [];

    if (this.service === EMAIL_SERVICES.RESEND) {
      if (!process.env[ENV_KEYS.RESEND_API_KEY]) {
        missingKeys.push(ENV_KEYS.RESEND_API_KEY);
      }
    } else if (this.service === EMAIL_SERVICES.SENDGRID) {
      if (!process.env[ENV_KEYS.SENDGRID_API_KEY]) {
        missingKeys.push(ENV_KEYS.SENDGRID_API_KEY);
      }
    }

    return {
      service: this.service,
      configured: missingKeys.length === 0,
      missingKeys,
    };
  }

  /**
   * 发送邮件
   */
  public async send(options: EmailOptions): Promise<EmailResult> {
    const configStatus = this.getConfigStatus();

    if (!configStatus.configured) {
      return {
        success: false,
        error: `邮件服务未配置，缺少环境变量: ${configStatus.missingKeys.join(', ')}`,
      };
    }

    try {
      if (this.service === EMAIL_SERVICES.RESEND) {
        return await this.sendWithResend(options);
      } else if (this.service === EMAIL_SERVICES.SENDGRID) {
        return await this.sendWithSendGrid(options);
      } else {
        return {
          success: false,
          error: `不支持的邮件服务: ${this.service}`,
        };
      }
    } catch (error) {
      console.error('发送邮件失败:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      };
    }
  }

  /**
   * 使用Resend发送邮件
   */
  private async sendWithResend(options: EmailOptions): Promise<EmailResult> {
    if (!this.resend) {
      return {
        success: false,
        error: 'Resend客户端未初始化',
      };
    }

    try {
      const from = options.from || DEFAULT_EMAIL_FROM;
      const to = Array.isArray(options.to) ? options.to : [options.to];

      const { data, error } = await this.resend.emails.send({
        from,
        to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
      });

      if (error) {
        console.error('Resend API错误:', error);
        return {
          success: false,
          service: EMAIL_SERVICES.RESEND,
          error: `Resend API错误: ${JSON.stringify(error)}`,
        };
      }

      console.log(`邮件发送成功: ${to}, 主题: ${options.subject}, 邮件ID: ${data?.id}`);

      return {
        success: true,
        service: EMAIL_SERVICES.RESEND,
        message: '邮件发送成功',
        data,
      };
    } catch (error) {
      console.error('发送邮件失败:', error);
      throw error;
    }
  }

  /**
   * 使用SendGrid发送邮件
   */
  private async sendWithSendGrid(options: EmailOptions): Promise<EmailResult> {
    // 当前为占位实现，需要实际集成SendGrid
    console.log(`[SendGrid占位] 准备发送邮件到: ${options.to}，主题: ${options.subject}`);

    // 模拟API调用
    return {
      success: true,
      service: EMAIL_SERVICES.SENDGRID,
      message: '邮件发送成功（占位模式）',
    };
  }

  /**
   * 发送每日提醒邮件
   */
  public async sendDailyReminder(
    email: string,
    nickname: string,
    message: string,
    userId?: string
  ): Promise<EmailResult> {
    const subject = `🎾 你的每日网球鼓励：${nickname}，今天也要加油！`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>每日网球鼓励</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background: #f9f9f9;
      padding: 30px;
      border-radius: 0 0 10px 10px;
      border: 1px solid #eee;
      border-top: none;
    }
    .message {
      font-size: 18px;
      white-space: pre-line;
      margin: 20px 0;
      padding: 20px;
      background: white;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #666;
      font-size: 14px;
    }
    .tennis-icon {
      font-size: 24px;
      margin: 0 5px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎾 你的AI网球搭子</h1>
    <p>每日鼓励 · 陪伴成长</p>
  </div>

  <div class="content">
    <h2>亲爱的 ${nickname}，</h2>

    <div class="message">
      ${message.replace(/\n/g, '<br>')}
    </div>

    <p>今天有什么网球计划吗？无论是练习发球、对打还是观看比赛，每一步都在让你变得更强！</p>

    <div class="footer">
      <p>💡 提示：你可以在设置中调整邮件通知频率</p>
      <p>🎾 坚持练球，享受网球带来的快乐！</p>
      <p>— 你的AI网球搭子团队</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `${nickname}，你好！\n\n${message}\n\n今天是打网球的好天气，别忘了去球场挥洒汗水！\n\n—— 你的AI网球搭子 🎾`;

    return this.send({
      to: email,
      subject,
      html,
      text,
      userId,
      emailType: EMAIL_TYPES.DAILY_REMINDER,
    });
  }

  /**
   * 发送练习提醒邮件
   */
  public async sendPracticeReminder(
    email: string,
    nickname: string,
    hasPracticed: boolean,
    userId?: string
  ): Promise<EmailResult> {
    const subject = hasPracticed
      ? '🎾 今日练习打卡成功'
      : '💪 Homie 的鼓励提醒';

    const message = hasPracticed
      ? `你今天已经练习了，真棒！继续保持～`
      : `今天还没练习哦，Homie 等你！哪怕只是挥拍5分钟也好～`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #eee; border-top: none; }
    .message { font-size: 18px; margin: 20px 0; padding: 20px; background: white; border-radius: 8px; border-left: 4px solid #667eea; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎾 你的AI网球搭子</h1>
    <p>个性化鼓励 · 每日陪伴</p>
  </div>
  <div class="content">
    <h2>嗨，${nickname || DEFAULTS.USER_NICKNAME}！</h2>
    <div class="message">
      ${message.replace(/\n/g, '<br>')}
    </div>
    <p>今天有什么网球计划吗？无论是练习发球、对打还是观看比赛，每一步都在让你变得更强！</p>
    <div class="footer">
      <p>💡 提示：你可以在设置中调整邮件通知频率</p>
      <p>🎾 坚持练球，享受网球带来的快乐！</p>
      <p>— 你的AI网球搭子 Homie</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `嗨，${nickname || DEFAULTS.USER_NICKNAME}！\n\n${message}\n\n今天有什么网球计划吗？无论是练习发球、对打还是观看比赛，每一步都在让你变得更强！\n\n💡 提示：你可以在设置中调整邮件通知频率\n🎾 坚持练球，享受网球带来的快乐！\n— 你的AI网球搭子 Homie`;

    return this.send({
      to: email,
      subject,
      html,
      text,
      userId,
      emailType: EMAIL_TYPES.PRACTICE_REMINDER,
    });
  }

  /**
   * 带重试机制的邮件发送
   */
  public async sendWithRetry(
    options: EmailOptions,
    maxAttempts: number = DEFAULTS.EMAIL_RETRY_ATTEMPTS,
    delayMs: number = DEFAULTS.EMAIL_RETRY_DELAY_MS
  ): Promise<EmailResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await this.send(options);

        if (result.success) {
          return result;
        }

        lastError = new Error(result.error || '发送失败');
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('发送失败');
      }

      // 如果不是最后一次尝试，等待后重试
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }

    return {
      success: false,
      error: `邮件发送失败，重试 ${maxAttempts} 次后仍然失败: ${lastError?.message}`,
    };
  }
}

/**
 * 便捷函数：发送邮件
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  return EmailService.getInstance().send(options);
}

/**
 * 便捷函数：发送每日提醒邮件
 */
export async function sendDailyReminderEmail(
  email: string,
  nickname: string,
  message: string,
  userId?: string
): Promise<EmailResult> {
  return EmailService.getInstance().sendDailyReminder(email, nickname, message, userId);
}

/**
 * 便捷函数：发送练习提醒邮件
 */
export async function sendPracticeReminderEmail(
  email: string,
  nickname: string,
  hasPracticed: boolean,
  userId?: string
): Promise<EmailResult> {
  return EmailService.getInstance().sendPracticeReminder(email, nickname, hasPracticed, userId);
}
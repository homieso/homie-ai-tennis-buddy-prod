import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import {
  EMAIL_SERVICES,
  ENV_KEYS,
  DEFAULTS
} from '@/lib/constants'

// 邮件服务配置
// 注意：需要用户提供邮件服务API密钥（Resend、SendGrid或其他）
// 当前为占位实现，需要用户提供实际配置

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json()
    const {
      to,           // 收件人邮箱
      subject,      // 邮件主题
      html,         // HTML内容
      text,         // 纯文本内容（可选）
      userId,       // 用户ID（用于追踪）
      emailType     // 邮件类型：daily-reminder, welcome, etc.
    } = body

    // 验证必需字段
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: '缺少必需字段：to, subject, html' },
        { status: 400 }
      )
    }

    // 检查邮件服务配置
    const emailService = process.env[ENV_KEYS.EMAIL_SERVICE] || EMAIL_SERVICES.RESEND // 默认使用Resend
    const apiKey = process.env[ENV_KEYS.RESEND_API_KEY] || process.env[ENV_KEYS.SENDGRID_API_KEY]

    if (!apiKey) {
      console.error('邮件服务API密钥未配置')
      return NextResponse.json(
        {
          error: '邮件服务暂不可用',
          message: '需要配置邮件服务API密钥。请在.env.local文件中添加RESEND_API_KEY或SENDGRID_API_KEY。',
          required: '需要用户提供邮件服务API密钥'
        },
        { status: 503 }
      )
    }

    // 根据配置的邮件服务选择发送方式
    if (emailService === EMAIL_SERVICES.RESEND || !process.env[ENV_KEYS.EMAIL_SERVICE]) {
      // 使用Resend发送邮件
      await sendWithResend({ to, subject, html, text, apiKey })
    } else if (emailService === EMAIL_SERVICES.SENDGRID) {
      // 使用SendGrid发送邮件
      await sendWithSendGrid({ to, subject, html, text, apiKey })
    } else {
      return NextResponse.json(
        { error: '不支持的邮件服务', message: `不支持的邮件服务: ${emailService}` },
        { status: 400 }
      )
    }

    // 记录邮件发送日志（可选）
    console.log(`邮件发送成功：${to}，用户：${userId || 'unknown'}，类型：${emailType || 'unknown'}`)

    return NextResponse.json({
      success: true,
      message: '邮件发送成功',
      data: {
        to,
        subject,
        emailType,
        service: emailService,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('发送邮件失败:', error)

    const errorMessage = error instanceof Error ? error.message : '未知错误'

    return NextResponse.json(
      {
        success: false,
        error: '发送邮件失败',
        message: errorMessage,
        note: '请检查邮件服务配置和API密钥'
      },
      { status: 500 }
    )
  }
}

// Resend邮件发送实现
async function sendWithResend({
  to,
  subject,
  html,
  text,
  apiKey
}: {
  to: string
  subject: string
  html: string
  text?: string
  apiKey: string
}) {
  try {
    const resend = new Resend(apiKey)

    // 发件人邮箱 - 可以从环境变量读取或使用默认值
    const from = process.env[ENV_KEYS.RESEND_FROM_EMAIL] || DEFAULTS.EMAIL_FROM

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text: text || undefined,
    })

    if (error) {
      console.error('Resend API错误:', error)
      throw new Error(`Resend API错误: ${JSON.stringify(error)}`)
    }

    console.log(`邮件发送成功: ${to}, 主题: ${subject}, 邮件ID: ${data?.id}`)

    return {
      success: true,
      service: 'resend',
      message: '邮件发送成功',
      data
    }
  } catch (error) {
    console.error('发送邮件失败:', error)
    throw error
  }
}

// SendGrid邮件发送实现
async function sendWithSendGrid({
  to,
  subject,
  html: _html, // eslint-disable-next-line @typescript-eslint/no-unused-vars
  text: _text, // eslint-disable-next-line @typescript-eslint/no-unused-vars
  apiKey: _apiKey // eslint-disable-next-line @typescript-eslint/no-unused-vars
}: {
  to: string
  subject: string
  html: string
  text?: string
  apiKey: string
}) {
  // 实际实现需要用户提供SendGrid API密钥
  // 这里是占位实现
  void _html;
  void _text;
  void _apiKey;
  console.log(`[SendGrid占位] 准备发送邮件到: ${to}，主题: ${subject}`)

  // 模拟API调用
  return {
    success: true,
    service: 'sendgrid',
    message: '邮件发送成功（占位模式）'
  }
}

// 健康检查端点
export async function GET() {
  const emailService = process.env[ENV_KEYS.EMAIL_SERVICE] || EMAIL_SERVICES.RESEND
  const hasApiKey = !!(process.env[ENV_KEYS.RESEND_API_KEY] || process.env[ENV_KEYS.SENDGRID_API_KEY])

  return NextResponse.json({
    message: '邮件发送API（占位实现）',
    status: hasApiKey ? '配置就绪' : '需要API密钥',
    endpoint: 'POST /api/send-email',
    requiredFields: ['to', 'subject', 'html'],
    optionalFields: ['text', 'userId', 'emailType'],
    currentConfig: {
      emailService,
      hasApiKey,
      note: hasApiKey ? '已配置API密钥，但需要实际实现' : '需要用户提供邮件服务API密钥'
    }
  })
}
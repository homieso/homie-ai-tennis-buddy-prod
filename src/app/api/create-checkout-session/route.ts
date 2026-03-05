import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

// 初始化 Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover', // 使用最新稳定版本
})

export async function POST(request: NextRequest) {
  try {
    // 1. 验证环境变量
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
      console.error('Stripe 环境变量未设置')
      return NextResponse.json(
        { error: '服务器配置错误' },
        { status: 500 }
      )
    }

    // 2. 获取当前用户
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('用户认证失败:', authError)
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    // 3. 获取请求来源（用于构建URL）
    const origin = request.headers.get('origin') || 'http://localhost:3000'

    // 4. 创建 Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      success_url: `${origin}/subscribe?success=true`,
      cancel_url: `${origin}/subscribe?canceled=true`,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        user_email: user.email || '',
        subscription_type: 'monthly',
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          user_email: user.email || '',
        },
      },
      customer_email: user.email || undefined,
      billing_address_collection: 'required',
    })

    // 5. 返回会话 URL
    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('创建 Stripe Checkout 会话失败:', error)

    // 返回友好的错误信息
    const errorMessage = error instanceof Error ? error.message : '未知错误'

    return NextResponse.json(
      {
        error: '创建支付会话失败',
        message: errorMessage,
        details: error instanceof Stripe.errors.StripeError ? error.raw : undefined
      },
      { status: 500 }
    )
  }
}

// 可选：GET 方法用于健康检查或信息展示
export async function GET() {
  return NextResponse.json({
    message: 'Stripe Checkout API 正常运行',
    endpoint: 'POST /api/create-checkout-session',
    requiredEnvVars: ['STRIPE_SECRET_KEY', 'STRIPE_PRICE_ID'],
    note: '此端点用于创建 Stripe Checkout 会话，需要用户认证'
  })
}
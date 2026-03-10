import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // 1. 创建 Supabase 客户端并获取当前用户
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    console.log('反馈API用户认证结果:', {
      hasUser: !!user,
      userId: user?.id?.substring(0, 8) + '...',
      userError: userError ? { message: userError.message, code: userError.code } : null,
      timestamp: new Date().toISOString()
    })

    if (userError || !user) {
      console.error('反馈API: 用户未认证', userError || '用户对象为空')
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    // 2. 解析请求体
    const body = await request.json()
    const { content, preferences } = body

    // 3. 验证必需字段 - 现在允许通过preferences提交反馈
    if ((!content || content.trim().length === 0) && (!preferences || !Array.isArray(preferences) || preferences.length === 0)) {
      return NextResponse.json(
        { error: '反馈内容不能为空，请至少选择一项偏好或填写反馈内容' },
        { status: 400 }
      )
    }

    // 4. 创建管理员客户端（绕过RLS）
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 5. 插入反馈到数据库（使用管理员客户端）
    console.log('准备插入反馈:', {
      user_id: user.id,
      content: content.trim(),
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50),
      timestamp: new Date().toISOString(),
      using_admin_client: true
    })

    const { error } = await supabaseAdmin
      .from('feedback')
      .insert({
        user_id: user.id,
        content: content.trim(),
        preferences: preferences && Array.isArray(preferences) && preferences.length > 0 ? preferences : null
      })

    console.log('插入错误:', error)
    console.log('错误详情:', error?.message, error?.details, error?.hint, error?.code)

    if (error) {
      console.error('插入反馈失败:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        user_id: user.id,
        content_length: content.trim().length
      })
      return NextResponse.json(
        { error: `保存反馈失败: ${error.message} (代码: ${error.code})` },
        { status: 500 }
      )
    }

    // 5. 返回成功响应
    return NextResponse.json({
      success: true,
      message: '感谢你的反馈！'
    })

  } catch (error) {
    console.error('Feedback API error:', error)

    const errorMessage = error instanceof Error ? error.message : '未知错误'

    return NextResponse.json(
      {
        error: errorMessage
      },
      { status: 500 }
    )
  }
}

// 可选：GET 方法用于健康检查或获取反馈（管理员用）
export async function GET() {
  return NextResponse.json({
    message: '反馈 API 正常运行',
    endpoint: 'POST /api/feedback',
    requiredFields: ['content'],
    note: '此端点用于收集用户反馈，需要用户认证'
  })
}